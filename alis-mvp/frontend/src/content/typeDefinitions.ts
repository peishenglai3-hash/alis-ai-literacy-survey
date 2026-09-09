// 3维度×8类型 AI协作风格测量——统一类型数据层（v2.2 724反馈）。
// 来源：C:\Users\35636\Downloads\724反馈\AI协作风格测量_完整版.md
//
// 核心定位：从"素养"到"风格"——这不是"谁更会用AI"的问题，
// 而是"人与AI形成何种协作关系"的问题。
// 所有维度两端都合理，无优劣之分。

// ============================================================================
// 第一部分：3维度完整定义
// ============================================================================

export interface DimensionEndDef {
  code: string;
  label: string;
  description: string;
  typicalBehaviors: string[];
  questions: number[]; // 题号（Q1→1）
}

export interface DimensionDefV3 {
  id: string; // "E-U" | "T-V" | "F-R"
  nameZh: string;
  nameEn: string;
  coreTension: string;
  positiveEnd: DimensionEndDef;
  negativeEnd: DimensionEndDef;
  valueNote: string;
}

export const DIMENSIONS_V3: DimensionDefV3[] = [
  {
    id: "E-U",
    nameZh: "探索者-实用者",
    nameEn: "Explorer - Utilizer",
    coreTension: "主动探索AI可能性 vs 任务导向使用AI",
    positiveEnd: {
      code: "E",
      label: "探索者",
      description: "主动探索AI的可能性，把它当成玩具/实验场",
      typicalBehaviors: [
        "关注AI技术实现细节（Q1高分）",
        "敏锐察觉生活中AI的应用（Q2高分）",
        "主动尝试新AI工具（Q6高分）",
      ],
      questions: [1, 2, 6],
    },
    negativeEnd: {
      code: "U",
      label: "实用者",
      description: "任务导向使用，AI只是完成任务的工具",
      typicalBehaviors: [
        "有明确任务才使用AI（Q3高分）",
        "专注少数工具，深入了解（Q4高分）",
        "等待工具成熟后再使用（Q6低分）",
      ],
      questions: [3, 4],
    },
    valueNote: "探索端和实用端都是合理的AI协作方式，无优劣之分——探索者能发现更多可能性，适合创新场景；实用者更专注高效，适合任务场景。",
  },
  {
    id: "T-V",
    nameZh: "信任者-验证者",
    nameEn: "Truster - Verifier",
    coreTension: "信任AI输出 vs 质疑AI输出",
    positiveEnd: {
      code: "T",
      label: "信任者",
      description: "信任AI，愿意协作调试",
      typicalBehaviors: [
        "多次调整表达，与AI协作（Q5高分）",
        "复杂任务也愿意交给AI（Q7高分）",
      ],
      questions: [5, 7],
    },
    negativeEnd: {
      code: "R", // 注：类型码中第二位置的"R"代表验证者(Verifier)，第三位置的"R"代表反思者(Reflector)
      label: "验证者",
      description: "质疑AI，需要验证批判",
      typicalBehaviors: [
        "主动检查AI的结果（Q8高分）",
        "明确知道AI的适用边界（Q9高分）",
        "不盲从AI的专业外表（Q12高分）",
      ],
      questions: [8, 9, 12],
    },
    valueNote: "信任端和验证端都是合理的AI协作方式，无优劣之分——信任者协作效率更高，适合快速迭代；验证者更谨慎准确，适合高风险场景。",
  },
  {
    id: "F-R",
    nameZh: "功能者-反思者",
    nameEn: "Functionalist - Reflector",
    coreTension: "关注AI功能使用 vs 思考AI社会影响",
    positiveEnd: {
      code: "F",
      label: "功能者",
      description: "关注AI的功能性使用，注重效率",
      typicalBehaviors: [
        "有明确任务才使用AI（Q3高分）",
        "专注工具选择和效率（Q4高分）",
        "愿意调试协作完成任务（Q5高分）",
        "主动尝试能提高效率的工具（Q6高分）",
      ],
      questions: [3, 4, 5, 6],
    },
    negativeEnd: {
      code: "R",
      label: "反思者",
      description: "思考AI的社会影响和个人影响",
      typicalBehaviors: [
        "考虑AI对社会的影响（Q10高分）",
        "关注AI的隐私风险（Q11高分）",
        "主动调整AI带来的情绪（Q13高分）",
        "快速调整对AI的认知（Q14高分）",
        "有明确的AI使用原则（Q15高分）",
      ],
      questions: [10, 11, 13, 14, 15],
    },
    valueNote: "功能端和反思端都是合理的AI协作方式，无优劣之分——功能者更实用，适合日常工作；反思者更深刻，适合长期思考。",
  },
];

