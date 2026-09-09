// 简化极性对比图（v3.2 726反馈——3条左右二分对比）。
// 设计：每条维度一条横向对比条，只显示百分比，删除原始分/倾向强度/维度详情。

import type { StyleProfileV3, DimensionPolarityV3 } from "../domain/styleClassifier";
import { DIMENSIONS_V3 } from "../content/typeDefinitions";

const DIM_DISPLAY: Record<string, { pos: string; neg: string; posLabel: string; negLabel: string }> = {};
for (const d of DIMENSIONS_V3) {
  DIM_DISPLAY[d.id] = { pos: d.positiveEnd.code, neg: d.negativeEnd.code, posLabel: d.positiveEnd.label, negLabel: d.negativeEnd.label };
}

function calcPct(score: number): number { return Math.round((score / 7) * 100); }

export function StyleComparisonBarChart({ styleProfile }: { styleProfile: StyleProfileV3 }) {
  return (
    <div className="simplified-polarity-chart" style={{ padding: "16px 0" }}>
      {styleProfile.dimensions.map((dim, i) => {
        const d = DIM_DISPLAY[dim.dimId] ?? { pos: "?", neg: "?", posLabel: dim.dimId, negLabel: dim.dimId };
        const leftPct = calcPct(dim.scores.positive);
        const rightPct = calcPct(dim.scores.negative);

        return (
          <div key={dim.dimId} style={{ marginBottom: i < 2 ? 16 : 0 }}>
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12 }}>
              <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text, #374151)", whiteSpace: "nowrap", textAlign: "right", minWidth: 70 }}>
                {d.posLabel} {leftPct}%
              </div>
              <div style={{ display: "flex", height: 14, background: "#f1f2f6", borderRadius: 7, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.max(leftPct, 3)}%`,
                  background: "linear-gradient(90deg, #6c5ce7, #a29bfe)",
                  borderRadius: 7,
                  transition: "width 0.6s ease",
                }} />
                <div style={{
                  flex: 1,
                  background: "linear-gradient(90deg, #dfe6e9, #b2bec3)",
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ fontSize: "0.85rem", color: "#636e72", whiteSpace: "nowrap", minWidth: 70 }}>
                {rightPct}% {d.negLabel}
              </div>
            </div>
          </div>
        );
      })}

      {/* 无优劣声明 */}
      <div style={{
        marginTop: 20, padding: "10px 12px", background: "var(--warning-bg, #fffbeb)",
        borderRadius: 8, border: "1px solid var(--warning, #f59e0b)",
      }}>
        <p style={{ margin: 0, fontSize: "0.8rem", color: "#92400e", lineHeight: 1.6, textAlign: "center" }}>
          ⚠️ 百分比仅表示倾向强度，不代表能力强弱。{styleProfile.valueStatement?.noHierarchy ?? "每种协作风格都值得研究，无优劣之分"}。
        </p>
      </div>
    </div>
  );
}
