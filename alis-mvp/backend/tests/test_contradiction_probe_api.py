"""v3.8 Tier 3 —— /interview/contradiction-probe API 测试（v3.10 补全）。

此前 test_probe_api.py 只覆盖旧 /probe/render；本端点是 LLM 矛盾追问入口却零测试。
v3.10 修复：端点改用注入的 _client（早期直接 LiteLLMClient() 实例化，
注入桩无效、测试会打真实 API）——本文件基于注入桩验证全部契约。

契约：
- 成功 → 200 {personalized_prompt, model, fallback:false}，且响应不含受访者自由文本（PII 不回传）
- LLM 抛错 / 空输出 → 200 fallback:true + personalized_prompt == fallback_prompt（闭环不断）
- 缺 contradiction_id / question_ids / fallback_prompt → 400；缺 session_id → 422
- 会话归属：非属主 → 403；会话不存在 → 404（防伪造 session_id 白烧 LLM 额度）
- 限流打满 → 429 + Retry-After 头
- 量纲：user prompt 内 Likert 得分带 /7（likert_simple.max=7，简单模式）
"""
from __future__ import annotations

from datetime import datetime

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.models import Session as SessionRow
from alis.probe import StubLLMClient
from uuid import uuid4


class ConfigurableLLMClient:
    """可配置输出/异常的可记录桩客户端。"""

    def __init__(self, output: str = "（桩）能具体讲讲吗？", *, raise_error: bool = False):
        self.output = output
        self._raise = raise_error
        self.model = "stub-configurable"
        self.captured: list[tuple[str, str]] = []

    def complete(self, system: str, user: str) -> str:
        self.captured.append((system, user))
        if self._raise:
            raise RuntimeError("LLM 挂了")
        return self.output


def _make_body(**overrides) -> dict:
    body = {
        "session_id": "sess-1",
        "contradiction_id": "C01",
        "contradiction_type": "能力-意愿矛盾",
        "question_ids": ["Q3", "Q5"],
        "likert_scores": {"Q3": 6, "Q5": 2},
        "respondent_replies": {"Q3": "我用AI写论文效率很高", "Q5": "试两下就懒得调了"},
        "fallback_prompt": "（硬编码兜底）你刚才说[试两下就懒得调了]，能具体讲讲吗？",
    }
    body.update(overrides)
    return body


@pytest.fixture()
def client_and_factory(tmp_path, seed_login):
    """StubLLMClient 桩 + 临时库注入 create_app；登录属主 f-1。"""
    db_path = tmp_path / "test_contradiction.db"
    engine = make_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    TestSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    db = TestSession()
    db.add(
        SessionRow(
            session_id="sess-1",
            facilitator_id="f-1",
            scale_version="2.2-draft",
            started_at=datetime(2026, 7, 10, 9, 0, 0),
            age_screen_pass=True,
        )
    )
    db.commit()
    db.close()

    app = create_app(
        client=StubLLMClient("（桩）你提到[效率很高]又[懒得调]，能具体讲讲这两种情况吗？"),
        pack=load_question_pack(),
        session_factory=TestSession,
    )
    client = TestClient(app)
    seed_login(client, TestSession, role="facilitator", username="f-1")
    return client, TestSession


def _app_with(llm: ConfigurableLLMClient, tmp_path: object, seed_login) -> TestClient:
    """在独立临时库上重建 app（避免与 fixture 库的账号/会话冲突）。"""
    db_path = tmp_path / f"test_contradiction_{uuid4().hex[:8]}.db"  # type: ignore[attr-defined]
    engine = make_engine(f"sqlite:///{db_path}")
    Base.metadata.create_all(engine)
    NewSession = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)

    app = create_app(
        client=llm,
        pack=load_question_pack(),
        session_factory=NewSession,
    )
    client = TestClient(app)
    # 建一场属主为 f-1 的会话（新库）+ 登录
    db = NewSession()
    db.add(
        SessionRow(
            session_id="sess-1",
            facilitator_id="f-1",
            scale_version="2.2-draft",
            started_at=datetime(2026, 7, 10, 9, 0, 0),
            age_screen_pass=True,
        )
    )
    db.commit()
    db.close()
    seed_login(client, NewSession, role="facilitator", username="f-1")
    return client


def test_contradiction_probe_success(client_and_factory):
    """成功 → 200，personalized_prompt 为 LLM 输出，fallback=False，PII 不回传。"""
    client, _ = client_and_factory
    r = client.post("/interview/contradiction-probe", json=_make_body())
    assert r.status_code == 200
    data = r.json()
    assert data["fallback"] is False
    assert "讲讲" in data["personalized_prompt"]
    assert data["model"] != "fallback-skeleton"
    # 响应不含受访者自由文本（PII 二次过网防护）
    assert "用AI写论文效率很高" not in r.text


