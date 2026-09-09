// 导出格式选择弹窗（v3.4 Feature 4B）。
// 设计：在 DoneScreen 或 ReviewScreen 中点击"导出"后，弹出格式选择。

import type { ExportFormat } from "../utils/dataExport";

export interface ExportDialogProps {
  onExport: (format: ExportFormat) => void;
  onClose: () => void;
}

const FORMAT_OPTIONS: {
  format: ExportFormat;
  icon: string;
  label: string;
  description: string;
  recommendation: string;
}[] = [
  {
    format: "json",
    icon: "{ }",
    label: "JSON 格式",
    description: "完整结构化数据，包含所有访谈记录、思维气泡、15题回答和维度得分。适合用 Python/R 进行编程分析。",
    recommendation: "推荐研究者使用",
  },
  {
    format: "csv",
    icon: "📊",
    label: "CSV 格式",
    description: "表格格式，UTF-8 编码（含 BOM），Excel 可直接打开。包含元信息、15题回答、访谈记录、思维气泡四个 section。",
    recommendation: "推荐 Excel 分析",
  },
  {
    format: "doc",
    icon: "📄",
    label: "Word 文档",
    description: "富文本报告格式，Word 可直接打开。包含完整的访谈报告、数据表格和元信息。适合打印和归档。",
    recommendation: "推荐打印归档",
  },
  {
    format: "pdf",
    icon: "📕",
    label: "PDF 完整报告",
    description: "风格分析 + 每题题干与受访者作答 + 完整访谈记录 + 思维气泡 + 受访者反馈。中文可选/可搜索，长内容自动分页。",
    recommendation: "推荐完整归档",
  },
];

export function ExportDialog({ onExport, onClose }: ExportDialogProps) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0, 0, 0, 0.5)", padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#ffffff", borderRadius: 16, padding: 32,
          maxWidth: 520, width: "90%",
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.15)",
          animation: "alis-celebration-scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: "1.2rem", textAlign: "center" }}>
          📥 导出访谈数据
        </h2>
        <p className="muted small" style={{ textAlign: "center", margin: "0 0 24px" }}>
          选择导出格式。数据仅保存在本地浏览器中生成，不上传至服务器。
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {FORMAT_OPTIONS.map((opt) => (
            <button
              key={opt.format}
              onClick={() => onExport(opt.format)}
              style={{
                textAlign: "left", padding: "14px 16px",
                border: "1.5px solid var(--border, #e5e7eb)",
                borderRadius: 10, background: "var(--bg, #fff)",
                cursor: "pointer", transition: "all 0.15s",
                display: "flex", alignItems: "flex-start", gap: 12,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "var(--primary, #7c3aed)";
                e.currentTarget.style.background = "var(--primary-bg, #f5f3ff)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "var(--border, #e5e7eb)";
                e.currentTarget.style.background = "var(--bg, #fff)";
              }}
            >
              <span style={{
                fontSize: "1.5rem", minWidth: 40, textAlign: "center",
                fontWeight: 700, color: "var(--primary, #7c3aed)",
              }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: 4 }}>
                  {opt.label}
                  <span style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 8,
                    background: "var(--primary-bg, #f5f3ff)", color: "var(--primary, #7c3aed)",
                    fontSize: "0.65rem", fontWeight: 500,
                  }}>{opt.recommendation}</span>
                </div>
                <p className="muted small" style={{ margin: 0, lineHeight: 1.5 }}>
                  {opt.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, textAlign: "center" }}>
          <button className="ghost" onClick={onClose}>取消</button>
        </div>

        <style>{`
          @keyframes alis-celebration-scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
