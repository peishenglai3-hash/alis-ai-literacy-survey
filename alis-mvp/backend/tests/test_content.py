"""content.py 校验测试。"""
import pytest

from alis.content import (
    EXPECTED_DIMENSIONS,
    EXPECTED_ITEMS,
    QuestionPackError,
    load_question_pack,
    validate_question_pack,
)


def test_load_real_pack_ok():
    pack = load_question_pack()
    assert len(pack["items"]) == EXPECTED_ITEMS
    assert len({d["id"] for d in pack["dimensions"]}) == EXPECTED_DIMENSIONS
    dim_ids = {d["id"] for d in pack["dimensions"]}
    for it in pack["items"]:
        assert it["dimension"] in dim_ids


def _minimal_pack():
    dims = [{"id": f"D{i}"} for i in range(1, EXPECTED_DIMENSIONS + 1)]
    items = [
        {
            "id": f"Q{i}",
            "dimension": "D1",
            "stem_zh": f"题干 {i}",
            "probe_tree": {"high": "h", "low": "l"},
        }
        for i in range(1, EXPECTED_ITEMS + 1)
    ]
    return {"dimensions": dims, "items": items}


def test_missing_stem_raises():
    bad = _minimal_pack()
    del bad["items"][0]["stem_zh"]
    with pytest.raises(QuestionPackError):
        validate_question_pack(bad)


def test_wrong_item_count_raises():
    bad = _minimal_pack()
    bad["items"].pop()
    with pytest.raises(QuestionPackError):
        validate_question_pack(bad)


def test_dangling_dimension_ref_raises():
    bad = _minimal_pack()
    bad["items"][0]["dimension"] = "D_NOPE"
    with pytest.raises(QuestionPackError):
        validate_question_pack(bad)


def test_probe_tree_needs_high_low():
    bad = _minimal_pack()
    bad["items"][0]["probe_tree"] = {"high": "only"}
    with pytest.raises(QuestionPackError):
        validate_question_pack(bad)
