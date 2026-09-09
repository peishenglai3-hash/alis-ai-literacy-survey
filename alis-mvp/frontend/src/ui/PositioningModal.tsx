// 访谈开始定位说明弹窗（v2.1 访谈引擎——P0.5）。
// 来源：D:\723版本反馈v2\学术反思性智能化人格设计.md 策略1。
//
// 职责：在访谈者第一次打开引擎时显示学术定位说明，
//       设定访谈的反思性基调，明确人机分工。

import { POSITIONING_STATEMENT } from "../content/conceptReflection";

export function PositioningModal({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.4)",
        padding: 16,
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          maxHeight: "80vh",
          overflow: "auto",
          background: "var(--bg, #fff)",
          borderRadius: 12,
          padding: "24px 28px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题 */}
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: "2rem" }}>🎯</span>
          <h2 style={{ margin: "8px 0 0", fontSize: "1.2rem" }}>
            {POSITIONING_STATEMENT.title}
          </h2>
        </div>

        {/* 各部分内容 */}
        {POSITIONING_STATEMENT.sections.map((section, idx) => (
          <div key={idx} style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: "0.95rem", margin: "0 0 6px", color: "var(--primary, #7c3aed)" }}>
              {section.heading}
            </h3>
            {"body" in section && (
              <p style={{ fontSize: "0.85rem", lineHeight: 1.7, margin: 0 }}>
                {section.body}
              </p>
            )}
            {"items" in section && section.items && (
              <ul style={{ margin: "4px 0 0", paddingLeft: 20, fontSize: "0.85rem", lineHeight: 1.8 }}>
                {section.items.map((item, j) => (
                  <li key={j}>{item}</li>
                ))}
              </ul>
            )}
          </div>
        ))}

        {/* 底部声明 */}
        <p
          className="muted small"
          style={{
            borderTop: "1px solid var(--border, #e5e7eb)",
            paddingTop: 12,
            marginTop: 16,
            lineHeight: 1.6,
            textAlign: "center",
          }}
        >
          {POSITIONING_STATEMENT.footer}
        </p>

        {/* 确认按钮 */}
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button className="primary" onClick={onDismiss}>
            我理解了，开始访谈
          </button>
        </div>
      </div>
    </div>
  );
}
