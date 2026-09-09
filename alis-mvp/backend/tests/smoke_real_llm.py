"""S3 真机烟测 —— 用真实 DeepSeek 跑一次追问渲染，验证 LLM 语言层。
不涉及任何受访者数据；ProbeTarget 是构造的假目标，只测"骨架→自然一句话"。
用法：先 pip install litellm，再 python -m tests.smoke_real_llm
"""
from __future__ import annotations

import os
import sys
from pathlib import Path

# Windows 控制台默认 GBK，直接 print UTF-8/emoji 会 UnicodeEncodeError（memory 记牢的坑）。
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[union-attr]


def _load_env() -> None:
    """极简 .env 读取（不引 python-dotenv）。"""
    env = Path(__file__).resolve().parents[1] / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


def main() -> int:
    _load_env()
    from alis.content import load_question_pack
    from alis.probe import LiteLLMClient, ProbeTarget, render_probe

    pack = load_question_pack()
    item = next(i for i in pack["items"] if i["id"] == "Q1")
    target = ProbeTarget(
        item_id="Q1",
        dimension_id=item["dimension"],
        branch="high",
        raw_score=6,
        effective_score=6.0,
    )
    key = os.environ.get("DEEPSEEK_API_KEY", "")
    print(f"[烟测] model={os.environ.get('ALIS_PROBE_MODEL')}  key={'已配置' if key else '缺失'}")
    print("[烟测] 目标题 Q1 / high 分支，骨架 → 期待 LLM 落成一句自然追问\n")

    render = render_probe(pack, target, LiteLLMClient())
    print(f"[结果] fallback={render.fallback}  model={render.model}")
    print(f"[结果] target_item_id={render.target_item_id}  branch={render.branch}")
    print(f"[追问] {render.probe_text}\n")

    if render.fallback:
        print("⚠️ 回退到骨架（LLM 调用失败或输出异常）——检查 Key/网络/额度。闭环仍在，但非真机自然追问。")
        return 1
    print("✅ 真机自然追问渲染成功；铁律：target_item_id 恒等于输入。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
