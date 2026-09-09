"""暴露 A/B 条件分配（中立模块，供 api 与 export 共用，避免相互 import）。"""
from __future__ import annotations

import hashlib


def assign_condition(session_id: str) -> str:
    """由 session_id 稳定散列出暴露/对照条件（跨进程可复现、大致均衡）。

    MVP 为会话级 A/B：exposed=先看相对位置剖面再追问；control=先追问后看剖面。
    （schema 预留的题级被试内 AB 留待正式版——单题闭环只有一个叙事点。）
    """
    h = int(hashlib.sha256(session_id.encode("utf-8")).hexdigest(), 16)
    return "exposed" if h % 2 == 0 else "control"
