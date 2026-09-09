"""S6 机器自动化内测台 —— 并发双角色环回压测（真实 HTTP + 真实序列化 + 真实 SQLite）。

赖培胜 S5 门指令：直接由你尝试并发模式，分两路分别担任【受访者】与【调查者】，
全面摸排各个功能是否正常、前后端衔接是否流畅。

做法（尽量贴近真实前后端衔接）：
  1. 用临时 SQLite（WAL 并发）建库 + StubLLM（不烧 DeepSeek、可复现）装配真实 create_app。
  2. 起一个真实 uvicorn 进程内服务在本机随机端口（真实 HTTP，走真实 JSON 序列化栈）。
  3. 并发跑：
       · 受访者 × N：完整复刻前端流程 —— /session/start → /probe/render → /session/commit
         → /narrative/register，且时间戳用与前端一致的 ISO(带 Z+毫秒 UTC)。
       · 调查者 × M：并发复刻促进者控制台 —— /health /sessions /stats /export/{wide,long}.csv
         /export/bundle.zip，边写边读。
  4. 汇总不变量：全部 200、无契约错配(422/400/500)、会话数/宽表行/长表行一致、
     每场 15 题不丢写、bundle.zip 为合法 ZIP 含 5 成员，逐项 PASS/FAIL。

退出码 0=全绿。用法：python -m tests.dryrun_concurrent [N respondents] [M investigators] [rounds]
"""
from __future__ import annotations

import io
import os
import socket
import sys
import threading
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor

# 让 alis 可导入（standalone 运行时）
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Windows GBK 控制台：避免打印中文/符号崩 UnicodeEncodeError
try:
    sys.stdout.reconfigure(encoding="utf-8")  # type: ignore[attr-defined]
except Exception:
    pass

import httpx
import uvicorn
from sqlalchemy.orm import sessionmaker

import alis.models  # noqa: F401  注册 ORM 表
from alis.api import create_app
from alis.content import load_question_pack
from alis.db import Base, make_engine
from alis.probe import StubLLMClient

ISO = "2026-07-10T09:{:02d}:00.000Z"  # 前端一致：带 Z + 毫秒的 UTC ISO


# ----------------------------- 结果记录 -----------------------------
class Report:
    def __init__(self) -> None:
        self.calls: list[tuple[str, str, bool, int, str]] = []  # role, step, ok, status, detail
        self.checks: list[tuple[str, bool, str]] = []  # name, ok, detail
        self._lock = threading.Lock()

    def call(self, role: str, step: str, status: int, ok: bool, detail: str = "") -> None:
        with self._lock:
            self.calls.append((role, step, ok, status, detail))

    def check(self, name: str, ok: bool, detail: str = "") -> None:
        with self._lock:
            self.checks.append((name, ok, detail))

    def call_ok(self) -> bool:
        return all(c[2] for c in self.calls)

    def checks_ok(self) -> bool:
        return all(c[1] for c in self.checks)


# ----------------------------- 受访者角色 -----------------------------
def _build_target(pack: dict, w: int) -> tuple[dict, list[dict]]:
    """构造第 w 位受访者的作答与一个合法追问目标（保证目标题走 high/low 极端分支）。"""
    items = pack["items"]
    item_dim = {it["id"]: it["dimension"] for it in items}
    lmax = int((pack.get("likert", {}) or {}).get("max", 6))  # 量纲从 pack 派生（6 点制=6）
    # 每题给 1..lmax 的散布分（可复现，非随机）
    responses = []
    for q, it in enumerate(items):
        score = 1 + ((w + q) % lmax)
        responses.append({"item_id": it["id"], "raw_score": score, "answered_at": ISO.format(5 + q % 50)})
    # 目标题：轮流选，强制极端以走合法分支
    tgt_item = items[w % len(items)]
    branch = "high" if w % 2 == 0 else "low"
    raw = lmax if branch == "high" else 1
    for r in responses:
        if r["item_id"] == tgt_item["id"]:
            r["raw_score"] = raw
    target = {
        "item_id": tgt_item["id"],
        "dimension_id": item_dim[tgt_item["id"]],
        "branch": branch,
        "raw_score": raw,
        "effective_score": float(raw),
    }
    return target, responses


