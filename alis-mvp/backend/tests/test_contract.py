"""前后端契约回归 —— 钉死"前端真实发送格式"能被后端正确受理与落库。

动机（赖培胜 S4 审阅叮嘱：防前后端错配/失常）：
前端 `client.ts` 用 `new Date().toISOString()` 发送带 `Z`+毫秒的 UTC ISO-8601
（如 "2026-07-10T09:00:00.000Z"），而手工 curl 常用无 Z 裸时间戳。本测试用**与前端逐字节
同形**的 payload 打全链路，确保 datetime 解析/落库不失常、字段无错配。
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import alis.models  # noqa: F401  注册 ORM 表
from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.models import LikertResponse, ProbeEvent, Session
from alis.probe import StubLLMClient


@pytest.fixture
def client_and_factory(tmp_path, seed_login):
    engine = make_engine(f"sqlite:///{tmp_path / 'contract.db'}")
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


# 与前端 client.ts 完全同形的 ISO：带 Z + 毫秒
Z = "2026-07-10T09:00:00.000Z"
Z2 = "2026-07-10T09:20:00.000Z"


class TestFrontendIsoDatetime:
    def test_start_accepts_z_suffixed_iso(self, client_and_factory):
        client, factory = client_and_factory
        resp = client.post(
            "/session/start",
            json={
                "facilitator_id": "F-web",
                "started_at": Z,  # 前端真实格式
                "age_screen_pass": True,
                "consent_ref": "verbal-consent-onsite",
            },
        )
        assert resp.status_code == 200
        sid = resp.json()["session_id"]
        with factory() as db:
            row = db.query(Session).filter_by(session_id=sid).one()
            assert row.started_at is not None  # 成功解析并落库，无失常

    def test_full_commit_matches_frontend_payload_shape(self, client_and_factory):
        client, factory = client_and_factory
        sid = client.post(
            "/session/start",
            json={
                "facilitator_id": "F-web",
                "started_at": Z,
                "age_screen_pass": True,
                "consent_ref": None,
            },
        ).json()["session_id"]

        # 逐字段对齐 client.ts renderProbe 发送体
        pr = client.post(
            "/probe/render",
            json={
                "session_id": sid,
                "asked_at": Z,
                "persist": True,
                "target": {
                    "item_id": "Q3",
                    "dimension_id": "D2",
                    "branch": "high",
                    "raw_score": 6,
                    "effective_score": 6.0,
                },
            },
        )
        assert pr.status_code == 200
        assert pr.json()["target_item_id"] == "Q3"

        # 逐字段对齐 client.ts commitSession 发送体（含 ci null + reaction）
        commit = client.post(
            "/session/commit",
            json={
                "session_id": sid,
                "locked_at": Z2,
                "computed_at": Z2,
                "responses": [
                    {"item_id": "Q1", "raw_score": 6, "answered_at": Z},
                    {"item_id": "Q3", "raw_score": 6, "answered_at": Z},
                ],
                "dimension_scores": [{"dimension_id": "D2", "score": 6.5}],
                "profiles": [
                    {
                        "dimension_id": "D2",
                        "percentile": 78.0,
                        "ci_low": None,
                        "ci_high": None,
                        "self_named_label": "务实的用AI者",
                    }
                ],
                "reaction": {
                    "item_id": "Q3",
                    "exposed": True,
                    "express_len": 140,
                    "emotion_intensity": 5.0,
                },
            },
        )
        assert commit.status_code == 200
        body = commit.json()
        assert body["n_responses"] == 2 and body["reaction_saved"] is True
        with factory() as db:
            assert db.query(LikertResponse).filter_by(session_id=sid).count() == 2
            assert db.query(ProbeEvent).filter_by(session_id=sid).count() == 1
            # locked_at 已落到每条作答（阶段隔离），无失常
            assert all(
                r.locked_at is not None
                for r in db.query(LikertResponse).filter_by(session_id=sid).all()
            )
