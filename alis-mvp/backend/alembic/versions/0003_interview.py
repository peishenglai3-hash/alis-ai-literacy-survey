"""interview_records: v2.0 访谈引擎持久化

Revision ID: 0003_interview
Revises: 0002_auth
Create Date: 2026-07-22

幂等守卫：若表已存在（全新库 0001 的 create_all 已按最新 metadata 建表）则跳过。
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0003_interview"
down_revision = "0002_auth"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())

    if "interview_records" not in existing:
        op.create_table(
            "interview_records",
            sa.Column("id", sa.Integer(), autoincrement=True, primary_key=True),
            sa.Column("session_id", sa.String(36), sa.ForeignKey("sessions.session_id"), nullable=False),
            sa.Column("style_id", sa.String(32), nullable=False),
            sa.Column("style_confidence", sa.Float(), nullable=False),
            sa.Column("dim_scores_json", sa.Text(), nullable=False),
            sa.Column("feedback_choice", sa.String(32)),
            sa.Column("reflection_text", sa.Text()),
            sa.Column("stage_id", sa.Integer(), nullable=False),
            sa.Column("question_id", sa.String(16)),
            sa.Column("follow_up_id", sa.String(64)),
            sa.Column("contradiction_id", sa.String(16)),
            sa.Column("interviewer_note", sa.Text(), nullable=False),
            sa.Column("respondent_reply", sa.Text(), nullable=False),
            sa.Column("recorded_at", sa.DateTime(), nullable=False),
        )
        op.create_index("ix_interview_records_session_id", "interview_records", ["session_id"])


def downgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())
    if "interview_records" in existing:
        op.drop_table("interview_records")
