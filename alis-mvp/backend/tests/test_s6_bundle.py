"""S6 交付包（bundle）+ 数据字典（codebook）回归。

覆盖：codebook 覆盖宽/长表每个变量（师门读表说明书完整）、/export/bundle.zip 为合法 ZIP
含 5 成员、包内 wide.csv 与 /export/wide.csv 一致、README 含隐私红线、stats.json 可解析。
"""
from __future__ import annotations

from datetime import datetime

import io
import json
import zipfile

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import alis.models  # noqa: F401  注册 ORM 表
from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.export import (
    codebook_columns,
    codebook_rows,
    long_columns,
    wide_columns,
)
from alis.probe import StubLLMClient


@pytest.fixture
def seeded(tmp_path, seed_login):
    """建库 + 落一场已提交会话，使导出有内容。返回 (client, pack)。"""
    engine = make_engine(f"sqlite:///{tmp_path / 's6.db'}")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    pack = load_question_pack()
    client = TestClient(create_app(client=StubLLMClient("（桩）能具体讲讲吗？"), pack=pack, session_factory=factory))
    seed_login(client, factory, role="admin")  # 导出需管理员登录
    sid = client.post(
        "/session/start",
        json={
            "facilitator_id": "F-01",
            "started_at": datetime(2026, 7, 10, 9, 0, 0).isoformat(),
            "age_screen_pass": True,
            "consent_ref": "verbal",
        },
    ).json()["session_id"]
    client.post(
        "/session/commit",
        json={
            "session_id": sid,
            "locked_at": datetime(2026, 7, 10, 9, 20, 0).isoformat(),
            "computed_at": datetime(2026, 7, 10, 9, 21, 0).isoformat(),
            "responses": [
                {"item_id": "Q1", "raw_score": 6, "answered_at": datetime(2026, 7, 10, 9, 5, 0).isoformat()},
                {"item_id": "Q2", "raw_score": 3, "answered_at": datetime(2026, 7, 10, 9, 6, 0).isoformat()},
            ],
            "dimension_scores": [{"dimension_id": "D1", "score": 5.0}],
            "profiles": [{"dimension_id": "D1", "percentile": 80.0, "ci_low": 60.0, "ci_high": 95.0, "self_named_label": None}],
            "reaction": {"item_id": "Q1", "exposed": True, "express_len": 120, "emotion_intensity": 5.0},
        },
    )
    return client, pack


class TestCodebook:
    def test_columns_shape(self):
        assert codebook_columns() == ["table", "variable", "label_zh", "type", "dimension_id", "note"]

    def test_covers_every_wide_and_long_variable(self):
        pack = load_question_pack()
        rows = codebook_rows(pack)
        cb_wide = {r["variable"] for r in rows if r["table"] == "wide"}
        cb_long = {r["variable"] for r in rows if r["table"] == "long"}
        # 数据字典必须覆盖导出表的每一列（否则师门有列无解释）
        assert set(wide_columns(pack)).issubset(cb_wide)
        assert set(long_columns()).issubset(cb_long)

    def test_item_and_dimension_mapping(self):
        pack = load_question_pack()
        rows = {r["variable"]: r for r in codebook_rows(pack) if r["table"] == "wide"}
        assert rows["Q1_raw"]["dimension_id"] == "D1"
        assert rows["D3_pct"]["dimension_id"] == "D3"
        assert "相对位置" in rows["D3_pct"]["label_zh"]
        # 题面进入标签（内容驱动，师门改题干即改字典）
        assert rows["Q1_raw"]["label_zh"].startswith("[Q1]")


class TestBundle:
    def test_bundle_is_valid_zip_with_six_members(self, seeded):
        client, _ = seeded
        resp = client.get("/export/bundle.zip")
        assert resp.status_code == 200
        assert resp.headers["content-type"] == "application/zip"
        zf = zipfile.ZipFile(io.BytesIO(resp.content))
        assert set(zf.namelist()) == {
            "alis_wide.csv",
            "alis_long.csv",
            "alis_interviews.csv",
            "alis_codebook.csv",
            "alis_stats.json",
            "README.txt",
        }

    def test_bundle_wide_matches_endpoint(self, seeded):
        client, _ = seeded
        zf = zipfile.ZipFile(io.BytesIO(client.get("/export/bundle.zip").content))
        in_zip = zf.read("alis_wide.csv").decode("utf-8-sig")
        endpoint = client.get("/export/wide.csv").content.decode("utf-8-sig")
        assert in_zip == endpoint

    def test_csv_members_have_utf8_sig_bom(self, seeded):
        client, _ = seeded
        zf = zipfile.ZipFile(io.BytesIO(client.get("/export/bundle.zip").content))
        for name in ("alis_wide.csv", "alis_long.csv", "alis_codebook.csv"):
            assert zf.read(name)[:3] == b"\xef\xbb\xbf"  # Excel 中文不乱码

    def test_readme_has_privacy_redline(self, seeded):
        client, _ = seeded
        zf = zipfile.ZipFile(io.BytesIO(client.get("/export/bundle.zip").content))
        readme = zf.read("README.txt").decode("utf-8")
        assert "跨境" in readme and "外部网盘" in readme

    def test_stats_json_parses(self, seeded):
        client, _ = seeded
        zf = zipfile.ZipFile(io.BytesIO(client.get("/export/bundle.zip").content))
        stats = json.loads(zf.read("alis_stats.json").decode("utf-8"))
        assert stats["n_sessions"] == 1
