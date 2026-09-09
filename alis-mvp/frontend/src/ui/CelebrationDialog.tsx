// v3.3 议程5：访谈者收尾弹窗（状态B）。
// 来源：C:\Users\35636\Downloads\726反馈2.1\议程5_访谈尾声页重构.md v2.0
//
// 设计：访谈保存成功后，给访谈者一个仪式感的成就总结弹窗。

export interface AchievementCard {
  icon: string;
  value: string;
  label: string;
}

export interface CelebrationDialogProps {
  achievements: AchievementCard[];
  interviewerName: string;
  onClose: () => void;
  /** v3.4: 查看访谈记录 → 进入回顾模式 */
  onReview?: () => void;
}

export function CelebrationDialog({
  achievements,
  interviewerName,
  onClose,
  onReview,
}: CelebrationDialogProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)", padding: 16,
        overflowY: "auto",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff", borderRadius: 16, padding: "clamp(24px, 4vh, 40px)",
          maxWidth: 480, width: "90%", textAlign: "center",
          maxHeight: "90vh", overflowY: "auto",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          animation: "alis-celebration-scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ fontSize: "56px", marginBottom: 16 }}>🎉</div>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1f2937", margin: "0 0 8px" }}>
          访谈采集完成！
        </h2>
        <p style={{ fontSize: "0.95rem", color: "#6b7280", margin: "0 0 32px", lineHeight: 1.6 }}>
          辛苦了，刚刚完成了一场深度对话的采集。
        </p>

        {/* 4个成就卡片 */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 12, margin: "0 0 24px",
        }}>
          {achievements.map((card, i) => (
            <div key={i} style={{
              background: "#f9fafb", border: "1px solid #e5e7eb",
              borderRadius: 12, padding: "20px 16px",
            }}>
              <div style={{ fontSize: "28px", marginBottom: 8 }}>{card.icon}</div>
              <div style={{
                fontSize: "1.25rem", fontWeight: 700, color: "#1f2937",
                marginBottom: 4,
              }}>{card.value}</div>
              <div style={{ fontSize: "0.75rem", color: "#6b7280" }}>{card.label}</div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: "0.8rem", color: "#9ca3af", margin: "0 0 28px" }}>
          📅 {new Date().toLocaleDateString("zh-CN")} · {interviewerName}
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
          <button className="secondary" onClick={onReview ?? onClose}
            style={{ padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500 }}>
            查看访谈记录
          </button>
          <button className="secondary" onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500 }}>
            开始下一场
          </button>
          <button className="primary" onClick={onClose}
            style={{ padding: "10px 20px", borderRadius: 8, fontSize: "0.85rem", fontWeight: 500 }}>
            返回首页
          </button>
        </div>
      </div>

      <style>{`
        @keyframes alis-celebration-scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
