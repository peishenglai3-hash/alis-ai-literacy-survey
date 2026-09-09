// 访谈后回顾模式（v3.4 Feature 1B）。
// 来源：C:\Users\35636\Downloads\726反馈2.1\产品整体反思_从模块化到空间化_v3.3设计升级.md 第八章 8.1 状态3
//
// 设计：访谈完成后，研究者回看全部阶段的气泡记录和访谈记录，
// 发现跨题模式，并导出研究素材。
// 信息密度高——这是"回看"模式，不是"实时"模式。

import type { InterviewSession, InterviewRecord } from "./InterviewScreen";
import type { ThoughtBubble } from "./ThoughtBubblePanel";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import { STAGE_NAMES, STAGE_EMOJIS } from "../content/stageQuestions";
import { aggregateRuleStats, type RuleTriggerStats } from "../domain/crossQuestionEngine";

export interface ReviewScreenProps {
  session: InterviewSession;
  styleResult: StyleProfileV3;
  bubbles: ThoughtBubble[];
  responses: Record<string, number>;
  triggeredRules: RuleTriggerStats[];
  onExport: () => void;
  onBackToInterview: () => void;
  onRestart: () => void;
}

/** 按阶段分组记录 */
function groupRecordsByStage(records: InterviewRecord[]): Map<number, InterviewRecord[]> {
  const map = new Map<number, InterviewRecord[]>();
  for (const r of records) {
    const list = map.get(r.stageId) ?? [];
    list.push(r);
    map.set(r.stageId, list);
  }
  return map;
}

