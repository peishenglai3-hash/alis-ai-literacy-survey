"""S3 追问闭环 —— LLM 语言层。

============================================================================
铁律：LLM 只把 S2 已选定的 probe_tree[branch] 骨架，落成一句自然中文追问。
  · "追问哪一题、走 high 还是 low" —— 全部由确定性状态机（S2）定死，作为
    ProbeTarget 输入传入本层；render_probe 绝不改变它。
  · 本层不评分、不选题、不改分支、不引入量表之外的概念。
  · LLM 不可用 / 输出异常时，回退到骨架派生文本（fallback=True），闭环不断。

注入内容全部来自可编辑的 Question Pack（题干/维度/理论来源/追问骨架/llm_injection
理论包），师门 7 月末改 YAML 即改 LLM 行为，不动本代码。
============================================================================
"""
from __future__ import annotations

import os
from dataclasses import dataclass
from typing import Any, Protocol, runtime_checkable


class ProbeError(ValueError):
    """追问渲染的输入不合法（如选题不在题库、分支非法）。"""


@dataclass(frozen=True)
class ProbeTarget:
    """S2 已确定的追问目标（本层的输入，不可被本层更改）。"""

    item_id: str
    dimension_id: str
    branch: str  # "high" | "low"
    raw_score: int
    effective_score: float


@dataclass
class ProbeRender:
    """追问渲染结果。probe_text 是唯一的 LLM 语言层产物；其余为可审计元数据。"""

    probe_text: str
    target_item_id: str
    branch: str
    model: str
    fallback: bool
    prompt_system: str = ""
    prompt_user: str = ""


@runtime_checkable
class LLMClient(Protocol):
    """语言模型客户端最小接口。仅做'系统提示+用户提示→一段文本'。"""

    def complete(self, system: str, user: str) -> str: ...


class StubLLMClient:
    """确定性桩客户端（测试/离线演示用）。返回可预期文本，不联网。"""

    def __init__(self, canned: str = "（桩）能再具体讲讲当时发生了什么吗？", model: str = "stub"):
        self._canned = canned
        self.model = model

    def complete(self, system: str, user: str) -> str:  # noqa: ARG002
        return self._canned


class LiteLLMClient:
    """生产客户端：经 LiteLLM 调用 DeepSeek（或兜底模型）。litellm 惰性导入。

    ⚠️ 需资源协调：模型端点与 API Key 经环境变量注入
       （ALIS_PROBE_MODEL，默认 deepseek/deepseek-chat；密钥如 DEEPSEEK_API_KEY）。
       无 Key 时调用会抛错 → render_probe 自动回退到骨架文本。
    """

    def __init__(self, model: str | None = None, temperature: float = 0.7, max_tokens: int = 200):
        self.model = model or os.environ.get("ALIS_PROBE_MODEL", "deepseek/deepseek-chat")
        self.temperature = temperature
        self.max_tokens = max_tokens

    def complete(self, system: str, user: str) -> str:
        import litellm  # 惰性导入：测试与离线不需要装 litellm

        resp = litellm.completion(
            model=self.model,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            temperature=self.temperature,
            max_tokens=self.max_tokens,
        )
        return (resp["choices"][0]["message"]["content"] or "").strip()


# --------------------------------------------------------------------------
# 提示构造（把量表理论包 + 本题上下文 + 骨架，注入给 LLM）
# --------------------------------------------------------------------------
_MAX_PROBE_LEN = 300  # 一句追问的合理上限；超长视为异常 → 回退


def _find_item(pack: dict[str, Any], item_id: str) -> dict[str, Any]:
    for it in pack.get("items", []):
        if it.get("id") == item_id:
            return it
    raise ProbeError(f"target item {item_id} 不在题库中")


def _find_dimension(pack: dict[str, Any], dim_id: str) -> dict[str, Any]:
    for d in pack.get("dimensions", []):
        if d.get("id") == dim_id:
            return d
    return {}


def _skeleton_text(item: dict[str, Any], branch: str) -> str:
    """取 probe_tree[branch]，剥掉'选 X-Y 分 → 追问：'前缀，留下裸追问句。"""
    tree = item.get("probe_tree", {})
    raw = str(tree.get(branch, "")).strip()
    if "追问：" in raw:
        raw = raw.split("追问：", 1)[1].strip()
    return raw


