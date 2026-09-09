/**
 * Question Schema Data — 15 complete question schemas for the ALIS AI Literacy Survey.
 *
 * Generated from 议程3 documents (2026-07-26):
 *   - 议程3_四思考窗口Schema_框架与Q1-Q5.md
 *   - 议程3_四思考窗口Schema_Q6-Q10.md
 *   - 议程3_四思考窗口Schema_Q11-Q15与Prompt模板.md
 *
 * Each question has:
 *   - Unique keywords (not generic placeholders)
 *   - Four thinking windows: meaning, experience, choice (high/mid/low), literacy
 *   - Cross-question association rules with trigger keywords
 */

export interface QuestionSchemaData {
  questionId: string;
  keywords: string[];
  thinkingWindows: {
    meaning: {
      focusPoints: string[];
      commonMisunderstanding: string[];
    };
    experience: {
      storyEntries: {
        type: string;
        prompts: string[];
      }[];
    };
    choice: {
      highScore: { mayMean: string[]; exploreDirection: string[] };
      midScore: { mayMean: string[]; exploreDirection: string[] };
      lowScore: { mayMean: string[]; exploreDirection: string[] };
    };
    literacy: {
      abilityChain: string[];
      distinction: string[];
    };
  };
  crossQuestionAssociations: {
    targetQuestion: string;
    triggerKeywords: string[];
    associationNote: string;
  }[];
}

export function getQuestionSchema(questionId: string): QuestionSchemaData | undefined {
  return QUESTION_SCHEMAS[questionId];
}

