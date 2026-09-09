"""bundle.py 打包/校验往返测试。"""
import json
from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from alis.bundle import export_session, verify_bundle
from alis.db import Base
from alis.models import (
    DimensionScore,
    LikertResponse,
    NarrativeSegment,
    PersonalityProfile,
    ProbeEvent,
    QuestionReaction,
    Session,
)

T = datetime(2026, 7, 10, 9, 0, 0)


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:", future=True)
    Base.metadata.create_all(engine)
    maker = sessionmaker(bind=engine, future=True)
    s = maker()
    try:
        yield s
    finally:
        s.close()


def _seed(db):
    db.add(
        Session(
            session_id="s1",
            facilitator_id="f1",
            scale_version="2.1-draft",
            started_at=T,
            age_screen_pass=True,
        )
    )
    db.add(LikertResponse(session_id="s1", item_id="Q1", raw_score=6, answered_at=T, locked_at=T))
    db.add(DimensionScore(session_id="s1", dimension_id="D1", score=5.5, computed_at=T))
    db.add(
        PersonalityProfile(
            session_id="s1",
            dimension_id="D1",
            percentile=80.0,
            ci_low=70.0,
            ci_high=90.0,
            self_named_label="识别者",
        )
    )
    db.add(ProbeEvent(session_id="s1", target_item_id="Q1", probe_text="最近一次判断是什么时候？", asked_at=T))
    db.add(
        NarrativeSegment(
            segment_id="n1",
            session_id="s1",
            ref_item_id="Q1",
            transcript="我上周才注意到某 App 用了 AI。",
            t_start=0.0,
            t_end=12.0,
            audio_file_id=None,
        )
    )
    db.add(
        QuestionReaction(
            session_id="s1", item_id="Q1", exposed=True, express_len=42, emotion_intensity=0.6
        )
    )
    db.commit()


def test_export_roundtrip(db, tmp_path):
    _seed(db)
    root = export_session("s1", tmp_path, db, exported_at=T)

    for name in (
        "manifest.json",
        "scale_responses.json",
        "narrative_segments.json",
        "probe_events.json",
        "question_reactions.json",
        "checksums.sha256",
    ):
        assert (root / name).is_file(), f"缺 {name}"
    assert (root / "audio").is_dir()
    assert (root / "transcripts").is_dir()

    manifest = json.loads((root / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["scale_version"] == "2.1-draft"
    assert manifest["counts"]["likert_responses"] == 1
    assert manifest["age_screen_pass"] is True

    # 校验通过
    assert verify_bundle(root) is True


def test_verify_detects_tamper(db, tmp_path):
    _seed(db)
    root = export_session("s1", tmp_path, db, exported_at=T)
    (root / "scale_responses.json").write_text("tampered", encoding="utf-8")
    with pytest.raises(ValueError):
        verify_bundle(root)


def test_missing_session_raises(db, tmp_path):
    with pytest.raises(ValueError):
        export_session("does-not-exist", tmp_path, db, exported_at=T)
