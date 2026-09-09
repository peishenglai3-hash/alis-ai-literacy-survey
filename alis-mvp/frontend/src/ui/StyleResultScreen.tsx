import { useState } from "react";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getStyleProfileV3 } from "../content/styleProfiles";
import { getTypeCharacteristics } from "../data/typeCharacteristics";
import { StyleComparisonBarChart } from "./StyleComparisonBarChart";
import { exportStyleResultAsPDF } from "../utils/styleResultPDF";

// 风格结果页（v3.2 726反馈——极简版）。
// 显示：类型名称 + 双标签 + 3条对比条 + 特点 + 无优劣说明 + 理论说明（折叠）

export type FeedbackChoice = "very-matching" | "partially-matching" | "not-matching" | null;

export function StyleResultScreen({
  styleResult,
  onEnterInterview,
}: {
  styleResult: StyleProfileV3;
  onEnterInterview: (feedback: FeedbackChoice, reflection: string) => void;
  onShowDetailProfile?: () => void;
  showDetailAvailable?: boolean;
}) {
  const v3Result = styleResult;
  const typeCode = v3Result.typeCode;
  const profile = getStyleProfileV3(typeCode);
  const tc = getTypeCharacteristics(typeCode);
  const [feedback, setFeedback] = useState<FeedbackChoice>(null);
  const [reflection, setReflection] = useState("");
  const [exportingPDF, setExportingPDF] = useState(false);

  const handleExportPDF = async () => {
    if (exportingPDF) return;
    setExportingPDF(true);
    try {
      const ts = new Date().toISOString().slice(0, 10);
      await exportStyleResultAsPDF(
        v3Result,
        `ALIS_风格报告_${typeCode}_${ts}.pdf`,
      );
    } catch (e) {
      console.error("PDF导出失败", e);
      alert("PDF生成失败，请重试");
    } finally {
      setExportingPDF(false);
    }
  };

  if (!profile || !v3Result?.typeDef) {
    return <div className="card"><p>无法加载风格画像。请重试。</p></div>;
  }

  return (
    <div className="style-result-container">
        {/* 类型名称 */}
        <div className="card type-header-card">
        <div className="type-icon-lg">{profile.icon}</div>
        <p className="type-label">你的AI协作风格</p>
        <h1 className="type-name">你是 {v3Result.typeDef.fullName}</h1>

        {/* 双标签 */}
        {tc && (
          <div className="dual-labels" style={{ marginTop: 8, fontSize: "0.9rem", lineHeight: 1.8 }}>
            <p style={{ margin: 2 }}>• {v3Result.typeDef.animalName}：{tc.animalDescription}</p>
            <p style={{ margin: 2 }}>• {v3Result.typeDef.memeName}：{tc.memeDescription}</p>
          </div>
        )}

        <div style={{ margin: "12px auto 0", width: 60, height: 2, background: "linear-gradient(90deg, transparent, var(--primary-light, #c4b5fd), transparent)" }} />

        {/* 3维对比条形图 */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px dashed var(--border, #e5e7eb)" }}>
          <StyleComparisonBarChart styleProfile={v3Result} />
        </div>
      </div>

      {/* 你的特点 */}
      {tc && (
        <div className="card">
          <h3>你的特点</h3>
          <ul>
            {tc.characteristics.map((c, i) => (
              <li key={i} style={{ listStyle: "none" }}>✓ {c}</li>
            ))}
          </ul>
        </div>
      )}

      {/* 无优劣说明 */}
      {tc && (
        <p style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--muted, #6b7280)", padding: "0 8px" }}>
          无优劣说明：{tc.valueNote}
        </p>
      )}

      {/* 理论说明（折叠） */}
      <details className="card" style={{ fontSize: "0.85rem" }}>
        <summary style={{ cursor: "pointer", fontWeight: 600 }}>本研究说明</summary>
        <p style={{ marginTop: 8, color: "var(--text-secondary, #4b5563)", lineHeight: 1.7 }}>
          {v3Result.valueStatement?.theoryInnovation ?? "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从\"能力高低\"转向\"风格差异\"，从\"规范达标\"转向\"认知多元\"。每种协作风格都是个体与AI互动的独特模式，值得理解和尊重。"}
        </p>
      </details>

      {/* PDF 导出按钮 */}
      <div style={{ textAlign: "center" }}>
        <button
          className="ghost"
          onClick={handleExportPDF}
          disabled={exportingPDF}
          style={{ fontSize: "0.9rem", padding: "10px 20px" }}
        >
          {exportingPDF ? "⏳ 生成中..." : "📥 导出PDF报告"}
        </button>
        <p className="muted small" style={{ marginTop: 4 }}>
          导出风格分析报告供被访者查看
        </p>
      </div>

      {/* 反思入口 */}
      <div className="card reflection-card">
        <h3>这个结果符合你的感觉吗？</h3>
        <p className="muted small">
          这里没有"对"或"错"——类型是用来引发讨论的对话框架，而不是定义你的标签。
          你的反馈正是深度对话的起点。
        </p>
        <div className="feedback-options">
          {([
            { value: "very-matching" as FeedbackChoice, label: "非常符合", desc: "描述的大多数特点和我对得上" },
            { value: "partially-matching" as FeedbackChoice, label: "部分符合", desc: "有些对、有些不太对" },
            { value: "not-matching" as FeedbackChoice, label: "不太符合", desc: "和我的感觉差距比较大" },
          ]).map((opt) => (
            <label key={opt.value} className={`feedback-option ${feedback === opt.value ? "selected" : ""}`}>
              <input type="radio" name="style-feedback" value={opt.value ?? ""} checked={feedback === opt.value} onChange={() => setFeedback(opt.value)} />
              <div className="feedback-option-content"><strong>{opt.label}</strong><span className="muted small">{opt.desc}</span></div>
            </label>
          ))}
        </div>
        <textarea className="reflection-input" placeholder="为什么？请分享你的想法...（可选，但你的想法对后续对话很有价值）" rows={3} value={reflection} onChange={(e) => setReflection(e.target.value)} />
        <div className="reflection-actions">
          <button className="primary large" onClick={() => onEnterInterview(feedback, reflection)}>进入深度访谈 →</button>
        </div>
        <p className="muted small" style={{ marginTop: 12, textAlign: "center" }}>
          💡 提示：无论你选"非常符合"还是"不太符合"，接下来的对话都会基于你的真实感受展开。
        </p>
      </div>

      <style>{`
        .style-result-container { max-width: 640px; margin: 0 auto; padding: 0 16px 80px; display: flex; flex-direction: column; gap: 16px; }
        .type-header-card { text-align: center; }
        .type-icon-lg { font-size: 4rem; margin-bottom: 8px; }
        .type-label { color: var(--muted, #6b7280); font-size: 0.85rem; margin: 0; }
        .type-name { font-size: 1.75rem; margin: 4px 0; color: var(--primary, #7c3aed); }
        .reflection-card { border: 2px solid var(--primary-light, #c4b5fd); }
        .feedback-options { display: flex; flex-direction: column; gap: 8px; margin: 12px 0; }
        .feedback-option { display: flex; align-items: flex-start; gap: 10px; padding: 12px; border: 1.5px solid var(--border, #d1d5db); border-radius: 10px; cursor: pointer; transition: all 0.15s; }
        .feedback-option:hover { border-color: var(--primary-light, #c4b5fd); }
        .feedback-option.selected { border-color: var(--primary, #7c3aed); background: var(--primary-bg, #f5f3ff); }
        .feedback-option input[type="radio"] { margin-top: 2px; accent-color: var(--primary, #7c3aed); }
        .feedback-option-content { display: flex; flex-direction: column; }
        .reflection-input { width: 100%; padding: 10px; border: 1px solid var(--border, #d1d5db); border-radius: 8px; font-size: 0.9rem; resize: vertical; box-sizing: border-box; }
        .reflection-actions { display: flex; gap: 12px; margin-top: 16px; flex-wrap: wrap; justify-content: flex-end; }
      `}</style>
    </div>
  );
}
