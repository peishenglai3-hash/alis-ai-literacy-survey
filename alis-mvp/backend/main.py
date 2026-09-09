"""ALIS 后端 ASGI 入口。

本地/内网启动：
    cd backend
    uvicorn main:app --host 127.0.0.1 --port 8000
（真机跑真实 LLM 追问需 backend/.env 内配置 DEEPSEEK_API_KEY；缺省则 render 自动回退骨架。）

生产内网部署时按实际情况绑定 host/port，并在反向代理层收紧 CORS 与访问控制。
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

log = logging.getLogger("uvicorn")


def _load_env() -> None:
    """极简 .env 读取（不引 python-dotenv），只在未设置时注入。"""
    env = Path(__file__).parent / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip())


_load_env()

from alis.api import create_app  # noqa: E402  必须在 _load_env 之后导入
from alis.db import DATABASE_URL  # noqa: E402


@asynccontextmanager
async def _lifespan(app):
    """v3.12：启动时自动执行 alembic 迁移（fail-fast——schema 未就绪绝不起服务）。

    手动 `alembic upgrade head` 被替换为启动自检，杜绝"部署后忘跑迁移"导致的
    interview_save 500 事故。SQLite 单进程部署下零风险。
    """
    import asyncio
    from alembic import command
    from alembic.config import Config as AlembicConfig

    here = Path(__file__).parent
    cfg = AlembicConfig(str(here / "alembic.ini"))
    cfg.set_main_option("script_location", str(here / "alembic"))
    cfg.set_main_option("sqlalchemy.url", DATABASE_URL)
    try:
        await asyncio.to_thread(command.upgrade, cfg, "head")
        log.info("alembic upgrade head applied (or already current)")
    except Exception:
        log.exception("alembic migration failed — refusing to start")
        raise  # fail-fast：schema 未达当前版本绝不起服务
    yield


app = create_app(lifespan=_lifespan)
