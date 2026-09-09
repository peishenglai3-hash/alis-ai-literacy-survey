// 故事化引导库（v2.2 访谈引擎——724反馈去术语化版）。
// 来源：C:\Users\35636\Downloads\724反馈\访谈者引导清晰化设计_极简版.md
//
// 核心理念（v2.2 更新）：
//   ❌ 旧：术语化三层（叙事起点/深化方向/反思引导）+ 冗长元信息
//   ✅ 新：去术语化三步递进（让TA讲故事 → 让TA讲经验 → 让TA反思）
//       每步只保留"为什么"，去掉学术化连接说明和预期收获列表
//
// v2.2 变更摘要：
//   - layerName 术语化标签 → stepLabel 口语化标签
//   - connectionToAnswer + expectedOutcome → 移除（学术冗余）
//   - whyItWorks 保留并简化为"为什么这样问"
//   - 新增 optionalFollowUps（可选追问，标注"可选"）
//   - layers → steps

// ============================================================================
// 类型定义（v2.2 简化版）
// ============================================================================

export interface StoryGuidanceStep {
  /** 步骤序号（1/2/3） */
  stepNumber: number;
  /** 步骤标签（去术语化：让TA讲具体故事 / 让TA讲具体经验 / 让TA反思判断标准） */
  stepLabel: string;
  /** 步骤 emoji */
  stepEmoji: string;
  /** 引导文本（口语化——访谈者可以直接使用的语言） */
  guidanceText: string;
  /** 为什么这样问（一句话说明设计意图） */
  whyItWorks: string;
  /** 额外追问（可选——标注"可选"） */
  optionalFollowUps?: string[];
}

export interface TypePerspective {
  /** 适用风格 ID */
  styleId: string;
  /** 类型视角引导文本 */
  guidanceText: string;
  /** 与类型特征的连接 */
  connection: string;
}

export interface StoryGuidance {
  /** 题目 ID（Q1-Q15） */
  questionId: string;
  /** 题目原文 */
  questionText: string;
  /** 分数条件 */
  scoreCondition: "high" | "low";
  /** 分数含义解释 */
  scoreMeaning: (score: number) => string;
  /** 三步递进的引导（2-3 步） */
  steps: StoryGuidanceStep[];
  /** 类型视角引导（可选——针对特定风格的第二视角） */
  typePerspectives?: TypePerspective[];
}

// ============================================================================
// 完整故事化引导库（15 题 × high/low = 30 组，v2.2 去术语化版）
// ============================================================================

