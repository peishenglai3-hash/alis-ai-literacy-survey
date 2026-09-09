// 确定性评分：单题（含反向计分）→ 维度均值。纯函数，无 LLM、无随机、无时钟。
import type { Item, ScoringConfig } from "./pack";
import type { ItemScore, DimensionScore } from "../types";

/** 单题评分。反向题：effective = (min+max) - raw；正向题：effective = raw。 */
export function scoreItem(rawScore: number, item: Item, cfg: ScoringConfig): ItemScore {
  if (!Number.isInteger(rawScore) || rawScore < cfg.likertMin || rawScore > cfg.likertMax) {
    throw new RangeError(
      `raw score ${rawScore} out of [${cfg.likertMin}, ${cfg.likertMax}] for item ${item.id}`,
    );
  }
  const effectiveScore = item.reverse_scored
    ? cfg.likertMin + cfg.likertMax - rawScore
    : rawScore;
  return {
    itemId: item.id,
    dimensionId: item.dimension,
    rawScore,
    effectiveScore,
    reverseScored: item.reverse_scored,
  };
}

/** 按 pack 顺序给全部题目评分；缺答即报错（评分只在锁定且答全后发生）。 */
export function scoreAllItems(responses: Record<string, number>, cfg: ScoringConfig): ItemScore[] {
  return cfg.itemOrder.map((id) => {
    const item = cfg.itemById.get(id);
    if (!item) throw new Error(`unknown item ${id}`);
    if (!(id in responses)) throw new Error(`missing response for item ${id}`);
    return scoreItem(responses[id]!, item, cfg);
  });
}

/** 维度聚合：有效分均值（Likert 原量纲）。单题维度 nItems=1 也能算均值。 */
export function scoreDimensions(itemScores: ItemScore[], cfg: ScoringConfig): DimensionScore[] {
  const byDim = new Map<string, ItemScore[]>();
  for (const s of itemScores) {
    const bucket = byDim.get(s.dimensionId);
    if (bucket) bucket.push(s);
    else byDim.set(s.dimensionId, [s]);
  }
  return cfg.dimensionOrder.map((dimId) => {
    const scores = byDim.get(dimId) ?? [];
    const sum = scores.reduce((a, s) => a + s.effectiveScore, 0);
    const nItems = scores.length;
    return {
      dimensionId: dimId,
      nItems,
      sum,
      mean: nItems > 0 ? sum / nItems : NaN,
      itemIds: scores.map((s) => s.itemId),
    };
  });
}
