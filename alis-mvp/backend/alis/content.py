"""Question Pack 加载与校验。

内容板块（题目/维度/追问树/人格文案）外置在 content/question_pack_v2.1.yaml，
师门 7 月末可直接改该文件而不动代码。本模块只负责**加载 + 结构校验**，不含业务逻辑。
"""
from __future__ import annotations

import os
from typing import Any

import yaml

# backend/alis/content.py → backend/content/question_pack_v2.1.yaml
_DEFAULT_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "content",
    "question_pack_v2.1.yaml",
)

EXPECTED_ITEMS = 15
EXPECTED_DIMENSIONS = 7
_REQUIRED_ITEM_KEYS = ("id", "dimension", "stem_zh", "probe_tree")


class QuestionPackError(ValueError):
    """Question Pack 结构不合法。"""


def load_question_pack(path: str | None = None) -> dict[str, Any]:
    """加载并校验 Question Pack；返回 dict。校验失败抛 QuestionPackError。"""
    path = path or _DEFAULT_PATH
    with open(path, encoding="utf-8") as f:
        data = yaml.safe_load(f)
    validate_question_pack(data)
    return data


def validate_question_pack(data: Any) -> bool:
    """结构校验：恰 15 题、恰 7 维度、题目必填字段齐全、dimension 引用存在。"""
    if not isinstance(data, dict):
        raise QuestionPackError("Question Pack 根节点必须是映射（dict）。")

    dims = data.get("dimensions")
    items = data.get("items")
    if not isinstance(dims, list) or not dims:
        raise QuestionPackError("缺少 dimensions 列表。")
    if not isinstance(items, list) or not items:
        raise QuestionPackError("缺少 items 列表。")

    dim_ids = {d.get("id") for d in dims if isinstance(d, dict)}
    if None in dim_ids:
        raise QuestionPackError("存在没有 id 的 dimension。")
    if len(dim_ids) != EXPECTED_DIMENSIONS:
        raise QuestionPackError(f"期望 {EXPECTED_DIMENSIONS} 个维度，实际 {len(dim_ids)} 个。")

    if len(items) != EXPECTED_ITEMS:
        raise QuestionPackError(f"期望 {EXPECTED_ITEMS} 道题，实际 {len(items)} 道。")

    seen_item_ids: set[str] = set()
    for i, it in enumerate(items):
        if not isinstance(it, dict):
            raise QuestionPackError(f"第 {i} 题不是映射。")
        for k in _REQUIRED_ITEM_KEYS:
            if k not in it or it[k] in (None, ""):
                raise QuestionPackError(f"题 {it.get('id', i)} 缺必填字段：{k}。")
        if it["id"] in seen_item_ids:
            raise QuestionPackError(f"题 id 重复：{it['id']}。")
        seen_item_ids.add(it["id"])
        if it["dimension"] not in dim_ids:
            raise QuestionPackError(f"题 {it['id']} 引用了不存在的维度：{it['dimension']}。")
        pt = it["probe_tree"]
        if not isinstance(pt, dict) or "high" not in pt or "low" not in pt:
            raise QuestionPackError(f"题 {it['id']} 的 probe_tree 需含 high/low 骨架。")

    return True