def respondent(base: str, pack: dict, w: int, rep: Report) -> None:
    role = f"受访者#{w:02d}"
    dims = [d["id"] for d in pack["dimensions"]]
    with httpx.Client(base_url=base, timeout=30.0) as c:
        # 1) 建会话（未成年筛查通过 + Z+毫秒时间戳，完全复刻前端 startSession）
        r = c.post(
            "/session/start",
            json={
                "facilitator_id": f"F-{w % 3:02d}",
                "started_at": ISO.format(0),
                "age_screen_pass": True,
                "consent_ref": "verbal-consent-onsite",
            },
        )
        ok = r.status_code == 200
        rep.call(role, "POST /session/start", r.status_code, ok)
        if not ok:
            return
        body = r.json()
        sid, condition = body["session_id"], body["condition"]

        # 2) 渲染追问（只发 S2 定死的 ProbeTarget，复刻前端 renderProbe）
        target, responses = _build_target(pack, w)
        r = c.post(
            "/probe/render",
            json={"session_id": sid, "asked_at": ISO.format(15), "persist": True, "target": target},
        )
        ok = r.status_code == 200 and "probe_text" in r.json()
        rep.call(role, "POST /probe/render", r.status_code, ok, "" if ok else r.text[:120])

        # 3) 整包落库（复刻前端 commitSession 的 CommitPayload 形状）
        dim_scores = [{"dimension_id": d, "score": 4.0 + (w % 3) * 0.5} for d in dims]
        profiles = [
            {
                "dimension_id": d,
                "percentile": float((w * 7 + i * 11) % 100),
                "ci_low": None if i % 3 == 0 else 30.0,  # 触发 CI 兜底路径
                "ci_high": None if i % 3 == 0 else 80.0,
                "self_named_label": "谨慎尝鲜者" if i == 0 else None,
            }
            for i, d in enumerate(dims)
        ]
        r = c.post(
            "/session/commit",
            json={
                "session_id": sid,
                "locked_at": ISO.format(20),
                "computed_at": ISO.format(21),
                "responses": responses,
                "dimension_scores": dim_scores,
                "profiles": profiles,
                "reaction": {
                    "item_id": target["item_id"],
                    "exposed": condition == "exposed",
                    "express_len": 50 + w * 7,
                    "emotion_intensity": 4.0,
                },
            },
        )
        jb = r.json() if r.status_code == 200 else {}
        ok = r.status_code == 200 and jb.get("n_responses") == len(responses)
        rep.call(role, "POST /session/commit", r.status_code, ok, "" if ok else r.text[:120])

        # 4) 登记叙事（音频只存路径指针，复刻本地 Whisper 登记）
        r = c.post(
            "/narrative/register",
            json={
                "session_id": sid,
                "ref_item_id": target["item_id"],
                "transcript": f"（内测桩）第 {w} 位受访者的一段叙事。",
                "t_start": 0.0,
                "t_end": 12.5,
                "audio_file_id": f"audio_raw/{sid}.webm",
            },
        )
        ok = r.status_code == 200 and "segment_id" in r.json()
        rep.call(role, "POST /narrative/register", r.status_code, ok, "" if ok else r.text[:120])


# ----------------------------- 调查者角色 -----------------------------
def investigator(base: str, j: int, rounds: int, rep: Report) -> None:
    role = f"调查者#{j:02d}"
    with httpx.Client(base_url=base, timeout=30.0) as c:
        for _ in range(rounds):
            for step, path in [
                ("GET /health", "/health"),
                ("GET /sessions", "/sessions"),
                ("GET /stats", "/stats"),
                ("GET /export/wide.csv", "/export/wide.csv"),
                ("GET /export/long.csv", "/export/long.csv"),
            ]:
                r = c.get(path)
                rep.call(role, step, r.status_code, r.status_code == 200)
            # bundle.zip：边写边读，校验为合法 ZIP 含 5 成员
            r = c.get("/export/bundle.zip")
            ok = r.status_code == 200
            detail = ""
            if ok:
                try:
                    zf = zipfile.ZipFile(io.BytesIO(r.content))
                    names = set(zf.namelist())
                    want = {"alis_wide.csv", "alis_long.csv", "alis_codebook.csv", "alis_stats.json", "README.txt"}
                    ok = want.issubset(names)
                    detail = "" if ok else f"缺成员 {want - names}"
                except zipfile.BadZipFile:
                    ok, detail = False, "非法 ZIP"
            rep.call(role, "GET /export/bundle.zip", r.status_code, ok, detail)
            time.sleep(0.02)


