// 常模策略（可替换扩展点 #1）。
// MVP：无常模样本，用"量表中点相对位置"占位，学术诚实地标注 normed=false。
// 明春 N≥300：实现 makeSampleNorm() 换成真实百分位，评分内核其余部分零改动。
import type { DimensionScore, DimensionProfile, ItemScore } from "../types";
import type { ScoringConfig } from "./pack";
import { round2, clamp } from "./util";

export interface NormPosition {
  percentile: number; // 0..100
  ciLow: number | null;
  ciHigh: number | null;
  ciEstimable: boolean;
}

export interface NormStrategy {
  readonly id: string;
  readonly normed: boolean;
  positionFor(dimScore: DimensionScore, itemScores: ItemScore[], cfg: ScoringConfig): NormPosition;
}

/**
 * 占位常模：把维度均值线性映射到 0..100 的"量表内相对位置"。
 * CI = 维度内题间离散度导出的测量误差带（均值 ± 1.96·SE，SE=sd/√n）。
 * ⚠️ 单题维度（如 D6=Q13）无法估离散度 → ciEstimable=false，ciLow/High=null（不崩、只标记）。
 *    这正是 2b 指出的"因子欠识别"，交由师门 7 月末议扩题。
 */
export function makeMidpointNorm(): NormStrategy {
  return {
    id: "provisional-midpoint",
    normed: false,
    positionFor(dimScore, itemScores, cfg): NormPosition {
      const span = cfg.likertMax - cfg.likertMin;
      const toPct = (x: number) => ((x - cfg.likertMin) / span) * 100;
      const percentile = round2(toPct(dimScore.mean));

      const dimItems = itemScores.filter((s) => s.dimensionId === dimScore.dimensionId);
      const n = dimItems.length;
      if (n < 2) {
        return { percentile, ciLow: null, ciHigh: null, ciEstimable: false };
      }
      const mean = dimScore.mean;
      const variance = dimItems.reduce((a, s) => a + (s.effectiveScore - mean) ** 2, 0) / (n - 1);
      const se = Math.sqrt(variance) / Math.sqrt(n);
      const lo = clamp(mean - 1.96 * se, cfg.likertMin, cfg.likertMax);
      const hi = clamp(mean + 1.96 * se, cfg.likertMin, cfg.likertMax);
      return { percentile, ciLow: round2(toPct(lo)), ciHigh: round2(toPct(hi)), ciEstimable: true };
    },
  };
}

/** 维度得分 + 常模 → 连续剖面。落 S1 的 personality_profiles（percentile/ci_low/ci_high）。 */
export function computeProfile(
  dimScores: DimensionScore[],
  itemScores: ItemScore[],
  cfg: ScoringConfig,
  norm: NormStrategy,
): DimensionProfile[] {
  return dimScores.map((ds) => {
    const pos = norm.positionFor(ds, itemScores, cfg);
    return {
      dimensionId: ds.dimensionId,
      mean: round2(ds.mean),
      percentile: pos.percentile,
      ciLow: pos.ciLow,
      ciHigh: pos.ciHigh,
      normed: norm.normed,
      normSource: norm.id,
      ciEstimable: pos.ciEstimable,
    };
  });
}
