import { useState } from "react";
import { startSession, ApiError, type SessionStartResult } from "../api/client";
import type { AppMode } from "../App";

// 采集起点：促进者完成受访者知情同意与年龄筛查后建会话。
// 促进者身份来自登录账号（facilitatorId 由服务端权威绑定，前端只读展示，不再手输）。
// 护栏（对齐 S0 红线）：未满 18 → 走监护人同意流程（本 MVP 记录已获监护人同意后放行）。
// 未成年筛查未过时后端 /session/start 直接 403 拒建会话。
// v2.0：新增模式选择（简单模式=师门新访谈引擎 / 详细模式=v1.0 保留）。
export function SetupScreen({
  facilitatorId,
  mode,
  onModeChange,
  onStarted,
}: {
  facilitatorId: string;
  mode: AppMode;
  onModeChange: (m: AppMode) => void;
  onStarted: (r: SessionStartResult, facilitatorId: string) => void;
}) {
  const [consent, setConsent] = useState(false);
  const [adult, setAdult] = useState(false);
  const [guardian, setGuardian] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 年龄筛查通过 = 成年，或（未成年且已取得监护人同意）
  const ageScreenPass = adult || guardian;
  const canStart = consent && ageScreenPass && !busy;

  async function handleStart() {
    setBusy(true);
    setErr(null);
    try {
      const r = await startSession({
        facilitator_id: facilitatorId, // 服务端会以登录账号权威覆盖
        age_screen_pass: ageScreenPass,
        consent_ref: consent ? "verbal-consent-onsite" : null,
      });
      onStarted(r, facilitatorId);
    } catch (e) {
      const msg =
        e instanceof ApiError
          ? `后端返回 ${e.status}（${e.detail || "无详情"}）。请确认后端已启动（uvicorn）。`
          : `无法连接后端。请确认 API 已在运行。（${String(e)}）`;
      setErr(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card">
      <h2>开始一场访谈</h2>

      {/* v2.0 模式选择 */}
      <div className="mode-selector">
        <label className="field">访谈模式</label>
        <div className="mode-options">
          <label className={`mode-option ${mode === "simple" ? "selected" : ""}`}>
            <input
              type="radio"
              name="app-mode"
              value="simple"
              checked={mode === "simple"}
              onChange={() => onModeChange("simple")}
            />
            <div className="mode-content">
              <strong>🆕 简单模式（推荐）</strong>
              <span className="muted small">
                15 题整体展示 → AI 交互类型 → 6 阶段访谈记录。适合实地访谈场景。
              </span>
            </div>
          </label>
          <label className={`mode-option ${mode === "detailed" ? "selected" : ""}`}>
            <input
              type="radio"
              name="app-mode"
              value="detailed"
              checked={mode === "detailed"}
              onChange={() => onModeChange("detailed")}
            />
            <div className="mode-content">
              <strong>📊 详细模式</strong>
              <span className="muted small">
                逐题 Likert → 7 维连续剖面 + 字母码 → 单题追问。保留 v1.0 完整功能。
              </span>
            </div>
          </label>
        </div>
      </div>
      <p className="muted small">
        这是一次关于你日常使用 AI 经验的对话，没有标准答案。我们会先请你就 15 句描述表达认同程度，
        再一起聊聊其中一题背后的具体经历。全程可随时暂停或退出。
      </p>

      <label className="field">促进者</label>
      <div className="row small" style={{ padding: "8px 0" }}>
        当前登录：<b style={{ marginLeft: 4 }}>{facilitatorId}</b>
        <span className="muted" style={{ marginLeft: 8 }}>
          （会话将自动归属此账号）
        </span>
      </div>

      <label className="field">知情同意与年龄</label>
      <div className="row" style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
        <label className="row small">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>受访者已了解本次采集内容并同意参与（可事后 debrief 说明研究意图）。</span>
        </label>
        <label className="row small">
          <input type="checkbox" checked={adult} onChange={(e) => setAdult(e.target.checked)} />
          <span>受访者已年满 18 周岁。</span>
        </label>
        {!adult && (
          <label className="row small">
            <input
              type="checkbox"
              checked={guardian}
              onChange={(e) => setGuardian(e.target.checked)}
            />
            <span>受访者未满 18 周岁，且已取得监护人同意。</span>
          </label>
        )}
      </div>

      {err && <div className="error">{err}</div>}

      <div className="row" style={{ marginTop: 18 }}>
        <button className="primary" disabled={!canStart} onClick={handleStart}>
          {busy ? "正在建立会话…" : "开始"}
        </button>
        {!ageScreenPass && (
          <span className="small muted">需勾选年龄/监护人同意后方可开始。</span>
        )}
      </div>
    </div>
  );
}
