// 跨题关联数据层（v2.3 725反馈——Phase 5）。
// 来源：C:\Users\35636\Downloads\725反馈\开发者反馈_v3_产品重构_从AI访谈员到认知增强系统.md
//
// 设计：定义15题之间的关联关系，当访谈者在某题中记录内容时，
// 系统提示可能相关的其他题目，帮助访谈者建立跨题联结。

export interface CrossQuestionLink {
  /** 源题目 */
  fromQuestion: string;
  /** 关联题目 */
  toQuestion: string;
  /** 关联逻辑说明 */
  connectionLogic: string;
  /** 触发条件（关键词或概念） */
  triggerKeywords: string[];
  /** 提示文案 */
  hintText: string;
}

/**
 * 跨题关联映射表（15题之间的关键关联）。
 *
 * 设计原则：
 * - 每道题有1-3条关联（不穷举所有可能，聚焦研究价值最高的联结）
 * - 关联基于"概念邻近性"而非"统计相关性"
 * - 提示文案用口语化疑问句，引发访谈者思考而非指令
 */
export const CROSS_QUESTION_LINKS: CrossQuestionLink[] = [
  // ---- 阶段1（初识）内部关联 ----
  {
    fromQuestion: "Q1",
    toQuestion: "Q2",
    connectionLogic: "识别AI→感知AI无处不在",
    triggerKeywords: ["判断", "识别", "真假", "AI应用"],
    hintText: "受访者对AI的判断标准，是否影响TA在日常生活中注意到AI的频率？",
  },
  {
    fromQuestion: "Q1",
    toQuestion: "Q6",
    connectionLogic: "识别AI→学习新AI工具",
    triggerKeywords: ["判断", "识别", "技术", "算法"],
    hintText: "受访者的AI识别能力，是否与TA学习新AI工具的难易程度有关？",
  },

  // ---- 阶段1→阶段2 跨阶段关联 ----
  {
    fromQuestion: "Q2",
    toQuestion: "Q3",
    connectionLogic: "感知AI→使用AI的动机",
    triggerKeywords: ["日常", "生活", "使用", "无处不在"],
    hintText: "受访者在日常中感知AI的程度，是否影响TA主动使用AI的意愿？",
  },
  {
    fromQuestion: "Q6",
    toQuestion: "Q4",
    connectionLogic: "学习新工具→工具选择策略",
    triggerKeywords: ["学习", "新工具", "容易", "困难"],
    hintText: "受访者学习新AI工具的方式，是否影响TA在不同工具间的选择策略？",
  },

  // ---- 阶段2（使用）内部关联 ----
  {
    fromQuestion: "Q3",
    toQuestion: "Q5",
    connectionLogic: "使用动机→人机协作调试",
    triggerKeywords: ["目标", "任务", "效率", "完成"],
    hintText: "受访者使用AI的目标导向程度，是否影响TA在AI不理解时的调试意愿？",
  },

  // ---- 阶段2→阶段3 跨阶段关联 ----
  {
    fromQuestion: "Q4",
    toQuestion: "Q8",
    connectionLogic: "工具选择→验证AI结果",
    triggerKeywords: ["选择", "工具", "比较", "哪个"],
    hintText: "受访者的工具选择策略，是否反映了TA验证AI结果的标准？",
  },
  {
    fromQuestion: "Q5",
    toQuestion: "Q7",
    connectionLogic: "协作调试→复杂任务信任",
    triggerKeywords: ["调整", "表达", "理解", "误解"],
    hintText: "受访者调整表达与AI协作的经验，是否影响TA将复杂任务交给AI的意愿？",
  },

  // ---- 阶段3（信任）内部关联 ----
  {
    fromQuestion: "Q7",
    toQuestion: "Q12",
    connectionLogic: "信任意愿→批判质疑",
    triggerKeywords: ["信任", "交给", "复杂", "任务"],
    hintText: "受访者的信任程度，是否影响TA对AI专业外表的质疑能力？",
  },
  {
    fromQuestion: "Q8",
    toQuestion: "Q9",
    connectionLogic: "结果验证→能力边界划定",
    triggerKeywords: ["验证", "检查", "可靠", "不可靠"],
    hintText: "受访者验证AI结果的经验，如何帮助TA划定AI的能力边界？",
  },

  // ---- 阶段3→阶段4 跨阶段关联 ----
  {
    fromQuestion: "Q9",
    toQuestion: "Q15",
    connectionLogic: "能力边界→AI素养定义",
    triggerKeywords: ["边界", "适合", "不适合", "能力"],
    hintText: "受访者对AI能力边界的理解，是否映射到TA对'AI素养'的定义？",
  },
  {
    fromQuestion: "Q12",
    toQuestion: "Q10",
    connectionLogic: "批判质疑→社会影响关注",
    triggerKeywords: ["专业", "相信", "质疑", "表面"],
    hintText: "受访者的批判质疑态度，是否延伸到对社会层面AI影响的关注？",
  },

  // ---- 阶段4（反思）内部关联 ----
  {
    fromQuestion: "Q10",
    toQuestion: "Q11",
    connectionLogic: "社会影响→个人情绪",
    triggerKeywords: ["社会", "影响", "隐私", "公平"],
    hintText: "受访者对AI社会影响的关注，是否伴随着个人使用中的情绪反应？",
  },
  {
    fromQuestion: "Q11",
    toQuestion: "Q13",
    connectionLogic: "情绪体验→隐私风险实践",
    triggerKeywords: ["情绪", "焦虑", "困惑", "挫败"],
    hintText: "受访者的AI使用情绪体验，是否影响TA在隐私安全方面的实际行动？",
  },
  {
    fromQuestion: "Q13",
    toQuestion: "Q14",
    connectionLogic: "风险实践→AI认知演进",
    triggerKeywords: ["隐私", "安全", "数据", "风险"],
    hintText: "受访者的隐私风险认知实践，是否推动TA对AI理解的深层变化？",
  },
  {
    fromQuestion: "Q14",
    toQuestion: "Q15",
    connectionLogic: "认知演进→素养定义形成",
    triggerKeywords: ["变化", "理解", "重新", "以前"],
    hintText: "受访者对AI理解的演进过程，是否塑造了TA对AI素养的最终定义？",
  },
];

