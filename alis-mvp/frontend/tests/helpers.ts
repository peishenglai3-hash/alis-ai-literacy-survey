// 测试辅助：构造小型 ScoringConfig（绕过 15/7 校验，专测评分数学）；加载真实 YAML。
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { load } from "js-yaml";
import type { Item, ScoringConfig, QuestionPack } from "../src/domain/pack";

export function makeItem(id: string, dimension: string, reverse = false): Item {
  return {
    id,
    dimension,
    reverse_scored: reverse,
    probe_tree: { high: `H-${id}`, low: `L-${id}` },
  };
}

/** 用任意题集直接搭 cfg（不经 validatePack），供单元数学测试用。 */
export function makeCfg(items: Item[], min = 1, max = 7): ScoringConfig {
  const itemById = new Map<string, Item>();
  const itemsByDimension = new Map<string, Item[]>();
  const itemOrder: string[] = [];
  const dimOrder: string[] = [];
  for (const it of items) {
    itemById.set(it.id, it);
    itemOrder.push(it.id);
    const bucket = itemsByDimension.get(it.dimension);
    if (bucket) bucket.push(it);
    else {
      itemsByDimension.set(it.dimension, [it]);
      dimOrder.push(it.dimension);
    }
  }
  return {
    likertMin: min,
    likertMax: max,
    midpoint: (min + max) / 2,
    itemById,
    itemsByDimension,
    dimensionOrder: dimOrder,
    itemOrder,
  };
}

/** 加载 S1 交付的真实 Question Pack（单一真源，防止逻辑层与内容层漂移）。 */
export function loadRealPack(): QuestionPack {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const p = path.resolve(here, "../../backend/content/question_pack_v2.1.yaml");
  return load(readFileSync(p, "utf8")) as QuestionPack;
}

/** 造一组 15 题全答的作答（默认全 4 分，可覆盖个别题）。 */
export function answersAll(pack: QuestionPack, overrides: Record<string, number> = {}) {
  const r: Record<string, number> = {};
  for (const it of pack.items) r[it.id] = overrides[it.id] ?? 4;
  return r;
}
