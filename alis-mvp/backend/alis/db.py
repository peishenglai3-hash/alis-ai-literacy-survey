"""数据库引擎与会话工厂。

本项目最重要的迁移埋点：连接串抽象。
- 8 月本地优先：默认 SQLite（单文件、WAL、可 U 盘带走）。
- 明春规模化：设置环境变量 DATABASE_URL 指向 PostgreSQL，**代码不改一行**，
  只改这个连接串（配合 Alembic 迁移）。
"""
from __future__ import annotations

import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

# 连接串抽象——SQLite ↔ PostgreSQL 只改这里（经环境变量）
DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./alis_local.db")


class Base(DeclarativeBase):
    """所有 ORM 模型的声明基类。"""


def make_engine(url: str | None = None):
    """按连接串建 engine；SQLite 自动开 WAL 并发 + 外键约束。"""
    url = url or DATABASE_URL
    is_sqlite = url.startswith("sqlite")
    connect_args = {"check_same_thread": False} if is_sqlite else {}
    engine = create_engine(url, echo=False, future=True, connect_args=connect_args)

    if is_sqlite:
        @event.listens_for(engine, "connect")
        def _set_sqlite_pragma(dbapi_conn, _record):  # noqa: ANN001
            cur = dbapi_conn.cursor()
            cur.execute("PRAGMA journal_mode=WAL")
            cur.execute("PRAGMA foreign_keys=ON")
            cur.execute("PRAGMA busy_timeout=5000")  # v3.12：并发写等待 5s 而非立即 database locked
            cur.close()

    return engine


engine = make_engine()
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)


def get_session():
    """返回一个新的 ORM 会话；调用方负责关闭（或用 with 上下文）。"""
    return SessionLocal()
