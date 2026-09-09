"""S5 汇聚导出 + 促进者控制台 + 叙事登记 —— 端到端（临时 SQLite，桩 LLM）。

覆盖：宽表列顺序（内容驱动）、宽表按会话聚合、长表按作答展开、build_stats 按条件 express_len 均值、
/sessions 列表汇总、/export CSV（utf-8-sig BOM）、/narrative/register 落库（音频只存路径指针）、
StubTranscriber 转写缝。
"""
from __future__ import annotations

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import alis.models  # noqa: F401
from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.export import build_long_rows, build_stats, build_wide_rows, wide_columns
from alis.models import NarrativeSegment  # noqa: F401
from alis.probe import StubLLMClient
from alis.transcribe import StubTranscriber, Transcriber

PACK = load_question_pack()
Z = "2026-07-10T09:00:00.000Z"


@pytest.fixture
def ctx(tmp_path, seed_login):
    engine = make_engine(f"sqlite:///{tmp_path / 's5.db'}")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    app = create_app(client=StubLLMClient("（桩）讲讲吧？"), pack=PACK, session_factory=factory)
    client = TestClient(app)
    seed_login(client, factory, role="admin")  # 导出/全量控制台需管理员登录
    return client, factory


def _seed_session(client, facilitator="F-1", express_len=100):
    sid = client.post(
        "/session/start",
        json={"facilitator_id": facilitator, "started_at": Z, "age_screen_pass": True},
    ).json()["session_id"]
    client.post(
        "/session/commit",
        json={
            "session_id": sid,
            "locked_at": Z,
            "computed_at": Z,
            "responses": [
                {"item_id": "Q1", "raw_score": 6, "answered_at": Z},
                {"item_id": "Q3", "raw_score": 4, "answered_at": Z},
            ],
            "dimension_scores": [{"dimension_id": "D1", "score": 6.0}, {"dimension_id": "D2", "score": 4.0}],
            "profiles": [
                {"dimension_id": "D1", "percentile": 82.0, "ci_low": 70.0, "ci_high": 94.0, "self_named_label": "A"},
                {"dimension_id": "D2", "percentile": 40.0, "ci_low": 25.0, "ci_high": 55.0, "self_named_label": None},
            ],
            "reaction": {"item_id": "Q1", "exposed": True, "express_len": express_len, "emotion_intensity": 4.0},
        },
    )
    return sid


# ---------- 宽表/长表构造（纯聚合） ----------
class TestExportBuilders:
    def test_wide_columns_content_driven(self):
        cols = wide_columns(PACK)
        assert "Q1_raw" in cols and "Q15_raw" in cols  # 15 题原始分列
        assert "D1_score" in cols and "D7_pct" in cols  # 7 维分 + 相对位置列
        assert "reaction_exposed" in cols and "condition" in cols

    def test_wide_one_row_per_session(self, ctx):
        client, factory = ctx
        _seed_session(client)
        with factory() as db:
            rows = build_wide_rows(db, PACK)
        assert len(rows) == 1
        r = rows[0]
        assert r["Q1_raw"] == 6 and r["Q3_raw"] == 4
        assert r["D1_score"] == 6.0 and r["D1_pct"] == 82.0
        assert r["reaction_exposed"] == 1 and r["reaction_express_len"] == 100
        assert r["condition"] in {"exposed", "control"}

    def test_long_one_row_per_response(self, ctx):
        client, factory = ctx
        _seed_session(client)
        with factory() as db:
            rows = build_long_rows(db, PACK)
        assert len(rows) == 2
        by_item = {r["item_id"]: r for r in rows}
        assert by_item["Q1"]["dimension_id"] == "D1"  # 维度映射来自 pack
        assert by_item["Q3"]["dimension_id"] == "D2"


# ---------- stats：暴露 A/B 方向性信号 ----------
class TestStats:
    def test_mean_express_len_by_condition(self, ctx):
        client, factory = ctx
        # 造几场，express_len 有别；按条件分组求均值
        for i in range(6):
            _seed_session(client, facilitator=f"F-{i}", express_len=50 + i * 10)
        with factory() as db:
            st = build_stats(db)
        assert st["n_sessions"] == 6
        assert st["by_condition"]["exposed"] + st["by_condition"]["control"] == 6
        assert st["n_reactions"] == 6
        means = st["express_len_mean"]
        # 至少一个条件有样本、能算出均值
        assert (means["exposed"] is not None) or (means["control"] is not None)


# ---------- 端点：/sessions、/export、/narrative ----------
class TestConsoleEndpoints:
    def test_sessions_list(self, ctx):
        client, _ = ctx
        _seed_session(client)
        body = client.get("/sessions").json()
        assert body["count"] == 1
        s = body["sessions"][0]
        assert s["committed"] is True and s["n_responses"] == 2 and s["has_reaction"] is True

    def test_export_wide_csv_utf8_sig(self, ctx):
        client, _ = ctx
        _seed_session(client)
        resp = client.get("/export/wide.csv")
        assert resp.status_code == 200
        assert resp.headers["content-type"].startswith("text/csv")
        # utf-8-sig BOM 头（Excel 中文不乱码）
        assert resp.content[:3] == b"\xef\xbb\xbf"
        assert "Q1_raw" in resp.text and "session_id" in resp.text

    def test_export_long_csv(self, ctx):
        client, _ = ctx
        _seed_session(client)
        resp = client.get("/export/long.csv")
        assert resp.status_code == 200
        assert "dimension_id" in resp.text

    def test_narrative_register_persists_pointer_only(self, ctx):
        client, factory = ctx
        sid = _seed_session(client)
        resp = client.post(
            "/narrative/register",
            json={
                "session_id": sid,
                "ref_item_id": "Q1",
                "transcript": "我记得那次赶报告用了AI。",
                "t_start": 0.0,
                "t_end": 12.0,
                "audio_file_id": "audio_raw/alis_xxx.webm",  # 仅路径指针
            },
        )
        assert resp.status_code == 200
        with factory() as db:
            seg = db.query(NarrativeSegment).filter_by(session_id=sid).one()
            assert seg.transcript.startswith("我记得")
            assert seg.audio_file_id == "audio_raw/alis_xxx.webm"  # 只存指针


# ---------- 转写缝 ----------
class TestTranscriber:
    def test_stub_conforms_protocol(self):
        t = StubTranscriber("测试转写", duration=9.0)
        assert isinstance(t, Transcriber)  # runtime_checkable Protocol
        out = t.transcribe("any/path.webm")
        assert out.text == "测试转写" and out.duration_sec == 9.0
