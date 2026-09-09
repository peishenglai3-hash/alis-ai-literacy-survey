// 四个思考窗口组件（v3.2 726反馈——数据驱动差异化内容）。
// 来源：C:\Users\35636\Downloads\726反馈\议程3_四思考窗口Schema_*.md
//
// 设计理念：从"三步深入模板"（线性流程）→"四个思考窗口"（并列呈现）
// v3.2 更新：buildWindowContent 从 QUESTION_SCHEMAS 数据配置读取，不再使用硬编码占位符。

import { useState } from "react";
import { getQuestionSchema, type QuestionSchemaData } from "../data/questionSchemasData";

// ---- 窗口定义 ----

interface ThinkingWindow {
  id: string;
  emoji: string;
  label: string;
  description: string;
}

const WINDOWS: ThinkingWindow[] = [
  { id: "meaning", emoji: "🔍", label: "题目理解", description: "这道题在问什么？关键词与核心关注" },
  { id: "experience", emoji: "📖", label: "经验叙事", description: "可能的故事入口与访谈方向" },
  { id: "choice", emoji: "🎯", label: "选择解释", description: "这个分数可能意味着什么？" },
  { id: "literacy", emoji: "🔗", label: "素养关联", description: "研究关联与注意区分" },
];

// ---- 分数段判定 ----

function getScoreBand(score: number): "high" | "mid" | "low" {
  if (score >= 5) return "high";
  if (score >= 3) return "mid";
  return "low";
}

const SCORE_BAND_LABELS: Record<string, string> = {
  high: "高分段（5-7分）",
  mid: "中分段（3-4分）",
  low: "低分段（1-2分）",
};

// ---- 窗口面板组件 ----

