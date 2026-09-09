"""应用层账号认证 —— 端到端（临时 SQLite，桩 LLM）。

覆盖守卫矩阵与安全不变式：登录成功/失败/未知用户同文案/停用401、无 Cookie 401、
facilitator 访问导出 403 / admin 200、建号+重复 409 + 弱密码 422、停用即时撤会话且不能再登、
logout 撤会话、TTL 过期 401、数据范围隔离（facilitator 只见自己 / admin 全量）、
facilitator_id 被登录账号权威覆盖、登录限速 429、最后一个在职 admin 不可停用（防自锁）。
"""
from __future__ import annotations

from datetime import datetime, timedelta

import pytest
from argon2 import PasswordHasher
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

import alis.models  # noqa: F401  注册 ORM 表
from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.models import AuthSession, Session, User
from alis.probe import StubLLMClient

_PH = PasswordHasher()
PW = "pw-test-12345"  # ≥8 位
Z = "2026-07-10T09:00:00.000Z"


@pytest.fixture
def app_factory(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'auth.db'}")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    app = create_app(
        client=StubLLMClient("（桩）能具体讲讲吗？"),
        pack=load_question_pack(),
        session_factory=factory,
    )
    return app, factory


def _mk_user(factory, username, password, role, is_active=True) -> str:
    with factory() as db:
        u = User(
            username=username,
            password_hash=_PH.hash(password),
            role=role,
            display_name=username,
            is_active=is_active,
            created_at=datetime.now(),
        )
        db.add(u)
        db.commit()
        return u.id


def _login(client, username, password):
    return client.post("/auth/login", json={"username": username, "password": password})


def _start_session(client):
    return client.post(
        "/session/start",
        json={"started_at": Z, "age_screen_pass": True, "consent_ref": "verbal"},
    )


