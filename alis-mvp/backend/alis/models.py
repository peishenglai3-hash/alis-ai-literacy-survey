"""ORM 模型 —— ALIS 单题闭环 MVP 的 7 张表。

对齐 S0 schema 草案 v0.1。设计约束（守铁律与护栏）：
- 评分（dimension_scores）与追问目标（probe_events.target_item_id）由**确定性代码**算出，
  LLM 只写 probe_events.probe_text（语言层）。本层不含任何计算逻辑。
- 音频只存路径指针（narrative_segments.audio_file_id），原始音频**绝不入库**。
- 采纳《量表 v2.1 修订建议》两项决策：
    · personality_profiles 存**连续剖面 + 置信区间**（percentile/ci_low/ci_high），
      **不设离散 type 字段**（弃硬人格类型）。
    · likert_responses 带 **locked_at**（阶段隔离：类型反馈前锁定评分）。
- 时间戳列不设 auto-now 默认，全部由调用方传入 —— 保证可复现、可测试。
- 无任何人脸/生物识别字段（面部识别已从 MVP 移除）。
"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .db import Base


def _uuid() -> str:
    return str(uuid.uuid4())


class Session(Base):
    """一场访谈一行。"""

    __tablename__ = "sessions"

    session_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    facilitator_id: Mapped[str] = mapped_column(String(64))
    scale_version: Mapped[str] = mapped_column(String(32))
    started_at: Mapped[datetime] = mapped_column(DateTime)  # 调用方传入
    consent_ref: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    # 未成年筛查护栏：false → 应用层走监护人同意流程
    age_screen_pass: Mapped[bool] = mapped_column(Boolean)

    likert_responses: Mapped[list["LikertResponse"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    dimension_scores: Mapped[list["DimensionScore"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    personality_profiles: Mapped[list["PersonalityProfile"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    probe_events: Mapped[list["ProbeEvent"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    narrative_segments: Mapped[list["NarrativeSegment"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    question_reactions: Mapped[list["QuestionReaction"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )
    interview_records: Mapped[list["InterviewRecord"]] = relationship(
        back_populates="session", cascade="all, delete-orphan"
    )


class LikertResponse(Base):
    """15 题的 Likert 作答事件。

    量表点数由可编辑 Question Pack 决定（2026-07 起为 6 点去中点，1..6）。
    下方 CHECK(1..7) 是**宽松兜底 superset**：对 1..6 完全兼容、不误拒，故保留不动、
    免去对现网 alis_local.db 的重建迁移；真正随 pack 走的量纲护栏在 API 层
    （/session/commit 按 pack likert.min/max 校验，见 api.py）。改点数无需动本约束。
    """

    __tablename__ = "likert_responses"
    __table_args__ = (CheckConstraint("raw_score >= 1 AND raw_score <= 7", name="ck_likert_1_7"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"))
    item_id: Mapped[str] = mapped_column(String(16))
    raw_score: Mapped[int] = mapped_column(Integer)
    answered_at: Mapped[datetime] = mapped_column(DateTime)
    # 阶段隔离：类型反馈前锁定的时间戳；未锁定为 NULL
    locked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    session: Mapped["Session"] = relationship(back_populates="likert_responses")


class DimensionScore(Base):
    """7 维度评分。由确定性代码算出，非 LLM。"""

    __tablename__ = "dimension_scores"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"))
    dimension_id: Mapped[str] = mapped_column(String(16))
    score: Mapped[float] = mapped_column(Float)
    computed_at: Mapped[datetime] = mapped_column(DateTime)

    session: Mapped["Session"] = relationship(back_populates="dimension_scores")


class PersonalityProfile(Base):
    """人格**连续剖面** + 置信区间（弃硬类型；type 字段被刻意省略）。"""

    __tablename__ = "personality_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"))
    dimension_id: Mapped[str] = mapped_column(String(16))
    percentile: Mapped[float] = mapped_column(Float)
    ci_low: Mapped[float] = mapped_column(Float)
    ci_high: Mapped[float] = mapped_column(Float)
    # 受访者自命名标签（"自我命名"环节）——非分析变量
    self_named_label: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    session: Mapped["Session"] = relationship(back_populates="personality_profiles")


class ProbeEvent(Base):
    """单题追问事件。target_item_id 由确定性代码选（偏离最大题）；probe_text 是 LLM 语言层产物。"""

    __tablename__ = "probe_events"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"))
    target_item_id: Mapped[str] = mapped_column(String(16))
    probe_text: Mapped[str] = mapped_column(Text)  # LLM 生成的一句自然追问
    asked_at: Mapped[datetime] = mapped_column(DateTime)

    session: Mapped["Session"] = relationship(back_populates="probe_events")


class NarrativeSegment(Base):
    """叙事片段。回指触发它的题；音频只存路径指针，原始音频不入库。"""

    __tablename__ = "narrative_segments"

    segment_id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"))
    ref_item_id: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    transcript: Mapped[str] = mapped_column(Text)
    t_start: Mapped[float] = mapped_column(Float)  # 相对秒
    t_end: Mapped[float] = mapped_column(Float)
    audio_file_id: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)  # 仅路径/指针

    session: Mapped["Session"] = relationship(back_populates="narrative_segments")


class QuestionReaction(Base):
    """暴露评价被试内 AB 埋点：一半题暴露评分过程、一半不暴露，比较表达欲。"""

    __tablename__ = "question_reactions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"))
    item_id: Mapped[str] = mapped_column(String(16))
    exposed: Mapped[bool] = mapped_column(Boolean)  # 是否暴露了评分过程（AB 因子）
    express_len: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)  # 叙事长度
    emotion_intensity: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    session: Mapped["Session"] = relationship(back_populates="question_reactions")


class User(Base):
    """账号（管理员 / 促进者）。参与者不登录、保持匿名，绝不入本表。

    - role 两级：admin（研究者，看全量+导出）/ facilitator（促进者，建会话/采集，只看自己）。
    - password_hash 为 argon2id 编码串（明文密码绝不入库/日志/报告）。
    - 账号由管理员后台统一建号（不开放自助注册）。
    """

    __tablename__ = "users"
    __table_args__ = (CheckConstraint("role IN ('admin','facilitator')", name="ck_user_role"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    username: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[str] = mapped_column(String(16))  # 'admin' | 'facilitator'
    display_name: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime)  # 调用方传入


class AuthSession(Base):
    """登录会话——不透明随机 token 的 sha256 哈希（不存明文），可即时撤销。

    区别于访谈 `Session`（一场访谈）。Cookie 里只放明文 token，服务端存其哈希后查表；
    停用/改密时把该用户全部会话 `revoked_at` 盖章即刻失效。
    """

    __tablename__ = "auth_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), index=True)
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)  # sha256 hex
    created_at: Mapped[datetime] = mapped_column(DateTime)
    expires_at: Mapped[datetime] = mapped_column(DateTime)
    revoked_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class InterviewRecord(Base):
    """v2.0 访谈引擎——6 阶段认知旅程中的单条追问-回复记录。

    每行 = 一次追问交互（促进者追问 + 受访者回复），归属某个访谈阶段。
    风格分类结果与受访者反馈一并持久化，供师门质性分析。
    """

    __tablename__ = "interview_records"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[str] = mapped_column(ForeignKey("sessions.session_id"), index=True)
    # 风格分类快照（冗余存储，避免跨表关联时 pack 版本不一致）
    style_id: Mapped[str] = mapped_column(String(32))
    style_confidence: Mapped[float] = mapped_column(Float)
    dim_scores_json: Mapped[str] = mapped_column(Text)  # FourDimScores JSON
    # 受访者反馈
    feedback_choice: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    reflection_text: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    # 访谈记录字段
    stage_id: Mapped[int] = mapped_column(Integer)  # 1-6
    question_id: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    follow_up_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    contradiction_id: Mapped[Optional[str]] = mapped_column(String(16), nullable=True)
    interviewer_note: Mapped[str] = mapped_column(Text)
    respondent_reply: Mapped[str] = mapped_column(Text)
    recorded_at: Mapped[datetime] = mapped_column(DateTime)

    # v3.11 恢复闭环支撑列（全 nullable，旧数据无损；与 style 快照同构冗余，GET 取首行）
    current_stage: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    completed_stages_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    responses_json: Mapped[Optional[str]] = mapped_column(Text, nullable=True)  # 简单模式 15 题作答
    updated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)  # P1-2 防乱序

    session: Mapped["Session"] = relationship(back_populates="interview_records")


# 明春 PostgreSQL 迁移时新增（RLS/TDE/pgcrypto）不需改上述模型，只在 Alembic 迁移里加策略。
ALL_MODELS = [
    Session,
    LikertResponse,
    DimensionScore,
    PersonalityProfile,
    ProbeEvent,
    NarrativeSegment,
    QuestionReaction,
    User,
    AuthSession,
    InterviewRecord,
]