// ============================================================================
// 第二部分：8种类型完整定义（网络梗+动物形象）
// ============================================================================

export interface TypeDefV3 {
  typeCode: string; // "ETF" | "ERF" | "UTF" | "UVF" | "ETR" | "ERR" | "UTR" | "UVR"
  memeName: string; // 网络梗名
  animalName: string; // 动物形象
  fullName: string; // 完整显示名
  dimCombo: string; // 维度组合（如 E+T+F）
  coreFeatures: string[]; // 3个核心特征（用于悬浮窗）
  characteristics: string[]; // 详细特点
  coreProfile: string; // 核心画像（一句话）
  interviewGuidance: string[]; // 访谈引导重点
  outputDescription: string; // 输出描述（多行文本，含emoji）
}

export const TYPES_V3: TypeDefV3[] = [
  {
    typeCode: "ETF",
    memeName: "摸鱼人",
    animalName: "好奇猫",
    fullName: "AI摸鱼人（好奇猫型）",
    dimCombo: "E+T+F",
    coreFeatures: ["爱探索", "信任AI", "重功能"],
    characteristics: ["主动探索AI的可能性", "信任AI，愿意协作调试", "注重效率和使用体验"],
    coreProfile: "爱玩新AI工具，提高摸鱼效率——好奇探索，信任AI，注重实用",
    interviewGuidance: [
      "你总是第一时间尝试新AI工具？",
      "AI帮你提高了多少摸鱼效率？",
      "你信任AI输出的原因是什么？",
    ],
    outputDescription: `你是AI摸鱼人（好奇猫型）

• 好奇猫：总是第一时间尝试新AI工具
• 摸鱼人：用AI提高摸鱼效率，主打一个实用

你的特点：
✓ 主动探索AI的可能性
✓ 信任AI，愿意协作调试
✓ 注重效率和使用体验

无优劣说明：摸鱼人和实干家都合理，只是风格不同`,
  },
  {
    typeCode: "ERF",
    memeName: "质疑党",
    animalName: "谨慎狗",
    fullName: "AI质疑党（谨慎狗型）",
    dimCombo: "E+R+F",
    coreFeatures: ["爱探索", "验证AI", "重功能"],
    characteristics: ["主动探索AI的可能性", "验证AI的结果，不盲从", "注重效率，但要验证"],
    coreProfile: "爱玩新AI，但每次都要验证——'让我康康是不是AI写的'",
    interviewGuidance: [
      "你爱尝试新AI，但为什么不完全信任？",
      "你如何验证AI的输出？",
      "验证的标准是什么？",
    ],
    outputDescription: `你是AI质疑党（谨慎狗型）

• 谨慎狗：先闻闻再决定，不轻易信任
• 质疑党："让我康康是不是AI写的"

你的特点：
✓ 主动探索AI的可能性
✓ 验证AI的结果，不盲从
✓ 注重效率，但要稳妥

无优劣说明：质疑党和信任者都合理，只是风格不同`,
  },
  {
    typeCode: "UTF",
    memeName: "工具人",
    animalName: "忙碌蜂",
    fullName: "AI工具人（忙碌蜂型）",
    dimCombo: "U+T+F",
    coreFeatures: ["重实用", "信任AI", "重功能"],
    characteristics: ["有明确任务才使用AI", "信任AI，愿意协作", "注重任务完成效率"],
    coreProfile: "有明确任务才用AI，信任AI，完成任务——'AI是我的工具'",
    interviewGuidance: [
      "你通常在什么任务中使用AI？",
      "AI如何帮助你完成任务？",
      "你信任AI的原因是什么？",
    ],
    outputDescription: `你是AI工具人（忙碌蜂型）

• 忙碌蜂：有目标才行动，快速完成任务
• 工具人："AI是我的工具，帮我干活"

你的特点：
✓ 有明确任务才使用AI
✓ 信任AI，愿意协作
✓ 注重任务完成效率

无优劣说明：工具人和探索者都合理，只是风格不同`,
  },
  {
    typeCode: "UVF",
    memeName: "保守派",
    animalName: "稳妥龟",
    fullName: "AI保守派（稳妥龟型）",
    dimCombo: "U+R+F",
    coreFeatures: ["重实用", "验证AI", "重功能"],
    characteristics: ["有明确任务才使用AI", "验证AI的结果", "稳扎稳打，确保正确"],
    coreProfile: "有任务才用AI，要验证，稳妥——'再看看，不急'",
    interviewGuidance: [
      "你使用AI的场景有哪些？",
      "为什么需要验证AI的输出？",
      "你如何确保稳妥？",
    ],
    outputDescription: `你是AI保守派（稳妥龟型）

• 稳妥龟：稳字当头，不轻易冒险
• 保守派："再看看，不急"

你的特点：
✓ 有明确任务才使用AI
✓ 验证AI的结果
✓ 稳扎稳打，确保正确

无优劣说明：保守派和探索者都合理，只是风格不同`,
  },
  {
    typeCode: "ETR",
    memeName: "哲学家",
    animalName: "智慧猫头鹰",
    fullName: "AI哲学家（智慧猫头鹰型）",
    dimCombo: "E+T+R",
    coreFeatures: ["爱探索", "信任AI", "重反思"],
    characteristics: ["主动探索AI的可能性", "信任AI，愿意协作", "深度思考AI的社会影响"],
    coreProfile: "爱玩新AI，信任AI，但爱思考——'AI会取代人类吗？'",
    interviewGuidance: [
      "你如何看待AI的社会影响？",
      "AI会改变人类的什么？",
      "你对AI的思考是什么？",
    ],
    outputDescription: `你是AI哲学家（智慧猫头鹰型）

• 智慧猫头鹰：深夜思考AI与人类
• 哲学家："AI会取代人类吗？"

你的特点：
✓ 主动探索AI的可能性
✓ 信任AI，愿意协作
✓ 深度思考AI的社会影响

无优劣说明：哲学家和工具人都合理，只是风格不同`,
  },
  {
    typeCode: "ERR",
    memeName: "批判家",
    animalName: "批判狐狸",
    fullName: "AI批判家（批判狐狸型）",
    dimCombo: "E+R+R",
    coreFeatures: ["爱探索", "验证AI", "重反思"],
    characteristics: ["主动探索AI的可能性", "验证AI的结果，不盲从", "深度思考AI的社会影响"],
    coreProfile: "爱玩新AI，要验证，爱思考——'AI的局限性在哪里？'",
    interviewGuidance: [
      "你如何批判性地看待AI？",
      "AI的局限性是什么？",
      "你认为AI应该如何发展？",
    ],
    outputDescription: `你是AI批判家（批判狐狸型）

• 批判狐狸：狡猾地分析AI漏洞
• 批判家："AI的局限性在哪里？"

你的特点：
✓ 主动探索AI的可能性
✓ 验证AI的结果，不盲从
✓ 深度思考AI的社会影响

无优劣说明：批判家和信任者都合理，只是风格不同`,
  },
  {
    typeCode: "UTR",
    memeName: "实干家",
    animalName: "实践大象",
    fullName: "AI实干家（实践大象型）",
    dimCombo: "U+T+R",
    coreFeatures: ["重实用", "信任AI", "重反思"],
    characteristics: ["有明确任务才使用AI", "信任AI，愿意协作", "思考AI的社会影响"],
    coreProfile: "有任务才用AI，信任AI，会思考影响——'AI帮我工作，也思考影响'",
    interviewGuidance: [
      "你如何在工作中使用AI？",
      "AI如何改变你的工作？",
      "你如何看待AI的影响？",
    ],
    outputDescription: `你是AI实干家（实践大象型）

• 实践大象：稳重实践，深思熟虑
• 实干家："AI帮我工作，也思考影响"

你的特点：
✓ 有明确任务才使用AI
✓ 信任AI，愿意协作
✓ 思考AI的社会影响

无优劣说明：实干家和探索者都合理，只是风格不同`,
  },
  {
    typeCode: "UVR",
    memeName: "老古董",
    animalName: "守仓松鼠",
    fullName: "AI老古董（守仓松鼠型）",
    dimCombo: "U+R+R",
    coreFeatures: ["重实用", "验证AI", "重反思"],
    characteristics: ["有明确任务才使用AI", "验证AI的结果", "关注AI的风险和影响"],
    coreProfile: "有任务才用AI，要验证，关注风险——'以前没有AI不也挺好？'",
    interviewGuidance: [
      "你对AI持谨慎态度的原因是什么？",
      "你认为AI的风险有哪些？",
      "你如何平衡使用和风险？",
    ],
    outputDescription: `你是AI老古董（守仓松鼠型）

• 守仓松鼠：存粮过冬，关注风险
• 老古董："以前没有AI不也挺好？"

你的特点：
✓ 有明确任务才使用AI
✓ 验证AI的结果
✓ 关注AI的风险和影响

无优劣说明：老古董和探索者都合理，只是风格不同`,
  },
];