def build_probe_prompt(pack: dict[str, Any], target: ProbeTarget) -> tuple[str, str]:
    """构造 (system, user)。system=稳定学术框架；user=本题具体追问任务。"""
    if target.branch not in ("high", "low"):
        raise ProbeError(f"branch 必须是 high/low，收到 {target.branch!r}")
    item = _find_item(pack, target.item_id)
    dim = _find_dimension(pack, item.get("dimension", ""))
    inj = pack.get("llm_injection", {}) or {}

    role = inj.get("role_zh", "你是一名社会学访谈的语言助手，只负责把追问骨架落成一句自然中文追问。")
    iron = inj.get("iron_rule_zh", "不要评分、不要下结论、不要改变系统已选定的题目与分支、不要引入量表外概念；一次只问一个问题。")
    philosophy = inj.get("design_philosophy_zh", "本量表是'叙事触发器'：目标是让受访者讲出具体经历。")
    grounding = inj.get("theoretical_grounding_zh", "维度继承 MAILS/清华/SNAIL 等权威量表以保学术可追溯。")
    style = inj.get("probe_style_guide_zh", []) or []
    type_defs = inj.get("statement_type_defs_zh", {}) or {}

    style_block = "\n".join(f"- {s}" for s in style) if style else "- 用中文口语，开放式，一次一问。"

    system = (
        f"{role}\n\n"
        f"【职责铁律】\n{iron}\n\n"
        f"【本量表的设计哲学】\n{philosophy}\n\n"
        f"【理论基础（维度可追溯）】\n{grounding}\n\n"
        f"【追问语言风格】\n{style_block}"
    )

    # 本题陈述类型 + 定义（让 LLM 明白这题在触发何种叙事）
    types = item.get("statement_types", []) or []
    type_lines = []
    for t in types:
        d = type_defs.get(t)
        type_lines.append(f"{t}（{d}）" if d else str(t))
    types_str = "、".join(type_lines) if type_lines else "未标注"

    ref = item.get("ref_scale") or dim.get("ref_scale") or "未标注"
    dim_label = f"{dim.get('name_zh', item.get('dimension', ''))}（{dim.get('name_en', '')}）"

    # 量表满分从 pack 派生，勿硬编码（6 点制=6，师门改点数自动跟随）——避免把旧量纲泄进 LLM 提示。
    likert_max = (pack.get("likert", {}) or {}).get("max", 6)
    if target.branch == "high":
        answer_desc = f"选了较同意（{target.raw_score}/{likert_max}，偏高端）"
    else:
        answer_desc = f"选了较不同意（{target.raw_score}/{likert_max}，偏低端）"

    skeleton = _skeleton_text(item, target.branch)

    user = (
        "下面是系统已经为本次访谈选定的一道追问任务，请只把最后的『追问骨架』"
        "落成一句自然、口语、开放的中文追问。\n\n"
        f"· 题目（{target.item_id}）：{item.get('stem_zh', '')}\n"
        f"· 所属维度：{dim_label}｜参考量表来源：{ref}\n"
        f"· 题目陈述类型：{types_str}\n"
        f"· 受访者作答：{answer_desc}\n"
        f"· 追问骨架（{target.branch}）：{skeleton}\n\n"
        "请输出：仅一句自然中文追问，承接受访者的作答，引导其讲出具体经历／最近一次／"
        "例外／场景切换；不要复述题目、不要解释评分、不要给结论。"
    )
    return system, user


def _is_bad_output(text: str) -> bool:
    t = (text or "").strip()
    return (not t) or len(t) > _MAX_PROBE_LEN


def render_probe(
    pack: dict[str, Any],
    target: ProbeTarget,
    client: LLMClient,
) -> ProbeRender:
    """把已选定的 target 渲染成一句追问。绝不改变 target 的题目/分支。

    LLM 成功 → fallback=False；LLM 异常/输出不合法 → 回退骨架文本，fallback=True。
    """
    # 输入校验（选题/分支非法直接抛错，绝不'另选一题'）
    system, user = build_probe_prompt(pack, target)  # 内含 item 存在性 + branch 校验
    item = _find_item(pack, target.item_id)
    model = getattr(client, "model", client.__class__.__name__)

    try:
        text = client.complete(system, user)
        if _is_bad_output(text):
            raise ProbeError("LLM 输出为空或超长")
        return ProbeRender(
            probe_text=text.strip(),
            target_item_id=target.item_id,  # 恒等于输入，铁律保证
            branch=target.branch,
            model=str(model),
            fallback=False,
            prompt_system=system,
            prompt_user=user,
        )
    except Exception:  # noqa: BLE001 —— 任何失败都回退，闭环不断
        return ProbeRender(
            probe_text=_skeleton_text(item, target.branch),
            target_item_id=target.item_id,
            branch=target.branch,
            model="fallback-skeleton",
            fallback=True,
            prompt_system=system,
            prompt_user=user,
        )
