"""models.py 结构与约束测试。"""
from datetime import datetime

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from alis.db import Base
from alis.models import (
    DimensionScore,
    LikertResponse,
    PersonalityProfile,
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


def test_full_session_roundtrip(db):
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
            session_id="s1", dimension_id="D1", percentile=80.0, ci_low=70.0, ci_high=90.0
        )
    )
    db.commit()

    sess = db.get(Session, "s1")
    assert len(sess.likert_responses) == 1
    assert sess.likert_responses[0].locked_at == T


def test_personality_is_continuous_not_hard_type():
    """采纳决策：连续剖面 + 置信区间，不得有离散 type 字段。"""
    cols = {c.name for c in PersonalityProfile.__table__.columns}
    assert "type" not in cols, "人格表不应含硬类型字段"
    assert {"percentile", "ci_low", "ci_high"} <= cols


def test_likert_has_locked_at_for_phase_isolation():
    cols = {c.name for c in LikertResponse.__table__.columns}
    assert "locked_at" in cols


def test_raw_score_check_constraint(db):
    db.add(
        Session(
            session_id="s2",
            facilitator_id="f",
            scale_version="v",
            started_at=T,
            age_screen_pass=True,
        )
    )
    db.commit()
    db.add(LikertResponse(session_id="s2", item_id="Q1", raw_score=9, answered_at=T))
    with pytest.raises(Exception):
        db.commit()
    db.rollback()


def test_no_face_recognition_fields():
    """护栏：MVP 无任何人脸/生物识别字段。"""
    for model in (Session, PersonalityProfile):
        names = " ".join(c.name for c in model.__table__.columns).lower()
        for banned in ("face", "biometric", "facial"):
            assert banned not in names
