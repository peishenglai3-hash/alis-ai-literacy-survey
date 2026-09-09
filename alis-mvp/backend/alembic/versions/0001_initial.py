"""initial schema: 7 tables + unified_timeline view

Revision ID: 0001_initial
Revises:
Create Date: 2026-07-10

初始迁移。为保证与 ORM 模型零漂移，用 metadata.create_all 建表，
再手写 CREATE VIEW（SQLite / PostgreSQL 同一段基础 SQL 均可）。
"""
from alembic import op

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

# 统一时间轴视图：把 Likert 作答事件与叙事片段并成一条可按 session_id 关联的事件流，
# 供定量×定性混合方法分析（SQL 为通用子集，SQLite 与 PostgreSQL 均可执行）。
_UNIFIED_TIMELINE_VIEW = """
CREATE VIEW unified_timeline AS
SELECT session_id,
       'likert'   AS event_type,
       item_id    AS ref_id,
       CAST(raw_score AS TEXT) AS payload,
       answered_at AS event_time,
       NULL       AS t_start
FROM likert_responses
UNION ALL
SELECT session_id,
       'narrative' AS event_type,
       ref_item_id AS ref_id,
       transcript  AS payload,
       NULL        AS event_time,
       t_start
FROM narrative_segments
"""


def upgrade() -> None:
    # 延迟 import：确保在迁移上下文中拿到已注册的 metadata
    from alis import models  # noqa: F401
    from alis.db import Base

    bind = op.get_bind()
    Base.metadata.create_all(bind)
    op.execute(_UNIFIED_TIMELINE_VIEW)


def downgrade() -> None:
    from alis import models  # noqa: F401
    from alis.db import Base

    bind = op.get_bind()
    op.execute("DROP VIEW IF EXISTS unified_timeline")
    Base.metadata.drop_all(bind)
