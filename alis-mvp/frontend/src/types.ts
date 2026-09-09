// ALIS S2 共享类型 —— 评分内核产出的数据结构。
// 铁律：本文件所有类型都是"结构化数据"，不含任何自然语言生成结果。
// probe 的自然语言由 S3 的 LLM 渲染，本层只产出"选哪一题、走哪个骨架分支"。

export type Branch = "high" | "low";

/** 单题评分（含反向计分处理后的有效分）。 */
export interface ItemScore {
  itemId: string;
  dimensionId: string;
  rawScore: number; // 受访者字面作答（likertMin..likertMax，当前 1..6）
  effectiveScore: number; // 反向题翻转后的"素养方向"分；正向题 === rawScore
  reverseScored: boolean;
}

/** 维度得分（Likert 原量纲上的均值/总分）。落 S1 的 dimension_scores 表。 */
export interface DimensionScore {
  dimensionId: string;
  nItems: number;
  sum: number;
  mean: number; // Likert 量纲均值（当前 1..6）
  itemIds: string[];
}

/**
 * 维度剖面（连续，非硬类型）。落 S1 的 personality_profiles 表。
 * ⚠️ 学术诚实：MVP 无常模样本，percentile 是"量表内相对位置(0..100)"，
 *    并非总体百分位；normed=false + normSource 标注来源。明春 N≥300 换真实常模。
 */
export interface DimensionProfile {
  dimensionId: string;
  mean: number; // 维度原始均值（当前 1..6）
  percentile: number; // 0..100 呈现数；见 normSource 判断是否真常模
  ciLow: number | null; // 0..100；单题维度不可估时为 null
  ciHigh: number | null;
  normed: boolean; // true 仅当插入真实样本常模
  normSource: string; // 出处，如 "provisional-midpoint"
  ciEstimable: boolean; // 维度题数 < 2 时为 false（如 D6 单题）
}

/**
 * 追问目标（单题闭环）。确定性地选出"最该追问的那一题"+走 high/low 骨架。
 * ⚠️ 只含结构化选择器，无任何 probe 文本——文本由 S3 的 LLM 按 probe_tree[branch] 渲染。
 */
export interface ProbeTarget {
  itemId: string;
  dimensionId: string;
  branch: Branch; // S3 的 LLM 据此取 probe_tree.high / .low 骨架
  rawScore: number;
  effectiveScore: number;
  deviation: number; // 选择所用的偏离度量值
  metric: string; // 偏离策略 id（出处，可替换）
}
