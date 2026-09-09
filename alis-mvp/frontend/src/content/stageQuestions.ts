// 认知阶段→题目映射（v2.2 724反馈更新——4阶段+开放性空间）。
// 来源：C:\Users\35636\Downloads\724反馈\访谈流程精细化设计_4阶段叙事深度.md
//
// v2.2 更新（2026-07-24）：
//   - 6阶段→4阶段（初识/使用/信任/反思）+ 开放性空间
//   - Q13 补入阶段4（修复了v2.0/v2.1中Q13缺失的问题）
//   - Q10/Q11/Q14 不再跨阶段重复
//   - 阶段5（开放性空间）无固定题目

/** 每阶段的关联题目。4阶段+开放性空间对应15题的完整划分。 */
export const STAGE_QUESTIONS: Record<number, string[]> = {
  1: ["Q1", "Q2", "Q6"],                          // 初识（3题）
  2: ["Q3", "Q4", "Q5"],                          // 使用（3题）
  3: ["Q7", "Q8", "Q9", "Q12"],                   // 信任（4题）
  4: ["Q10", "Q11", "Q13", "Q14", "Q15"],         // 反思（5题）——Q13已补入
  5: [],                                           // 开放性空间（无固定题目）
};

/** 获取某阶段的关联题目列表。 */
export function getStageQuestions(stageId: number): string[] {
  return STAGE_QUESTIONS[stageId] ?? [];
}

/** 阶段名称（用于显示） */
export const STAGE_NAMES: Record<number, string> = {
  1: "初识",
  2: "使用",
  3: "信任",
  4: "反思",
  5: "开放性空间",
};

/** 阶段emoji（用于显示） */
export const STAGE_EMOJIS: Record<number, string> = {
  1: "👀",
  2: "⚙️",
  3: "🤔",
  4: "💡",
  5: "🌟",
};