// ============================================================================
// 第三部分：15题行为描述版重新解释字典
// ============================================================================

export interface QuestionReinterpretation {
  questionId: string;
  questionContent: string;
  journeyStage: string;
  originalMeasure: string;
  behaviorDescription: string;
  highScoreBehavior: string;
  lowScoreBehavior: string;
  valueNote: string;
  relatedDimensions: string[];
  interviewTheme: string;
  narrativeFocus: string;
}

export const QUESTION_REINTERPRETATIONS: QuestionReinterpretation[] = [
  {
    questionId: "Q1",
    questionContent: "我通常能够判断，一个应用或服务是否真正使用了AI",
    journeyStage: "初识",
    originalMeasure: "AI识别能力（素养化）",
    behaviorDescription: "技术信息寻求行为",
    highScoreBehavior: "查看产品说明、技术文档，关注技术实现",
    lowScoreBehavior: "通过使用体验判断，不关注技术细节",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["E-U"],
    interviewTheme: "如何判断AI是否真实存在",
    narrativeFocus: "从技术关注 vs 使用体验谈起",
  },
  {
    questionId: "Q2",
    questionContent: "我能在日常生活中注意到AI的应用（如推荐、导航、翻译等）",
    journeyStage: "初识",
    originalMeasure: "AI感知能力（素养化）",
    behaviorDescription: "日常觉察行为",
    highScoreBehavior: "主动发现生活中的AI应用",
    lowScoreBehavior: "被动接触AI，较少察觉",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["E-U"],
    interviewTheme: "AI如何进入日常生活",
    narrativeFocus: "从发现AI到习惯AI的过程",
  },
  {
    questionId: "Q3",
    questionContent: "我通常有明确的目标才使用AI（如解决问题、学习、创作）",
    journeyStage: "使用",
    originalMeasure: "目标导向使用（素养化）",
    behaviorDescription: "使用动机行为",
    highScoreBehavior: "有明确任务才使用AI",
    lowScoreBehavior: "随机探索AI功能",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["E-U", "F-R"],
    interviewTheme: "什么时候会想到用AI",
    narrativeFocus: "从具体任务看AI的角色",
  },
  {
    questionId: "Q4",
    questionContent: "面对同一个任务，我知道该选择哪个AI工具",
    journeyStage: "使用",
    originalMeasure: "工具选择能力（素养化）",
    behaviorDescription: "工具认知行为",
    highScoreBehavior: "了解多种AI工具，对比选择",
    lowScoreBehavior: "专注少数工具，不关注其他",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["E-U", "F-R"],
    interviewTheme: "如何选择AI工具",
    narrativeFocus: "从选择逻辑看工具观",
  },
  {
    questionId: "Q5",
    questionContent: "当AI没有理解我时，我会调整表达方式再试试",
    journeyStage: "使用",
    originalMeasure: "协作意愿（素养化）",
    behaviorDescription: "调试耐心行为",
    highScoreBehavior: "多次调整表达，与AI协作调试",
    lowScoreBehavior: "放弃尝试，转向人工完成",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["T-V", "F-R"],
    interviewTheme: "如何与AI协作调试",
    narrativeFocus: "从调试经验看人机互动",
  },
  {
    questionId: "Q6",
    questionContent: "我愿意尝试新的AI应用或功能，即使不确定它有什么用",
    journeyStage: "初识",
    originalMeasure: "学习能力（素养化）",
    behaviorDescription: "新技术接触行为",
    highScoreBehavior: "主动尝试新AI工具",
    lowScoreBehavior: "等待工具成熟后再使用",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["E-U", "F-R"],
    interviewTheme: "尝试新AI的意愿和经历",
    narrativeFocus: "从尝鲜经历看学习模式",
  },
  {
    questionId: "Q7",
    questionContent: "我会把复杂问题交给AI处理，而不是只让它做简单任务",
    journeyStage: "信任",
    originalMeasure: "复杂问题处理（素养化）",
    behaviorDescription: "任务分配行为",
    highScoreBehavior: "愿意把复杂任务交给AI",
    lowScoreBehavior: "倾向人工完成复杂任务",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["T-V"],
    interviewTheme: "什么任务交给AI、什么留给自己",
    narrativeFocus: "从任务分配看信任边界",
  },
  {
    questionId: "Q8",
    questionContent: "我会主动检查AI给出的结果是否靠谱",
    journeyStage: "信任",
    originalMeasure: "结果验证（素养化）",
    behaviorDescription: "验证行为",
    highScoreBehavior: "主动检查AI的结果",
    lowScoreBehavior: "直接接受AI的输出",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["T-V"],
    interviewTheme: "如何判断AI结果是否可信",
    narrativeFocus: "从验证经验看判断标准",
  },
  {
    questionId: "Q9",
    questionContent: "我知道哪些事情适合交给AI，哪些不适合",
    journeyStage: "信任",
    originalMeasure: "边界意识（素养化）",
    behaviorDescription: "适用性判断行为",
    highScoreBehavior: "明确知道AI的适用边界",
    lowScoreBehavior: "模糊感知AI的边界",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["T-V"],
    interviewTheme: "AI的能力边界在哪",
    narrativeFocus: "从边界判断看风险意识",
  },
  {
    questionId: "Q10",
    questionContent: "我关注AI技术对社会的影响（如就业、隐私、公平等）",
    journeyStage: "反思",
    originalMeasure: "社会影响考量（素养化）",
    behaviorDescription: "影响思考范围",
    highScoreBehavior: "考虑AI对社会的影响",
    lowScoreBehavior: "仅考虑AI对个人的影响",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["F-R"],
    interviewTheme: "AI对社会意味着什么",
    narrativeFocus: "从社会视角看AI影响",
  },
  {
    questionId: "Q11",
    questionContent: "我会注意保护个人数据和隐私，不随意向AI透露敏感信息",
    journeyStage: "反思",
    originalMeasure: "风险意识（素养化）",
    behaviorDescription: "隐私关注行为",
    highScoreBehavior: "主动关注AI的隐私风险",
    lowScoreBehavior: "较少关注隐私问题",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["F-R"],
    interviewTheme: "AI时代的隐私保护",
    narrativeFocus: "从隐私经验看安全意识",
  },
  {
    questionId: "Q12",
    questionContent: "我不会因为AI的回答看起来很专业就全盘相信",
    journeyStage: "信任",
    originalMeasure: "批判性思维（素养化）",
    behaviorDescription: "权威质疑行为",
    highScoreBehavior: "不盲从AI的专业外表",
    lowScoreBehavior: "容易被AI的专业外表说服",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["T-V"],
    interviewTheme: "如何保持对AI的质疑精神",
    narrativeFocus: "从质疑经历看独立思考",
  },
  {
    questionId: "Q13",
    questionContent: "我在使用AI过程中遇到困惑或挫折时能很好地应对",
    journeyStage: "反思",
    originalMeasure: "情绪调节（素养化）",
    behaviorDescription: "情绪应对行为",
    highScoreBehavior: "主动调整心态，适应AI",
    lowScoreBehavior: "被动感受情绪变化",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["F-R"],
    interviewTheme: "与AI相处中的情绪体验",
    narrativeFocus: "从挫折经验看适应能力",
  },
  {
    questionId: "Q14",
    questionContent: "我对'什么是AI'的理解在过去一年里发生过明显变化",
    journeyStage: "反思",
    originalMeasure: "概念理解变化（素养化）",
    behaviorDescription: "概念更新行为",
    highScoreBehavior: "快速调整对AI的认知",
    lowScoreBehavior: "缓慢变化，逐步理解",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["F-R"],
    interviewTheme: "对AI的理解如何随时间变化",
    narrativeFocus: "从认知变化看AI观的演进",
  },
  {
    questionId: "Q15",
    questionContent: "我有自己判断'该怎么用AI'的原则，不只是随大流",
    journeyStage: "反思",
    originalMeasure: "自主原则（素养化）",
    behaviorDescription: "原则使用行为",
    highScoreBehavior: "有明确的AI使用原则",
    lowScoreBehavior: "随性使用，无固定原则",
    valueNote: "两种行为模式都合理，无优劣之分",
    relatedDimensions: ["F-R"],
    interviewTheme: "AI使用的个人原则",
    narrativeFocus: "从原则形成看批判性自觉",
  },
];

