"""持久化层。

铁律护栏：probe_text 是 LLM 语言层产物，其余（评分/剖面/追问目标）由确定性代码算出。
音频/叙事原始文件绝不入库（narrative_segments 只存路径指针，S5 接入）。

S3：record_probe_event（单条追问事件）。
S4：会话建立 + 锁定后整包落库（作答/维度分/连续剖面/暴露AB反应）——供师门量化分析。
    事务边界一律交调用方（本层只 add+flush，不 commit）。
"""
from __future__ import annotations

from datetime import datetime
from typing import Any, Iterable, Optional

from .models import (
    DimensionScore,
    InterviewRecord,
    LikertResponse,
    NarrativeSegment,
    PersonalityProfile,
    ProbeEvent,
    QuestionReaction,
    Session,
)
from .probe import ProbeRender


def record_probe_event(
    db_session,
    session_id: str,
    render: ProbeRender,
    asked_at: datetime,
) -> ProbeEvent:
    """把一次追问渲染写入 probe_events。返回已 flush 的行（未 commit，交调用方决定事务边界）。"""
    ev = ProbeEvent(
        session_id=session_id,
        target_item_id=render.target_item_id,
        probe_text=render.probe_text,
        asked_at=asked_at,
    )
    db_session.add(ev)
    db_session.flush()
    return ev


def record_session(
    db_session,
    *,
    session_id: str,
    facilitator_id: str,
    scale_version: str,
    started_at: datetime,
    age_screen_pass: bool,
    consent_ref: Optional[str] = None,
) -> Session:
    """建立一场访谈会话（S4 flow 起点）。未成年筛查不过（age_screen_pass=False）由应用层拦。"""
    row = Session(
        session_id=session_id,
        facilitator_id=facilitator_id,
        scale_version=scale_version,
        started_at=started_at,
        consent_ref=consent_ref,
        age_screen_pass=age_screen_pass,
    )
    db_session.add(row)
    db_session.flush()
    return row


def record_likert_responses(
    db_session,
    session_id: str,
    responses: Iterable[tuple[str, int, datetime]],
    locked_at: datetime,
) -> int:
    """整批落 15 题作答；locked_at 统一盖章（阶段隔离：类型反馈前锁定）。返回落库条数。"""
    n = 0
    for item_id, raw_score, answered_at in responses:
        db_session.add(
            LikertResponse(
                session_id=session_id,
                item_id=item_id,
                raw_score=raw_score,
                answered_at=answered_at,
                locked_at=locked_at,
            )
        )
        n += 1
    db_session.flush()
    return n


def record_dimension_scores(
    db_session,
    session_id: str,
    scores: Iterable[tuple[str, float]],
    computed_at: datetime,
) -> int:
    """落 7 维度分（确定性代码算出，非 LLM）。返回条数。"""
    n = 0
    for dimension_id, score in scores:
        db_session.add(
            DimensionScore(
                session_id=session_id,
                dimension_id=dimension_id,
                score=float(score),
                computed_at=computed_at,
            )
        )
        n += 1
    db_session.flush()
    return n


def record_personality_profiles(
    db_session,
    session_id: str,
    profiles: Iterable[tuple[str, float, Optional[float], Optional[float], Optional[str]]],
) -> int:
    """落连续剖面 + 置信区间（无硬类型）。CI 不可估时以 percentile 兜底为上下界（退化区间）。返回条数。"""
    n = 0
    for dimension_id, percentile, ci_low, ci_high, self_named_label in profiles:
        db_session.add(
            PersonalityProfile(
                session_id=session_id,
                dimension_id=dimension_id,
                percentile=float(percentile),
                # 模型 ci_low/ci_high 非空；校正后各维≥2题恒可估，此处仅防御性兜底
                ci_low=float(ci_low) if ci_low is not None else float(percentile),
                ci_high=float(ci_high) if ci_high is not None else float(percentile),
                self_named_label=self_named_label,
            )
        )
        n += 1
    db_session.flush()
    return n


