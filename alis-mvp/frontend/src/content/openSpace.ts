// 开放性空间——9个探讨问题 + 8种类型的个性化问题（v2.2 724反馈）。
// 来源：C:\Users\35636\Downloads\724反馈\访谈流程精细化设计_4阶段叙事深度.md 第三章第五节
//
// 设计理念：
//   - 类型作为背景信息，不框定访谈流程
//   - 在15题访谈后，围绕类型进行反思性探讨
//   - 激发受访者对AI协作关系的自我认识

import type { TypeDefV3 } from "./typeDefinitions";

// ============================================================================
// 探讨问题模块定义
// ============================================================================

export interface OpenSpaceModule {
  moduleId: string;
  moduleName: string;
  moduleEmoji: string;
  description: string;
}

export const OPEN_SPACE_MODULES: OpenSpaceModule[] = [
  {
    moduleId: "type_reflection",
    moduleName: "类型反思",
    moduleEmoji: "🪞",
    description: "让受访者反思类型是否准确，探索自我认知",
  },
  {
    moduleId: "ai_literacy",
    moduleName: "AI素养理解",
    moduleEmoji: "📚",
    description: "探索受访者的AI素养概念，挑战预设",
  },
  {
    moduleId: "ai_literacy_extension",
    moduleName: "AI素养拓展",
    moduleEmoji: "⭐",
    description: "探索受访者对AI素养概念的拓展理解",
  },
  {
    moduleId: "personal_story",
    moduleName: "个人故事",
    moduleEmoji: "📖",
    description: "从类型回到具体经验，深化理解",
  },
  {
    moduleId: "future_planning",
    moduleName: "未来规划",
    moduleEmoji: "🚀",
    description: "探索受访者的AI学习策略和未来态度",
  },
  {
    moduleId: "critical_reflection",
    moduleName: "批判性反思",
    moduleEmoji: "🔍",
    description: "让受访者反思类型框架本身的合理性",
  },
];

// ============================================================================
// 9个探讨问题
// ============================================================================

export interface OpenSpaceQuestion {
  questionId: string; // "OS_Q1" - "OS_Q9"
  moduleId: string;
  questionText: string;
  followUpDirection: string;
  purpose: string;
  isRequired: boolean;
}

export const OPEN_SPACE_QUESTIONS: OpenSpaceQuestion[] = [
  // ---- 模块1：类型反思 ----
  {
    questionId: "OS_Q1",
    moduleId: "type_reflection",
    questionText: "看到这个测试结果，你觉得{typeName}符合你吗？有没有什么地方不准确？",
    followUpDirection:
      '如果"符合"："什么地方最符合？"\n如果"不符合"："哪里不准确？为什么？"\n如果"不确定"："为什么不确定？"',
    purpose: "让受访者反思类型是否准确，探索类型与自我认知的一致性/矛盾性",
    isRequired: false,
  },
  {
    questionId: "OS_Q2",
    moduleId: "type_reflection",
    questionText: "如果让你重新定义，你会用什么词描述你与AI的关系？",
    followUpDirection:
      '"你会用什么关键词？"\n"为什么选择这些词？"\n"这8种类型都没有提到的特质是什么？"',
    purpose: "开放反思空间，不受类型框架限制，了解受访者自己的概念框架",
    isRequired: false,
  },

  // ---- 模块2：AI素养理解 ----
  {
    questionId: "OS_Q3",
    moduleId: "ai_literacy",
    questionText:
      "现在你大致了解了'AI素养'这个概念，你认为它是什么？是一种能力，还是一种风格？",
    followUpDirection:
      '"你如何理解AI素养？"\n"你认为它是高低的问题，还是不同的问题？"\n"这个测试有帮助你理解AI素养吗？"',
    purpose: "探索受访者的AI素养概念，挑战'能力 vs 风格'的预设",
    isRequired: false,
  },
  {
    questionId: "OS_Q4",
    moduleId: "ai_literacy",
    questionText:
      "你认为'{typeName}'和'质疑党'，哪种AI素养更好？还是没有优劣之分？",
    followUpDirection:
      '"你觉得有优劣吗？为什么？"\n"社会可能更偏好哪种类型？"\n"这反映了什么？"',
    purpose: "探索受访者的价值判断，挑战'无优劣'的预设",
    isRequired: false,
  },

  // ---- 模块3：AI素养拓展 ⭐（保留原问题） ----
  {
    questionId: "OS_Q5",
    moduleId: "ai_literacy_extension",
    questionText:
      "你认为AI素养还可以包括什么？除了我们讨论的这些，还有什么重要的维度或能力被遗漏了吗？",
    followUpDirection:
      '"有什么重要的能力或维度我们没有讨论到？"\n"如果让你增加一个问题，会是什么？"\n"你认为AI素养还应该包括什么？"',
    purpose: "探索受访者对AI素养概念的拓展理解，获取对现有测试框架的补充建议",
    isRequired: false,
  },

  // ---- 模块4：个人故事 ----
  {
    questionId: "OS_Q6",
    moduleId: "personal_story",
    questionText:
      "作为'{typeName}'，有没有什么特别的AI使用故事，让你印象深刻？",
    followUpDirection:
      '"能讲一个具体的例子吗？"\n"这个例子如何体现了你的特质？"\n"有没有例外的情况？"',
    purpose: "从类型回到具体经验，深化对类型的理解",
    isRequired: false,
  },

  // ---- 模块5：未来规划 ----
  {
    questionId: "OS_Q7",
    moduleId: "future_planning",
    questionText: "面对AI时代的来临，你打算如何学习AI，以适应这个时代？",
    followUpDirection:
      '"你打算学什么？"\n"你担心的挑战是什么？"\n"你希望获得什么支持？"',
    purpose: "探索受访者的AI学习策略，了解对AI时代的态度",
    isRequired: false,
  },
  {
    questionId: "OS_Q8",
    moduleId: "future_planning",
    questionText: "在你的职业/个人发展中，AI将扮演什么角色？",
    followUpDirection:
      '"AI会改变你的职业吗？"\n"你希望AI如何帮助你？"\n"你担心AI会带来什么挑战？"',
    purpose: "探索受访者的未来规划，了解AI与个人生活的关系",
    isRequired: false,
  },

  // ---- 模块6：批判性反思 ----
  {
    questionId: "OS_Q9",
    moduleId: "critical_reflection",
    questionText:
      "你觉得这8种类型（摸鱼人、质疑党等）能准确描述人们与AI的关系吗？",
    followUpDirection:
      '"有什么重要的类型被遗漏了吗？"\n"这些类型的边界清晰吗？"\n"你会如何改进这个分类？"',
    purpose: "让受访者反思类型框架本身，获取对理论框架的批判性反馈",
    isRequired: false,
  },
];