// ============================================================================
// 查询辅助函数
// ============================================================================

/** 根据 typeCode 获取类型定义 */
export function getTypeDefV3(typeCode: string): TypeDefV3 | undefined {
  return TYPES_V3.find((t) => t.typeCode === typeCode);
}

/** 根据 dimension ID 获取维度定义 */
export function getDimensionDefV3(dimId: string): DimensionDefV3 | undefined {
  return DIMENSIONS_V3.find((d) => d.id === dimId);
}

/** 根据题目ID获取行为重释 */
export function getReinterpretation(questionId: string): QuestionReinterpretation | undefined {
  return QUESTION_REINTERPRETATIONS.find((q) => q.questionId === questionId);
}

/** 旧类型ID→新类型码映射表（向后兼容） */
export const LEGACY_TO_V3_TYPE_MAP: Record<string, string> = {
  ai_explorer: "ETF",
  ai_verifier: "ERF",
  ai_practitioner: "UTF",
  ai_collaborator: "UVF",
  ai_reflector: "ETR",
  ai_dependent_user: "ERR",
  ai_observer: "UTR",
  ai_balancer: "UVR",
};

/** 新类型码→旧类型ID反向映射 */
export const V3_TO_LEGACY_TYPE_MAP: Record<string, string> = {
  ETF: "ai_explorer",
  ERF: "ai_verifier",
  UTF: "ai_practitioner",
  UVF: "ai_collaborator",
  ETR: "ai_reflector",
  ERR: "ai_dependent_user",
  UTR: "ai_observer",
  UVR: "ai_balancer",
};

