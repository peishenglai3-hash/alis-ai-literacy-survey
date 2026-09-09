// 偏离策略（可替换扩展点 #2）—— 单题闭环的"追问目标选择"。
// 确定性地选出"最该追问的那一题"，产出结构化 ProbeTarget 交给 S3 的 LLM 渲染语言。
// 师门/分析层可替换度量（极端度 / 维度残差 / 索引性等），本层只保证确定性与可插拔。
import type { ItemScore, ProbeTarget, Branch } from "../types";
import type { ScoringConfig } from "./pack";
import { round2 } from "./util";

export interface DeviationStrategy {
  readonly id: string;
  select(itemScores: ItemScore[], cfg: ScoringConfig): ProbeTarget;
}

/**
 * 默认策略：选"与受访者自身总体倾向偏离最大"的一题。
 * - 偏离在 effective（素养方向）空间度量，使反向题与正向题可比。
 * - 分支 branch 按 raw（字面作答）定：raw ≥ 中点 → high，否则 low，
 *   因 probe_tree 文案是按字面选项写的（"选 6-7 分…"）。branch 是骨架选择器，
 *   S3 的 LLM 据 probe_tree[branch] 生成一句贴合语境的追问。
 * - tie-break：偏离相等时取 pack 顺序在前者，保证同输入同输出。
 */
export function makeOverallMeanDeviation(): DeviationStrategy {
  return {
    id: "overall-mean-abs-deviation",
    select(itemScores, cfg): ProbeTarget {
      if (itemScores.length === 0) throw new Error("no item scores to select probe from");
      const overallMean =
        itemScores.reduce((a, s) => a + s.effectiveScore, 0) / itemScores.length;
      const order = new Map(cfg.itemOrder.map((id, i) => [id, i] as const));

      let best: ItemScore | null = null;
      let bestDev = -1;
      let bestIdx = Number.POSITIVE_INFINITY;
      for (const s of itemScores) {
        const dev = Math.abs(s.effectiveScore - overallMean);
        const idx = order.get(s.itemId) ?? Number.POSITIVE_INFINITY;
        if (dev > bestDev || (dev === bestDev && idx < bestIdx)) {
          best = s;
          bestDev = dev;
          bestIdx = idx;
        }
      }
      const chosen = best!;
      const branch: Branch = chosen.rawScore >= cfg.midpoint ? "high" : "low";
      return {
        itemId: chosen.itemId,
        dimensionId: chosen.dimensionId,
        branch,
        rawScore: chosen.rawScore,
        effectiveScore: chosen.effectiveScore,
        deviation: round2(bestDev),
        metric: "overall-mean-abs-deviation",
      };
    },
  };
}

/**
 * 维度残差策略（师门 2026-07-10 选定为默认）——更体现反思性与社会学问题意识。
 * 选"在其所属构念（维度）内部，与该维度自身其余题最不一致"的一题：
 * residual = |该题有效分 − 其维度有效分均值|，取全局最大。
 * 直觉：受访者在某构念上多数题一致、唯独一题背离，那处"内部张力"最值得反身追问
 * （例如"批判 AI"维度里普遍高分、却在某具体情境上低分——正是加芬克尔式的断裂点）。
 * 结构后果（如实标注）：单题维度残差恒为 0、不会被选中——这与"严格按量表、不给
 * 单题维度硬加题"一致；量表原文校正后已无单题维度（D6=Q12+Q13）。
 * branch 仍按字面 raw 定；tie-break 取 pack 顺序在前者，保证确定性。
 */
export function makeDimensionResidualDeviation(): DeviationStrategy {
  return {
    id: "dimension-residual",
    select(itemScores, cfg): ProbeTarget {
      if (itemScores.length === 0) throw new Error("no item scores to select probe from");
      // 各维度有效分均值
      const byDim = new Map<string, ItemScore[]>();
      for (const s of itemScores) {
        const bucket = byDim.get(s.dimensionId);
        if (bucket) bucket.push(s);
        else byDim.set(s.dimensionId, [s]);
      }
      const dimMean = new Map<string, number>();
      for (const [dim, arr] of byDim) {
        dimMean.set(dim, arr.reduce((a, s) => a + s.effectiveScore, 0) / arr.length);
      }
      const order = new Map(cfg.itemOrder.map((id, i) => [id, i] as const));

      let best: ItemScore | null = null;
      let bestDev = -1;
      let bestIdx = Number.POSITIVE_INFINITY;
      for (const s of itemScores) {
        const residual = Math.abs(s.effectiveScore - (dimMean.get(s.dimensionId) ?? s.effectiveScore));
        const idx = order.get(s.itemId) ?? Number.POSITIVE_INFINITY;
        if (residual > bestDev || (residual === bestDev && idx < bestIdx)) {
          best = s;
          bestDev = residual;
          bestIdx = idx;
        }
      }
      const chosen = best!;
      const branch: Branch = chosen.rawScore >= cfg.midpoint ? "high" : "low";
      return {
        itemId: chosen.itemId,
        dimensionId: chosen.dimensionId,
        branch,
        rawScore: chosen.rawScore,
        effectiveScore: chosen.effectiveScore,
        deviation: round2(bestDev),
        metric: "dimension-residual",
      };
    },
  };
}