/**
 * 获取从某题出发的所有跨题关联。
 */
export function getCrossLinksForQuestion(questionId: string): CrossQuestionLink[] {
  return CROSS_QUESTION_LINKS.filter((link) => link.fromQuestion === questionId);
}

/**
 * 获取指向某题的所有跨题关联。
 */
export function getCrossLinksToQuestion(questionId: string): CrossQuestionLink[] {
  return CROSS_QUESTION_LINKS.filter((link) => link.toQuestion === questionId);
}

/**
 * 思维气泡预设提示（按题目）。
 * 访谈者在某题时，系统预填可能的思考方向。
 */
export const THOUGHT_BUBBLE_PRESETS: Record<string, string[]> = {
  Q1: [
    "这个人如何理解'AI'？",
    "TA的判断依据是什么？",
    "TA有没有经历过误判？",
  ],
  Q2: [
    "TA从什么时候开始注意到AI？",
    "哪些场景让TA觉得AI无处不在？",
    "TA的生活中AI以什么形式出现？",
  ],
  Q3: [
    "TA使用AI的主要动机是什么？",
    "效率提升还是好奇探索？",
    "TA如何定义'真正使用AI'？",
  ],
  Q4: [
    "TA如何比较不同AI工具？",
    "选择标准是什么——效率？准确？方便？",
    "TA有没有偏好的工具类型？",
  ],
  Q5: [
    "TA如何应对AI的误解？",
    "调整策略是什么——换说法？放弃？",
    "TA对AI的理解力有何预期？",
  ],
  Q6: [
    "TA学习新AI工具的方式是什么？",
    "主动搜索还是被动接受？",
    "学习过程中最大的困难是什么？",
  ],
  Q7: [
    "TA信任AI的底线在哪里？",
    "什么情况下TA会犹豫？",
    "TA的信任是基于经验还是直觉？",
  ],
  Q8: [
    "TA验证AI结果的方法是什么？",
    "交叉验证？常识判断？",
    "TA有没有被AI误导的经历？",
  ],
  Q9: [
    "TA如何划定AI的能力边界？",
    "哪些任务TA绝对不会交给AI？",
    "这种边界判断来自哪里？",
  ],
  Q10: [
    "TA关注AI的哪些社会影响？",
    "隐私？就业？公平？",
    "TA的关切是否影响实际行为？",
  ],
  Q11: [
    "使用AI时TA有什么情绪体验？",
    "焦虑？兴奋？挫败？",
    "TA如何应对这些情绪？",
  ],
  Q12: [
    "TA会因为AI看起来专业就相信吗？",
    "什么能让TA质疑AI？",
    "TA有没有过'差点被骗'的经历？",
  ],
  Q13: [
    "TA在隐私安全方面做了什么？",
    "关注和实践之间有差距吗？",
    "什么因素驱动TA的保护行为？",
  ],
  Q14: [
    "TA的AI理解发生了怎样的变化？",
    "关键转折点是什么？",
    "变化后的理解与之前有何不同？",
  ],
  Q15: [
    "TA如何定义'AI素养'？",
    "这与TA的亲身经历有何关联？",
    "TA的定义中有没有意外的元素？",
  ],
};

/**
 * 获取某题的思维气泡预设提示。
 */
export function getBubblePresets(questionId: string): string[] {
  return THOUGHT_BUBBLE_PRESETS[questionId] ?? [];
}
