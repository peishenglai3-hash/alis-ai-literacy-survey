// 原题+答案上下文面板（v2.1 访谈引擎）。
// 来源：D:\723版本反馈v2 问题3修正方案——"始终回到原题"。
//
// 职责：始终显示原题内容 + 受访者答案 + 含义，帮助被访者回忆。
// 这是访谈者引导对话的"锚点"——任何时候回头看都能知道"我们在讨论什么"。

import type { StoryGuidance } from "../content/storyGuidance";

export function QuestionContextPanel({
  guidance,
  score,
}: {
  guidance: StoryGuidance;
  score: number;
}) {
  // 将分数转为星星可视化
  const stars = "⭐".repeat(Math.min(score, 7));
  const scoreLabel =
    score >= 6
      ? "非常同意"
      : score >= 5
        ? "比较同意"
        : score >= 4
          ? "有点同意"
          : score >= 3
            ? "有点不同意"
            : score >= 2
              ? "比较不同意"
              : "非常不同意";

  return (
    <div className="card question-context-panel" style={{ borderLeft: "3px solid var(--primary, #7c3aed)" }}>
      {/* 标题行 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: "0.95rem" }}>
          📝 当前讨论：{guidance.questionId}
        </h3>
        <span
          className="muted small"
          style={{ background: "var(--primary-bg, #f5f3ff)", padding: "2px 8px", borderRadius: 4 }}
        >
          阶段题目
        </span>
      </div>

      {/* 原题内容 */}
      <p className="question-text" style={{ fontSize: "0.9rem", fontWeight: 500, margin: "4px 0 8px", lineHeight: 1.5 }}>
        {guidance.questionText}
      </p>

      {/* 分隔线 */}
      <div
        style={{
          borderTop: "1px dashed var(--border, #e5e7eb)",
          margin: "8px 0",
        }}
      />

      {/* 受访者答案 */}
      <div className="user-response-box" style={{ background: "var(--surface, #f9fafb)", borderRadius: 8, padding: "10px 12px" }}>
        <div className="score-display" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <span className="score-stars" style={{ fontSize: "1.1rem", letterSpacing: 2 }}>
            {stars}
          </span>
          <span className="score-value" style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--primary, #7c3aed)" }}>
            {score} - {scoreLabel}
          </span>
        </div>
        <p className="answer-meaning small muted" style={{ margin: 0, lineHeight: 1.5 }}>
          {guidance.scoreMeaning(score)}
        </p>
      </div>
    </div>
  );
}
