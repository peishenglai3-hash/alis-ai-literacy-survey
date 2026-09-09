"""v3.11 访谈保存恢复闭环——API 测试（0004 迁移支撑）。

覆盖：
- POST /interview/save 落 progress/responses/updated_at → GET 回读完整（恢复闭环）
- 旧 updated_at 后到 → 409 stale save rejected（P1-2 防乱序）
- 新 updated_at 正常保存 → 200
- 无 updated_at（旧客户端）→ 兼容保存 200
- 简单模式 15 题作答 responses 落库回读
"""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.models import Session as SessionRow
from alis.probe import StubLLMClient


def _make_body(updated_at: str, n_records: int = 2, **overrides) -> dict:
    body = {
        "session_id": "sess-1",
        "style_result": {
            "styleId": "UVR",
            "confidence": 0.04,
            "dimensionScores": {"E-U": -0.3, "T-V": -0.3, "F-R": -0.2},
            "matchedRules": ["UVR"],
        },
        "feedback_choice": "partially-matching",
        "reflection_text": "挺符合的",
        "records": [
            {
                "stage_id": 1,
                "question_id": "Q1",
                "follow_up_id": None,
                "contradiction_id": None,
                "interviewer_note": f"追问{i}",
                "respondent_reply": f"回答{i}",
                "recorded_at": f"2026-08-02T10:0{i}:00",
            }
            for i in range(1, n_records + 1)
        ],
        "current_stage": 2,
        "completed_stages": [1],
        "responses": {f"Q{i}": 5 for i in range(1, 16)},
        "updated_at": updated_at,
    }
    body.update(overrides)
    return body


@pytest.fixture()
def client_and_factory(tmp_path, seed_login):
    db_path = tmp_path / "test_save.db"
    engine = make_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    db = TestSession()
    db.add(
        SessionRow(
            session_id="sess-1",
            facilitator_id="f-1",
            scale_version="2.2-draft",
            started_at=datetime(2026, 8, 2, 9, 0, 0),
            age_screen_pass=True,
        )
    )
    db.commit()
    db.close()

    app = create_app(
        client=StubLLMClient("（桩）"),
        pack=load_question_pack(),
        session_factory=TestSession,
    )
    client = TestClient(app)
    seed_login(client, TestSession, role="facilitator", username="f-1")
    return client, TestSession


def test_save_and_get_roundtrip(client_and_factory):
    """保存 progress/responses → GET 完整回读（恢复闭环数据链）。"""
    client, _ = client_and_factory
    r = client.post("/interview/save", json=_make_body(updated_at="2026-08-02T10:05:00"))
    assert r.status_code == 200
    assert r.json()["n_records"] == 2

    g = client.get("/interview/session/sess-1")
    assert g.status_code == 200
    data = g.json()
    assert data["current_stage"] == 2
    assert data["completed_stages"] == [1]
    assert data["responses"] == {f"Q{i}": 5 for i in range(1, 16)}
    assert data["style_snapshot"]["styleId"] == "UVR"
    assert len(data["records"]) == 2


def test_stale_save_rejected_409(client_and_factory):
    """旧 updated_at 后到 → 409（P1-2 防乱序覆盖）。"""
    client, _ = client_and_factory
    # 先存新数据
    r1 = client.post("/interview/save", json=_make_body(updated_at="2026-08-02T10:30:00", n_records=3))
    assert r1.status_code == 200

    # 旧包（10:00）后到 → 409
    r2 = client.post("/interview/save", json=_make_body(updated_at="2026-08-02T10:00:00", n_records=1))
    assert r2.status_code == 409
    assert r2.json()["detail"] == "stale save rejected"

    # 库内数据未被旧包覆盖（仍是 3 条）
    g = client.get("/interview/session/sess-1")
    assert g.status_code == 200
    assert len(g.json()["records"]) == 3


def test_fresh_save_after_stale_200(client_and_factory):
    """旧包 409 后，新包正常保存 200。"""
    client, _ = client_and_factory
    r1 = client.post("/interview/save", json=_make_body(updated_at="2026-08-02T10:30:00", n_records=2))
    assert r1.status_code == 200
    r2 = client.post("/interview/save", json=_make_body(updated_at="2026-08-02T11:00:00", n_records=4))
    assert r2.status_code == 200
    g = client.get("/interview/session/sess-1")
    assert len(g.json()["records"]) == 4


def test_save_without_updated_at_compat(client_and_factory):
    """无 updated_at（旧客户端）→ 兼容保存 200，用 records 最大时间戳兜底。"""
    client, _ = client_and_factory
    body = _make_body(updated_at=None)
    body.pop("updated_at")
    r = client.post("/interview/save", json=body)
    assert r.status_code == 200
    assert r.json()["n_records"] == 2


def test_get_empty_session(client_and_factory):
    """无记录会话 → 空字段兜底（前端可推导）。"""
    client, _ = client_and_factory
    g = client.get("/interview/session/sess-1")
    assert g.status_code == 200
    data = g.json()
    assert data["current_stage"] is None
    assert data["completed_stages"] == []
    assert data["responses"] is None
    assert data["style_snapshot"] is None