/**
 * 3位位置组合 → 反馈类型码映射表。
 *
 * 背景：反馈文件的8种类型码存在内部不一致——
 *   Verifier端在ERF/ERR中用"R"表示，在UVF/UVR中用"V"表示。
 *   此映射表将内部一致的3位位置组合（E/U, T/R, F/R）映射到反馈的类型码。
 *   例如：位置组合"URF"（U+R+F）映射到类型码"UVF"（反馈命名）。
 */
export const POSITION_TO_TYPE_CODE: Record<string, string> = {
  ETF: "ETF",
  ERF: "ERF",
  UTF: "UTF",
  URF: "UVF", // U+R+F → UVF（反馈中Verifier在此用V）
  ETR: "ETR",
  ERR: "ERR",
  UTR: "UTR",
  URR: "UVR", // U+R+R → UVR（反馈中Verifier在此用V）
};

/** 全局价值声明（在结果页/类型展示中始终可见） */
export const VALUE_STATEMENT = {
  noHierarchy: "每种协作风格都值得研究，无优劣之分",
  theoryInnovation:
    "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从'能力水平'到'协作风格'。这不是'谁更会用AI'的问题，而是'人与AI形成何种协作关系'的问题。",
};

/** 全局访谈者自由度提示 */
export const INTERVIEWER_FREEDOM_NOTE = {
  title: "使用提示",
  body: "这是访谈辅助工具，不是固定脚本。",
  points: [
    "用你的语言习惯",
    "根据受访者回答调整",
    "可以跳过、改写、忽略建议",
    "你主导访谈，AI只是辅助",
  ],
};
