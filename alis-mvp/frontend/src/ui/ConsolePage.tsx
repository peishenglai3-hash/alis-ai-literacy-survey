import { useEffect, useState } from "react";
import {
  listSessions,
  getStats,
  exportUrl,
  bundleUrl,
  ApiError,
  type SessionsList,
  type Stats,
} from "../api/client";

// 促进者控制台（S5）：汇总统计 + 暴露 A/B 方向性信号 + 会话列表 + 一键导出 CSV。
// 用于灰度/dry-run 期间掌握采集进度，并把数据交给师门做量化分析（宽表/长表 CSV）。
export function ConsolePage({ onBack }: { onBack: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null);
  const [list, setList] = useState<SessionsList | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    setLoading(true);
    setErr(null);
    try {
      const [s, l] = await Promise.all([getStats(), listSessions()]);
      setStats(s);
      setList(l);
    } catch (e) {
      setErr(
        e instanceof ApiError
          ? `后端 ${e.status}：${e.detail || "无详情"}`
          : `无法连接后端（${String(e)}）。请确认 uvicorn 已启动。`,
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  const mean = stats?.express_len_mean;

  return (
    <>
      <div className="card">
        <div className="row spread">
          <h2>促进者控制台</h2>
          <div className="row">
            <button className="ghost" onClick={refresh}>
              刷新
            </button>
            <button className="ghost" onClick={onBack}>
              ← 返回采集
            </button>
          </div>
        </div>
        {err && <div className="error">{err}</div>}
        {loading && <p className="muted">加载中…</p>}

        {stats && (
          <>
            <div className="row" style={{ gap: 24, flexWrap: "wrap", marginTop: 8 }}>
              <Stat label="已采集会话" value={String(stats.n_sessions)} />
              <Stat label="暴露组" value={String(stats.by_condition.exposed)} />
              <Stat label="对照组" value={String(stats.by_condition.control)} />
              <Stat label="有追问反应" value={String(stats.n_reactions)} />
            </div>

            <div className="disclaimer" style={{ marginTop: 14 }}>
              <b>暴露 A/B 方向性信号</b>（叙述长度均值，非正式统计，仅供 dry-run 观察）：
              暴露组 {mean?.exposed ?? "—"}（n={stats.express_len_n.exposed}） · 对照组{" "}
              {mean?.control ?? "—"}（n={stats.express_len_n.control}）。
              <div className="muted small" style={{ marginTop: 4 }}>
                样本足够后再做正式检验；这里只帮你判断"暴露评分是否倾向激发更长叙事"的方向。
              </div>
            </div>

            <div className="row" style={{ marginTop: 14 }}>
              <a className="primary" href={bundleUrl()} download style={{ textDecoration: "none" }}>
                下载完整交付包 ZIP（推荐）
              </a>
              <a className="ghost" href={exportUrl("wide")} download style={{ textDecoration: "none" }}>
                仅宽表 CSV
              </a>
              <a className="ghost" href={exportUrl("long")} download style={{ textDecoration: "none" }}>
                仅长表 CSV
              </a>
            </div>
            <div className="muted small" style={{ marginTop: 6 }}>
              交付包 = 宽表 + 长表 + 数据字典（codebook）+ 统计 + README，单个 ZIP 便于内网/U 盘一次性交给师门。
              CSV 为 utf-8-sig，Excel/SPSS/Stata/R 直接读入；含 Q1–Q15 原始分、D1–D7 维度分与相对位置、暴露条件与反应。
              <br />
              ⚠️ 含个人数据，仅走内网/U 盘/加密邮件，禁上外部网盘或跨境。
            </div>
          </>
        )}
      </div>

      {list && (
        <div className="card">
          <h3>会话列表（{list.count}）</h3>
          {list.count === 0 && <p className="muted">暂无会话。完成一场采集后回来刷新。</p>}
          {list.count > 0 && (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ textAlign: "left", color: "var(--muted)" }}>
                    <th style={{ padding: "6px 8px" }}>会话</th>
                    <th style={{ padding: "6px 8px" }}>促进者</th>
                    <th style={{ padding: "6px 8px" }}>条件</th>
                    <th style={{ padding: "6px 8px" }}>作答</th>
                    <th style={{ padding: "6px 8px" }}>追问</th>
                    <th style={{ padding: "6px 8px" }}>叙事</th>
                    <th style={{ padding: "6px 8px" }}>时间</th>
                  </tr>
                </thead>
                <tbody>
                  {list.sessions.map((s) => (
                    <tr key={s.session_id} style={{ borderTop: "1px solid var(--line)" }}>
                      <td style={{ padding: "6px 8px", fontFamily: "monospace" }}>
                        {s.session_id.slice(0, 8)}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{s.facilitator_id}</td>
                      <td style={{ padding: "6px 8px" }}>
                        {s.condition === "exposed" ? "暴露" : "对照"}
                      </td>
                      <td style={{ padding: "6px 8px" }}>
                        {s.committed ? `${s.n_responses} 题` : "未提交"}
                      </td>
                      <td style={{ padding: "6px 8px" }}>{s.has_reaction ? "✓" : "—"}</td>
                      <td style={{ padding: "6px 8px" }}>{s.n_narratives}</td>
                      <td style={{ padding: "6px 8px" }} className="muted">
                        {s.started_at ? s.started_at.replace("T", " ").slice(0, 16) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 700 }}>{value}</div>
      <div className="muted small">{label}</div>
    </div>
  );
}
