// Question Pack 类型与派生的评分配置。
// 单一真源：内容（题目/维度/反向标记/追问骨架）来自 S1 的可编辑
// content/question_pack_v2.1.yaml，师门 7 月末改 YAML 即可，不动本层逻辑代码。

export interface LikertConfig {
  min: number;
  max: number;
  anchor_low?: string;
  anchor_high?: string;
  labels_zh?: Record<number, string>; // 全标注等距锚点（每点词标）·点3
  reference_card_zh?: Record<number, string>; // 校准参照卡·点3
}

export interface Dimension {
  id: string;
  name_zh?: string;
  part_zh?: string;
  personality_copy?: string;
}

export interface ProbeTree {
  high: string;
  low: string;
}

export interface Item {
  id: string;
  dimension: string;
  stem_zh?: string;
  statement_types?: string[];
  reverse_scored: boolean;
  probe_tree: ProbeTree;
}

// ---- 类 MBTI 字母码内容（点 4·可编辑 · 建在连续剖面之上、非硬类型）----
export interface TypeAxisPole {
  letter: string; // 该极的字母（高极大写惯例；未分化时由 deriveTypeCode 转小写）
  label_zh: string; // 极名（如"审辨"）
  gloss_zh?: string; // 一句释义
}
export interface TypeAxis {
  id: string;
  dimension: string; // 取自哪个维度（须在 dimensions 内）
  name_zh?: string;
  high: TypeAxisPole; // 相对位置 ≥ 切点走 high
  low: TypeAxisPole; // 相对位置 < 切点走 low
}
export interface TypeCodeConfig {
  enabled?: boolean;
  cut_percentile?: number; // 切点（相对位置 0..100 空间）；缺省 50
  intro_zh?: string;
  disclaimer_zh?: string;
  axes: TypeAxis[];
}

export interface QuestionPack {
  scale_version: string;
  likert: LikertConfig;
  dimensions: Dimension[];
  items: Item[];
  type_code?: TypeCodeConfig; // 可选：点 4 字母码内容
  [k: string]: unknown;
}

// 8 月锁定：15 题 / 7 维度。数字来自内容纪律，不是逻辑常量——师门扩题在明春。
export const EXPECTED_ITEMS = 15;
export const EXPECTED_DIMENSIONS = 7;

export class PackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PackError";
  }
}

/** 结构校验（与后端 content.py 对齐的前端侧防线）。 */
export function validatePack(pack: QuestionPack): void {
  if (!pack || typeof pack !== "object") throw new PackError("pack missing");
  const lk = pack.likert;
  if (!lk || typeof lk.min !== "number" || typeof lk.max !== "number")
    throw new PackError("likert min/max missing");
  if (lk.min >= lk.max) throw new PackError("likert min must be < max");
  if (!Array.isArray(pack.items) || pack.items.length !== EXPECTED_ITEMS)
    throw new PackError(`expected ${EXPECTED_ITEMS} items, got ${pack.items?.length}`);
  if (!Array.isArray(pack.dimensions) || pack.dimensions.length !== EXPECTED_DIMENSIONS)
    throw new PackError(`expected ${EXPECTED_DIMENSIONS} dimensions, got ${pack.dimensions?.length}`);
  const dimIds = new Set(pack.dimensions.map((d) => d.id));
  const seen = new Set<string>();
  for (const it of pack.items) {
    if (!it.id) throw new PackError("item missing id");
    if (seen.has(it.id)) throw new PackError(`duplicate item id ${it.id}`);
    seen.add(it.id);
    if (!dimIds.has(it.dimension))
      throw new PackError(`item ${it.id} dimension ${it.dimension} not in dimensions`);
    if (typeof it.reverse_scored !== "boolean")
      throw new PackError(`item ${it.id} reverse_scored must be boolean`);
    if (!it.probe_tree || typeof it.probe_tree.high !== "string" || typeof it.probe_tree.low !== "string")
      throw new PackError(`item ${it.id} probe_tree.high/low required`);
  }
  // type_code 为可选内容：仅当存在时校验其结构（师门可整段删除而不影响评分内核）。
  if (pack.type_code !== undefined) validateTypeCodeConfig(pack.type_code, dimIds);
}

/** 可选的类 MBTI 字母码配置校验（点 4）。缺省不调用。 */
export function validateTypeCodeConfig(tc: TypeCodeConfig, dimIds: Set<string>): void {
  if (!tc || typeof tc !== "object") throw new PackError("type_code must be an object");
  if (!Array.isArray(tc.axes) || tc.axes.length === 0)
    throw new PackError("type_code.axes must be a non-empty array");
  const seen = new Set<string>();
  for (const ax of tc.axes) {
    if (!ax.id) throw new PackError("type_code axis missing id");
    if (seen.has(ax.id)) throw new PackError(`duplicate type_code axis id ${ax.id}`);
    seen.add(ax.id);
    if (!dimIds.has(ax.dimension))
      throw new PackError(`type_code axis ${ax.id} dimension ${ax.dimension} not in dimensions`);
    for (const pole of [ax.high, ax.low]) {
      if (!pole || typeof pole.letter !== "string" || pole.letter.length === 0)
        throw new PackError(`type_code axis ${ax.id} pole missing letter`);
      if (typeof pole.label_zh !== "string")
        throw new PackError(`type_code axis ${ax.id} pole missing label_zh`);
    }
  }
}

/** 派生出评分/追问要用的确定性索引。逻辑层只按 id 与结构取值，不读死文案。 */
export interface ScoringConfig {
  likertMin: number;
  likertMax: number;
  midpoint: number;
  itemById: Map<string, Item>;
  itemsByDimension: Map<string, Item[]>;
  dimensionOrder: string[]; // 稳定顺序：用于确定性 tie-break
  itemOrder: string[];
}

export function deriveScoringConfig(pack: QuestionPack): ScoringConfig {
  validatePack(pack);
  const itemById = new Map<string, Item>();
  const itemsByDimension = new Map<string, Item[]>();
  const itemOrder: string[] = [];
  for (const it of pack.items) {
    itemById.set(it.id, it);
    itemOrder.push(it.id);
    const bucket = itemsByDimension.get(it.dimension);
    if (bucket) bucket.push(it);
    else itemsByDimension.set(it.dimension, [it]);
  }
  return {
    likertMin: pack.likert.min,
    likertMax: pack.likert.max,
    midpoint: (pack.likert.min + pack.likert.max) / 2,
    itemById,
    itemsByDimension,
    dimensionOrder: pack.dimensions.map((d) => d.id),
    itemOrder,
  };
}