# ----------------------------- 服务器管理 -----------------------------
def _free_port() -> int:
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def _run(n_resp: int, m_inv: int, rounds: int) -> int:
    import tempfile

    pack = load_question_pack()
    tmpdir = tempfile.mkdtemp(prefix="alis_dryrun_")
    db_url = f"sqlite:///{os.path.join(tmpdir, 'dryrun.db')}"
    engine = make_engine(db_url)
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, autoflush=False, autocommit=False, future=True)
    app = create_app(client=StubLLMClient("（桩）能具体讲讲那次的情形吗？"), pack=pack, session_factory=factory)

    port = _free_port()
    base = f"http://127.0.0.1:{port}"
    config = uvicorn.Config(app, host="127.0.0.1", port=port, log_level="warning")
    server = uvicorn.Server(config)
    th = threading.Thread(target=server.run, daemon=True)
    th.start()
    # 等服务器就绪
    for _ in range(200):
        if server.started:
            break
        time.sleep(0.05)
    if not server.started:
        print("[FATAL] uvicorn 未就绪")
        return 2

    rep = Report()
    print(f"[内测台] 服务 {base} | 受访者×{n_resp} 调查者×{m_inv}（各 {rounds} 轮）| StubLLM + 临时 WAL SQLite")
    t0 = time.perf_counter()
    try:
        with ThreadPoolExecutor(max_workers=n_resp + m_inv) as pool:
            futs = [pool.submit(respondent, base, pack, w, rep) for w in range(n_resp)]
            futs += [pool.submit(investigator, base, j, rounds, rep) for j in range(m_inv)]
            for f in futs:
                f.result()
        elapsed = time.perf_counter() - t0

        # ---- 落库后不变量核对（真库直查） ----
        with factory() as db:
            from sqlalchemy import func

            from alis.models import LikertResponse, NarrativeSegment, QuestionReaction, Session

            n_sessions = db.query(Session).count()
            n_committed = db.query(func.count(func.distinct(LikertResponse.session_id))).scalar()
            n_resp_rows = db.query(LikertResponse).count()
            n_react = db.query(QuestionReaction).count()
            n_narr = db.query(NarrativeSegment).count()
            # 每场 15 题不丢写
            per = dict(
                db.query(LikertResponse.session_id, func.count())
                .group_by(LikertResponse.session_id)
                .all()
            )
        n_items = len(pack["items"])
        rep.check("会话数 == 受访者数", n_sessions == n_resp, f"{n_sessions}/{n_resp}")
        rep.check("每场均已提交", n_committed == n_resp, f"{n_committed}/{n_resp}")
        rep.check(f"作答行 == 会话×{n_items}", n_resp_rows == n_resp * n_items, f"{n_resp_rows}/{n_resp * n_items}")
        rep.check("每场 15 题不丢写", all(v == n_items for v in per.values()), f"min={min(per.values()) if per else 0}")
        rep.check("暴露反应数 == 会话数", n_react == n_resp, f"{n_react}/{n_resp}")
        rep.check("叙事片段数 == 会话数", n_narr == n_resp, f"{n_narr}/{n_resp}")

        # ---- 导出一致性（真实 HTTP 再取一次，比对行数） ----
        with httpx.Client(base_url=base, timeout=30.0) as c:
            wide = c.get("/export/wide.csv").text.strip().splitlines()
            long = c.get("/export/long.csv").text.strip().splitlines()
        rep.check("宽表行 == 会话数(含表头)", len(wide) == n_resp + 1, f"{len(wide)}/{n_resp + 1}")
        rep.check("长表行 == 作答行(含表头)", len(long) == n_resp_rows + 1, f"{len(long)}/{n_resp_rows + 1}")
    finally:
        server.should_exit = True
        th.join(timeout=5)

    # ---- 打印报告 ----
    from collections import Counter

    by_step: Counter = Counter()
    fail_step: Counter = Counter()
    for role, step, ok, status, detail in rep.calls:
        by_step[step] += 1
        if not ok:
            fail_step[step] += 1
    print(f"\n[HTTP 调用] 共 {len(rep.calls)} 次，用时 {elapsed:.2f}s")
    print(f"{'端点/步骤':<26}{'次数':>6}{'失败':>6}{'判定':>8}")
    for step in by_step:
        f = fail_step[step]
        print(f"{step:<26}{by_step[step]:>6}{f:>6}{'  PASS' if f == 0 else '  FAIL':>8}")
        for role, s, ok, status, detail in rep.calls:
            if s == step and not ok:
                print(f"    └─ {role} status={status} {detail}")

    print("\n[数据不变量]")
    for name, ok, detail in rep.checks:
        print(f"  [{'PASS' if ok else 'FAIL'}] {name:<26} ({detail})")

    all_ok = rep.call_ok() and rep.checks_ok()
    print("\n" + ("=" * 52))
    print(f"[内测结论] {'全绿 —— 各功能正常、前后端衔接流畅' if all_ok else '存在失败项，见上'}")
    print("=" * 52)
    return 0 if all_ok else 1


def main() -> int:
    n = int(sys.argv[1]) if len(sys.argv) > 1 else 12
    m = int(sys.argv[2]) if len(sys.argv) > 2 else 3
    rounds = int(sys.argv[3]) if len(sys.argv) > 3 else 5
    return _run(n, m, rounds)


if __name__ == "__main__":
    raise SystemExit(main())
