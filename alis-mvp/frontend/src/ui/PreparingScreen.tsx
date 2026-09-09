// 访谈者准备页（v3.6 727反馈2.0 议程6 重写）。
// 来源：727反馈2.0/议程6_引导语与节奏系统_逐点文案.md §②
//
// v3.6 变更：彻底删除15题题库堆叠内容（议程6 §4 决策）。
// 替代：访谈者准备指南——操作指引 + 主导策略 + 录音授权 + 心态准备。
// Props 接口保持不变（向后兼容 App.tsx）。

import { useState } from "react";
import { GUIDANCE_SCRIPTS } from "../content/guidanceScripts";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import type { JourneyStage } from "../domain/styleClassifier";
import { exportPreInterviewPDF } from "../utils/preInterviewPDF";

export interface PreparingScreenProps {
  journey: JourneyStage[];
  styleResult: StyleProfileV3;
  responses: Record<string, number>;
  questionTexts: Record<string, string>; // 题干映射（与答题页同源 stem_zh）
  sessionId: string;
  onStartInterview: () => void;
}

export function PreparingScreen({
  journey,
  styleResult,
  responses,
  questionTexts,
  sessionId,
  onStartInterview,
}: PreparingScreenProps) {
  const prep = GUIDANCE_SCRIPTS.interviewerPrep;
  const typeDef = styleResult.typeDef;
  const [showQuestionBank, setShowQuestionBank] = useState(false);
  const [exportingPrePDF, setExportingPrePDF] = useState(false);

  const handleExportPrePDF = async () => {
    if (exportingPrePDF) return;
    setExportingPrePDF(true);
    try {
      await exportPreInterviewPDF({ styleResult, responses, questionTexts, sessionId });
    } catch (e) {
      console.error("对照表导出失败", e);
      alert("PDF 生成失败，请重试。如持续失败请联系管理员。");
    } finally {
      setExportingPrePDF(false);
    }
  };

  return (
    <div style={{ maxWidth: 780, margin: "0 auto", padding: "24px 16px 80px" }}>
      {/* ======== 受访者摘要 ======== */}
      <div
        className="card"
        style={{
          borderLeft: "4px solid var(--ds-accent, #6957c9)",
          marginBottom: 24,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <span style={{ fontSize: "2.2rem" }}>🎯</span>
          <div>
            <h2 style={{ margin: "0 0 4px", fontSize: "1.2rem" }}>
              即将访谈：{typeDef?.fullName ?? styleResult.typeCode}
            </h2>
            <p className="muted small" style={{ margin: 0 }}>
              风格类型：{styleResult.typeCode} · 置信度：{Math.round((styleResult.typeConfidence ?? 0) * 100)}%
            </p>
          </div>
        </div>

        {/* 三维度位置摘要 */}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          {styleResult.dimensions.map((dim) => (
            <div
              key={dim.dimId}
              style={{
                flex: "1 1 160px",
                padding: "10px 12px",
                background: "var(--ds-surface-2, #f6f3ec)",
                borderRadius: 8,
                border: "1px solid var(--ds-line, #e3ddd1)",
              }}
            >
              <div style={{ fontSize: "0.75rem", color: "var(--ds-muted)", marginBottom: 4 }}>
                {dim.dimId}
              </div>
              <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                {dim.positionLabel} ({dim.position})
              </div>
            </div>
          ))}
        </div>

        {/* 核心特征 */}
        {typeDef && (
          <div style={{ fontSize: "0.85rem", lineHeight: 1.7, color: "var(--ds-ink-2, #4a4754)" }}>
            <p style={{ margin: "0 0 4px" }}>
              <strong>核心特征：</strong>{typeDef.coreFeatures.join("、")}
            </p>
          </div>
        )}

        {/* 作答对照表导出（v3.10：访谈前生成，供受访者对照） */}
        <div style={{ textAlign: "center", marginTop: 16, paddingTop: 14, borderTop: "1px dashed var(--ds-line, #e3ddd1)" }}>
          <button className="ghost" disabled={exportingPrePDF} onClick={handleExportPrePDF}>
            {exportingPrePDF ? "⏳ 生成对照表中..." : "📥 生成作答对照表（PDF）"}
          </button>
          <p className="muted small" style={{ margin: "8px 0 0" }}>
            访谈前导出，供受访者访谈时对照。建议当场导出——系统不保存作答明细。
          </p>
        </div>
      </div>

      {/* ======== 准备指南 ======== */}
      <h3 style={{ margin: "0 0 16px", fontSize: "1.05rem", display: "flex", alignItems: "center", gap: 8 }}>
        <span>📋</span>
        <span>{prep.title}</span>
      </h3>

      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        {prep.sections.map((section, i) => (
          <div
            key={i}
            className="card"
            style={{
              padding: "18px 20px",
              borderLeft: "3px solid var(--ds-accent, #6957c9)",
            }}
          >
            <h4 style={{ margin: "0 0 8px", fontSize: "0.92rem", color: "var(--ds-accent, #6957c9)" }}>
              {section.heading}
            </h4>
            <div
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.75,
                color: "var(--ds-ink-2, #4a4754)",
                whiteSpace: "pre-line",
              }}
            >
              {section.content}
            </div>
          </div>
        ))}
      </div>

      {/* ======== 题库预览（可折叠） ======== */}
      {showQuestionBank && (
        <div style={{ marginBottom: 24 }}>
          <h3 style={{ margin: "0 0 12px", fontSize: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
            <span>📚</span><span>题库概览（{journey.length} 个阶段）</span>
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {journey.map((stage) => (
              <div
                key={stage.id}
                className="card"
                style={{
                  padding: "14px 18px",
                  borderLeft: "3px solid var(--ds-accent, #6957c9)",
                }}
              >
                <h4 style={{ margin: "0 0 4px", fontSize: "0.9rem" }}>
                  {stage.emoji} 阶段{stage.id}：{stage.nameZh}
                </h4>
                <p style={{ margin: "0 0 6px", fontSize: "0.8rem", color: "var(--ds-ink-2, #4a4754)" }}>
                  {stage.description}
                </p>
                {stage.questions.length > 0 && (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--ds-muted)", fontFamily: "var(--ds-mono)" }}>
                    题目：{stage.questions.join("、")}
                  </p>
                )}
                {stage.entryPrompt && (
                  <p style={{ margin: "6px 0 0", fontSize: "0.78rem", color: "var(--ds-ai, #bd7a2e)", lineHeight: 1.5 }}>
                    💬 {stage.entryPrompt}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======== 开始按钮 ======== */}
      <div style={{ textAlign: "center" }}>
        {prep.buttons.map((btn, i) => (
          <button
            key={i}
            className={btn.primary ? "primary large" : "ghost"}
            onClick={btn.primary ? onStartInterview : () => setShowQuestionBank((v) => !v)}
            style={{
              padding: btn.primary ? "14px 40px" : "10px 24px",
              fontSize: btn.primary ? "1.05rem" : "0.9rem",
              marginLeft: i > 0 ? 12 : 0,
            }}
          >
            {btn.primary ? btn.label : (showQuestionBank ? "收起题库 ↑" : btn.label)}
          </button>
        ))}
        <p className="muted small" style={{ marginTop: 10 }}>
          点击后将进入访谈定位说明，然后是正式的认知地图访谈界面。
        </p>
      </div>
    </div>
  );
}