export const QUESTION_SCHEMAS: Record<string, QuestionSchemaData> = {
  // ============================================================
  // Q1: AI识别能力 — 我通常能够判断，一个应用或服务是否真正使用了AI
  // ============================================================
  Q1: {
    questionId: "Q1",
    keywords: ["识别", "分辨", "判断", "真正使用"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA如何理解'AI'这个概念",
          "TA认为什么算'真正使用AI'（vs 仅作为噱头）",
          "TA的判断标准是什么（技术细节 vs 使用体验）",
          "TA有没有质疑过题目中'真正使用'的表述",
        ],
        commonMisunderstanding: [
          "把AI等同于机器人或ChatGPT",
          "认为'使用了AI'就是'界面有AI字样'",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次判断某个应用是否用了AI是什么时候？",
              "第一次明确'这是AI'的瞬间",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "有没有判断对了/判断错了的经历？",
              "遇到过'看起来像AI但其实不是'的应用吗？",
            ],
          },
          {
            type: "变化",
            prompts: ["你对'什么是AI'的判断标准有没有变化？"],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "能够主动识别AI应用",
            "有较明确的判断标准",
            "关注技术实现细节",
          ],
          exploreDirection: [
            "这种判断能力来自哪里？（技术背景/职业/兴趣）",
            "判断依据是技术特征还是使用体验？",
          ],
        },
        midScore: {
          mayMean: [
            "对AI识别有一定把握，但标准可能模糊",
            "部分场景能判断，部分场景不确定",
          ],
          exploreDirection: [
            "什么时候能确定？什么时候不确定？",
            "不确定的时候会怎么处理？",
          ],
        },
        lowScore: {
          mayMean: [
            "较少主动判断应用是否用了AI",
            "可能通过使用体验感知，不关注技术细节",
          ],
          exploreDirection: [
            "你觉得AI是什么样的？会用什么方式描述？",
            "如果让你判断，你会看什么？",
          ],
        },
      },
      literacy: {
        abilityChain: ["AI识别能力", "→", "AI理解能力", "→", "技术判断能力"],
        distinction: [
          "描述知识",
          "vs",
          "描述经验判断",
          "（TA说'知道AI是什么' vs TA真的能判断）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q3",
        triggerKeywords: ["使用", "工具", "ChatGPT", "豆包", "DeepSeek"],
        associationNote: "此回答可能涉及Q3（使用习惯），可在Q3时呼应",
      },
      {
        targetQuestion: "Q7",
        triggerKeywords: ["信任", "相信", "交给"],
        associationNote: "判断能力影响信任形成，可在Q7时追溯",
      },
      {
        targetQuestion: "Q14",
        triggerKeywords: ["变化", "以前", "现在"],
        associationNote: "判断标准的变化是概念演进的一部分，可在Q14时整合",
      },
    ],
  },

  // ============================================================
  // Q2: AI感知能力 — 我发现，自己已经越来越容易注意到生活中哪些地方正在使用AI
  // ============================================================
  Q2: {
    questionId: "Q2",
    keywords: ["觉察", "敏感", "无处不在", "越来越"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA是否意识到AI在生活中的'渗透'",
          "'越来越容易'是TA的真实感受，还是社会话语的影响",
          "TA注意到的AI应用场景有哪些（推荐算法/语音助手/内容生成等）",
          "TA对'无处不在'是欣然接受还是有所不适",
        ],
        commonMisunderstanding: [
          "把所有个性化推荐都归为AI（部分推荐是传统算法）",
          "把'注意到AI'等同于'懂AI'",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'生活中到处是AI'是什么时候？",
              "是哪个具体的场景让你有这种感觉？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次'突然发现这也是AI'的经历",
              "有没有哪个AI应用让你觉得'躲不开'？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "从'没注意'到'越来越容易注意到'，这个变化是怎么发生的？",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "对AI的存在高度敏感",
            "主动关注AI的应用场景",
            "可能具有技术兴趣或职业相关",
          ],
          exploreDirection: [
            "这种敏感是天生的还是后天培养的？",
            "敏感带来的是便利感还是焦虑感？",
          ],
        },
        midScore: {
          mayMean: [
            "能注意到明显的AI应用，但不那么敏感",
            "AI存在感不强，或未被特别关注",
          ],
          exploreDirection: [
            "什么样的AI应用容易注意到？什么样的不容易？",
            "如果不主动关注，是因为不感兴趣还是其他原因？",
          ],
        },
        lowScore: {
          mayMean: [
            "较少主动察觉AI的存在",
            "AI对TA而言是'隐形'的",
          ],
          exploreDirection: [
            "如果不察觉AI，TA如何看待身边的智能功能？",
            "有没有哪个时刻让TA'突然发现'AI的存在？",
          ],
        },
      },
      literacy: {
        abilityChain: ["AI感知能力", "→", "AI敏感度", "→", "AI意识形成"],
        distinction: [
          "被动接触",
          "vs",
          "主动觉察",
          "（AI找上门 vs TA主动发现AI）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q1",
        triggerKeywords: ["判断", "分辨", "标准"],
        associationNote: "感知(觉察)是判断(识别)的前提，可在Q1时追溯",
      },
      {
        targetQuestion: "Q14",
        triggerKeywords: ["变化", "以前没注意", "现在注意"],
        associationNote: "感知变化是概念演进的一部分，可在Q14时整合",
      },
      {
        targetQuestion: "Q10",
        triggerKeywords: ["社会", "大家", "无处不在"],
        associationNote: "对AI无处不在的感知，可能延伸到对社会影响的思考（Q10）",
      },
    ],
  },

  // ============================================================
  // Q3: 使用动机 — 我使用AI，主要是因为有明确的任务或目标
  // ============================================================
  Q3: {
    questionId: "Q3",
    keywords: ["使用", "动机", "任务", "目标导向"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA使用AI是'任务驱动'还是'探索驱动'",
          "'明确任务'对TA意味着什么（工作/学习/生活）",
          "如果没有明确任务，TA会不会主动用AI",
          "TA对'用AI做什么'有没有清晰的场景",
        ],
        commonMisunderstanding: [
          "认为'任务导向'就是'功利'（其实是合理的使用风格）",
          "把'偶尔探索'等同于'探索驱动'",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次用AI是为了完成什么任务？",
              "那个任务是怎么想到用AI的？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次用AI是什么场景？是任务驱动还是探索？",
              "有没有'没事也打开AI玩玩'的经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你用AI的动机有没有变化？（从探索→任务，或从任务→探索）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "典型的任务导向使用者",
            "AI是完成任务的工具",
            "注重效率和结果",
          ],
          exploreDirection: [
            "这种任务导向是怎么形成的？（工作需要/性格/习惯）",
            "任务完成后，你会继续探索AI的其他功能吗？",
          ],
        },
        midScore: {
          mayMean: ["任务和探索兼有", "视情境而定"],
          exploreDirection: [
            "什么情境下偏向任务？什么情境下偏向探索？",
            "两种动机哪种更让你享受？",
          ],
        },
        lowScore: {
          mayMean: [
            "偏向探索型使用",
            "AI更像是'玩具'或'实验场'",
            "可能没有明确的使用场景",
          ],
          exploreDirection: [
            "探索的时候，你最享受什么？",
            "探索有没有转化为具体任务的例子？",
          ],
        },
      },
      literacy: {
        abilityChain: ["使用动机", "→", "目标导向能力", "→", "工具选择策略"],
        distinction: [
          "任务导向使用",
          "vs",
          "探索导向使用",
          "（两种风格都合理，无优劣）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q4",
        triggerKeywords: ["选择", "工具", "对比"],
        associationNote: "使用动机会影响工具选择策略，可在Q4时深入",
      },
      {
        targetQuestion: "Q6",
        triggerKeywords: ["尝试", "新工具", "学习"],
        associationNote: "任务导向者可能较少尝试新工具（Q6），可在Q6时呼应",
      },
      {
        targetQuestion: "Q1",
        triggerKeywords: ["判断", "识别"],
        associationNote: "使用经验影响判断能力，可在Q1时追溯",
      },
    ],
  },

  // ============================================================
  // Q4: 工具选择能力 — 我通常会了解和对比多种AI工具，然后选择最适合的
  // ============================================================
  Q4: {
    questionId: "Q4",
    keywords: ["选择", "对比", "专注", "工具认知"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对AI工具市场的认知广度（知道多少种工具）",
          "TA的选择标准是什么（功能/易用性/口碑/价格）",
          "TA是'广撒网'还是'深耕一两个'",
          "选择工具时是否考虑过工具之间的差异",
        ],
        commonMisunderstanding: [
          "认为'用得多'就是'选择能力强'",
          "把'常用某个工具'等同于'经过对比后选择'",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次'对比多个AI工具'是什么时候？",
              "那次对比是为了什么任务？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次换AI工具的经历",
              "有没有'用了很久才发现更好的'的情况？",
            ],
          },
          {
            type: "变化",
            prompts: ["你选择工具的标准有没有变化？（从跟风→主动对比）"],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "工具认知广，主动对比",
            "有明确的选择标准",
            "可能关注AI工具动态",
          ],
          exploreDirection: [
            "你的对比维度是什么？（功能/效果/易用性）",
            "对比后，你通常会换工具还是保留原来的？",
          ],
        },
        midScore: {
          mayMean: ["偶尔对比，但不是系统性", "主要依赖推荐或跟风"],
          exploreDirection: [
            "你对比的时候，主要看什么？",
            "如果不对比，是因为没时间还是没必要？",
          ],
        },
        lowScore: {
          mayMean: [
            "专注少数工具，不主动对比",
            "用顺手的就继续用",
            "可能工具需求单一",
          ],
          exploreDirection: [
            "你专注的工具是怎么进入你生活的？",
            "有没有遇到过'专注的工具不够用'的情况？",
          ],
        },
      },
      literacy: {
        abilityChain: ["工具认知", "→", "选择策略", "→", "使用深度"],
        distinction: [
          "广度认知",
          "vs",
          "深度使用",
          "（知道很多工具 vs 把一个工具用精）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q3",
        triggerKeywords: ["任务", "目标", "动机"],
        associationNote: "使用动机决定工具选择策略，可在Q3时追溯",
      },
      {
        targetQuestion: "Q6",
        triggerKeywords: ["新工具", "尝试", "学习"],
        associationNote: "工具选择与新技术接触意愿相关，可在Q6时深入",
      },
    ],
  },

  // ============================================================
  // Q5: 协作意愿（调试耐心）— 当AI给出的结果不理想时，我会调整表达方式，多次尝试
  // ============================================================
  Q5: {
    questionId: "Q5",
    keywords: ["调试", "耐心", "协作", "调整表达"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA遇到AI'不理想'结果时的第一反应",
          "TA认为'调整表达'是有效的还是徒劳的",
          "TA的耐心边界在哪里（几次后放弃）",
          "TA是否把AI当作'需要沟通的对象'",
        ],
        commonMisunderstanding: [
          "认为'多次尝试'就是'会用人机协作'（也可能是不知道怎么用）",
          "把'放弃'等同于'不会用'（其实是使用风格的选择）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'换个说法AI就懂了'是什么时候？",
              "那个经历让你对AI的看法有什么变化？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次'调试很久终于成功'的经历",
              "有没有'调试很久还是失败'的经历？当时什么感受？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对'调试AI'的耐心有没有变化？（从急躁→耐心，或反之）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "强烈的协作意愿",
            "把AI视为'需要沟通的伙伴'",
            "调试耐心高",
          ],
          exploreDirection: [
            "这种耐心是天生的还是后天培养的？",
            "调试成功后的感受是什么？（成就感/工具感）",
          ],
        },
        midScore: {
          mayMean: ["视情况而定", "重要任务愿意调试，小事就直接放弃"],
          exploreDirection: [
            "什么任务值得你调试？什么任务不值得？",
            "判断标准是什么？",
          ],
        },
        lowScore: {
          mayMean: [
            "调试耐心低",
            "倾向'一次不行就换'",
            "可能把AI当'即用即走'的工具",
          ],
          exploreDirection: [
            "放弃后你会怎么做？（人工/换工具/放弃任务）",
            "有没有'曾经放弃但现在会调试'的转变？",
          ],
        },
      },
      literacy: {
        abilityChain: ["协作意愿", "→", "调试耐心", "→", "人机协作能力"],
        distinction: [
          "工具型使用",
          "vs",
          "协作型使用",
          "（AI是工具 vs AI是对话伙伴）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q7",
        triggerKeywords: ["信任", "交给", "复杂任务"],
        associationNote: "协作意愿影响信任形成，可在Q7时深入",
      },
      {
        targetQuestion: "Q8",
        triggerKeywords: ["验证", "检查", "结果"],
        associationNote: "调试后是否验证结果？协作与验证的关系，可在Q8时呼应",
      },
      {
        targetQuestion: "Q13",
        triggerKeywords: ["挫败", "情绪", "烦"],
        associationNote: "调试失败引发的情绪反应，可在Q13时深入",
      },
    ],
  },

  // ============================================================
  // Q6: 新技术接触意愿（学习能力）— 当出现新的AI工具时，我会主动尝试
  // ============================================================
  Q6: {
    questionId: "Q6",
    keywords: ["尝试", "新工具", "主动", "跟进"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对'新AI工具'的信息敏感度（从哪里得知）",
          "TA的尝试动机（好奇/实用/社交话题）",
          "TA对新工具的判断标准（什么值得试）",
          "TA是'第一批尝鲜者'还是'大众用户'",
        ],
        commonMisunderstanding: [
          "认为'主动尝试'就是'盲目追新'（其实是探索能力）",
          "把'用过新工具'等同于'主动尝试'（可能是被动跟风）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次主动尝试新AI工具是什么时候？",
              "是什么让你决定'试一试'？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次尝试的新AI工具是什么？体验如何？",
              "有没有'跟风尝试但后悔'的经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对新工具的态度有没有变化？（从热衷→理性，或从观望→主动）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "典型的探索者",
            "把AI当成'玩具/实验场'",
            "信息敏感度高",
          ],
          exploreDirection: [
            "你尝试新工具的动机是什么？（好奇/实用/分享）",
            "尝试后，你会持续使用还是很快就放下？",
          ],
        },
        midScore: {
          mayMean: ["视工具热度而定", "可能跟风尝试，但不主动"],
          exploreDirection: [
            "什么样的工具会吸引你主动尝试？",
            "什么样的工具你完全没兴趣？",
          ],
        },
        lowScore: {
          mayMean: [
            "等待工具成熟后再使用",
            "注重稳定，不追新",
            "可能工具需求已满足",
          ],
          exploreDirection: [
            "你不尝试新工具的原因是什么？（没必要/怕麻烦/不信任）",
            "有没有'错过早期尝试'而遗憾的经历？",
          ],
        },
      },
      literacy: {
        abilityChain: ["学习能力", "→", "新技术适应力", "→", "工具更新意识"],
        distinction: [
          "主动探索",
          "vs",
          "被动跟进",
          "（自己发现新工具 vs 等别人推荐）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q3",
        triggerKeywords: ["任务", "实用", "效率"],
        associationNote: "探索意愿影响使用动机，可在Q3时呼应",
      },
      {
        targetQuestion: "Q4",
        triggerKeywords: ["选择", "对比", "工具"],
        associationNote: "主动尝试者通常工具认知广（Q4），可在Q4时追溯",
      },
    ],
  },

  // ============================================================
  // Q7: 任务分配意愿（信任形成）— 我愿意把复杂任务交给AI处理
  // ============================================================
  Q7: {
    questionId: "Q7",
    keywords: ["交给", "复杂", "信任", "依赖"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对'复杂任务'的定义（什么算复杂）",
          "TA信任AI的边界在哪里（哪些愿意交，哪些不愿意）",
          "TA的信任来源是什么（经验/口碑/能力认知）",
          "TA是否区分'交给AI'和'依赖AI'",
        ],
        commonMisunderstanding: [
          "认为'愿意交给'就是'盲目信任'（可能是理性评估后的选择）",
          "把'交给AI'等同于'不会做'（可能是为了效率）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次把'复杂任务'交给AI是什么时候？",
              "那次是主动选择还是被逼无奈？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次把复杂任务交给AI的经历",
              "有没有'交给AI后结果很差'的经历？当时怎么处理？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对'交给AI'的意愿有没有变化？（从谨慎→放心，或反之）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "强烈的信任倾向",
            "愿意在重要场景依赖AI",
            "可能已有较多成功经验",
          ],
          exploreDirection: [
            "这种信任是怎么建立的？（哪次关键经历）",
            "信任的边界在哪里？什么任务你绝对不会交？",
          ],
        },
        midScore: {
          mayMean: ["视任务类型而定", "部分信任，部分保留"],
          exploreDirection: [
            "哪些任务你愿意交？哪些不愿意？",
            "判断标准是什么？",
          ],
        },
        lowScore: {
          mayMean: [
            "倾向人工处理复杂任务",
            "对AI能力持保留态度",
            "可能注重控制感",
          ],
          exploreDirection: [
            "你不愿交给AI的原因是什么？（不信任/享受过程/怕出错）",
            "如果AI能力提升，你会改变吗？",
          ],
        },
      },
      literacy: {
        abilityChain: ["任务分配意愿", "→", "信任形成", "→", "依赖程度评估"],
        distinction: [
          "理性信任",
          "vs",
          "盲目依赖",
          "（评估后交 vs 不加判断地交）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q5",
        triggerKeywords: ["调试", "协作", "耐心"],
        associationNote: "协作经验影响信任形成，可在Q5时追溯",
      },
      {
        targetQuestion: "Q8",
        triggerKeywords: ["验证", "检查", "结果"],
        associationNote: "交给AI后是否验证结果？信任与验证的张力，可在Q8时深入",
      },
      {
        targetQuestion: "Q9",
        triggerKeywords: ["边界", "局限", "适用"],
        associationNote: "信任形成与边界意识相关，可在Q9时呼应",
      },
    ],
  },

  // ============================================================
  // Q8: 结果验证能力（批判性思维）— 我会主动检查或验证AI给出的结果
  // ============================================================
  Q8: {
    questionId: "Q8",
    keywords: ["验证", "检查", "核实", "批判"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对'验证'的理解（抽查/全检/交叉验证）",
          "TA的验证动机（怕错/学习/职业习惯）",
          "TA验证的方法是什么（搜索/对比/询问他人）",
          "TA是否区分'信任AI'和'需要验证'",
        ],
        commonMisunderstanding: [
          "认为'验证'就是'不信任'（其实是负责任的使用）",
          "把'偶尔检查'等同于'系统性验证'",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'必须验证AI结果'是什么时候？",
              "是什么经历让你建立验证习惯？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "有没有'验证后发现问题'的经历？",
              "有没有'没验证结果出错'的经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你的验证习惯有没有变化？（从轻信→严谨，或从过度验证→适度）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "典型的验证者",
            "批判性思维强",
            "可能具有专业背景或职业习惯",
          ],
          exploreDirection: [
            "验证的方法是什么？（搜索/对比/专家确认）",
            "验证后发现错误，你会怎么处理？",
          ],
        },
        midScore: {
          mayMean: ["重要任务验证，小事直接接受", "验证意识存在但不系统"],
          exploreDirection: [
            "什么样的结果你会验证？什么样的不会？",
            "判断标准是什么？",
          ],
        },
        lowScore: {
          mayMean: [
            "倾向直接接受AI输出",
            "可能因效率优先或信任度高",
            "可能从未遇到需要验证的情况",
          ],
          exploreDirection: [
            "你不验证的原因是什么？（信任/没必要/没时间）",
            "如果结果出错，你怎么发现？怎么处理？",
          ],
        },
      },
      literacy: {
        abilityChain: ["结果验证能力", "→", "批判性思维", "→", "边界认知"],
        distinction: [
          "信任",
          "vs",
          "盲信",
          "（理性接受 vs 不加判断地接受）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q7",
        triggerKeywords: ["交给", "信任", "复杂"],
        associationNote: "信任与验证是张力的两端，可在Q7时呼应",
      },
      {
        targetQuestion: "Q9",
        triggerKeywords: ["边界", "局限", "适用"],
        associationNote: "验证经验形成边界认知，可在Q9时深入",
      },
      {
        targetQuestion: "Q12",
        triggerKeywords: ["质疑", "权威", "盲从"],
        associationNote: "验证能力与权威质疑相关，可在Q12时深入",
      },
    ],
  },

  // ============================================================
  // Q9: 边界意识（适用性判断）— 我清楚AI擅长什么、不擅长什么
  // ============================================================
  Q9: {
    questionId: "Q9",
    keywords: ["边界", "适用", "局限", "擅长"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对AI能力边界的认知清晰度",
          "TA的边界认知来源（经验/学习/听说）",
          "TA能否举出AI'不擅长'的具体例子",
          "TA的边界认知是否随时间变化",
        ],
        commonMisunderstanding: [
          "认为'清楚边界'就是'懂AI'（可能是表面的标签化认知）",
          "把'用过'等同于'知道边界'（可能是浅层使用）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'AI也有不会的'是什么时候？",
              "那个发现是怎么发生的？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "有没有'以为AI会但其实不会'的经历？",
              "有没有'意外发现AI擅长某事'的经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对AI边界的认知有没有变化？（从高估→理性，或从低估→欣赏）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "清晰的边界认知",
            "能具体说出AI擅长/不擅长的领域",
            "可能经过系统性思考",
          ],
          exploreDirection: [
            "你能举出AI'不擅长'的3个例子吗？",
            "这个边界认知是怎么形成的？",
          ],
        },
        midScore: {
          mayMean: ["边界认知模糊", "大概知道，但不具体"],
          exploreDirection: [
            "你能说出AI擅长的领域吗？不擅长呢？",
            "有没有遇到过'以为会其实不会'的情况？",
          ],
        },
        lowScore: {
          mayMean: [
            "边界认知不清",
            "可能高估或低估AI能力",
            "可能使用经验有限",
          ],
          exploreDirection: [
            "你觉得AI能做什么？不能做什么？",
            "如果让你给AI画一条'能力边界'，你会怎么画？",
          ],
        },
      },
      literacy: {
        abilityChain: ["边界意识", "→", "适用性判断", "→", "风险认知"],
        distinction: [
          "经验型认知",
          "vs",
          "标签化认知",
          "（亲身验证 vs 听别人说）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q8",
        triggerKeywords: ["验证", "检查", "结果"],
        associationNote: "验证经验形成边界认知，可在Q8时追溯",
      },
      {
        targetQuestion: "Q12",
        triggerKeywords: ["质疑", "权威", "盲从"],
        associationNote: "边界认知与批判思维相关，可在Q12时深入",
      },
      {
        targetQuestion: "Q15",
        triggerKeywords: ["原则", "自律", "边界"],
        associationNote: "边界认知影响使用原则形成，可在Q15时深入",
      },
    ],
  },

  // ============================================================
  // Q10: 社会影响思考（影响思考范围）— 我会思考AI对社会的影响（不仅仅是个人使用）
  // ============================================================
  Q10: {
    questionId: "Q10",
    keywords: ["社会", "影响", "未来", "宏观"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA是否区分'个人影响'和'社会影响'",
          "TA关注的社会影响维度（就业/伦理/教育/公平）",
          "TA的思考是'担心'还是'期待'，还是兼有",
          "TA的信息来源是什么（新闻/讨论/亲身观察）",
        ],
        commonMisunderstanding: [
          "认为'思考社会影响'就是'悲观'（也可能是积极期待）",
          "把'听说过AI议题'等同于'思考过'（可能是被动接收信息）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次'跳出个人使用'思考AI的社会影响是什么时候？",
              "是什么触发了这种思考？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次让你'深思'的AI社会议题是什么？",
              "有没有和朋友/同事讨论过AI的社会影响？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对AI社会影响的看法有没有变化？（从乐观→担忧，或反之）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "具有宏观视野",
            "关注AI的 broader implications",
            "可能读过相关讨论或参与过对话",
          ],
          exploreDirection: [
            "你最关注的社会影响维度是什么？（就业/伦理/教育）",
            "你觉得个人能做什么？",
          ],
        },
        midScore: {
          mayMean: ["偶尔思考，但不深入", "主要关注个人影响"],
          exploreDirection: [
            "什么样的议题会让你'跳出来'思考？",
            "你觉得AI对社会是好事还是坏事？",
          ],
        },
        lowScore: {
          mayMean: [
            "关注个人使用，较少思考宏观",
            "可能觉得'社会影响'离自己远",
          ],
          exploreDirection: [
            "你不思考社会影响的原因是什么？（没兴趣/没时间/觉得无关）",
            "如果让你想一个，你会想到什么？",
          ],
        },
      },
      literacy: {
        abilityChain: ["社会影响思考", "→", "宏观视野", "→", "未来预期"],
        distinction: [
          "个人视角",
          "vs",
          "社会视角",
          "（AI对我 vs AI对我们）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q2",
        triggerKeywords: ["无处不在", "大家", "社会"],
        associationNote: "感知AI无处不在，可能延伸到社会影响思考，可在Q2时追溯",
      },
      {
        targetQuestion: "Q11",
        triggerKeywords: ["隐私", "风险", "数据"],
        associationNote: "社会影响思考包括隐私风险，可在Q11时深入",
      },
      {
        targetQuestion: "Q14",
        triggerKeywords: ["变化", "未来", "演进"],
        associationNote: "社会影响思考是概念演进的一部分，可在Q14时整合",
      },
    ],
  },

  // ============================================================
  // Q11: 隐私风险意识 — 我会关注使用AI时的隐私和数据安全问题
  // ============================================================
  Q11: {
    questionId: "Q11",
    keywords: ["隐私", "数据", "风险", "安全"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对'隐私风险'的具体理解（知道哪些风险）",
          "TA的关注是主动的还是被动的（新闻驱动 vs 主动思考）",
          "TA是否采取过保护措施（不输入敏感信息/用代理工具等）",
          "TA对'数据被收集'的态度（接受/担忧/无感）",
        ],
        commonMisunderstanding: [
          "认为'关注隐私'就是'不用AI'（其实是负责任地使用）",
          "把'听说过数据泄露'等同于'有关注意识'（可能是信息被动接收）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'用AI有隐私风险'是什么时候？",
              "是什么让你意识到的？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "有没有'因为隐私考虑而不使用AI'的经历？",
              "有没有'输入了敏感信息后后悔'的经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对隐私风险的关注度有没有变化？（从无感→敏感，或反之）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "高度关注隐私",
            "可能采取过保护措施",
            "对数据流向敏感",
          ],
          exploreDirection: [
            "你采取过哪些保护措施？",
            "你觉得这些措施有效吗？",
          ],
        },
        midScore: {
          mayMean: ["知道有风险，但关注度一般", "偶尔注意，不系统"],
          exploreDirection: [
            "什么样的信息你会避免输入？什么样的无所谓？",
            "你的判断标准是什么？",
          ],
        },
        lowScore: {
          mayMean: [
            "较少关注隐私问题",
            "可能觉得'没什么好隐瞒'",
            "可能优先便利性",
          ],
          exploreDirection: [
            "你不关注隐私的原因是什么？（没必要/不懂/嫌麻烦）",
            "如果发生数据泄露，你会怎么应对？",
          ],
        },
      },
      literacy: {
        abilityChain: ["风险意识", "→", "隐私保护能力", "→", "数据敏感度"],
        distinction: [
          "被动接收信息",
          "vs",
          "主动评估风险",
          "（听说有风险 vs 主动判断风险）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q9",
        triggerKeywords: ["边界", "局限", "适用"],
        associationNote: "边界意识包括隐私边界，可在Q9时追溯",
      },
      {
        targetQuestion: "Q10",
        triggerKeywords: ["社会", "影响", "数据"],
        associationNote: "隐私是社会影响的重要维度，可在Q10时呼应",
      },
      {
        targetQuestion: "Q13",
        triggerKeywords: ["情绪", "焦虑", "担心"],
        associationNote: "隐私风险可能引发焦虑情绪，可在Q13时深入",
      },
    ],
  },

  // ============================================================
  // Q12: 权威质疑能力（批判性思维）— 我不会因为AI表现得'专业'就盲从它的输出
  // ============================================================
  Q12: {
    questionId: "Q12",
    keywords: ["质疑", "权威", "盲从", "专业外表"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA对'专业外表'的免疫力如何",
          "TA是否区分'AI看起来对'和'AI真的对'",
          "TA质疑的依据是什么（常识/专业背景/直觉）",
          "TA在什么情境下更容易盲从（紧急/不熟悉/权威背书）",
        ],
        commonMisunderstanding: [
          "认为'质疑'就是'反对AI'（其实是理性使用）",
          "把'不盲从'等同于'不相信'（可能是验证后相信）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'AI看起来专业但其实是错'是什么时候？",
              "那次经历让你对AI的看法有什么变化？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "有没有'被AI的自信说服但后来发现错了'的经历？",
              "有没有'坚持质疑最后证明自己对'的经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对'AI专业外表'的态度有没有变化？（从信任→质疑，或反之）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "强烈的批判意识",
            "对AI的'专业外表'保持距离",
            "可能具有专业背景或独立思考习惯",
          ],
          exploreDirection: [
            "你质疑的依据是什么？（专业背景/常识/直觉）",
            "有没有'质疑后发现自己错了'的经历？",
          ],
        },
        midScore: {
          mayMean: ["重要问题会质疑，小事直接接受", "质疑意识存在但不稳定"],
          exploreDirection: [
            "什么样的AI输出你会质疑？什么样的不会？",
            "判断标准是什么？",
          ],
        },
        lowScore: {
          mayMean: [
            "倾向相信AI的专业性",
            "可能因效率优先或缺乏质疑习惯",
            "可能从未遇到需要质疑的情况",
          ],
          exploreDirection: [
            "你不质疑的原因是什么？（信任/没必要/不懂）",
            "如果AI结果有问题，你怎么发现？",
          ],
        },
      },
      literacy: {
        abilityChain: ["批判性思维", "→", "权威质疑能力", "→", "独立判断"],
        distinction: [
          "理性信任",
          "vs",
          "盲从",
          "（评估后接受 vs 不加判断地接受）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q8",
        triggerKeywords: ["验证", "检查", "结果"],
        associationNote: "验证是质疑的行动表现，可在Q8时追溯",
      },
      {
        targetQuestion: "Q9",
        triggerKeywords: ["边界", "局限", "适用"],
        associationNote: "质疑能力与边界认知相关，可在Q9时呼应",
      },
    ],
  },

  // ============================================================
  // Q13: 情绪应对能力（情绪调节）— 当AI让我感到挫败或焦虑时，我能调整心态继续使用
  // ============================================================
  Q13: {
    questionId: "Q13",
    keywords: ["情绪", "挫败", "焦虑", "调节"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA在使用AI时的典型情绪反应（挫败/焦虑/兴奋/平静）",
          "TA的情绪触发点是什么（结果不好/不会用/对比他人）",
          "TA的调节方式是什么（休息/换工具/坚持/求助）",
          "TA是否区分'对AI的情绪'和'对自己的情绪'",
        ],
        commonMisunderstanding: [
          "认为'调整心态'就是'压抑情绪'（其实是积极应对）",
          "把'没情绪'等同于'情绪调节能力强'（可能是不投入）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次因AI感到挫败/焦虑是什么时候？",
              "是什么具体情境触发的？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "最近一次因AI产生负面情绪的经历",
              "有没有'从挫败到突破'的转变经历？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你对AI的情绪反应有没有变化？（从易挫败→平静，或反之）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "情绪调节能力强",
            "能区分'工具问题'和'自我价值'",
            "可能具有成长型思维",
          ],
          exploreDirection: [
            "你的调节方式是什么？（休息/换工具/求助）",
            "这种能力是怎么形成的？",
          ],
        },
        midScore: {
          mayMean: ["视情境而定", "有时能调节，有时被情绪影响"],
          exploreDirection: [
            "什么样的情境容易让你失控？",
            "什么样的情境你能保持平静？",
          ],
        },
        lowScore: {
          mayMean: [
            "情绪反应强烈",
            "可能因挫败而减少使用",
            "可能把'AI不会用'等同于'自己不行'",
          ],
          exploreDirection: [
            "你最强烈的情绪反应是什么时候？",
            "有没有因为情绪而放弃使用AI的经历？",
          ],
        },
      },
      literacy: {
        abilityChain: ["情绪调节", "→", "挫败应对", "→", "心理韧性"],
        distinction: [
          "工具型情绪",
          "vs",
          "自我型情绪",
          "（对AI不满 vs 对自己不满）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q5",
        triggerKeywords: ["调试", "耐心", "协作"],
        associationNote: "调试耐心是情绪调节的一部分，可在Q5时追溯",
      },
      {
        targetQuestion: "Q11",
        triggerKeywords: ["焦虑", "担心", "隐私"],
        associationNote: "隐私风险可能引发焦虑，可在Q11时呼应",
      },
    ],
  },

  // ============================================================
  // Q14: 概念重构能力（认知演进）— 我对AI的理解和态度，在过去一段时间发生了明显变化
  // ============================================================
  Q14: {
    questionId: "Q14",
    keywords: ["变化", "演进", "重构", "以前vs现在"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA能否清晰描述'变化前'和'变化后'的具体差异",
          "TA的变化方向是什么（从陌生→熟悉，从乐观→理性等）",
          "TA的变化触发点是什么（具体事件/渐进积累/他人影响）",
          "TA是否意识到自己的变化（元认知）",
        ],
        commonMisunderstanding: [
          "认为'发生变化'就是'变得更好'（也可能是从乐观到担忧）",
          "把'用过更多AI'等同于'理解发生变化'（可能是量变不是质变）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'我对AI的看法变了'是什么时候？",
              "是哪个具体事件触发的？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "能用一句话描述'以前的我'和'现在的我'吗？",
              "有没有某个事件让你的看法'突然转变'？",
            ],
          },
          {
            type: "变化",
            prompts: ["你预期未来你的看法还会变吗？往哪个方向？"],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "清晰的概念演进",
            "可能具有反思习惯",
            "能具体描述变化的轨迹",
          ],
          exploreDirection: [
            "能用一句话描述'以前的你'和'现在的你'吗？",
            "这个变化是好事还是坏事？",
          ],
        },
        midScore: {
          mayMean: ["感受到变化，但不那么清晰", "可能是渐进的，没有明显节点"],
          exploreDirection: [
            "你感受到的变化主要在哪方面？（使用/态度/理解）",
            "这个变化是怎么发生的？",
          ],
        },
        lowScore: {
          mayMean: [
            "看法相对稳定",
            "可能从未系统反思过",
            "可能使用经验较短",
          ],
          exploreDirection: [
            "你觉得自己的看法稳定是因为什么？（深思熟虑/不关心/没变化）",
            "如果发生变化，你希望往哪个方向？",
          ],
        },
      },
      literacy: {
        abilityChain: ["概念重构", "→", "认知演进", "→", "反思能力"],
        distinction: [
          "量变积累",
          "vs",
          "质变重构",
          "（用得更多 vs 想法本质改变）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q1",
        triggerKeywords: ["以前", "现在", "判断"],
        associationNote: "判断标准的变化是概念演进的一部分，可在Q1时追溯",
      },
      {
        targetQuestion: "Q2",
        triggerKeywords: ["越来越", "变化", "感知"],
        associationNote: "感知变化是概念演进的一部分，可在Q2时追溯",
      },
      {
        targetQuestion: "Q15",
        triggerKeywords: ["原则", "未来", "打算"],
        associationNote: "概念变化影响使用原则，可在Q15时深入",
      },
    ],
  },

  // ============================================================
  // Q15: 使用原则（元认知能力）— 我有自己明确的AI使用原则或边界
  // ============================================================
  Q15: {
    questionId: "Q15",
    keywords: ["原则", "边界", "自律", "元认知"],
    thinkingWindows: {
      meaning: {
        focusPoints: [
          "TA的使用原则是否清晰（能具体说出来）",
          "TA的原则来源是什么（自我反思/他人影响/职业规范）",
          "TA的原则是'约束性'还是'引导性'",
          "TA是否定期反思和调整原则",
        ],
        commonMisunderstanding: [
          "认为'有原则'就是'限制使用'（也可能是积极引导）",
          "把'偶尔想过'等同于'有原则'（需要能清晰表达）",
        ],
      },
      experience: {
        storyEntries: [
          {
            type: "第一次",
            prompts: [
              "第一次意识到'我需要原则'是什么时候？",
              "是什么触发了这种意识？",
            ],
          },
          {
            type: "典型经历",
            prompts: [
              "你的原则是什么？能说3条吗？",
              "有没有'违反自己原则'的经历？当时什么感受？",
            ],
          },
          {
            type: "变化",
            prompts: [
              "你的原则有没有变化？（从模糊→清晰，或从严格→灵活）",
            ],
          },
        ],
      },
      choice: {
        highScore: {
          mayMean: [
            "清晰的使用原则",
            "强烈的元认知能力",
            "可能经过系统反思",
          ],
          exploreDirection: [
            "你的原则是什么？能说3条吗？",
            "这些原则是怎么形成的？",
          ],
        },
        midScore: {
          mayMean: ["有模糊的原则，但不清晰", "偶尔反思，不系统"],
          exploreDirection: [
            "如果让你说一条原则，你会说什么？",
            "在什么情境下你会想到'要有原则'？",
          ],
        },
        lowScore: {
          mayMean: [
            "随性使用，无固定原则",
            "可能优先便利性",
            "可能从未反思过",
          ],
          exploreDirection: [
            "你没有原则的原因是什么？（没必要/没想过/随性）",
            "如果让你现在定一条原则，你会定什么？",
          ],
        },
      },
      literacy: {
        abilityChain: ["元认知", "→", "使用原则", "→", "自我调节能力"],
        distinction: [
          "约束性原则",
          "vs",
          "引导性原则",
          "（不该做什么 vs 应该做什么）",
        ],
      },
    },
    crossQuestionAssociations: [
      {
        targetQuestion: "Q9",
        triggerKeywords: ["边界", "局限", "适用"],
        associationNote: "边界认知是使用原则的基础，可在Q9时追溯",
      },
      {
        targetQuestion: "Q14",
        triggerKeywords: ["变化", "演进", "反思"],
        associationNote: "概念变化影响原则形成，可在Q14时追溯",
      },
    ],
  },
};
