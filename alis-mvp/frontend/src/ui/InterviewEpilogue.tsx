// v3.3 议程5：对话尾声页（状态A）。
// 来源：C:\Users\35636\Downloads\726反馈2.1\议程5_访谈尾声页重构.md v2.0
//
// 设计：概念总结页之后，访谈者对被访者表达感谢+展示6站旅程总结。
// 文案原则：活泼轻松、第一人称、去学术化。

export interface EpilogueData {
  journeyLabels: string[];
}

export interface InterviewEpilogueProps {
  journeyLabels: string[];
  onBack: () => void;
  onSaveAndComplete: () => void;
  /** v3.12：保存进行中——按钮显示加载态，防重复点击 */
  saving?: boolean;
}

const CHIP_COLORS = [
  { bg: "#fef3c7", border: "#fde68a", text: "#92400e" },
  { bg: "#dbeafe", border: "#93c5fd", text: "#1e40af" },
  { bg: "#d1fae5", border: "#6ee7b7", text: "#065f46" },
  { bg: "#fce7f3", border: "#f9a8d4", text: "#9f1239" },
  { bg: "#e0e7ff", border: "#a5b4fc", text: "#3730a3" },
  { bg: "#fef9c3", border: "#fde047", text: "#713f12" },
];

export function InterviewEpilogue({
  journeyLabels,
  onBack,
  onSaveAndComplete,
  saving = false,
}: InterviewEpilogueProps) {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: "clamp(20px, 4vh, 40px) 16px 80px", textAlign: "center", maxHeight: "calc(100vh - 80px)", overflowY: "auto" }}>
      <h1 style={{ fontSize: "1.75rem", margin: "0 0 16px" }}>🎉 今天就聊到这里啦</h1>

      <p style={{
        fontSize: "1rem", lineHeight: 1.8, color: "var(--text-secondary, #4b5563)",
        maxWidth: 480, margin: "0 auto 24px",
      }}>
        感谢你分享了这么多关于AI的真实体验，这些对话对我们理解"人和AI的关系"特别有价值。
      </p>

      <p style={{ fontSize: "0.95rem", fontWeight: 600, margin: "0 0 16px" }}>💬 我们一起聊了：</p>

      {/* 6站chip旅程条 */}
      <div style={{
        display: "flex", flexWrap: "wrap", gap: 8,
        justifyContent: "center", margin: "0 0 24px",
      }}>
        {journeyLabels.map((label, i) => {
          const idx = i % CHIP_COLORS.length;
          const c = CHIP_COLORS[idx]!;
          return (
            <span key={i} style={{
              padding: "6px 14px", borderRadius: 16,
              background: c.bg, border: `1px solid ${c.border}`,
              color: c.text, fontSize: "0.85rem", fontWeight: 500,
            }}>{label}</span>
          );
        })}
      </div>

      <p style={{
        fontSize: "0.95rem", lineHeight: 1.8,
        color: "var(--text-secondary, #4b5563)",
        maxWidth: 480, margin: "0 auto 24px",
      }}>
        从最开始你怎么察觉到AI的存在，一路聊到了你想怎么重新定义AI——这是一段很完整的对话。
      </p>

      <p style={{ fontSize: "1.1rem", fontWeight: 600, margin: "0 0 32px" }}>
        🙏 谢谢你的时间！
      </p>

      <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
        <button className="ghost" onClick={onBack}>
          ← 再补充几句
        </button>
        <button className="primary" onClick={onSaveAndComplete} disabled={saving}>
          {saving ? "正在保存…" : "完成访谈并保存 →"}
        </button>
      </div>
    </div>
  );
}
