"""interview_records: v3.11 恢复闭环支撑列（current_stage/completed_stages/responses/updated_at）

Revision ID: 0004_interview_progress
Revises: 0003_interview
Create Date: 2026-08-02

背景（事故 1 修复）：刷新即丢全部访谈内容。根因之一 = 后端不存进度位置与
15 题作答，前端刷新后无从恢复。本次为 interview_records 增加四列（全 nullable，
旧数据无损）：
- current_stage:          冗余存储当前阶段（与 style 快照同构，每行冗余，GET 取首行）
- completed_stages_json:  已完成阶段 JSON 数组
- responses_json:         简单模式 15 题作答（Q1..Q15 → 7 点分），刷新恢复用
- updated_at:             最近一次保存时间戳（P1-2 防乱序覆盖：旧包后到 → 409 拒绝）

幂等守卫：列已存在（全新库 create_all 已按最新 metadata 建表）则跳过。
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0004_interview_progress"
down_revision = "0003_interview"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing_cols = set()
    try:
        existing_cols = {c["name"] for c in inspect(bind).get_columns("interview_records")}
    except Exception:
        # 表不存在（全新库）→ create_all 已建齐，无需补列
        return

    if "current_stage" not in existing_cols:
        op.add_column("interview_records", sa.Column("current_stage", sa.Integer(), nullable=True))
    if "completed_stages_json" not in existing_cols:
        op.add_column("interview_records", sa.Column("completed_stages_json", sa.Text(), nullable=True))
    if "responses_json" not in existing_cols:
        op.add_column("interview_records", sa.Column("responses_json", sa.Text(), nullable=True))
    if "updated_at" not in existing_cols:
        op.add_column("interview_records", sa.Column("updated_at", sa.DateTime(), nullable=True))


def downgrade() -> None:
    bind = op.get_bind()
    existing_cols = set()
    try:
        existing_cols = {c["name"] for c in inspect(bind).get_columns("interview_records")}
    except Exception:
        return
    for col in ("current_stage", "completed_stages_json", "responses_json", "updated_at"):
        if col in existing_cols:
            op.drop_column("interview_records", col)
