"""S3 追问闭环 —— API 端到端测试（TestClient + 临时 SQLite）。

用桩 LLM 客户端 + 独立临时库注入 create_app，验证：
- /health 返回量表版本
- POST /probe/render → 200，返回 probe_text/target_item_id/branch
- persist=True → probe_events 落库一行，target_item_id 恒等于输入（铁律）
- persist=False → 不落库
- 非法选题 → 400
"""
from __future__ import annotations

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import select
from sqlalchemy.orm import sessionmaker

from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.models import ProbeEvent
from alis.models import Session as SessionRow
from alis.probe import StubLLMClient


@pytest.fixture()
def client_and_factory(tmp_path, seed_login):
    db_path = tmp_path / "test_alis.db"
    engine = make_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    # 建一场会话，满足 probe_events.session_id 外键
    db = TestSession()
    db.add(
        SessionRow(
            session_id="sess-1",
            facilitator_id="f-1",
            scale_version="2.1-draft",
            started_at=datetime(2026, 7, 10, 9, 0, 0),
            age_screen_pass=True,
        )
    )
    db.commit()
    db.close()

    app = create_app(
        client=StubLLMClient("（桩）能具体讲讲当时的情形吗？"),
        pack=load_question_pack(),
        session_factory=TestSession,
    )
    client = TestClient(app)
    # 登录账号须为 sess-1 的属主 f-1（/probe/render 持久化现有写侧归属校验）
    seed_login(client, TestSession, role="facilitator", username="f-1")
    return client, TestSession


def test_health(client_and_factory):
    client, _ = client_and_factory
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["scale_version"] == "2.2-draft"


def test_render_persists(client_and_factory):
    client, TestSession = client_and_factory
    body = {
        "session_id": "sess-1",
        "target": {
            "item_id": "Q1",
            "dimension_id": "D1",
            "branch": "high",
            "raw_score": 6,
            "effective_score": 6.0,
        },
        "asked_at": "2026-07-10T09:05:00",
        "persist": True,
    }
    r = client.post("/probe/render", json=body)
    assert r.status_code == 200
    data = r.json()
    assert data["target_item_id"] == "Q1"  # 铁律：不改选题
    assert data["branch"] == "high"
    assert data["fallback"] is False
    assert "讲讲" in data["probe_text"]

    db = TestSession()
    rows = db.execute(select(ProbeEvent)).scalars().all()
    db.close()
    assert len(rows) == 1
    assert rows[0].target_item_id == "Q1"
    assert rows[0].session_id == "sess-1"


def test_render_no_persist(client_and_factory):
    client, TestSession = client_and_factory
    body = {
        "session_id": "sess-1",
        "target": {
            "item_id": "Q3",
            "dimension_id": "D2",
            "branch": "low",
            "raw_score": 2,
            "effective_score": 2.0,
        },
        "asked_at": "2026-07-10T09:06:00",
        "persist": False,
    }
    r = client.post("/probe/render", json=body)
    assert r.status_code == 200
    db = TestSession()
    rows = db.execute(select(ProbeEvent)).scalars().all()
    db.close()
    assert len(rows) == 0  # 未落库


def test_unknown_item_400(client_and_factory):
    client, _ = client_and_factory
    body = {
        "session_id": "sess-1",
        "target": {
            "item_id": "Q999",
            "dimension_id": "D1",
            "branch": "high",
            "raw_score": 7,
            "effective_score": 7.0,
        },
        "asked_at": "2026-07-10T09:07:00",
        "persist": True,
    }
    r = client.post("/probe/render", json=body)
    assert r.status_code == 400