# ---------- 登录 ----------
class TestLogin:
    def test_success_sets_cookie_and_me(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        r = _login(c, "fac", PW)
        assert r.status_code == 200
        body = r.json()
        assert body["username"] == "fac" and body["role"] == "facilitator"
        # Cookie 已置且后续请求自动携带
        assert "alis_session" in c.cookies
        me = c.get("/auth/me")
        assert me.status_code == 200 and me.json()["username"] == "fac"

    def test_wrong_password_401(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        r = _login(TestClient(app), "fac", "wrong-password")
        assert r.status_code == 401
        assert r.json()["detail"] == "invalid_credentials"

    def test_unknown_user_same_message_no_enumeration(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        r = _login(TestClient(app), "ghost-user", PW)
        # 未知用户与密码错返回完全相同的文案与状态码 → 无法枚举
        assert r.status_code == 401 and r.json()["detail"] == "invalid_credentials"

    def test_disabled_user_401(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator", is_active=False)
        assert _login(TestClient(app), "fac", PW).status_code == 401


# ---------- 守卫矩阵 ----------
class TestGuards:
    def test_no_cookie_guarded_endpoints_401(self, app_factory):
        app, _ = app_factory
        c = TestClient(app)
        assert c.get("/sessions").status_code == 401
        assert _start_session(c).status_code == 401
        assert c.get("/auth/me").status_code == 401

    def test_health_public(self, app_factory):
        app, _ = app_factory
        assert TestClient(app).get("/health").status_code == 200

    def test_facilitator_cannot_export_403(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        _login(c, "fac", PW)
        assert c.get("/export/wide.csv").status_code == 403
        assert c.get("/export/bundle.zip").status_code == 403

    def test_admin_can_export_200(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "boss", PW, "admin")
        c = TestClient(app)
        _login(c, "boss", PW)
        assert c.get("/export/wide.csv").status_code == 200
        assert c.get("/export/long.csv").status_code == 200


# ---------- 管理员建号/管号 ----------
class TestAdminUsers:
    def _admin_client(self, app, factory):
        _mk_user(factory, "boss", PW, "admin")
        c = TestClient(app)
        _login(c, "boss", PW)
        return c

    def test_create_user_and_duplicate_409(self, app_factory):
        app, factory = app_factory
        c = self._admin_client(app, factory)
        r = c.post("/admin/users", json={"username": "f1", "password": PW, "role": "facilitator"})
        assert r.status_code == 201 and r.json()["username"] == "f1"
        dup = c.post("/admin/users", json={"username": "f1", "password": PW, "role": "facilitator"})
        assert dup.status_code == 409

    def test_create_user_weak_password_422(self, app_factory):
        app, factory = app_factory
        c = self._admin_client(app, factory)
        r = c.post("/admin/users", json={"username": "f2", "password": "short", "role": "facilitator"})
        assert r.status_code == 422

    def test_create_user_password_no_complexity_422(self, app_factory):
        # H4 回归：12 位以上但只有一类字符 → 422 password_too_weak
        app, factory = app_factory
        c = self._admin_client(app, factory)
        r = c.post("/admin/users", json={"username": "f3", "password": "abcdefghijklm", "role": "facilitator"})
        assert r.status_code == 422
        assert "password_too_weak" in r.json()["detail"]

    def test_facilitator_cannot_create_user_403(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        _login(c, "fac", PW)
        r = c.post("/admin/users", json={"username": "x", "password": PW, "role": "facilitator"})
        assert r.status_code == 403

    def test_disable_revokes_sessions_immediately(self, app_factory):
        app, factory = app_factory
        uid = _mk_user(factory, "fac", PW, "facilitator")
        fac_c = TestClient(app)
        _login(fac_c, "fac", PW)
        assert fac_c.get("/auth/me").status_code == 200
        admin_c = self._admin_client(app, factory)
        r = admin_c.patch(f"/admin/users/{uid}", json={"is_active": False})
        assert r.status_code == 200
        # 既有 Cookie 立即失效，且无法再登录
        assert fac_c.get("/auth/me").status_code == 401
        assert _login(TestClient(app), "fac", PW).status_code == 401

    def test_password_reset_revokes_sessions(self, app_factory):
        app, factory = app_factory
        uid = _mk_user(factory, "fac", PW, "facilitator")
        fac_c = TestClient(app)
        _login(fac_c, "fac", PW)
        admin_c = self._admin_client(app, factory)
        assert admin_c.patch(f"/admin/users/{uid}", json={"new_password": "brand-new-pw"}).status_code == 200
        assert fac_c.get("/auth/me").status_code == 401  # 旧会话被撤
        assert _login(TestClient(app), "fac", "brand-new-pw").status_code == 200  # 新密码可登

    def test_last_active_admin_cannot_be_disabled_409(self, app_factory):
        app, factory = app_factory
        boss_id = _mk_user(factory, "boss", PW, "admin")
        c = TestClient(app)
        _login(c, "boss", PW)
        # 唯一在职 admin 停用自己 → 409 防自锁
        assert c.patch(f"/admin/users/{boss_id}", json={"is_active": False}).status_code == 409
        # 降级唯一 admin 同样被拦
        assert c.patch(f"/admin/users/{boss_id}", json={"role": "facilitator"}).status_code == 409


# ---------- 会话生命周期 ----------
class TestSessionLifecycle:
    def test_logout_revokes(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        _login(c, "fac", PW)
        assert c.post("/auth/logout").status_code == 200
        assert c.get("/auth/me").status_code == 401

    def test_expired_ttl_401(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        _login(c, "fac", PW)
        # 直接把会话 expires_at 改到过去 → 下次请求判过期
        with factory() as db:
            row = db.query(AuthSession).one()
            row.expires_at = datetime.now() - timedelta(hours=1)
            db.commit()
        assert c.get("/auth/me").status_code == 401


# ---------- 数据范围隔离 ----------
class TestDataScope:
    def test_facilitator_sees_only_own_admin_all(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "A", PW, "facilitator")
        _mk_user(factory, "B", PW, "facilitator")
        _mk_user(factory, "boss", PW, "admin")
        ca, cb, cadmin = TestClient(app), TestClient(app), TestClient(app)
        _login(ca, "A", PW)
        _login(cb, "B", PW)
        _login(cadmin, "boss", PW)
        _start_session(ca)  # A 建 1 场
        _start_session(cb)  # B 建 1 场

        assert ca.get("/sessions").json()["count"] == 1
        assert cb.get("/sessions").json()["count"] == 1
        assert cadmin.get("/sessions").json()["count"] == 2  # admin 见全量
        assert ca.get("/stats").json()["n_sessions"] == 1
        assert cadmin.get("/stats").json()["n_sessions"] == 2

    def test_facilitator_id_overridden_by_login(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "realfac", PW, "facilitator")
        c = TestClient(app)
        _login(c, "realfac", PW)
        # 前端即便伪造 facilitator_id，服务端也用登录账号权威覆盖
        r = c.post(
            "/session/start",
            json={"facilitator_id": "SPOOFED", "started_at": Z, "age_screen_pass": True},
        )
        assert r.status_code == 200
        sid = r.json()["session_id"]
        with factory() as db:
            row = db.query(Session).filter_by(session_id=sid).one()
            assert row.facilitator_id == "realfac"  # 非 "SPOOFED"


# ---------- 登录限速 ----------
class TestRateLimit:
    def test_too_many_failures_429(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        # 默认 5 次窗口内失败上限
        for _ in range(5):
            assert _login(c, "fac", "wrong").status_code == 401
        r = _login(c, "fac", "wrong")
        assert r.status_code == 429
        assert "Retry-After" in r.headers

    def test_xff_prefix_spoof_does_not_bypass_limit(self, app_factory):
        # H1 回归：限速按 nginx 覆盖写入的 X-Real-IP 计（客户端无法伪造）；
        # 客户端伪造的 X-Forwarded-For 前缀不应每请求换桶绕过。
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        real = {"X-Real-IP": "9.9.9.9"}
        for i in range(5):
            r = c.post(
                "/auth/login",
                json={"username": "fac", "password": "wrong"},
                headers={**real, "X-Forwarded-For": f"1.2.3.{i}"},
            )
            assert r.status_code == 401
        # X-Real-IP 恒定 → 第 6 次仍被限，尽管 XFF 前缀每次不同
        r = c.post(
            "/auth/login",
            json={"username": "fac", "password": "wrong"},
            headers={**real, "X-Forwarded-For": "1.2.3.250"},
        )
        assert r.status_code == 429


# ---------- 写侧对象级授权（防 IDOR）----------
class TestObjectAuthz:
    def test_facilitator_cannot_write_others_session(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "A", PW, "facilitator")
        _mk_user(factory, "B", PW, "facilitator")
        ca, cb = TestClient(app), TestClient(app)
        _login(ca, "A", PW)
        _login(cb, "B", PW)
        sid = _start_session(ca).json()["session_id"]  # A 名下会话

        # B 向 A 的会话登记叙事 → 403
        r = cb.post(
            "/narrative/register",
            json={"session_id": sid, "transcript": "偷写", "t_start": 0.0, "t_end": 1.0},
        )
        assert r.status_code == 403
        # B 向 A 的会话整包落库 → 403
        r2 = cb.post(
            "/session/commit",
            json={
                "session_id": sid,
                "locked_at": Z,
                "computed_at": Z,
                "responses": [{"item_id": "Q1", "raw_score": 6, "answered_at": Z}],
                "dimension_scores": [],
                "profiles": [],
            },
        )
        assert r2.status_code == 403
        # 属主 A 可登记 → 200
        assert ca.post(
            "/narrative/register",
            json={"session_id": sid, "transcript": "本人", "t_start": 0.0, "t_end": 1.0},
        ).status_code == 200

    def test_write_to_nonexistent_session_404(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "A", PW, "facilitator")
        c = TestClient(app)
        _login(c, "A", PW)
        r = c.post(
            "/narrative/register",
            json={"session_id": "no-such-session", "transcript": "x", "t_start": 0.0, "t_end": 1.0},
        )
        assert r.status_code == 404

    def test_admin_can_write_any_session(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "A", PW, "facilitator")
        _mk_user(factory, "boss", PW, "admin")
        ca, cadmin = TestClient(app), TestClient(app)
        _login(ca, "A", PW)
        _login(cadmin, "boss", PW)
        sid = _start_session(ca).json()["session_id"]  # A 名下
        # admin 跨促进者维护 → 放行
        assert cadmin.post(
            "/narrative/register",
            json={"session_id": sid, "transcript": "admin维护", "t_start": 0.0, "t_end": 1.0},
        ).status_code == 200


# ---------- Cookie 属性 ----------
class TestCookieAttributes:
    def test_login_cookie_flags(self, app_factory):
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        r = _login(c, "fac", PW)
        setc = r.headers.get("set-cookie", "")
        low = setc.lower()
        assert "httponly" in low
        assert "samesite=lax" in low
        assert "path=/" in low
        assert "max-age=" in low
        # 测试态 ALIS_COOKIE_SECURE=false → 不下发 Secure（生产为 true）
        assert "secure" not in low


# ---------- CSRF Origin/Referer 校验 ----------
class TestCsrfOrigin:
    def test_evil_origin_rejected_403(self, app_factory):
        """跨站 POST 带不匹配的 Origin → 403"""
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        r = c.post(
            "/auth/login",
            json={"username": "fac", "password": PW},
            headers={"Origin": "https://evil.com"},
        )
        assert r.status_code == 403
        assert "invalid_origin" in r.json()["detail"]

    def test_trusted_dev_origin_allowed(self, app_factory):
        """开发源 Origin（localhost:5173）→ 被信任，可正常执行业务逻辑"""
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        r = c.post(
            "/auth/login",
            json={"username": "fac", "password": PW},
            headers={"Origin": "http://localhost:5173"},
        )
        # 不在 CSRF 层被拒绝，正常走到登录逻辑（密码对则 200，错则 401）
        assert r.status_code in (200, 401)

    def test_no_origin_no_referer_allowed(self, app_factory):
        """无 Origin/Referer 时放行（依赖 SameSite=Lax Cookie 作为主防线）"""
        app, factory = app_factory
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        r = c.post("/auth/login", json={"username": "fac", "password": PW})
        assert r.status_code in (200, 401)  # 不被 CSRF 拦截


# ---------- ALIS_TRUST_PROXY 行为 ----------
class TestTrustProxy:
    def test_default_no_trust_ignores_proxy_headers(self, monkeypatch):
        """默认 ALIS_TRUST_PROXY 未设置 → X-Real-IP 被忽略，用直连 IP"""
        # 确保环境变量未设置
        monkeypatch.delenv("ALIS_TRUST_PROXY", raising=False)
        from alis.api import create_app
        from alis.content import load_question_pack
        from alis.db import make_engine, Base
        from alis.probe import StubLLMClient
        from sqlalchemy.orm import sessionmaker
        import tempfile

        tmp = tempfile.mkdtemp()
        engine = make_engine(f"sqlite:///{tmp}/t.db")
        Base.metadata.create_all(engine)
        factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
        app = create_app(
            client=StubLLMClient("桩"),
            pack=load_question_pack(),
            session_factory=factory,
        )
        _mk_user(factory, "fac", PW, "facilitator")
        c = TestClient(app)
        # 发送伪造的 X-Real-IP，默认不信任代理头 → 限速 IP 应为 testclient
        for i in range(5):
            r = c.post(
                "/auth/login",
                json={"username": "fac", "password": "wrong"},
                headers={"X-Real-IP": f"10.0.0.{i}"},
            )
            assert r.status_code == 401
        # 第 6 次仍被限速（IP 未因 X-Real-IP 变化而换桶）
        r = c.post(
            "/auth/login",
            json={"username": "fac", "password": "wrong"},
            headers={"X-Real-IP": "10.0.0.99"},
        )
        assert r.status_code == 429



class TestRateLimitMultiDevice:
    """v3.11 事故 2 回归：per-user 键纯 username——不同账号互不锁死（原 (username,ip) 键
    在共享 IP/nginx 反代下会跨账号误伤）。"""

    def test_different_accounts_no_cross_lock(self, app_factory):
        """账号 A 错满 5 次锁 5 分钟 → 账号 B 同 IP 不受影响，可立即登录。"""
        app, factory = app_factory
        _mk_user(factory, "facA", PW, "facilitator")
        _mk_user(factory, "facB", PW, "facilitator")
        c = TestClient(app)
        # A 错 5 次 → 第 6 次 429
        for _ in range(5):
            assert c.post("/auth/login", json={"username": "facA", "password": "wrong"}).status_code == 401
        assert c.post("/auth/login", json={"username": "facA", "password": "wrong"}).status_code == 429
        # B 同 IP 正确密码 → 200（v3.11 前：同 IP 桶计数共享，B 可能被 A 拖累）
        assert _login(c, "facB", PW).status_code == 200

    def test_success_reset_does_not_clear_ip_bucket(self, app_factory):
        """P0-1 reset bug 回归：A 账号成功登录不得清空同 IP 下 B 账号的失败计数。"""
        app, factory = app_factory
        _mk_user(factory, "facA", PW, "facilitator")
        _mk_user(factory, "facB", PW, "facilitator")
        c = TestClient(app)
        # A 错 3 次（记入 IP 桶）
        for _ in range(3):
            c.post("/auth/login", json={"username": "facA", "password": "wrong"})
        # B 成功登录（旧实现会清空整个 IP 桶；修复后不清）
        assert _login(c, "facB", PW).status_code == 200
        # A 的 per-user 计数保留：再错 2 次（累计 5）→ 第 6 次 429
        for _ in range(2):
            c.post("/auth/login", json={"username": "facA", "password": "wrong"})
        assert c.post("/auth/login", json={"username": "facA", "password": "wrong"}).status_code == 429