export function ReviewScreen({
  session,
  styleResult,
  bubbles,
  responses,
  triggeredRules,
  onExport,
  onBackToInterview,
  onRestart,
}: ReviewScreenProps) {
  const recordsByStage = groupRecordsByStage(session.records);
  const pendingBubbles = bubbles.filter((b) => b.status === "pending");
  const processedBubbles = bubbles.filter((b) => b.status === "processed");
  const answeredCount = Object.values(responses).filter((v) => v !== undefined && v !== null).length;

  // 所有阶段（1-5）
  const allStages = [1, 2, 3, 4, 5];

  return (
    <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 16px 80px" }}>
      {/* ======== 头部摘要 ======== */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem" }}>
              📊 访谈回顾 · {styleResult.typeDef?.fullName ?? styleResult.typeCode}
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              风格类型：{styleResult.typeCode} · 受访者编号：#{session.startedAt.slice(0, 10).replace(/-/g, "")}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="secondary" onClick={onBackToInterview}>
              ← 返回访谈
            </button>
            <button className="primary" onClick={onExport}>
              📥 导出研究素材
            </button>
          </div>
        </div>

        {/* 统计概览 */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 12, marginTop: 16, paddingTop: 16,
          borderTop: "1px solid var(--border, #e5e7eb)",
        }}>
          <StatCard icon="📝" value={`${session.records.length}`} label="访谈记录" />
          <StatCard icon="💭" value={`${bubbles.length}`} label="思维气泡" />
          <StatCard icon="✅" value={`${answeredCount} / 15`} label="题目覆盖" />
          <StatCard icon="🔗" value={`${triggeredRules.length}`} label="跨题关联触发" />
          <StatCard icon="🗺️" value={`${session.completedStages.length} / 5`} label="阶段完成" />
        </div>
      </div>

      {/* ======== 按阶段分组：记录 + 气泡 ======== */}
      {allStages.map((stageId) => {
        const records = recordsByStage.get(stageId) ?? [];
        const stageBubbles = bubbles.filter((b) => {
          // 气泡没有直接的 stageId，按时间范围匹配
          if (records.length === 0) return false;
          const firstTime = new Date(records[0]!.timestamp).getTime();
          const lastTime = new Date(records[records.length - 1]!.timestamp).getTime();
          const bubbleTime = new Date(b.createdAt).getTime();
          return bubbleTime >= firstTime - 60000 && bubbleTime <= lastTime + 60000;
        });

        if (records.length === 0 && stageBubbles.length === 0) return null;

        return (
          <div key={stageId} className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: 8 }}>
              <span>{STAGE_EMOJIS[stageId] ?? "📋"}</span>
              <span>阶段 {stageId}：{STAGE_NAMES[stageId] ?? `阶段${stageId}`}</span>
              <span className="muted small" style={{ fontWeight: 400 }}>
                ({records.length} 条记录 · {stageBubbles.length} 个气泡)
              </span>
            </h3>

            {/* 访谈记录 */}
            {records.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: stageBubbles.length > 0 ? 12 : 0 }}>
                {records.map((r, i) => (
                  <div key={i} style={{
                    padding: "8px 12px", background: "var(--surface, #f9fafb)",
                    borderRadius: 8, border: "1px solid var(--border, #e5e7eb)",
                    fontSize: "0.82rem",
                  }}>
                    {r.questionId && (
                      <span style={{
                        display: "inline-block", padding: "1px 6px", borderRadius: 4,
                        background: "var(--primary-bg, #f5f3ff)", color: "var(--primary, #7c3aed)",
                        fontSize: "0.7rem", fontWeight: 600, marginRight: 8, marginBottom: 4,
                      }}>{r.questionId}</span>
                    )}
                    {r.interviewerNote && (
                      <div style={{ marginBottom: 2 }}>
                        <span style={{ fontWeight: 600, fontSize: "0.72rem" }}>🗣️ 追问：</span>
                        {r.interviewerNote}
                      </div>
                    )}
                    {r.respondentReply && (
                      <div>
                        <span style={{ fontWeight: 600, fontSize: "0.72rem" }}>💬 回复：</span>
                        {r.respondentReply}
                      </div>
                    )}
                    <span className="muted" style={{ fontSize: "0.65rem", display: "block", marginTop: 2 }}>
                      {new Date(r.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* 阶段气泡 */}
            {stageBubbles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <div className="muted small" style={{ fontWeight: 600, marginBottom: 4 }}>💭 本阶段气泡：</div>
                {stageBubbles.map((b) => (
                  <div key={b.id} style={{
                    padding: "6px 10px", borderRadius: 8, fontSize: "0.78rem",
                    background: b.status === "processed" ? "var(--surface, #f9fafb)" : "var(--primary-bg, #f5f3ff)",
                    border: `1px solid ${b.status === "processed" ? "var(--border, #e5e7eb)" : "var(--primary-light, #c4b5fd)"}`,
                    opacity: b.status === "processed" ? 0.7 : 1,
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span>{b.status === "processed" ? "✅" : "💭"}</span>
                    <span style={{ flex: 1, textDecoration: b.status === "processed" ? "line-through" : "none" }}>
                      {b.content}
                    </span>
                    <span className="muted" style={{ fontSize: "0.65rem", whiteSpace: "nowrap" }}>
                      {new Date(b.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* ======== 跨题关联触发汇总 ======== */}
      {triggeredRules.length > 0 && (
        <div className="card" style={{ marginBottom: 16, borderLeft: "3px solid var(--primary, #7c3aed)" }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "0.95rem" }}>🔗 跨题关联触发汇总</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {triggeredRules.map((stat) => (
              <div key={stat.ruleId} style={{
                padding: "8px 12px", background: "var(--surface, #f9fafb)",
                borderRadius: 8, border: "1px solid var(--border, #e5e7eb)",
                fontSize: "0.82rem", display: "flex", alignItems: "center", gap: 8,
              }}>
                <span style={{ fontWeight: 700, color: "var(--primary, #7c3aed)", fontSize: "0.8rem" }}>
                  {stat.fromQuestion} → {stat.toQuestion}
                </span>
                <span style={{ flex: 1 }} className="muted">{stat.connectionLogic}</span>
                <span style={{
                  padding: "2px 8px", borderRadius: 10,
                  background: "var(--primary-bg, #f5f3ff)", color: "var(--primary, #7c3aed)",
                  fontSize: "0.7rem", fontWeight: 600,
                }}>触发 {stat.triggerCount} 次</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== 处理中气泡（提醒） ======== */}
      {pendingBubbles.length > 0 && (
        <div className="card" style={{
          marginBottom: 16, border: "1px solid var(--warning, #f59e0b)",
          background: "var(--warning-bg, #fffbeb)",
        }}>
          <h3 style={{ margin: "0 0 8px", fontSize: "0.9rem" }}>⚠️ {pendingBubbles.length} 个气泡待处理</h3>
          <p className="small muted" style={{ margin: 0 }}>
            以下气泡尚未标记为"已处理"，建议回顾后逐个确认或处理。
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 8 }}>
            {pendingBubbles.slice(0, 5).map((b) => (
              <div key={b.id} style={{ fontSize: "0.78rem", padding: "4px 8px", background: "var(--bg, #fff)", borderRadius: 6 }}>
                💭 {b.content}
              </div>
            ))}
            {pendingBubbles.length > 5 && (
              <p className="muted small" style={{ margin: 0 }}>…还有 {pendingBubbles.length - 5} 条</p>
            )}
          </div>
        </div>
      )}

      {/* ======== 底部操作 ======== */}
      <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
        <button className="ghost" onClick={onBackToInterview}>← 返回访谈</button>
        <button className="primary" onClick={onExport}>📥 导出研究素材</button>
        <button className="secondary" onClick={onRestart}>返回首页</button>
      </div>
    </div>
  );
}

/** 统计卡片小组件 */
function StatCard({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <div style={{ textAlign: "center", padding: "10px 8px" }}>
      <div style={{ fontSize: "1.5rem", marginBottom: 4 }}>{icon}</div>
      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--primary, #7c3aed)" }}>{value}</div>
      <div className="muted" style={{ fontSize: "0.7rem" }}>{label}</div>
    </div>
  );
}
