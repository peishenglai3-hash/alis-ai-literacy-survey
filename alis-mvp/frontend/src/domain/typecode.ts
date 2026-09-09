// 类 MBTI 字母码（点 4）—— 确定性纯函数，建在连续剖面 + CI 之上，非硬类型。
// ============================================================================
// 铁律：本模块无 LLM、无网络、无随机、无时钟；字母完全由 profile + type_code 配置
//   派生。语言（intro/disclaimer/极名）来自可编辑 Question Pack，代码只做比较与拼装。
//
// 切点在"相对位置（percentile 0..100）"空间：cut（缺省 50）。
//   - 占位常模下 percentile = 量表内相对位置，50 = 量表中点（criterion-referenced）；
//   - 阶段 B 接入真实样本常模后，percentile 变真百分位，50 = 样本中位数
//     （norm-referenced）——切点口径随常模自动升级，本函数零改。
//
// 三层诚实：
//   ① 测量真身 = 连续 percentile + CI（永远并排呈现，见 TypeCodeCard）；
//   ② 字母码 = percentile ≥ cut → 高极字母，否则低极字母；
//   ③ 未分化 = 该维 95% CI 跨越 cut（ciLow < cut < ciHigh）→ 该轴记小写字母，
//      如实表达"这方面比较均衡、暂说不上明显偏向"，而非硬塞一边。
// ============================================================================
import type { DimensionProfile } from "../types";
import type { TypeCodeConfig, TypeAxis } from "./pack";

export interface AxisCode {
  axisId: string;
  dimensionId: string;
  nameZh: string;
  side: "high" | "low"; // 点估计落在切点的哪一侧
  differentiated: boolean; // false = CI 跨切点 → 未分化
  letter: string; // 分化=大写高/低极字母；未分化=小写
  labelZh: string; // 该极极名（如"审辨"）
  glossZh: string; // 一句释义
  percentile: number; // 该维相对位置（0..100）
}

export interface TypeCode {
  code: string; // 用连字符拼接的代号，如 "C-m-G-R"
  axes: AxisCode[];
  nDifferentiated: number; // 分化（大写）轴数量
  nAxes: number;
}

const DEFAULT_CUT = 50;

/**
 * 由连续剖面派生字母码。纯函数：同一 profile + 同一配置 → 同一输出。
 * @param profile 7 维连续剖面（含 percentile / ciLow / ciHigh / ciEstimable）
 * @param config  Question Pack 的 type_code 段（可编辑内容）
 * @returns TypeCode；若配置未启用或无轴，返回 null（调用方据此不渲染）
 */
export function deriveTypeCode(
  profile: DimensionProfile[],
  config: TypeCodeConfig | undefined,
): TypeCode | null {
  if (!config || config.enabled === false || !Array.isArray(config.axes) || config.axes.length === 0) {
    return null;
  }
  const cut = typeof config.cut_percentile === "number" ? config.cut_percentile : DEFAULT_CUT;
  const byDim = new Map(profile.map((p) => [p.dimensionId, p] as const));

  const axes: AxisCode[] = [];
  for (const ax of config.axes) {
    const p = byDim.get(ax.dimension);
    if (!p) continue; // 配置引用了剖面里没有的维度 → 跳过（validatePack 已在加载期挡下正常情况）
    const code = axisCode(ax, p, cut);
    axes.push(code);
  }
  const nDiff = axes.filter((a) => a.differentiated).length;
  return {
    code: axes.map((a) => a.letter).join("-"),
    axes,
    nDifferentiated: nDiff,
    nAxes: axes.length,
  };
}

function axisCode(ax: TypeAxis, p: DimensionProfile, cut: number): AxisCode {
  // 点估计侧：percentile ≥ cut → 高极；否则低极（切点归高极，确定性）。
  const side: "high" | "low" = p.percentile >= cut ? "high" : "low";
  const pole = side === "high" ? ax.high : ax.low;

  // 未分化判定：CI 可估且跨越切点 → 该轴不强判高低。
  //   CI 不可估时（如未来出现单题维度）无从谈 CI，退回点估计判分化=true（如实：无区间证据）。
  const ciLow = p.ciLow;
  const ciHigh = p.ciHigh;
  const straddles =
    p.ciEstimable &&
    ciLow !== null &&
    ciHigh !== null &&
    ciLow < cut &&
    ciHigh > cut;
  const differentiated = !straddles;

  const letter = differentiated ? pole.letter : pole.letter.toLowerCase();
  return {
    axisId: ax.id,
    dimensionId: ax.dimension,
    nameZh: ax.name_zh ?? ax.id,
    side,
    differentiated,
    letter,
    labelZh: pole.label_zh,
    glossZh: pole.gloss_zh ?? "",
    percentile: p.percentile,
  };
}
