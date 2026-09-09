// 3维度×8类型 AI协作风格分类器（v3.2 726反馈——清理旧代码）。
// 来源：C:\Users\35636\Downloads\724反馈\AI协作风格测量_完整版.md 第四部分
//
// v3.2 更新（2026-07-26）：
//   - 删除所有旧4维体系代码（classifyStyleV2/POLARITY_DIMENSIONS/FOUR_DIMENSIONS等）
//   - 删除旧 classifyStyle() 包装器
//   - 仅保留 classifyStyleV3() + 4+1阶段旅程

import type { TypeDefV3 } from "../content/typeDefinitions";
import {
  TYPES_V3,
  DIMENSIONS_V3,
  VALUE_STATEMENT,
  POSITION_TO_TYPE_CODE,
  getTypeDefV3,
} from "../content/typeDefinitions";

// ============================================================================
// 3维度极性维度定义
// ============================================================================

export interface PolarityDimDefV3 {
  id: string;
  nameZh: string;
  polePositive: { label: string; description: string };
  poleNegative: { label: string; description: string };
}

export const POLARITY_DIMENSIONS_V3: PolarityDimDefV3[] = DIMENSIONS_V3.map((d) => ({
  id: d.id,
  nameZh: d.nameZh,
  polePositive: { label: d.positiveEnd.label, description: d.positiveEnd.description },
  poleNegative: { label: d.negativeEnd.label, description: d.negativeEnd.description },
}));

// ============================================================================
// 3维度独立题目映射（来自724反馈第二部分）
// ============================================================================

interface PoleMappingV3 {
  questions: number[];
}

interface DimMappingV3 {
  positive: PoleMappingV3;
  negative: PoleMappingV3;
}

/**
 * 3维度极性映射表（724反馈算法）。
 *
 *   E-U: Explorer=[Q1,Q2,Q6], Utilizer=[Q3,Q4]
 *   T-V: Truster=[Q5,Q7],   Verifier=[Q8,Q9,Q12]
 *   F-R: Functionalist=[Q3,Q4,Q5,Q6], Reflector=[Q10,Q11,Q13,Q14,Q15]
 *
 * 注意：Q3/Q4/Q5/Q6 在 E-U 和 F-R 中复用（反馈设计的"跨维复用但计算独立"原则）。
 *       Q13 补入 F-R 反思端（724反馈修复了Q13缺失问题）。
 */
export const POLARITY_DIM_MAP_V3: Record<string, DimMappingV3> = {
  "E-U": {
    positive: { questions: [1, 2, 6] },
    negative: { questions: [3, 4] },
  },
  "T-V": {
    positive: { questions: [5, 7] },
    negative: { questions: [8, 9, 12] },
  },
  "F-R": {
    positive: { questions: [3, 4, 5, 6] },
    negative: { questions: [10, 11, 13, 14, 15] },
  },
};

// ============================================================================
// 类型定义
// ============================================================================

/** 单维度极性计算结果 */
export interface DimensionPolarityV3 {
  dimId: string;
  polarity: number;
  confidence: number;
  position: string;
  positionLabel: string;
  scores: { positive: number; negative: number };
}

/** 3维度完整的风格画像（v2.2+ 输出格式） */
export interface StyleProfileV3 {
  typeCode: string;
  typeDef: TypeDefV3;
  dimensions: DimensionPolarityV3[];
  typeConfidence: number;
  valueStatement: typeof VALUE_STATEMENT;
  reflectionQuestions: string[];
}

// ============================================================================
// 核心：3维度极性计算
// ============================================================================

function _qkey(n: number): string {
  return `Q${n}`;
}

function _getScores(responses: Record<string, number>, questionNums: number[]): number[] {
  return questionNums
    .map((n) => responses[_qkey(n)])
    .filter((v): v is number => v !== undefined && v !== null);
}