// ============================================================================
// 8种类型的个性化问题表述
// ============================================================================

export interface TypeSpecificQuestion {
  typeCode: string;
  questionId: string;
  personalizedText: string;
  followUpDirection: string;
}

/**
 * 8种类型×9个问题的个性化表述。
 * 每种类型用自己的网络梗名+动物名替换模板中的{typeName}。
 */
export const TYPE_SPECIFIC_QUESTIONS: TypeSpecificQuestion[] = [
  // ---- 摸鱼人（好奇猫型/ETF） ----
  {
    typeCode: "ETF", questionId: "OS_Q1",
    personalizedText: "看到'摸鱼人'这个结果，你觉得符合吗？'好奇猫'这个形象准确吗？",
    followUpDirection: "从'主动探索、信任AI、注重效率'三个特征展开讨论",
  },
  {
    typeCode: "ETF", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？好奇猫总是第一时间尝试新AI工具，哪些新技术最吸引你？",
    followUpDirection: "好奇猫特质：主动探索、好奇心强",
  },
  {
    typeCode: "ETF", questionId: "OS_Q6",
    personalizedText: "作为摸鱼人，有什么特别的AI使用故事，让你印象深刻？",
    followUpDirection: "用AI提高效率的典型例子",
  },
  {
    typeCode: "ETF", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何平衡'摸鱼'和'学习'？",
    followUpDirection: "探索如何在效率提升中保持成长",
  },
  {
    typeCode: "ETF", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，AI将扮演什么角色？",
    followUpDirection: "AI如何改变你的工作方式",
  },

  // ---- 质疑党（谨慎狗型/ERF） ----
  {
    typeCode: "ERF", questionId: "OS_Q1",
    personalizedText: "看到'质疑党'这个结果，你觉得符合吗？'谨慎狗'这个形象准确吗？",
    followUpDirection: "从'主动探索、验证AI、注重效率'三个特征展开讨论",
  },
  {
    typeCode: "ERF", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为谨慎狗，你为什么需要验证？",
    followUpDirection: "谨慎狗特质：先闻闻再决定，不轻易信任",
  },
  {
    typeCode: "ERF", questionId: "OS_Q4",
    personalizedText: "你认为'质疑党'的AI素养更高吗？还是说'质疑'只是另一种风格？",
    followUpDirection: "挑战'质疑=更高素养'的预设",
  },
  {
    typeCode: "ERF", questionId: "OS_Q6",
    personalizedText: "作为质疑党，你验证AI时有什么特别的经历？",
    followUpDirection: "验证方法、判断标准的形成过程",
  },
  {
    typeCode: "ERF", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何保持'质疑'但不错过机会？",
    followUpDirection: "平衡质疑和开放性的策略",
  },

  // ---- 工具人（忙碌蜂型/UTF） ----
  {
    typeCode: "UTF", questionId: "OS_Q1",
    personalizedText: "看到'工具人'这个结果，你觉得符合吗？'忙碌蜂'这个形象准确吗？",
    followUpDirection: "从'有明确任务才用AI、信任AI、注重效率'三个特征展开",
  },
  {
    typeCode: "UTF", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为忙碌蜂，你通常在什么任务中使用AI？",
    followUpDirection: "忙碌蜂特质：有目标才行动，快速完成任务",
  },
  {
    typeCode: "UTF", questionId: "OS_Q4",
    personalizedText: "你认为'工具人'的AI素养如何？是高效还是被工具化？",
    followUpDirection: "挑战'工具人=浅层使用'的预设",
  },
  {
    typeCode: "UTF", questionId: "OS_Q6",
    personalizedText: "作为工具人，你如何平衡效率和深度使用？",
    followUpDirection: "探索工具人是否可能错过AI的深层价值",
  },
  {
    typeCode: "UTF", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你担心AI会取代你的工作吗？",
    followUpDirection: "探索工具人对AI职业影响的看法",
  },
  {
    typeCode: "UTF", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，AI将扮演什么角色？",
    followUpDirection: "AI如何改变你的工作方式",
  },

  // ---- 保守派（稳妥龟型/UVF） ----
  {
    typeCode: "UVF", questionId: "OS_Q1",
    personalizedText: "看到'保守派'这个结果，你觉得符合吗？'稳妥龟'这个形象准确吗？",
    followUpDirection: "从'有明确任务才用AI、要验证、确保稳妥'三个特征展开",
  },
  {
    typeCode: "UVF", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为稳妥龟，为什么需要验证？",
    followUpDirection: "稳妥龟特质：稳字当头，不轻易冒险",
  },
  {
    typeCode: "UVF", questionId: "OS_Q4",
    personalizedText: "你认为'保守派'的AI素养差一些吗？还是说'稳妥'本身就是一种素养？",
    followUpDirection: "挑战'保守=素养低'的预设",
  },
  {
    typeCode: "UVF", questionId: "OS_Q6",
    personalizedText: "作为保守派，有没有因为'太保守'而错过好用的AI工具？",
    followUpDirection: "保守策略的代价和反思",
  },
  {
    typeCode: "UVF", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何在不冒险的前提下保持学习？",
    followUpDirection: "在稳妥中寻找成长机会的策略",
  },
  {
    typeCode: "UVF", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，AI是威胁还是机遇？",
    followUpDirection: "探索保守派对AI职业影响的看法",
  },

  // ---- 哲学家（智慧猫头鹰型/ETR） ----
  {
    typeCode: "ETR", questionId: "OS_Q1",
    personalizedText: "看到'哲学家'这个结果，你觉得符合吗？'智慧猫头鹰'这个形象准确吗？",
    followUpDirection: "从'主动探索、信任AI、深度思考'三个特征展开",
  },
  {
    typeCode: "ETR", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为智慧猫头鹰，你如何思考AI对人类社会的影响？",
    followUpDirection: "智慧猫头鹰特质：深夜思考AI与人类",
  },
  {
    typeCode: "ETR", questionId: "OS_Q4",
    personalizedText: "你认为'哲学家'的AI素养更高吗？深度思考是否意味着更好的AI使用？",
    followUpDirection: "挑战'反思=更高素养'的预设",
  },
  {
    typeCode: "ETR", questionId: "OS_Q6",
    personalizedText: "作为哲学家，有没有什么AI使用经历让你产生了深刻的思考？",
    followUpDirection: "从具体经验到抽象思考的转化过程",
  },
  {
    typeCode: "ETR", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何将深度思考转化为实际行动？",
    followUpDirection: "探索哲学家如何平衡思考和行动",
  },
  {
    typeCode: "ETR", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，AI将扮演什么角色？你的思考如何指导你的实践？",
    followUpDirection: "AI如何改变你的工作方式",
  },

  // ---- 批判家（批判狐狸型/ERR） ----
  {
    typeCode: "ERR", questionId: "OS_Q1",
    personalizedText: "看到'批判家'这个结果，你觉得符合吗？'批判狐狸'这个形象准确吗？",
    followUpDirection: "从'主动探索、要验证、深度思考'三个特征展开",
  },
  {
    typeCode: "ERR", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为批判狐狸，你如何批判性地看待AI？",
    followUpDirection: "批判狐狸特质：狡猾地分析AI漏洞",
  },
  {
    typeCode: "ERR", questionId: "OS_Q4",
    personalizedText: "你认为'批判家'的AI素养更高吗？还是说批判只是另一种使用风格？",
    followUpDirection: "挑战'批判=更高素养'的预设",
  },
  {
    typeCode: "ERR", questionId: "OS_Q6",
    personalizedText: "作为批判家，有没有你发现AI重大漏洞或局限的经历？",
    followUpDirection: "批判性分析的具体案例",
  },
  {
    typeCode: "ERR", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何保持批判但不陷入悲观？",
    followUpDirection: "在批判中保持建设性的策略",
  },
  {
    typeCode: "ERR", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，批判性思维如何帮助你更好地使用AI？",
    followUpDirection: "批判性思维与AI实践的互动",
  },

  // ---- 实干家（实践大象型/UTR） ----
  {
    typeCode: "UTR", questionId: "OS_Q1",
    personalizedText: "看到'实干家'这个结果，你觉得符合吗？'实践大象'这个形象准确吗？",
    followUpDirection: "从'有明确任务才用AI、信任AI、思考影响'三个特征展开",
  },
  {
    typeCode: "UTR", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为实践大象，你如何平衡效率和思考？",
    followUpDirection: "实践大象特质：稳重实践，深思熟虑",
  },
  {
    typeCode: "UTR", questionId: "OS_Q4",
    personalizedText: "你认为'实干家'的AI素养如何？踏实使用但缺少探索，这是问题吗？",
    followUpDirection: "挑战'实干=不够创新'的预设",
  },
  {
    typeCode: "UTR", questionId: "OS_Q6",
    personalizedText: "作为实干家，AI如何改变了你的工作方式？",
    followUpDirection: "实干家的AI工具选择和应用策略",
  },
  {
    typeCode: "UTR", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何在学习新工具和保持稳定实践之间取得平衡？",
    followUpDirection: "探索实干家的学习策略",
  },
  {
    typeCode: "UTR", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，AI将扮演什么角色？你的实践导向如何影响你的职业规划？",
    followUpDirection: "AI如何融入实干家的职业成长",
  },

  // ---- 老古董（守仓松鼠型/UVR） ----
  {
    typeCode: "UVR", questionId: "OS_Q1",
    personalizedText: "看到'老古董'这个结果，你觉得符合吗？'守仓松鼠'这个形象准确吗？",
    followUpDirection: "从'有明确任务才用AI、要验证、关注风险'三个特征展开",
  },
  {
    typeCode: "UVR", questionId: "OS_Q2",
    personalizedText: "如果让你重新定义，你会用什么词描述你与AI的关系？作为守仓松鼠，你对AI持谨慎态度的原因是什么？",
    followUpDirection: "守仓松鼠特质：存粮过冬，关注风险",
  },
  {
    typeCode: "UVR", questionId: "OS_Q4",
    personalizedText: "你认为'老古董'的AI素养真的低吗？对AI保持警惕是否也是一种素养？",
    followUpDirection: "挑战'谨慎=落后'的预设",
  },
  {
    typeCode: "UVR", questionId: "OS_Q6",
    personalizedText: "作为老古董，你认为AI的风险有哪些？有没有因为这些风险而拒绝使用某个AI？",
    followUpDirection: "风险意识的形成和实际影响",
  },
  {
    typeCode: "UVR", questionId: "OS_Q7",
    personalizedText: "面对AI时代，你如何平衡使用和风险？",
    followUpDirection: "在风险意识中保持开放性的策略",
  },
  {
    typeCode: "UVR", questionId: "OS_Q8",
    personalizedText: "在你的职业发展中，AI带来的风险是否会改变你的职业规划？",
    followUpDirection: "探索风险意识对职业选择的影响",
  },
];

// ============================================================================
// 查询函数
// ============================================================================

/** 根据模块ID获取探讨问题列表 */
export function getQuestionsByModule(moduleId: string): OpenSpaceQuestion[] {
  return OPEN_SPACE_QUESTIONS.filter((q) => q.moduleId === moduleId);
}

/** 获取某类型在某问题上的个性化表述 */
export function getTypeSpecificQuestion(
  typeCode: string,
  questionId: string,
): TypeSpecificQuestion | undefined {
  return TYPE_SPECIFIC_QUESTIONS.find(
    (q) => q.typeCode === typeCode && q.questionId === questionId,
  );
}

/** 将问题模板中的{typeName}替换为实际类型名 */
export function renderQuestionText(question: OpenSpaceQuestion, typeDef: TypeDefV3): string {
  return question.questionText.replace("{typeName}", `"${typeDef.memeName}"（${typeDef.animalName}）`);
}
