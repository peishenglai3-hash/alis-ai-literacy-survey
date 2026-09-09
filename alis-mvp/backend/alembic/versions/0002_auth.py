"""auth: users + auth_sessions（应用层账号认证）

Revision ID: 0002_auth
Revises: 0001_initial
Create Date: 2026-07-11

幂等守卫说明（关键）：0001 用 `Base.metadata.create_all`，而 create_all 建的是
**运行时 metadata 里的全部表**。因此存在两条路径，本迁移都要正确：
  · 生产库：0001 当年建表时 metadata 只有 7 张（无 users/auth_sessions）→ 此处新建两表。
  · 全新库：0001 的 create_all 已按最新 metadata 建了 9 张（含两表）→ 此处检测到已存在→跳过。
用 inspect 检测表是否存在再决定建/跳，两条路径都收敛到同一 schema。
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect

revision = "0002_auth"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())

    if "users" not in existing:
        op.create_table(
            "users",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("username", sa.String(64), nullable=False),
            sa.Column("password_hash", sa.String(255), nullable=False),
            sa.Column("role", sa.String(16), nullable=False),
            sa.Column("display_name", sa.String(64)),
            sa.Column("is_active", sa.Boolean(), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.CheckConstraint("role IN ('admin','facilitator')", name="ck_user_role"),
        )
        op.create_index("ix_users_username", "users", ["username"], unique=True)

    if "auth_sessions" not in existing:
        op.create_table(
            "auth_sessions",
            sa.Column("id", sa.String(36), primary_key=True),
            sa.Column("user_id", sa.String(36), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("token_hash", sa.String(64), nullable=False),
            sa.Column("created_at", sa.DateTime(), nullable=False),
            sa.Column("expires_at", sa.DateTime(), nullable=False),
            sa.Column("revoked_at", sa.DateTime()),
        )
        op.create_index("ix_auth_sessions_token_hash", "auth_sessions", ["token_hash"], unique=True)
        op.create_index("ix_auth_sessions_user_id", "auth_sessions", ["user_id"])


def downgrade() -> None:
    bind = op.get_bind()
    existing = set(inspect(bind).get_table_names())
    if "auth_sessions" in existing:
        op.drop_table("auth_sessions")  # 先删子表（FK 指向 users）
    if "users" in existing:
        op.drop_table("users")
