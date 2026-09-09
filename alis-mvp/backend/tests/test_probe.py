"""S3 追问闭环 —— probe.py 单元测试。

覆盖：注入忠实性（题干/骨架/维度来源/铁律/设计哲学/作答方向都进了提示）、
铁律（render 绝不改选题与分支）、兜底（LLM 抛错/空/超长 → 骨架回退）、
确定性（桩客户端同输入同输出）、非法输入（选题不在题库/分支非法 → ProbeError）。
"""
from __future__ import annotations

import pytest

from alis.content import load_question_pack
from alis.probe import (
    ProbeError,
    ProbeTarget,
    StubLLMClient,
    _skeleton_text,
    build_probe_prompt,
    render_probe,
)


@pytest.fixture(scope="module")
def pack():
    return load_question_pack()


def _item(pack, item_id):
    return next(i for i in pack["items"] if i["id"] == item_id)


def _target(pack, item_id="Q1", branch="high", raw=7):
    it = _item(pack, item_id)
    return ProbeTarget(
        item_id=item_id,
        dimension_id=it["dimension"],
        branch=branch,
        raw_score=raw,
        effective_score=float(raw),
    )


class _RaisingClient:
    model = "raising"

    def complete(self, system, user):  # noqa: ARG002
        raise RuntimeError("模拟 LLM 端点不可用")


class _EmptyClient:
    model = "empty"

    def complete(self, system, user):  # noqa: ARG002
        return "   "


class _LongClient:
    model = "long"

    def complete(self, system, user):  # noqa: ARG002
        return "追问" * 500  # 远超 300 字上限


# ---------- 注入忠实性 ----------
class TestInjectionFaithfulness:
    def test_system_carries_theory_pack(self, pack):
        system, _ = build_probe_prompt(pack, _target(pack))
        inj = pack["llm_injection"]
        assert inj["role_zh"] in system
        assert inj["iron_rule_zh"] in system
        assert inj["design_philosophy_zh"] in system
        assert inj["theoretical_grounding_zh"] in system

    def test_grounding_names_authoritative_scales(self, pack):
        # 维度可追溯性：理论基础点名权威量表
        system, _ = build_probe_prompt(pack, _target(pack))
        assert "MAILS" in system

    def test_user_carries_item_context(self, pack):
        it = _item(pack, "Q1")
        _, user = build_probe_prompt(pack, _target(pack, "Q1", "high", 7))
        assert it["stem_zh"] in user  # 题干原文
        assert _skeleton_text(it, "high") in user  # 追问骨架
        assert "Q1" in user  # 题号
        assert ("偏高" in user) or ("较同意" in user)  # 作答方向

    def test_low_branch_direction(self, pack):
        _, user = build_probe_prompt(pack, _target(pack, "Q1", "low", 1))
        assert ("偏低" in user) or ("较不同意" in user)

    def test_ref_scale_provenance_in_user(self, pack):
        # 该题的参考量表来源（学术可追溯性）进了提示
        it = _item(pack, "Q1")
        _, user = build_probe_prompt(pack, _target(pack, "Q1", "high", 7))
        assert it["ref_scale"] in user


# ---------- 铁律：不改选题/分支 ----------
class TestIronRule:
    def test_render_preserves_target(self, pack):
        for item_id, branch, raw in [("Q1", "high", 7), ("Q5", "low", 2), ("Q12", "high", 6)]:
            r = render_probe(pack, _target(pack, item_id, branch, raw), StubLLMClient())
            assert r.target_item_id == item_id  # 恒等于输入
            assert r.branch == branch

    def test_stub_success_not_fallback(self, pack):
        r = render_probe(pack, _target(pack), StubLLMClient("能具体讲讲吗？"))
        assert r.fallback is False
        assert r.probe_text == "能具体讲讲吗？"


# ---------- 兜底 ----------
class TestFallback:
    def test_llm_raises_falls_back_to_skeleton(self, pack):
        it = _item(pack, "Q1")
        r = render_probe(pack, _target(pack), _RaisingClient())
        assert r.fallback is True
        assert r.model == "fallback-skeleton"
        assert r.probe_text == _skeleton_text(it, "high")

    def test_empty_output_falls_back(self, pack):
        r = render_probe(pack, _target(pack), _EmptyClient())
        assert r.fallback is True

    def test_overlong_output_falls_back(self, pack):
        r = render_probe(pack, _target(pack), _LongClient())
        assert r.fallback is True

    def test_fallback_still_preserves_target(self, pack):
        r = render_probe(pack, _target(pack, "Q7", "low", 2), _RaisingClient())
        assert r.target_item_id == "Q7"
        assert r.branch == "low"


# ---------- 确定性 ----------
class TestDeterminism:
    def test_stub_deterministic(self, pack):
        t = _target(pack)
        a = render_probe(pack, t, StubLLMClient())
        b = render_probe(pack, t, StubLLMClient())
        assert a.probe_text == b.probe_text
        assert a.target_item_id == b.target_item_id


# ---------- 非法输入 ----------
class TestBadInput:
    def test_unknown_item_raises(self, pack):
        t = ProbeTarget(
            item_id="Q999", dimension_id="D1", branch="high", raw_score=7, effective_score=7.0
        )
        with pytest.raises(ProbeError):
            render_probe(pack, t, StubLLMClient())

    def test_bad_branch_raises(self, pack):
        t = ProbeTarget(
            item_id="Q1", dimension_id="D1", branch="middle", raw_score=4, effective_score=4.0
        )
        with pytest.raises(ProbeError):
            render_probe(pack, t, StubLLMClient())