def record_question_reaction(
    db_session,
    session_id: str,
    *,
    item_id: str,
    exposed: bool,
    express_len: Optional[int] = None,
    emotion_intensity: Optional[float] = None,
) -> QuestionReaction:
    """落暴露 AB 反应（本 MVP 为会话级 A/B 的目标题一条；题级被试内留待正式版）。"""
    row = QuestionReaction(
        session_id=session_id,
        item_id=item_id,
        exposed=exposed,
        express_len=express_len,
        emotion_intensity=emotion_intensity,
    )
    db_session.add(row)
    db_session.flush()
    return row


def record_narrative_segment(
    db_session,
    session_id: str,
    *,
    ref_item_id: Optional[str],
    transcript: str,
    t_start: float,
    t_end: float,
    audio_file_id: Optional[str] = None,
) -> NarrativeSegment:
    """登记一段叙事（S5 汇聚）。音频只存路径指针 audio_file_id，原始音频绝不入库。"""
    row = NarrativeSegment(
        session_id=session_id,
        ref_item_id=ref_item_id,
        transcript=transcript,
        t_start=float(t_start),
        t_end=float(t_end),
        audio_file_id=audio_file_id,
    )
    db_session.add(row)
    db_session.flush()
    return row


def replace_interview_records(
    db_session,
    session_id: str,
    *,
    style_id: str,
    style_confidence: float,
    dim_scores_json: str,
    feedback_choice: Optional[str],
    reflection_text: Optional[str],
    records: list[dict[str, Any]],
    current_stage: Optional[int] = None,
    completed_stages_json: Optional[str] = None,
    responses_json: Optional[str] = None,
    updated_at: Optional[datetime] = None,
    force_empty: bool = False,  # v3.12：显式确认才允许清空已有记录（防误删）
) -> int:
    """替换某会话的全部访谈记录（先删后插，幂等保存）。

    records 每项包含：stage_id, question_id, follow_up_id, contradiction_id,
    interviewer_note, respondent_reply, recorded_at。
    v3.11：新增进度/作答/时间戳冗余列（与 style 快照同构，每行写入，GET 取首行）。
    v3.12：内容守卫——库内已有记录 + 新 records 为空 → ValueError（除非 force_empty=True）。
    返回写入条数。
    """
    # v3.12 内容守卫：拒绝空 payload 清空已有数据（除非显式确认）
    if not records and not force_empty:
        existing_count = (
            db_session.query(InterviewRecord)
            .filter(InterviewRecord.session_id == session_id)
            .count()
        )
        if existing_count > 0:
            raise ValueError(
                f"refusing to replace {existing_count} existing records with empty list "
                f"for session {session_id}. Set force_empty=True to confirm."
            )
    # 先删旧记录
    db_session.query(InterviewRecord).filter(InterviewRecord.session_id == session_id).delete()
    # 再批量插入
    n = 0
    for r in records:
        db_session.add(
            InterviewRecord(
                session_id=session_id,
                style_id=style_id,
                style_confidence=style_confidence,
                dim_scores_json=dim_scores_json,
                feedback_choice=feedback_choice,
                reflection_text=reflection_text,
                stage_id=r["stage_id"],
                question_id=r.get("question_id"),
                follow_up_id=r.get("follow_up_id"),
                contradiction_id=r.get("contradiction_id"),
                interviewer_note=r.get("interviewer_note", ""),
                respondent_reply=r.get("respondent_reply", ""),
                recorded_at=r["recorded_at"],
                current_stage=current_stage,
                completed_stages_json=completed_stages_json,
                responses_json=responses_json,
                updated_at=updated_at,
            )
        )
        n += 1
    db_session.flush()
    return n


def get_interview_updated_at(db_session, session_id: str) -> Optional[datetime]:
    """取某会话最近一次保存时间戳（P1-2 防乱序：旧包后到 → 409 拒绝）。"""
    row = (
        db_session.query(InterviewRecord)
        .filter(InterviewRecord.session_id == session_id)
        .order_by(InterviewRecord.updated_at.desc())
        .first()
    )
    return row.updated_at if row else None