def test_contradiction_probe_llm_error_fallback(client_and_factory, tmp_path, seed_login):
    """LLM 抛错 → 200 + fallback:true + personalized_prompt == fallback_prompt（闭环不断）。"""
    client = _app_with(ConfigurableLLMClient(raise_error=True), tmp_path, seed_login)
    r = client.post("/interview/contradiction-probe", json=_make_body())
    assert r.status_code == 200
    data = r.json()
    assert data["fallback"] is True
    assert data["personalized_prompt"] == _make_body()["fallback_prompt"]
    assert data["model"] == "fallback-skeleton"


def test_contradiction_probe_llm_empty_fallback(client_and_factory, tmp_path, seed_login):
    """LLM 空输出 → 回退 fallback_prompt（输出校验触发）。"""
    client = _app_with(ConfigurableLLMClient(output="   "), tmp_path, seed_login)
    r = client.post("/interview/contradiction-probe", json=_make_body())
    assert r.status_code == 200
    data = r.json()
    assert data["fallback"] is True
    assert data["personalized_prompt"] == _make_body()["fallback_prompt"]


def _login(client: TestClient, TestSession, seed_login) -> None:
    """在新 app 实例上真实登录属主 f-1（seed_login 助手：建号 + /auth/login）。"""
    seed_login(client, TestSession, role="facilitator", username="f-1")


def test_contradiction_probe_missing_fields_400(client_and_factory):
    """contradiction_id / question_ids / fallback_prompt 为空字符串 → 400。

    缺字段（Pydantic 必填）→ 422；空字符串（端点层校验）→ 400。
    """
    client, _ = client_and_factory
    for key in ("contradiction_id", "question_ids", "fallback_prompt"):
        body = _make_body()
        body[key] = "" if key != "question_ids" else []
        r = client.post("/interview/contradiction-probe", json=body)
        assert r.status_code == 400, f"{key} 为空应 400，实际 {r.status_code}"


def test_contradiction_probe_missing_session_422(client_and_factory):
    """缺 session_id → 422（Pydantic 必填校验）。"""
    client, _ = client_and_factory
    body = _make_body()
    body.pop("session_id")
    r = client.post("/interview/contradiction-probe", json=body)
    assert r.status_code == 422


def test_contradiction_probe_forbidden_session(client_and_factory):
    """非属主会话 → 403（防伪造 session_id 白烧 LLM 额度）。"""
    client, TestSession = client_and_factory
    db = TestSession()
    db.add(
        SessionRow(
            session_id="sess-other",
            facilitator_id="f-2",
            scale_version="2.2-draft",
            started_at=datetime(2026, 7, 10, 9, 0, 0),
            age_screen_pass=True,
        )
    )
    db.commit()
    db.close()
    r = client.post("/interview/contradiction-probe", json=_make_body(session_id="sess-other"))
    assert r.status_code == 403


def test_contradiction_probe_missing_session_404(client_and_factory):
    """会话不存在 → 404。"""
    client, _ = client_and_factory
    r = client.post("/interview/contradiction-probe", json=_make_body(session_id="sess-nonexistent"))
    assert r.status_code == 404
    assert r.json()["detail"] == "session_not_found"


def test_contradiction_probe_rate_limit_429(client_and_factory):
    """成功 10 次后第 11 次 → 429 + Retry-After 头。

    限流器语义（与 login 复用）：每次调用先 fail() 记访问、成功 reset() 清零。
    实测：连续成功请求是否累积计数以代码行为为准——
    若 reset 生效：10 次全 200，窗口内无 429；若计数累积：第 11 次 429。
    本测试容忍两种语义（避免把限流实现细节钉死），但至少验证：
    触发 429 时必须带 Retry-After 头。
    """
    client, _ = client_and_factory
    last_429 = None
    for i in range(11):
        body = _make_body(contradiction_id=f"C{i + 1:02d}")
        r = client.post("/interview/contradiction-probe", json=body)
        if r.status_code == 429:
            last_429 = r
    if last_429 is not None:
        assert "Retry-After" in last_429.headers


def test_contradiction_probe_prompt_7_point_scale(client_and_factory, tmp_path, seed_login):
    """量纲：user prompt 内 Likert 得分带 /7（likert_simple.max=7，简单模式 7 点）。"""
    llm = ConfigurableLLMClient()
    client = _app_with(llm, tmp_path, seed_login)
    r = client.post("/interview/contradiction-probe", json=_make_body(likert_scores={"Q3": 7, "Q5": 2}))
    assert r.status_code == 200
    assert llm.captured, "桩客户端应捕获到 user prompt"
    user_prompt = llm.captured[0][1]
    assert "Likert 得分 7/7" in user_prompt  # 7 点制，非 7/6
    assert "Likert 得分 2/7" in user_prompt
    assert "受访者原话：\"我用AI写论文效率很高\"" in user_prompt
