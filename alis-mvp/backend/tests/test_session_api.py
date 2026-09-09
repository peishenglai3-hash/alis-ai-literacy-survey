"""S4 会话 API 端到端 —— /session/start 与 /session/commit（临时 SQLite，桩 LLM）。

覆盖：建会话 + 暴露 A/B 分配、未成年筛查 403、整包落库（作答/维度分/剖面/暴露反应）、
反应可选、CI 不可估的防御性兜底、assign_condition 确定性与均衡性。
"""
from __future__ import annotations

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import alis.models  # noqa: F401  注册 ORM 表
from alis.api import assign_condition, create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.models import LikertResponse, PersonalityProfile, QuestionReaction, Session
from alis.probe import StubLLMClient


@pytest.fixture
def client_and_factory(tmp_path, seed_login):
    db_path = tmp_path / "s4.db"
    engine = make_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    app = create_app(
        client=StubLLMClient("（桩）能具体讲讲吗？"),
        pack=load_question_pack(),
        session_factory=TestSession,
    )
    client = TestClient(app)
    seed_login(client, TestSession, role="facilitator")  # 采集类端点需促进者登录
    return client, TestSession


def _start(client, age_pass=True):
    return client.post(
        "/session/start",
        json={
            "facilitator_id": "F-03",
            "started_at": datetime(2026, 7, 10, 9, 0, 0).isoformat(),
            "age_screen_pass": age_pass,
            "consent_ref": "verbal-consent-onsite",
        },
    )


# ---------- assign_condition 纯函数 ----------
class TestAssignCondition:
    def test_deterministic(self):
        assert assign_condition("abc-123") == assign_condition("abc-123")

    def test_values_are_valid(self):
        assert assign_condition("x") in {"exposed", "control"}

    def test_roughly_balanced(self):
        conds = [assign_condition(f"sess-{i}") for i in range(200)]
        # 两个条件都应出现，且不至于极端失衡
        assert conds.count("exposed") > 60
        assert conds.count("control") > 60


# ---------- /session/start ----------
class TestSessionStart:
    def test_creates_session(self, client_and_factory):
        client, factory = client_and_factory
        resp = _start(client)
        assert resp.status_code == 200
        body = resp.json()
        assert body["session_id"]
        assert body["condition"] in {"exposed", "control"}
        assert body["scale_version"] == "2.2-draft"
        with factory() as db:
            assert db.query(Session).count() == 1

    def test_condition_matches_pure_fn(self, client_and_factory):
        client, _ = client_and_factory
        body = _start(client).json()
        assert body["condition"] == assign_condition(body["session_id"])

    def test_minor_without_guardian_rejected(self, client_and_factory):
        client, factory = client_and_factory
        resp = _start(client, age_pass=False)
        assert resp.status_code == 403
        with factory() as db:
            assert db.query(Session).count() == 0  # 未建会话


# ---------- /session/commit ----------
def _commit_payload(session_id, with_reaction=True):
    payload = {
        "session_id": session_id,
        "locked_at": datetime(2026, 7, 10, 9, 20, 0).isoformat(),
        "computed_at": datetime(2026, 7, 10, 9, 21, 0).isoformat(),
        "responses": [
            {"item_id": "Q1", "raw_score": 6, "answered_at": datetime(2026, 7, 10, 9, 5, 0).isoformat()},
            {"item_id": "Q2", "raw_score": 3, "answered_at": datetime(2026, 7, 10, 9, 6, 0).isoformat()},
        ],
        "dimension_scores": [
            {"dimension_id": "D1", "score": 5.0},
            {"dimension_id": "D2", "score": 4.2},
        ],
        "profiles": [
            {"dimension_id": "D1", "percentile": 80.0, "ci_low": 60.0, "ci_high": 95.0, "self_named_label": "谨慎尝鲜者"},
            # CI 不可估 → 后端防御性以 percentile 兜底为上下界
            {"dimension_id": "D2", "percentile": 50.0, "ci_low": None, "ci_high": None, "self_named_label": None},
        ],
    }
    if with_reaction:
        payload["reaction"] = {
            "item_id": "Q1",
            "exposed": True,
            "express_len": 120,
            "emotion_intensity": 5.0,
        }
    return payload


class TestSessionCommit:
    def test_persists_bundle(self, client_and_factory):
        client, factory = client_and_factory
        sid = _start(client).json()["session_id"]
        resp = client.post("/session/commit", json=_commit_payload(sid))
        assert resp.status_code == 200
        body = resp.json()
        assert body["n_responses"] == 2
        assert body["n_dimension_scores"] == 2
        assert body["n_profiles"] == 2
        assert body["reaction_saved"] is True
        with factory() as db:
            assert db.query(LikertResponse).filter_by(session_id=sid).count() == 2
            assert db.query(QuestionReaction).filter_by(session_id=sid).count() == 1
            # CI 兜底：D2 的 ci_low/ci_high 被 percentile(50) 填上，非空
            d2 = db.query(PersonalityProfile).filter_by(session_id=sid, dimension_id="D2").one()
            assert d2.ci_low == 50.0 and d2.ci_high == 50.0

    def test_reaction_optional(self, client_and_factory):
        client, factory = client_and_factory
        sid = _start(client).json()["session_id"]
        resp = client.post("/session/commit", json=_commit_payload(sid, with_reaction=False))
        assert resp.status_code == 200
        assert resp.json()["reaction_saved"] is False
        with factory() as db:
            assert db.query(QuestionReaction).filter_by(session_id=sid).count() == 0

    def test_locked_at_stamped_on_responses(self, client_and_factory):
        client, factory = client_and_factory
        sid = _start(client).json()["session_id"]
        client.post("/session/commit", json=_commit_payload(sid))
        with factory() as db:
            rows = db.query(LikertResponse).filter_by(session_id=sid).all()
            # 阶段隔离：每条作答都盖了统一 locked_at
            assert all(r.locked_at is not None for r in rows)