function _mean(arr: number[]): number {
  if (arr.length === 0) return 3.5;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

export function computePolarityV3(
  responses: Record<string, number>,
  dimId: string,
): DimensionPolarityV3 {
  const mapping = POLARITY_DIM_MAP_V3[dimId];
  const def = DIMENSIONS_V3.find((d) => d.id === dimId);

  if (!mapping || !def) {
    return {
      dimId,
      polarity: 0,
      confidence: 0,
      position: "",
      positionLabel: "",
      scores: { positive: 0, negative: 0 },
    };
  }

  const posScores = _getScores(responses, mapping.positive.questions);
  const negScores = _getScores(responses, mapping.negative.questions);
  const posMean = _mean(posScores);
  const negMean = _mean(negScores);

  const polarity = Math.round((posMean - negMean) * 10) / 10;
  const confidence = Math.round(Math.min(Math.abs(polarity) / 6, 1.0) * 100) / 100;

  const position = polarity >= 0 ? def.positiveEnd.code : def.negativeEnd.code;
  const positionLabel = polarity >= 0 ? def.positiveEnd.label : def.negativeEnd.label;

  return {
    dimId,
    polarity,
    confidence,
    position,
    positionLabel,
    scores: {
      positive: Math.round(posMean * 10) / 10,
      negative: Math.round(negMean * 10) / 10,
    },
  };
}

export function computeDimensionProfileV3(
  responses: Record<string, number>,
): DimensionPolarityV3[] {
  return DIMENSIONS_V3.map((d) => computePolarityV3(responses, d.id));
}

// ============================================================================
// 核心：3位类型码判定算法
// ============================================================================

export function classifyStyleV3(responses: Record<string, number>): StyleProfileV3 {
  const validCount = Object.keys(responses).filter(
    (k) => k.startsWith("Q") && typeof responses[k] === "number",
  ).length;
  if (validCount < 3) {
    const fallback = TYPES_V3[0]!;
    return {
      typeCode: fallback.typeCode,
      typeDef: fallback,
      dimensions: [
        { dimId: "E-U", position: "E", positionLabel: "探索者", polarity: 0, confidence: 0, scores: { positive: 0, negative: 0 } },
        { dimId: "T-V", position: "T", positionLabel: "信任者", polarity: 0, confidence: 0, scores: { positive: 0, negative: 0 } },
        { dimId: "F-R", position: "F", positionLabel: "功能者", polarity: 0, confidence: 0, scores: { positive: 0, negative: 0 } },
      ],
      typeConfidence: 0,
      valueStatement: { ...VALUE_STATEMENT, noHierarchy: `当前仅有${validCount}个有效回答，不足以进行可靠的AI协作风格分类。请完成至少3个题目后再查看分类结果。` },
      reflectionQuestions: ["数据不足，无法生成有意义的反思问题。请先完成至少3个题目。"],
    };
  }

  const dims = computeDimensionProfileV3(responses);

  const eDim = dims[0]!;
  const tDim = dims[1]!;
  const fDim = dims[2]!;

  const rawCode = eDim.position + tDim.position + fDim.position;
  const typeCode = POSITION_TO_TYPE_CODE[rawCode] ?? rawCode;
  const typeDef = getTypeDefV3(typeCode);

  if (!typeDef) {
    const fallback = TYPES_V3[0]!;
    return {
      typeCode: fallback.typeCode,
      typeDef: fallback,
      dimensions: dims,
      typeConfidence: 0.5,
      valueStatement: VALUE_STATEMENT,
      reflectionQuestions: [
        "这个描述符合你吗？完全符合？部分符合？还是不太符合？",
        "哪些特点很准确？哪些地方你觉得不像？",
      ],
    };
  }

  const typeConfidence =
    Math.round(((eDim.confidence + tDim.confidence + fDim.confidence) / 3) * 100) / 100;

  const reflectionQuestions = [
    `看到"${typeDef.memeName}"（${typeDef.animalName}）这个结果，你觉得符合你吗？有没有什么地方不准确？`,
    `你的${eDim.positionLabel}倾向(polarity=${eDim.polarity})和${tDim.positionLabel}倾向(polarity=${tDim.polarity})——这种组合意味着什么？又可能让你忽略了什么？`,
    `如果让你重新定义，你会用什么词描述你与AI的关系？`,
    `你认为"${typeDef.memeName}"的AI素养更高吗？还是说这只是另一种风格？`,
  ];

  return {
    typeCode,
    typeDef,
    dimensions: dims,
    typeConfidence,
    valueStatement: VALUE_STATEMENT,
    reflectionQuestions,
  };
}

// ============================================================================
// 4+1阶段旅程定义
// ============================================================================

export interface JourneyStage {
  id: number;
  nameZh: string;
  emoji: string;
  description: string;
  questions: string[];
  entryPrompt?: string;
}

export const JOURNEY_STAGES_V3: JourneyStage[] = [
  { id: 1, nameZh: "初识", emoji: "👀", description: "AI如何进入你的视野？", entryPrompt: "让我们从你最初与AI的接触开始聊起——你是什么时候第一次注意到AI的？", questions: ["Q1", "Q2", "Q6"] },
  { id: 2, nameZh: "使用", emoji: "⚙️", description: "你如何使用AI？", entryPrompt: "既然你已经接触AI有一段时间了，我想了解你是怎么实际使用它的——你通常会用它来做什么？", questions: ["Q3", "Q4", "Q5"] },
  { id: 3, nameZh: "信任", emoji: "🤔", description: "你如何建立对AI的信任？", entryPrompt: "聊完怎么使用AI，我想深入了解一下你和AI之间的信任关系——你觉得AI可靠吗？", questions: ["Q7", "Q8", "Q9", "Q12"] },
  { id: 4, nameZh: "反思", emoji: "💡", description: "AI如何影响你？你如何重新定义AI？", entryPrompt: "经过前面的交流，我想请你退一步，从更大的视角来看——AI对你这个人产生了什么影响？", questions: ["Q10", "Q11", "Q13", "Q14", "Q15"] },
  { id: 5, nameZh: "开放性空间", emoji: "🌟", description: "聊聊你的AI协作类型", questions: [] },
];

export function getJourneyForStyle(_styleId: string): JourneyStage[] {
  return JOURNEY_STAGES_V3;
}
