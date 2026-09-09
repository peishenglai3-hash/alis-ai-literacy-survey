"""pytest 共享夹具 —— 账号认证接入后，受守卫端点需先登录。

两件事：
1) 测试经 http 的 TestClient，httpx 会丢弃 Secure Cookie → 在任何 app 建立前把
   ALIS_COOKIE_SECURE 置 false（用 setdefault，不覆盖显式设置）。
2) seed_login 夹具：向测试库直插一个账号并调 /auth/login，使 TestClient 携带会话 Cookie。
   TestClient 底层 httpx.Client 自带 cookie jar，登录后的 Set-Cookie 会自动回带到后续请求。
"""
from __future__ import annotations

import os

os.environ.setdefault("ALIS_COOKIE_SECURE", "false")

from datetime import datetime

import pytest
from argon2 import PasswordHasher

from alis.models import User

_PH = PasswordHasher()


def seed_user(factory, username: str, password: str, role: str, is_active: bool = True) -> None:
    """直插一个账号到测试库（绕过 /admin/users，供夹具引导用）。"""
    with factory() as db:
        db.add(
            User(
                username=username,
                password_hash=_PH.hash(password),
                role=role,
                display_name=username,
                is_active=is_active,
                created_at=datetime.now(),
            )
        )
        db.commit()


@pytest.fixture
def seed_login():
    """返回 _login(client, factory, role=..., username=..., password=...) 助手：建号并登录。"""

    def _login(client, factory, role="facilitator", username=None, password="pw-test-123"):
        username = username or f"{role}-tester"
        seed_user(factory, username, password, role)
        resp = client.post("/auth/login", json={"username": username, "password": password})
        assert resp.status_code == 200, resp.text
        return username

    return _login
