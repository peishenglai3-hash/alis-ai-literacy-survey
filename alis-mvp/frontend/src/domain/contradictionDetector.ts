// 矛盾检测器（v2.0 访谈引擎）。
// 来源：师门设计文档 开发者阅读指南_10天MVP.md + AI_Collaboration_Style_Engine.md
// 检测受访者作答中的跨题逻辑矛盾，引发反思性追问。

export interface Contradiction {
  id: string;
  type: string; // 矛盾类型标签
  questions: string[]; // 涉及的题目
  description: string; // 矛盾描述
  prompt: string; // 追问提示
  severity: "high" | "medium" | "low"; // 严重程度
}

// 硬编码常见矛盾模式（MVP: 5-8 种）
const CONTRADICTION_PATTERNS: {
  id: string;
  type: string;
  questionIds: string[]; // 涉及的题号（用于阶段过滤）
  check: (responses: Record<string, number>) => boolean;
  description: (responses: Record<string, number>) => string;
  prompt: string;
  severity: "high" | "medium" | "low";
}[] = [
  {
    id: "C01",
    type: "能力-意愿矛盾",
    questionIds: ["Q3", "Q5"],
    check: (r) => (r["Q3"] ?? 0) >= 5 && (r["Q5"] ?? 0) <= 3,
    description: () =>
      "你能用AI完成事情（Q3高分），但遇到AI不理解时倾向于放弃（Q5低分）——使用能力与协作意愿之间存在落差。",
    prompt: "你说能用AI完成事情，但遇到不理解时会放弃。你怎么看待这种矛盾？是觉得不值得花时间调整，还是不知道怎么调整？",
    severity: "high",
  },
  {
    id: "C02",
    type: "信任-验证矛盾",
    questionIds: ["Q7", "Q8"],
    check: (r) => (r["Q7"] ?? 0) >= 5 && (r["Q8"] ?? 0) <= 3,
    description: () =>
      "你愿意信任AI处理复杂问题（Q7高分），但判断AI是否可信的能力相对较弱（Q8低分）——高信任与低验证并存。",
    prompt: "你愿意信任AI处理复杂问题，但通常不太能判断AI什么时候可信。这种'高信任低验证'的状态，你觉得有没有风险？",
    severity: "high",
  },
  {
    id: "C03",
    type: "探索-使用矛盾",
    questionIds: ["Q1", "Q3"],
    check: (r) => (r["Q1"] ?? 0) >= 5 && (r["Q3"] ?? 0) <= 3,
    description: () =>
      "你能识别AI的存在（Q1高分），但利用AI完成实际任务的能力较弱（Q3低分）——AI识别力与AI使用力之间存在落差。",
    prompt: "你能注意到很多AI的存在，但似乎不太用它们来完成实际任务。是什么阻碍了你从'注意到'到'用起来'这一步？",
    severity: "medium",
  },
  {
    id: "C04",
    type: "判断-说服矛盾",
    questionIds: ["Q8", "Q12"],
    check: (r) => (r["Q8"] ?? 0) >= 5 && (r["Q12"] ?? 0) <= 3,
    description: () =>
      "你对自己的AI判断力有信心（Q8高分），但AI的'专业语气'仍然会显著影响你的信任（Q12低分）——理性判断与感性说服之间存在张力。",
    prompt: "你说能判断AI是否可信，但AI语气很专业时你会更容易相信。这两个判断标准，你觉得哪个更影响你的实际决策？",
    severity: "medium",
  },
  {
    id: "C05",
    type: "学习-耐心矛盾",
    questionIds: ["Q6", "Q5"],
    check: (r) => (r["Q6"] ?? 0) >= 5 && (r["Q5"] ?? 0) <= 3,
    description: () =>
      "你觉得学习新AI工具容易（Q6高分），但在AI不理解时容易放弃（Q5低分）——学习能力与协作耐心之间存在不同策略。",
    prompt: "你学新工具很快，但AI不理解你时容易放弃。是觉得'教'AI太麻烦，还是觉得换一种方式不如换个工具？",
    severity: "low",
  },
  {
    id: "C06",
    type: "伦理-行为矛盾",
    questionIds: ["Q10", "Q11"],
    check: (r) => (r["Q10"] ?? 0) >= 5 && (r["Q11"] ?? 0) <= 3,
    description: () =>
      "你关心AI的社会影响（Q10高分），但在隐私和数据安全方面的实际行动较少（Q11低分）——伦理关切与自我保护行为之间存在落差。",
    prompt: "你关心AI对社会的影响，但在保护自己的隐私方面做得不多。你觉得'关心社会'和'保护自己'之间有什么不同？",
    severity: "medium",
  },
  {
    id: "C07",
    type: "原则-反思落差",
    questionIds: ["Q15", "Q14"],
    check: (r) => (r["Q15"] ?? 0) >= 5 && (r["Q14"] ?? 0) <= 3,
    description: () =>
      "你已形成自己的AI使用原则（Q15高分），但觉得对AI的理解变化不大（Q14低分）——原则已建立，值得探索这些原则的形成历程。",
    prompt: "你已经有自己的AI使用原则了，同时觉得对AI的理解没怎么变过。这些原则是什么时候形成的？后来有没有经历过挑战？",
    severity: "low",
  },
  {
    id: "C08",
    type: "使用-反思落差",
    questionIds: ["Q3", "Q14"],
    check: (r) => (r["Q3"] ?? 0) >= 5 && (r["Q14"] ?? 0) <= 3,
    description: () =>
      "你高效利用AI完成目标（Q3高分），但对AI的深层理解变化不大（Q14低分）——高效使用与深度反思之间存在不同的发展节奏。",
    prompt: "你很会用AI做事，但对'AI是什么'的理解变化不大。你觉得'会用'和'理解'之间有什么关系？需要理解才能用好，还是可以纯粹当工具？",
    severity: "medium",
  },
  {
    id: "C09",
    type: "探索意愿-社会关切落差",
    questionIds: ["Q2", "Q10"],
    check: (r) => (r["Q2"] ?? 0) >= 5 && (r["Q10"] ?? 0) <= 3,
    description: () =>
      "你主动了解AI发展动态（Q2高分），但较少关心AI对社会的影响（Q10低分）——个体层面的好奇心与公共层面的关切之间存在落差。",
    prompt: "你平时会主动关注AI的新进展，但对它对社会的影响关注不多。你觉得'了解AI'和'关心AI的社会影响'是两回事吗？",
    severity: "medium",
  },
  {
    id: "C10",
    type: "知识边界-评估素养矛盾",
    questionIds: ["Q4", "Q9"],
    check: (r) => (r["Q4"] ?? 0) >= 5 && (r["Q9"] ?? 0) <= 3,
    description: () =>
      "你能指出AI能力的边界（Q4高分），但评估AI输出质量的能力较弱（Q9低分）——知道AI不能做什么，却不擅长判断它做得好不好。",
    prompt: "你能说出AI做不到什么，但似乎不太容易判断它给出的结果质量如何。'知道局限'和'判断质量'，你觉得哪个更难？",
    severity: "high",
  },
  {
    id: "C11",
    type: "评估能力-学习策略落差",
    questionIds: ["Q9", "Q13"],
    check: (r) => (r["Q9"] ?? 0) >= 5 && (r["Q13"] ?? 0) <= 3,
    description: () =>
      "你能评估AI输出质量（Q9高分），但较少从失败中调整自己的使用方式（Q13低分）——会评判结果，却不把评判转化为策略调整。",
    prompt: "你能判断AI给出的结果好不好，但似乎不太会因为结果不理想而改变自己的用法。你一般怎么处理AI给的不满意结果？",
    severity: "medium",
  },
  {
    id: "C12",
    type: "察觉-理解演化落差",
    questionIds: ["Q1", "Q14"],
    check: (r) => (r["Q1"] ?? 0) >= 5 && (r["Q14"] ?? 0) <= 3,
    description: () =>
      "你普遍能识别AI的存在（Q1高分），但感觉对AI的理解变化不大（Q14低分）——看见了很多AI，理解却似乎停滞。",
    prompt: "你能在生活里认出很多AI，但觉得对它的理解没怎么变过。'看见'和'理解'之间，你觉得隔着什么？",
    severity: "low",
  },
  {
    id: "C13",
    type: "学习速度-原则形成落差",
    questionIds: ["Q6", "Q15"],
    check: (r) => (r["Q6"] ?? 0) >= 5 && (r["Q15"] ?? 0) <= 3,
    description: () =>
      "你学新AI工具很快（Q6高分），但尚未形成明确的AI使用原则（Q15低分）——上手快与沉淀原则之间存在不同节奏。",
    prompt: "你上手新工具很快，但似乎还没形成一套自己的使用原则。用得多和想得深，是不是不太一样的事？",
    severity: "low",
  },
  {
    id: "C14",
    type: "信任-隐私落差",
    questionIds: ["Q7", "Q11"],
    check: (r) => (r["Q7"] ?? 0) >= 5 && (r["Q11"] ?? 0) <= 3,
    description: () =>
      "你愿意信任AI处理任务（Q7高分），但在隐私保护上行动较少（Q11低分）——把任务交给AI，却较少设防。",
    prompt: "你愿意把不少事情交给AI，但对自己的隐私保护做得不多。信任AI和处理隐私，你是怎么把握这个平衡的？",
    severity: "medium",
  },
];

/** 检测作答中的所有矛盾 */
export function detectContradictions(responses: Record<string, number>): Contradiction[] {
  const results: Contradiction[] = [];
  for (const pattern of CONTRADICTION_PATTERNS) {
    if (pattern.check(responses)) {
      results.push({
        id: pattern.id,
        type: pattern.type,
        questions: pattern.questionIds,
        description: pattern.description(responses),
        prompt: pattern.prompt,
        severity: pattern.severity,
      });
    }
  }
  // 按严重程度排序：high → medium → low
  const order = { high: 0, medium: 1, low: 2 };
  results.sort((a, b) => order[a.severity] - order[b.severity]);
  return results;
}

/** 获取某阶段的矛盾检测结果 */
export function getContradictionsForStage(
  contradictions: Contradiction[],
  stageId: number,
): Contradiction[] {
  const stageQuestions = getStageQuestions(stageId);
  return contradictions.filter((c) =>
    c.questions.some((q) => stageQuestions.includes(q)),
  );
}

import { getStageQuestions } from "../content/stageQuestions";
