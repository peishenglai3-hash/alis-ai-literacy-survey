// 跨题关联提示组件（v2.3 725反馈——Phase 5）。
// 来源：C:\Users\35636\Downloads\725反馈\开发者反馈_v3_产品重构_从AI访谈员到认知增强系统.md
//
// 设计：在当前题目下方显示可能相关的其他题目链接，
// 帮助访谈者建立跨题联结，在访谈中注意题目间关联。

import { useState } from "react";
import { getCrossLinksForQuestion, type CrossQuestionLink } from "../content/crossQuestionLinks";

export function CrossQuestionHints({
  questionId,
}: {
  questionId: string;
}) {
  const links = getCrossLinksForQuestion(questionId);
  const [expanded, setExpanded] = useState(false);

  if (links.length === 0) return null;

  return (
    <div
      style={{
        marginTop: 8,
        padding: "8px 12px",
        background: "var(--surface, #f9fafb)",
        borderRadius: 8,
        border: "1px solid var(--border, #e5e7eb)",
        fontSize: "0.78rem",
      }}
    >
      {/* 标题行 */}
      <button
        className="ghost small"
        onClick={() => setExpanded(!expanded)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          width: "100%",
          textAlign: "left",
          padding: 0,
          border: "none",
          background: "none",
          cursor: "pointer",
          fontSize: "0.78rem",
        }}
      >
        <span>🔗</span>
        <span style={{ fontWeight: 600 }}>
          跨题关联（{links.length} 条）
        </span>
        <span className="muted" style={{ fontSize: "0.65rem" }}>
          {expanded ? "▲ 收起" : "▼ 展开"}
        </span>
      </button>

      {/* 关联列表 */}
      {expanded && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 6 }}>
          {links.map((link, i) => (
            <div
              key={`${link.fromQuestion}→${link.toQuestion}`}
              style={{
                padding: "6px 8px",
                background: "var(--bg, #fff)",
                borderRadius: 6,
                borderLeft: `3px solid var(--primary-light, #c4b5fd)`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontWeight: 700,
                    color: "var(--primary, #7c3aed)",
                    fontSize: "0.75rem",
                  }}
                >
                  {link.fromQuestion} → {link.toQuestion}
                </span>
                <span className="muted" style={{ fontSize: "0.65rem" }}>
                  {link.connectionLogic}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.75rem",
                  fontStyle: "italic",
                  color: "var(--text-secondary, #4b5563)",
                  lineHeight: 1.4,
                }}
              >
                💡 {link.hintText}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