function WindowPanel({
  window: w,
  isActive,
  onToggle,
  schema,
  score,
}: {
  window: ThinkingWindow;
  isActive: boolean;
  onToggle: () => void;
  schema: QuestionSchemaData;
  score: number;
}) {
  const band = getScoreBand(score);
  const choiceData = band === "high" ? schema.thinkingWindows.choice.highScore
    : band === "mid" ? schema.thinkingWindows.choice.midScore
    : schema.thinkingWindows.choice.lowScore;

  return (
    <div
      style={{
        border: isActive ? "2px solid var(--primary, #7c3aed)" : "1px solid var(--border, #e5e7eb)",
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.2s",
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: "100%", textAlign: "left", padding: "10px 14px", border: "none",
          background: isActive ? "var(--primary-bg, #f5f3ff)" : "var(--surface, #f9fafb)",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 8, fontSize: "0.85rem",
        }}
      >
        <span style={{ fontSize: "1.1rem" }}>{w.emoji}</span>
        <span style={{ fontWeight: 600 }}>{w.label}</span>
        <span style={{ fontSize: "0.7rem", color: "var(--muted, #6b7280)", flex: 1 }}>{w.description}</span>
        <span style={{ fontSize: "0.7rem", opacity: 0.5 }}>{isActive ? "▲" : "▼"}</span>
      </button>

      {isActive && (
        <div style={{ padding: "12px 14px", fontSize: "0.82rem", lineHeight: 1.7 }}>
          {/* 窗口1：题目理解 */}
          {w.id === "meaning" && (
            <>
              <div style={{ marginBottom: 10 }}>
                <strong>关键词：</strong>
                <span style={{ display: "inline-flex", gap: 6, flexWrap: "wrap", marginLeft: 4 }}>
                  {schema.keywords.map((kw) => (
                    <span key={kw} style={{ padding: "2px 8px", background: "var(--primary-bg, #f5f3ff)", borderRadius: 10, fontSize: "0.78rem", color: "var(--primary, #7c3aed)", fontWeight: 500 }}>{kw}</span>
                  ))}
                </span>
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>核心关注：</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                  {schema.thinkingWindows.meaning.focusPoints.map((f, i) => (
                    <li key={i} style={{ color: "var(--text-secondary, #4b5563)" }}>{f}</li>
                  ))}
                </ul>
              </div>
              {schema.thinkingWindows.meaning.commonMisunderstanding.length > 0 && (
                <div>
                  <strong>常见误区：</strong>
                  <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                    {schema.thinkingWindows.meaning.commonMisunderstanding.map((m, i) => (
                      <li key={i} style={{ color: "var(--warning, #d97706)", fontSize: "0.78rem" }}>{m}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          {/* 窗口2：经验叙事 */}
          {w.id === "experience" && (
            <>
              {schema.thinkingWindows.experience.storyEntries.map((entry, i) => (
                <div key={i} style={{
                  marginBottom: i < schema.thinkingWindows.experience.storyEntries.length - 1 ? 10 : 0,
                  padding: "8px 10px", background: "var(--surface, #f9fafb)", borderRadius: 6,
                  borderLeft: "3px solid var(--primary-light, #c4b5fd)",
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "0.8rem" }}>{entry.type}</div>
                  {entry.prompts.map((p, j) => (
                    <p key={j} style={{ margin: "2px 0", fontStyle: "italic", color: "var(--text-secondary, #4b5563)" }}>
                      💬 "{p}"
                    </p>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* 窗口3：选择解释 */}
          {w.id === "choice" && (
            <>
              <div style={{
                display: "inline-block", padding: "3px 10px", background: "var(--primary-bg, #f5f3ff)",
                borderRadius: 10, fontSize: "0.78rem", fontWeight: 600, color: "var(--primary, #7c3aed)", marginBottom: 8,
              }}>
                你的选择：{score}分 · {SCORE_BAND_LABELS[band] ?? ""}
              </div>
              <div style={{ marginBottom: 8 }}>
                <strong>可能意味着：</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                  {choiceData.mayMean.map((m, i) => (<li key={i}>{m}</li>))}
                </ul>
              </div>
              <div>
                <strong>探索方向：</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                  {choiceData.exploreDirection.map((d, i) => (
                    <li key={i} style={{ color: "var(--primary, #7c3aed)" }}>{d}</li>
                  ))}
                </ul>
              </div>
              <p style={{ margin: "8px 0 0", fontSize: "0.72rem", color: "var(--muted, #6b7280)", fontStyle: "italic" }}>
                ⚠️ "可能意味着"不是价值判断，而是提供探索方向——每种回答都值得理解。
              </p>
            </>
          )}

          {/* 窗口4：素养关联 */}
          {w.id === "literacy" && (
            <>
              <div style={{ marginBottom: 10 }}>
                <strong>本题涉及：</strong>
                <div style={{ display: "flex", alignItems: "center", gap: 4, flexWrap: "wrap", marginTop: 4, fontSize: "0.8rem" }}>
                  {schema.thinkingWindows.literacy.abilityChain.map((item, i) => (
                    <span key={i} style={{
                      padding: item === "→" ? "0 2px" : "2px 8px",
                      background: item === "→" ? "transparent" : "var(--surface, #f9fafb)",
                      borderRadius: item === "→" ? 0 : 6,
                      fontWeight: item === "→" ? 400 : 500,
                      color: item === "→" ? "var(--muted, #9ca3af)" : "var(--text, #374151)",
                    }}>{item}</span>
                  ))}
                </div>
              </div>
              <div>
                <strong>注意区分：</strong>
                <ul style={{ margin: "4px 0 0", paddingLeft: 20 }}>
                  {schema.thinkingWindows.literacy.distinction.map((d, i) => (<li key={i}>{d}</li>))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ---- 主组件 ----

export function ThinkingWindows({
  questionId,
  score,
  activeTab,
}: {
  questionId: string;
  score: number;
  /** v3.6: 如果提供，只渲染指定ID的窗口（由钻取区Tab栏控制）；省略则渲染全部4个（手风琴模式，用于PreparingScreen等独立场景） */
  activeTab?: string;
}) {
  const [activeWindow, setActiveWindow] = useState<string | null>(null);
  const schema = getQuestionSchema(questionId);
  // v3.6: 有 activeTab 时只渲染匹配的窗口，否则渲染全部4个
  const visibleWindows = activeTab ? WINDOWS.filter(w => w.id === activeTab) : WINDOWS;

  if (!schema) {
    return (
      <div className="thinking-windows muted" style={{ fontSize: "0.8rem", padding: "8px 0" }}>
        ⚠️ 该题目的思考窗口数据暂未加载。Question ID: {questionId}
      </div>
    );
  }

  return (
    <div className="thinking-windows">
      {/* v3.6: 有 activeTab 时隐藏内部标题（Tab栏已提供） */}
      {!activeTab && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <h4 style={{ margin: 0, fontSize: "0.9rem" }}>🧠 四个思考窗口</h4>
            <span className="muted" style={{ fontSize: "0.7rem" }}>点击展开 · 并列使用 · 自主选择</span>
          </div>
          <div style={{
            marginBottom: 10, padding: "6px 10px", background: "var(--surface, #f9fafb)", borderRadius: 6,
            fontSize: "0.75rem", color: "var(--muted, #6b7280)", lineHeight: 1.5,
            borderLeft: "3px solid var(--primary-light, #c4b5fd)",
          }}>
            💡 这些窗口提供<strong>思考方向</strong>而非固定问题。访谈者可根据现场情况自由选择使用哪个窗口，或完全不使用——你主导访谈，AI提供认知支架。
          </div>
        </>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {visibleWindows.map((w) => (
          <WindowPanel
            key={w.id}
            window={w}
            isActive={activeTab ? true : activeWindow === w.id}
            onToggle={() => setActiveWindow(activeWindow === w.id ? null : w.id)}
            schema={schema}
            score={score}
          />
        ))}
      </div>
    </div>
  );
}