export const STORY_GUIDANCE_LIBRARY: StoryGuidance[] = [
  // =========================================================================
  // 阶段 1：初识 — Q1（AI识别能力）
  // =========================================================================
  {
    questionId: "Q1",
    questionText: "我通常能够判断，一个应用或服务是否真正使用了AI，而不仅仅是在宣传中提到AI。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者在日常生活中能够清晰地分辨AI应用，有较强的AI识别能力。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你什么时候开始注意到AI的存在？是某个具体的产品、新闻，还是别人的推荐？",
        whyItWorks:
          "从时间点切入，帮助受访者回忆具体事件。问题开放但不抽象——每个人都有'第一次接触'的时刻，故事自然从起点开始。",
        optionalFollowUps: [
          "那时候你对AI的第一印象是什么？觉得厉害、好奇、还是没什么感觉？",
        ],
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "第一次意识到'这个应用用了AI'时的情景是什么？那个瞬间让你对AI有了什么具体的印象？",
        whyItWorks:
          "从'什么时候'转向'什么情景'，帮受访者从抽象认知过渡到具体体验。场景化的回忆比时间线回忆更鲜活、细节更丰富。",
        optionalFollowUps: [
          "后来有没有遇到过'以为是AI但其实不是'的情况？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "现在回看，你当时对AI的判断准确吗？有没有过判断错的时候？你现在靠什么来判断'这是真AI'？",
        whyItWorks:
          "从过去的故事转向当下的反思——帮受访者自己发现认知的成长。'判断错的时候'让受访者承认不确定性，获得更真实的回答。",
      },
    ],
    typePerspectives: [
      {
        styleId: "ai_explorer",
        guidanceText:
          "从探索者的角度看，你对AI的识别很有经验。这种'敏感度'从哪里来？是天生的好奇心，还是后天培养的？",
        connection:
          "Q1高分符合探索者特征：倾向于主动识别和探索AI应用。",
      },
    ],
  },
  {
    questionId: "Q1",
    questionText: "我通常能够判断，一个应用或服务是否真正使用了AI，而不仅仅是在宣传中提到AI。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者对AI应用的识别不太清晰，可能难以区分'真AI'和'宣传AI'。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你什么时候第一次意识到AI的存在？那时候你对AI是什么印象？",
        whyItWorks:
          "从更模糊的起点切入，降低回答门槛——受访者可能没有明确的'第一次'概念，但从印象切入更容易开口。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "在判断'这个应用是不是用了AI'的时候，你通常会有哪些困惑？能不能举一个你拿不准的例子？",
        whyItWorks:
          "帮受访者把'模糊'变成具体的困惑点。举例子让抽象的'分不清'变得可讨论，也帮访谈者了解受访者的判断盲区。",
        optionalFollowUps: [
          "你觉得区分'真AI'和'宣传AI'难在哪里？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "如果让你想一个最简单的办法来判断'这是不是AI'——你会想到什么？",
        whyItWorks:
          "从困惑转向解决——即使受访者觉得自己分不清，也一定有某种直觉判断。帮受访者发现自己的隐性判断标准。",
      },
    ],
  },

  // =========================================================================
  // 阶段 1：初识 — Q2（AI日常感知）
  // =========================================================================
  {
    questionId: "Q2",
    questionText: "我发现，自己已经越来越容易注意到生活中哪些地方正在使用AI。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者对AI的日常感知越来越敏锐，AI认知在持续增长。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "这种'越来越注意到'是从什么时候开始的？有没有一件具体的事让你突然意识到'原来AI已经这么多了'？",
        whyItWorks:
          "从变化感切入——'越来越'暗示了一个过程，引导受访者回溯这个过程的起点和关键转折点。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "最近一次让你意外地发现'这里居然也有AI'是什么时候？那个场景是什么样的？",
        whyItWorks:
          "'意外发现'本身就是一个故事——有场景、有预期、有反差。受访者容易回忆起这些'原来这也是AI'的瞬间。",
        optionalFollowUps: [
          "你觉得AI已经渗透到你生活的哪些角落了？有没有让你意外的领域？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "现在回看，你觉得'注意到AI'这件事改变了你什么？是让你更安心了，还是更警惕了？",
        whyItWorks:
          "从'看到了什么'转向'看到了之后怎么样了'，探索AI感知对受访者的实际影响和心理变化。",
      },
    ],
  },
  {
    questionId: "Q2",
    questionText: "我发现，自己已经越来越容易注意到生活中哪些地方正在使用AI。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者对AI的日常感知不太敏感，或觉得没有明显变化。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "是平时没有太留意AI的存在，还是觉得分不太清楚哪些是AI、哪些不是？",
        whyItWorks:
          "给受访者两个选项——'没留意'和'分不清'——降低表达'我不知道'的压力。两种情况的访谈方向完全不同。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你平时用的手机、电脑或APP里，有没有哪一个功能让你觉得'这背后可能用了AI'？",
        whyItWorks:
          "从受访者熟悉的日常工具切入，比直接问'你注意到AI吗'更容易激活记忆。即使感知模糊，也能找到一些具体线索。",
        optionalFollowUps: [
          "如果有的话，那个功能让你感觉怎么样？好用吗？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 1：初识 — Q6（AI学习能力）
  // =========================================================================
  {
    questionId: "Q6",
    questionText: "学习新的AI工具，对我来说通常是一件比较容易的事情。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者学习新AI工具的能力较强，上手速度快。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "上一个你自学上手的新AI工具是什么？你是怎么摸熟它的？有没有什么'学习套路'？",
        whyItWorks:
          "从最近的具体学习案例切入，受访者容易回忆。'怎么摸熟的'让受访者展示学习策略，而非抽象地回答'我学习能力强'。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "学习那个工具的过程中，有没有哪个功能让你卡住过？你是怎么解决的？",
        whyItWorks:
          "从成功故事转向困难时刻——学习能力强不代表一帆风顺，了解受访者如何克服困难能揭示更真实的学习策略。",
        optionalFollowUps: [
          "跟别人相比，你觉得你学新工具快在哪里？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得这种'容易上手'的能力是从哪来的？是经常接触新技术，还是你有一套自己的学习方法？",
        whyItWorks:
          "从能力表现转向能力来源——帮受访者反思自己为什么擅长学习AI工具，揭示背后的学习哲学。",
      },
    ],
  },
  {
    questionId: "Q6",
    questionText: "学习新的AI工具，对我来说通常是一件比较容易的事情。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者觉得学习新AI工具有难度。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你觉得学习新AI工具难在哪里——是界面不好懂、概念不理解，还是不知道从何学起？",
        whyItWorks:
          "三个选项覆盖了学习障碍的主要类型（界面/概念/入口），受访者容易定位自己的困难所在。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "上次你尝试学一个新工具但最后放弃了的经历——当时卡在哪一步了？",
        whyItWorks:
          "从具体失败案例切入比抽象讨论'为什么难'更有叙事张力，帮助访谈者了解受访者的学习断点。",
        optionalFollowUps: [
          "如果有人帮你一把，你觉得在哪个环节最需要帮助？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 2：使用 — Q3（AI目标导向使用）
  // =========================================================================
  {
    questionId: "Q3",
    questionText: "我通常能够利用AI帮助自己完成真正想完成的事情，而不仅仅是尝试新功能。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者经常使用AI并完成真实任务，AI使用具有目标导向性。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "能分享一个你用AI完成事情的具体例子吗？那是什么任务？AI具体怎么帮到你的？",
        whyItWorks:
          "从具体例子切入，受访者容易回忆。'什么任务'和'怎么帮'两个维度帮受访者把笼统的'我用了AI'变成具体的故事。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "在这个过程中，有没有哪个时刻让你觉得'AI真的帮到我了'？或者反过来——'AI还是不够懂'？",
        whyItWorks:
          "从'做了什么'转向'感觉如何'，把效率和体验两个维度分开。两个方向让受访者选择最有感触的方向展开。",
        optionalFollowUps: [
          "你觉得AI最擅长帮你做什么类型的事？最不擅长什么？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "如果用一句话总结'AI对你来说最有用的是什么'，你会怎么说？",
        whyItWorks:
          "从具体例子上升到整体评价——建立在前面具体例子的基础上，概括性问题变得容易回答。帮受访者提炼自己的使用哲学。",
      },
    ],
    typePerspectives: [
      {
        styleId: "ai_practitioner",
        guidanceText:
          "作为实践家，你使用AI时通常目标很明确。这种'目标导向'的习惯是怎么养成的？是某个任务让你意识到'AI能真做事'，还是你本来就是这样的人？",
        connection:
          "Q3高分符合实践家特征：将AI作为高效工具服务于真实目标。",
      },
    ],
  },
  {
    questionId: "Q3",
    questionText: "我通常能够利用AI帮助自己完成真正想完成的事情，而不仅仅是尝试新功能。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者使用AI更多停留在尝试阶段，尚未将AI有效接入真实任务。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你用过AI吗？最近一次用AI是在什么场景下？那时候你本来想做什么？",
        whyItWorks:
          "从具体使用场景切入而不是直接问'为什么没深入使用'——先确认受访者确实用过AI，再探索停留在试用阶段的原因。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你觉得更多停留在'试用功能'阶段吗？卡在哪一步让你没能把AI接入真实任务——是不知道怎么用，还是觉得没必要？",
        whyItWorks:
          "区分'能力障碍'和'态度障碍'——两种障碍对应的访谈方向完全不同。给出选项降低'承认自己不行'的压力。",
        optionalFollowUps: [
          "有没有什么事你想用AI来做，但不知道怎么开始？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 2：使用 — Q4（AI工具选择）
  // =========================================================================
  {
    questionId: "Q4",
    questionText: "面对同一个任务，我通常知道应该选择哪一种AI工具，而不是随便使用一个。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者在多个AI工具之间有清晰的选择标准和切换策略。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "举个例子，面对同一个任务，你会怎么在两个AI工具之间做取舍？有没有什么'选工具'的个人原则？",
        whyItWorks:
          "具体的'选工具'场景让受访者展示判断逻辑——不是抽象地说'我会选'，而是'面对这个任务我选A不选B因为...'。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "有没有过'选错了工具'的经历？那次之后你学到了什么？有没有改变你的选择策略？",
        whyItWorks:
          "'选错了'的故事比'选对了'更有张力——有预期、有挫败、有反思，更能揭示受访者的学习过程。",
        optionalFollowUps: [
          "你现在常用的AI工具有几个？它们分别负责什么？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得一个人需要懂多少技术，才能做出好的'选工具'判断？你自己的判断靠的是什么？",
        whyItWorks:
          "从工具选择上升到判断力来源——帮受访者反思自己的选择标准是建立在技术理解、使用经验还是他人推荐之上。",
      },
    ],
  },
  {
    questionId: "Q4",
    questionText: "面对同一个任务，我通常知道应该选择哪一种AI工具，而不是随便使用一个。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者对AI工具的了解有限，选择时更多是随手使用或缺乏判断依据。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你平时用AI的时候，一般是随手打开你常用的那个，还是不太清楚有哪些选项？",
        whyItWorks:
          "区分'习惯性使用'和'选项不足'——前者说明受访者有稳定的使用模式但缺乏比较意识，后者说明对AI工具的认知本身有限。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你常用的那个AI工具——你是怎么知道它的？有没有试过其他的但觉得不好用？",
        whyItWorks:
          "从使用历史切入——即使受访者现在只用一种工具，了解他们如何发现和选择这个工具能揭示信息获取渠道和决策模式。",
      },
    ],
  },

  // =========================================================================
  // 阶段 2：使用 — Q5（AI协作磨合）
  // =========================================================================
  {
    questionId: "Q5",
    questionText: "当AI没有理解我的意思时，我通常会尝试调整表达，而不是马上放弃。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者有较高的AI协作意愿，愿意在AI不理解时调整自己的表达方式。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "能分享一个具体的例子吗？某次AI完全不理解你想说什么，你是怎么一步步调整表达、最后让它懂的？",
        whyItWorks:
          "从具体协作场景切入——'AI没理解→你调整→最终成功'是一个完整的迷你故事，有冲突有解决，受访者容易回忆。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "在调整表达的过程中，你觉得'这是我的问题'还是'这是AI的问题'？这种看法有没有影响你的耐心？",
        whyItWorks:
          "从'做了什么'转向'怎么想的'——责任归因揭示了受访者对'人机关系'的基本立场：是迁就AI还是调教AI。",
        optionalFollowUps: [
          "有没有怎么调整都没用、最后只能放弃的经历？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得跟AI沟通，和跟人沟通有什么不一样？你调整自己表达的时候，用的是跟人沟通的经验，还是专门为AI发展出来的方法？",
        whyItWorks:
          "从AI协作上升到人机沟通的比较——帮受访者意识到自己在发展一套独特的'AI沟通策略'。",
      },
    ],
    typePerspectives: [
      {
        styleId: "ai_collaborator",
        guidanceText:
          "作为协作者，你反复调整表达直到AI理解——能不能回忆一次让你印象深刻的'磨合'经历？那次经历让你学到了什么？",
        connection:
          "Q5高分符合协作者特征：视AI为思维伙伴、愿意在互动中磨合。",
      },
    ],
  },
  {
    questionId: "Q5",
    questionText: "当AI没有理解我的意思时，我通常会尝试调整表达，而不是马上放弃。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者在AI不理解时更容易放弃，协作意愿相对较低。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "当AI没理解你的意思时，你是更倾向于换个办法（比如换个工具、换个人问），还是干脆放弃？",
        whyItWorks:
          "区分'放弃AI但换别的方式'和'彻底放弃任务'——前者的替代策略本身就是一种问题解决，后者则需要探索放弃的深层原因。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "有没有一次你跟AI沟通失败的经历，让你觉得'算了不跟它较劲了'？当时是什么情况？",
        whyItWorks:
          "从具体挫败经历切入——了解受访者在什么情况下会放弃AI，以及放弃的阈值在哪里。",
        optionalFollowUps: [
          "你有没有觉得AI'应该'能理解你，但它就是理解不了的时候？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 3：信任 — Q7（复杂问题信任）
  // =========================================================================
  {
    questionId: "Q7",
    questionText: "即使遇到比较复杂的问题，我也能够逐步利用AI帮助自己找到解决办法。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者对AI有较高信任度，愿意将复杂问题交给AI逐步解决。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你第一次愿意把重要或复杂的事情交给AI处理的情景是什么？那是什么任务？当时有没有犹豫？",
        whyItWorks:
          "从'第一次'切入——每个人对AI的信任都有起点，那个起点往往是一个具体事件。'有没有犹豫'让受访者承认信任建立过程中的不确定性。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "在那个过程中，你如何判断'这个事情可以交给AI'？有没有什么信号让你觉得'可以了'或者'还不行'？",
        whyItWorks:
          "把'信任'从模糊态度变成可讨论的判断标准——受访者可以描述自己的'信任信号'（回答具体、引用来源、逻辑自洽等）。",
        optionalFollowUps: [
          "有没有过'这次信了但被坑了'的经历？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "现在回看，你觉得你对AI的信任是建立在什么基础上的？是经验验证、理论理解、还是某种直觉？这个基础稳不稳？",
        whyItWorks:
          "从'你信任AI吗'转向'你的信任建立在什么之上'——受访者可能第一次有意识地审视自己的信任基础。",
      },
    ],
  },
  {
    questionId: "Q7",
    questionText: "即使遇到比较复杂的问题，我也能够逐步利用AI帮助自己找到解决办法。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者在面对复杂问题时不太会借助AI，或觉得AI无法处理复杂问题。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "面对比较复杂的问题时，你一般怎么解决？有没有试过用AI帮忙？",
        whyItWorks:
          "先问'你怎么解决的'再问'为什么不用AI'——避免直接追问'为什么不信任AI'带来的防御感。受访者可以先描述自己熟悉的问题解决方式。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "如果没试过用AI——是什么让你觉得'AI搞不定这个'？是之前试过但失败了，还是觉得AI的能力就到这儿？",
        whyItWorks:
          "区分'有失败经验'和'预判不可行'——前者是经验判断，后者可能是偏见或信息不足。两种情况的引导方向完全不同。",
        optionalFollowUps: [
          "你觉得AI需要做到什么程度，你才会愿意把复杂问题交给它？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 3：信任 — Q8（AI输出判断）
  // =========================================================================
  {
    questionId: "Q8",
    questionText: "面对AI给出的回答，我通常能够判断它什么时候值得相信，什么时候需要进一步确认。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者对AI输出有自己的信任判断标准，审辨意识较强。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你靠什么信号来决定'这条回答得再核实一下'？能不能举一个你最近'不放心所以查了一下'的例子？",
        whyItWorks:
          "把'审辨能力'具象化为'什么信号让你警惕'——受访者可以分享具体的信号（太绝对、没来源、逻辑不通等），让访谈者看到审辨思维过程。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "有没有被AI'坑过'的经历——它说得特别肯定但其实是错的？那次之后你改变了什么？",
        whyItWorks:
          "'被坑过'的故事有天然的叙事张力——有信任、有背叛、有反思。最能揭示受访者的审辨能力来源。",
        optionalFollowUps: [
          "你现在是更信任AI了还是更不信任了？为什么？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得'不轻信AI'是一种需要学习的能力，还是每个人迟早会自然获得的经验？你自己属于哪一种？",
        whyItWorks:
          "从个人经验上升到对审辨能力本质的思考——帮受访者反思自己的审辨能力是主动培养的还是被动获得的。",
      },
    ],
    typePerspectives: [
      {
        styleId: "ai_verifier",
        guidanceText:
          "作为验证者，你靠什么信号来判断'这条回答得再核实一下'？你的验证策略是怎么建立起来的——是某次经历'教'出来的吗？",
        connection:
          "Q8高分符合验证者特征：对AI输出保持审辨态度。",
      },
    ],
  },
  {
    questionId: "Q8",
    questionText: "面对AI给出的回答，我通常能够判断它什么时候值得相信，什么时候需要进一步确认。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者对AI输出缺乏判断标准，更多时候是默认信任或被动接受。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "看AI给出的回答时，你一般会怎么做？是大致看一下觉得差不多就用了，还是想判断但不知道从哪里入手？",
        whyItWorks:
          "两个选项把'不判断'分为主动和被动——前者反映使用态度，后者反映能力缺口。引导方向完全不同。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "有没有哪次你用了AI的回答，但后来发现不太对？那次之后你有没有想过'下次得注意'？",
        whyItWorks:
          "从'吃过亏'的经历切入——即使受访者平时不主动判断，也可能有过被AI误导的体验。这种经历是培养审辨意识的契机。",
        optionalFollowUps: [
          "如果AI回答得特别肯定、看起来很专业，你会更容易相信吗？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 3：信任 — Q9（AI能力边界判断）
  // =========================================================================
  {
    questionId: "Q9",
    questionText: "我通常能够判断，哪些任务适合交给AI完成，哪些最好由自己完成。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者对AI能力边界有清晰的认知，能合理划分人机分工。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "有没有一类事你坚持自己做、绝不交给AI？为什么这件事对你来说必须自己做？",
        whyItWorks:
          "从'拒绝AI'切入——拒绝背后有强烈的理由（价值判断、质量要求、个人意义等），这些理由比'为什么用AI'更容易激起深层叙述。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "这条'什么交给AI、什么留给自己'的界线，对你来说是清晰的还是模糊的？有没有碰到过不好判断的情况？",
        whyItWorks:
          "从边界内容转向边界的清晰度和稳定性——让受访者反思自己的判断是否总是可靠的，边界是否经历过调整。",
        optionalFollowUps: [
          "有没有过'以为AI能搞定但发现不行'的经历？反过来呢？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得一个人需要用过多少次AI，才能形成这种'什么该交给AI'的判断力？你的判断力是怎么来的？",
        whyItWorks:
          "从当前判断力上升到判断力的形成过程——帮受访者反思自己是靠经验积累还是靠某种原则来判断AI能力边界。",
      },
    ],
  },
  {
    questionId: "Q9",
    questionText: "我通常能够判断，哪些任务适合交给AI完成，哪些最好由自己完成。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者对AI能力边界缺乏清晰的认知，不太确定什么该交给AI。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你觉得'什么该交给AI、什么不该'这条界线对你来说模糊在哪里？有没有过交给了AI但后来发现'还是得自己做'的经历？",
        whyItWorks:
          "从具体经历切入——'交给AI但后悔了'的故事比抽象讨论边界更容易引出真实感受。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你一般是怎么决定'这个用AI、这个不用'的？是凭感觉，还是有某种判断——比如'简单的事用AI，重要的事自己来'？",
        whyItWorks:
          "帮受访者发现自己可能已经有隐性的判断规则——即使他们觉得'不清楚'，行为中可能已经形成了某种模式。",
      },
    ],
  },

  // =========================================================================
  // 阶段 3：信任 — Q12（抵抗AI说服性权威）
  // =========================================================================
  {
    questionId: "Q12",
    questionText: "即使AI回答得非常肯定，我也不会只因为它看起来\"很专业\"就完全相信它。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者对AI的'说服性权威'有抵抗力，不会因为AI语气笃定就全盘接受。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "有没有遇到过AI回答得特别肯定、特别专业，但你总觉得'哪里不对'的经历？后来发现你的直觉是对的还是错的？",
        whyItWorks:
          "从'觉得不对→查证→结果'的完整故事切入——有悬念（直觉对了吗？）、有反思（为什么会产生怀疑？），形成紧凑的叙事结构。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "这种'不轻易相信'的态度是从哪里来的？是天生性格，还是被'坑过'之后学会的？",
        whyItWorks:
          "从质疑行为转向质疑态度的来源——审辨思维不是天生的，了解其形成过程有助于理解受访者的AI素养发展路径。",
        optionalFollowUps: [
          "你觉得'保持怀疑'和'保持开放'之间怎么平衡？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得AI的'专业语气'是一种帮助（让回答更容易理解），还是一种误导（让错误看起来更可信）？你自己有没有被误导过的经历？",
        whyItWorks:
          "从个人经验上升到对AI设计伦理的思考——帮受访者意识到'专业语气'本身就是一个值得批判审视的AI特征。",
      },
    ],
  },
  {
    questionId: "Q12",
    questionText: "即使AI回答得非常肯定，我也不会只因为它看起来\"很专业\"就完全相信它。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者更容易被AI的专业语气说服，审辨意识相对较弱。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "如果AI回答得语气非常笃定、看起来很专业，你会更容易相信吗？有没有哪次AI特别让你觉得'它说得对'？",
        whyItWorks:
          "避免评判性的'为什么你那么容易被说服'，转为探索性的'AI的什么让你觉得可信'——让受访者从自己的视角描述AI的说服力来源。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "后来有没有发现那次'说得对'其实不太对？或者你到现在还觉得它说得挺对的？",
        whyItWorks:
          "从具体的'信以为真'经历切入——让受访者回看自己的信任判断，可能发现自己曾经轻信过，也可能坚持认为判断合理。两种情况都提供有价值的反思材料。",
      },
    ],
  },

  // =========================================================================
  // 阶段 4：反思 — Q10（AI社会影响意识）
  // =========================================================================
  {
    questionId: "Q10",
    questionText: "使用AI时，我会考虑它可能对其他人、组织或社会产生什么影响。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者在AI使用中具有社会意识，关注AI对社会和他人的影响。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "有没有一次你因为顾虑AI对社会或他人的影响，而改变了使用方式的经历？当时你在顾虑什么？",
        whyItWorks:
          "从行为改变切入——'因为顾虑而改变使用方式'比'我关心社会影响'更有叙事张力。行为改变揭示了顾虑的强度和优先级。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你觉得'关注AI社会影响'是一种责任，还是一种负担？为什么？",
        whyItWorks:
          "从'你做什么'转向'你觉得这是什么'——同样是关注社会影响，有人觉得是道德责任，有人觉得是多此一举。揭示了受访者的伦理框架。",
        optionalFollowUps: [
          "你觉得AI对社会最大的影响是什么？最让你担心的是什么？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "如果让你来定一条'AI使用的基本规则'，所有人都应该遵守——你会定什么？为什么是这一条？",
        whyItWorks:
          "从个人顾虑上升到规则制定——帮受访者把自己的伦理直觉外化为可讨论的规则。这个问题既开放又有约束，容易引出深层价值观。",
      },
    ],
  },
  {
    questionId: "Q10",
    questionText: "使用AI时，我会考虑它可能对其他人、组织或社会产生什么影响。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者在使用AI时较少考虑社会影响，更关注个人使用体验。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "是平时没想过AI的社会影响，还是觉得这些事情离自己太远了？",
        whyItWorks:
          "两个选项把'不关注'分为不同类型——前者是信息暴露问题，后者是价值优先级问题。访谈路径完全不同。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你有没有看到过关于AI引起社会问题的新闻或讨论——比如AI换脸、AI假新闻、AI取代工作？你对这些有什么感觉？",
        whyItWorks:
          "从具体社会议题切入——即使受访者说'没想过'，提到具体新闻时往往能激活一些看法。帮受访者发现自己的社会意识可能比想象中多。",
        optionalFollowUps: [
          "你觉得这些问题跟你有关系吗？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 4：反思 — Q11（隐私安全意识）
  // =========================================================================
  {
    questionId: "Q11",
    questionText: "使用AI时，我通常会留意隐私、安全或数据使用方面的问题。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者在AI使用中有隐私安全意识，会留意数据保护和隐私风险。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你具体会做什么来保护自己的隐私或数据安全？这些做法是怎么形成的——是看了新闻、别人的提醒，还是吃过亏之后的改变？",
        whyItWorks:
          "从'怎么做'切入而非'为什么关心'——具体的隐私保护行为更容易描述，也让访谈者了解受访者的隐私素养水平。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "有没有过因为隐私顾虑而放弃使用某个AI工具的经历？当时你顾虑的是什么？",
        whyItWorks:
          "从'放弃使用'的行为切入——放弃比使用更能体现隐私在受访者价值体系中的权重。",
        optionalFollowUps: [
          "你觉得'隐私'在AI时代还意味着什么？跟以前有什么不同？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得在隐私问题上，AI公司应该承担多少责任，用户自己应该承担多少？你信任AI公司会保护好你的数据吗？",
        whyItWorks:
          "从个人实践上升到责任分配——帮受访者反思自己对AI隐私治理的立场，以及这种立场背后的信任假设。",
      },
    ],
  },
  {
    questionId: "Q11",
    questionText: "使用AI时，我通常会留意隐私、安全或数据使用方面的问题。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者在AI使用中对隐私和数据安全的关注较少。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "是不太担心隐私问题，还是不知道该注意什么？",
        whyItWorks:
          "两个选项帮受访者定位自己的状态——'不担心'可能是有意选择（隐私换便利），'不知道'则是能力缺口。两种访谈路径完全不同。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你有没有听说过别人因为AI泄露隐私而遇到麻烦的事？或者你自己有没有'不太想被AI知道'的信息？",
        whyItWorks:
          "从他人经历或个人敏感信息切入——即使受访者不主动关注隐私，也能通过这些具体问题发现自己其实有一定的隐私边界意识。",
      },
    ],
  },

  // =========================================================================
  // 阶段 4：反思 — Q13（AI情绪影响）——v2.2 新增引导
  // =========================================================================
  {
    questionId: "Q13",
    questionText: "当AI让我感到困惑、焦虑或挫败时，我通常能够调整自己的做法，而不是完全依赖或放弃AI。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者感受到AI对自身情绪或心态的明显影响。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "能具体讲讲最近一次因为AI感到焦虑或兴奋的经历吗？当时是什么情况？",
        whyItWorks:
          "从具体情绪经历切入——'焦虑或兴奋'给出两个方向，受访者可以选最有感触的方向展开。具体场景比抽象讨论'AI影响情绪'更容易叙述。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "这种情绪是短暂的还是持续的？你有没有注意到自己因为AI改变了某些习惯或者想法？",
        whyItWorks:
          "从单次情绪转向持续性影响——帮受访者区分'偶尔的情绪反应'和'持续的心态变化'，后者更能体现AI对个人的深层影响。",
        optionalFollowUps: [
          "你觉得AI对你的影响，跟社交媒体对你的影响有什么不同？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得被AI影响情绪是好事还是坏事？或者说——在什么情况下是好事，什么情况下是坏事？",
        whyItWorks:
          "从情绪体验上升到价值判断——帮受访者反思自己对'AI影响人'这件事的立场，以及这种立场背后的标准是什么。",
      },
    ],
  },
  {
    questionId: "Q13",
    questionText: "当AI让我感到困惑、焦虑或挫败时，我通常能够调整自己的做法，而不是完全依赖或放弃AI。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者不认为AI对自己的情绪或心态有明显影响。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "是觉得AI对情绪的影响不明显，还是平时没特别注意过这种影响？",
        whyItWorks:
          "区分'确实没影响'和'没注意过'——前者说明受访者与AI的情感距离较远，后者可能只是缺乏反思习惯。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你有没有过这样的经历：AI做出来的东西让你觉得'哇好厉害'，或者AI的回答让你觉得'这也太蠢了'？那种时候你心里是什么感觉？",
        whyItWorks:
          "从具体的使用体验切入——即使受访者认为没有整体影响，具体的使用瞬间仍然可能有情绪反应。帮受访者发现那些被忽略的微小情绪。",
        optionalFollowUps: [
          "如果有一天AI突然从你的生活中消失了，你会有什么感觉？",
        ],
      },
    ],
  },

  // =========================================================================
  // 阶段 4：反思 — Q14（AI理解变化）
  // =========================================================================
  {
    questionId: "Q14",
    questionText: "过去一年，我对\"什么是AI\"的理解发生过明显变化。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者对AI的理解经历了显著的变化，具有较强的反思意识和认知成长。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "变化之前和变化之后，你分别是怎么看AI的？什么事推动了这种转变？",
        whyItWorks:
          "从'之前/之后'的对比结构切入——受访者不需要一次性描述变化，而是先讲'以前怎么想的'再讲'现在怎么想的'。两个时间点的描述都比描述变化本身容易。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你觉得这种变化是'更了解AI了'还是'对AI的理解更深了'？这两者对你来说有什么不同？",
        whyItWorks:
          "区分'知识积累'和'理解深化'——前者是量的变化（知道了更多AI产品），后者是质的变化（认知框架变了）。这种区分让受访者更精准地描述自己的成长。",
        optionalFollowUps: [
          "现在回看一年前的自己，你觉得那时候对AI的理解有什么'幼稚'的地方吗？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "你觉得这种理解的变化会继续下去吗？你预期一年后的自己会怎么看现在的AI理解？",
        whyItWorks:
          "从过去的变化延伸到未来的变化预期——帮受访者意识到自己对AI的理解不是一个终点，而是一个持续演进的过程。",
      },
    ],
    typePerspectives: [
      {
        styleId: "ai_reflector",
        guidanceText:
          "作为反思者，你能清晰感知到对AI理解的变化。这种'变化感'本身——你注意到自己在变化——是怎么形成的？是某次对话、某篇文字，还是使用中的某个时刻让你开始回看自己？",
        connection:
          "Q14高分符合反思者特征：能清晰感知并表述自己对AI理解的变化历程。",
      },
    ],
  },
  {
    questionId: "Q14",
    questionText: "过去一年，我对\"什么是AI\"的理解发生过明显变化。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者对AI的理解相对稳定，没有感受到明显的变化。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "是理解一直比较稳定，还是没太回想过这个问题？如果让你想一下——你对AI的理解和一年前一样吗？",
        whyItWorks:
          "区分'稳定'和'没想过'——前者是一种认知状态，后者是反思习惯的缺失。可能有变化但受访者自己没有注意到。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "一年前AI跟现在有什么不同？比如ChatGPT刚出来的时候和现在——你觉得外界对AI的讨论变了吗？这些变化有没有影响你？",
        whyItWorks:
          "从外部变化切入——即使受访者觉得自己的理解没变，外部世界的变化是客观的。帮受访者发现自己可能在不知不觉中已经受到了影响。",
      },
    ],
  },

  // =========================================================================
  // 阶段 4：反思 — Q15（AI使用原则形成）
  // =========================================================================
  {
    questionId: "Q15",
    questionText: "我已经形成了一套属于自己的AI使用原则，而不仅仅依赖别人告诉我怎么用。",
    scoreCondition: "high",
    scoreMeaning: (s) =>
      `受访者选了${s}分（同意），表示受访者已经形成了基于个人实践的AI使用原则，具有理论自觉。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "你的AI使用原则里，最重要的一条是什么？这条原则是怎么形成的——是某次经历'教'出来的，还是长期积累下来的？",
        whyItWorks:
          "从'最重要的一条'切入——让受访者先做减法（选最重要的），再做加法（展开讲怎么来的）。降低了'说说你的原则'这种开放式问题的负担。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "这些原则在什么情况下会动摇？你有没有遇到过'原则说不要用，但实际情况让你想用'的时刻？",
        whyItWorks:
          "从原则内容转向原则的稳定性——再强的原则也有被动摇的时刻，那些时刻最能揭示原则的真正基础和边界。",
        optionalFollowUps: [
          "有没有你打破自己原则之后觉得'其实也没什么'的经历？",
        ],
      },
      {
        stepNumber: 3,
        stepLabel: "让TA反思判断标准",
        stepEmoji: "🧩",
        guidanceText:
          "这些原则是你'关于AI的原则'，还是已经变成了你'作为一个人的原则'的一部分？AI有没有改变你对自己的看法？",
        whyItWorks:
          "从AI使用原则上升到自我认知——当AI使用原则已融入个人身份，AI的影响就不仅停留在工具层面，而是进入存在层面。这是整个访谈旅程的收束点。",
      },
    ],
  },
  {
    questionId: "Q15",
    questionText: "我已经形成了一套属于自己的AI使用原则，而不仅仅依赖别人告诉我怎么用。",
    scoreCondition: "low",
    scoreMeaning: (s) =>
      `受访者选了${s}分（不同意），表示受访者尚未形成自己的AI使用原则，更多是跟随他人的使用方式。`,
    steps: [
      {
        stepNumber: 1,
        stepLabel: "让TA讲具体故事",
        stepEmoji: "📖",
        guidanceText:
          "目前你更多是跟着别人的用法走，还是在慢慢摸索自己的方式？有没有哪次你意识到'别人这么用，但我不太同意'？",
        whyItWorks:
          "区分'完全跟随'和'半摸索半跟随'——后者已具备原则的萌芽，需要访谈者帮助发掘和命名。'不太同意别人'的时刻就是原则萌芽的时刻。",
      },
      {
        stepNumber: 2,
        stepLabel: "让TA讲具体经验",
        stepEmoji: "🔬",
        guidanceText:
          "你周围有没有人的AI用法是你觉得'这样用挺好的'或者'这样用不太对'的？你为什么这么觉得？",
        whyItWorks:
          "从对他人的评价切入——即使受访者觉得自己没有原则，对他人的评价已经隐含了自己的标准。帮受访者发现自己的隐性原则。",
        optionalFollowUps: [
          "如果让你教一个完全没用过AI的人——你会教他什么？第一条建议是什么？",
        ],
      },
    ],
  },
];

// ============================================================================
// 查询函数（保持向后兼容）
// ============================================================================

/** 按题目和分数条件查找故事化引导 */
export function getStoryGuidance(
  questionId: string,
  score: number,
  likertMidpoint: number = 3.5,
): StoryGuidance | undefined {
  const condition = score >= likertMidpoint ? "high" : "low";
  return STORY_GUIDANCE_LIBRARY.find(
    (g) => g.questionId === questionId && g.scoreCondition === condition,
  );
}

/** 获取某题目在特定分数下的完整故事化引导（含阶段分组） */
export function getGuidanceForQuestion(
  questionId: string,
  responses: Record<string, number>,
  likertMidpoint: number = 3.5,
): StoryGuidance | undefined {
  const score = responses[questionId];
  if (score === undefined) return undefined;
  return getStoryGuidance(questionId, score, likertMidpoint);
}

/** 获取某阶段所有题目的故事化引导列表 */
export function getGuidanceForStage(
  stageQuestions: string[],
  responses: Record<string, number>,
  likertMidpoint: number = 3.5,
): StoryGuidance[] {
  return stageQuestions
    .map((qId) => getGuidanceForQuestion(qId, responses, likertMidpoint))
    .filter((g): g is StoryGuidance => g !== undefined);
}

/** 获取某类型的视角引导（跨所有题目） */
export function getTypePerspectives(
  styleId: string,
  stageQuestions: string[],
  responses: Record<string, number>,
): { questionId: string; perspective: TypePerspective }[] {
  const result: { questionId: string; perspective: TypePerspective }[] = [];
  for (const qId of stageQuestions) {
    const score = responses[qId];
    if (score === undefined) continue;
    const guidance = getStoryGuidance(qId, score);
    if (!guidance?.typePerspectives) continue;
    const tp = guidance.typePerspectives.find((p) => p.styleId === styleId);
    if (tp) result.push({ questionId: qId, perspective: tp });
  }
  return result;
}
