# 议程3：四思考窗口Question Schema（Q6-Q10）

**文档版本**: v1.0
**创建日期**: 2026-07-26
**优先级**: 🔴 P0（🔥 **今日重点**）
**本文件覆盖**: Q6-Q10完整Schema
**承接**: `议程3_四思考窗口Schema_框架与Q1-Q5.md`

---

## 📝 Q6 完整Schema

### 基本信息

```yaml
question_id: "Q6"
content: "（新技术接触题）当出现新的AI工具时，我会主动尝试"
journey_stage: "使用AI"
question_type: "能力"
measurement_target: "新技术接触意愿（学习能力）"
related_dimension: "E（探索者端）"
```

**注**：Q6是测量"探索者"倾向的核心题，高分=主动尝试新工具，低分=等待工具成熟。

### 关键词

```json
["尝试", "新工具", "主动", "跟进"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA对'新AI工具'的信息敏感度（从哪里得知）",
    "TA的尝试动机（好奇/实用/社交话题）",
    "TA对新工具的判断标准（什么值得试）",
    "TA是'第一批尝鲜者'还是'大众用户'"
  ],
  "common_misunderstanding": [
    "认为'主动尝试'就是'盲目追新'（其实是探索能力）",
    "把'用过新工具'等同于'主动尝试'（可能是被动跟风）"
  ]
}
```

### 思考窗口2：经验叙事

```json
{
  "story_entries": [
    {
      "type": "第一次",
      "prompts": [
        "第一次主动尝试新AI工具是什么时候？",
        "是什么让你决定'试一试'？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "最近一次尝试的新AI工具是什么？体验如何？",
        "有没有'跟风尝试但后悔'的经历？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对新工具的态度有没有变化？（从热衷→理性，或从观望→主动）"
      ]
    }
  ]
}
```

### 思考窗口3：选择解释

```json
{
  "high_score": {
    "score_range": [5, 6, 7],
    "may_mean": [
      "典型的探索者",
      "把AI当成'玩具/实验场'",
      "信息敏感度高"
    ],
    "explore_direction": [
      "你尝试新工具的动机是什么？（好奇/实用/分享）",
      "尝试后，你会持续使用还是很快就放下？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "视工具热度而定",
      "可能跟风尝试，但不主动"
    ],
    "explore_direction": [
      "什么样的工具会吸引你主动尝试？",
      "什么样的工具你完全没兴趣？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "等待工具成熟后再使用",
      "注重稳定，不追新",
      "可能工具需求已满足"
    ],
    "explore_direction": [
      "你不尝试新工具的原因是什么？（没必要/怕麻烦/不信任）",
      "有没有'错过早期尝试'而遗憾的经历？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "学习能力", "→", "新技术适应力", "→", "工具更新意识"
  ],
  "distinction": [
    "主动探索", "vs", "被动跟进",
    "（自己发现新工具 vs 等别人推荐）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q3",
    "trigger_keywords": ["任务", "实用", "效率"],
    "association_note": "探索意愿影响使用动机，可在Q3时呼应"
  },
  {
    "target_question": "Q4",
    "trigger_keywords": ["选择", "对比", "工具"],
    "association_note": "主动尝试者通常工具认知广（Q4），可在Q4时追溯"
  }
]
```

---

## 📝 Q7 完整Schema

### 基本信息

```yaml
question_id: "Q7"
content: "（任务分配题）我愿意把复杂任务交给AI处理"
journey_stage: "信任AI"
question_type: "情境"
measurement_target: "任务分配意愿（信任形成）"
related_dimension: "T（信任者端）"
```

**注**：Q7是测量"信任者"倾向的核心题，高分=信任AI处理复杂任务，低分=倾向人工处理。

### 关键词

```json
["交给", "复杂", "信任", "依赖"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA对'复杂任务'的定义（什么算复杂）",
    "TA信任AI的边界在哪里（哪些愿意交，哪些不愿意）",
    "TA的信任来源是什么（经验/口碑/能力认知）",
    "TA是否区分'交给AI'和'依赖AI'"
  ],
  "common_misunderstanding": [
    "认为'愿意交给'就是'盲目信任'（可能是理性评估后的选择）",
    "把'交给AI'等同于'不会做'（可能是为了效率）"
  ]
}
```

### 思考窗口2：经验叙事

```json
{
  "story_entries": [
    {
      "type": "第一次",
      "prompts": [
        "第一次把'复杂任务'交给AI是什么时候？",
        "那次是主动选择还是被逼无奈？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "最近一次把复杂任务交给AI的经历",
        "有没有'交给AI后结果很差'的经历？当时怎么处理？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对'交给AI'的意愿有没有变化？（从谨慎→放心，或反之）"
      ]
    }
  ]
}
```

### 思考窗口3：选择解释

```json
{
  "high_score": {
    "score_range": [5, 6, 7],
    "may_mean": [
      "强烈的信任倾向",
      "愿意在重要场景依赖AI",
      "可能已有较多成功经验"
    ],
    "explore_direction": [
      "这种信任是怎么建立的？（哪次关键经历）",
      "信任的边界在哪里？什么任务你绝对不会交？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "视任务类型而定",
      "部分信任，部分保留"
    ],
    "explore_direction": [
      "哪些任务你愿意交？哪些不愿意？",
      "判断标准是什么？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "倾向人工处理复杂任务",
      "对AI能力持保留态度",
      "可能注重控制感"
    ],
    "explore_direction": [
      "你不愿交给AI的原因是什么？（不信任/享受过程/怕出错）",
      "如果AI能力提升，你会改变吗？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "任务分配意愿", "→", "信任形成", "→", "依赖程度评估"
  ],
  "distinction": [
    "理性信任", "vs", "盲目依赖",
    "（评估后交 vs 不加判断地交）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q5",
    "trigger_keywords": ["调试", "协作", "耐心"],
    "association_note": "协作经验影响信任形成，可在Q5时追溯"
  },
  {
    "target_question": "Q8",
    "trigger_keywords": ["验证", "检查", "结果"],
    "association_note": "交给AI后是否验证结果？信任与验证的张力，可在Q8时深入"
  },
  {
    "target_question": "Q9",
    "trigger_keywords": ["边界", "局限", "适用"],
    "association_note": "信任形成与边界意识相关，可在Q9时呼应"
  }
]
```

---

## 📝 Q8 完整Schema

### 基本信息

```yaml
question_id: "Q8"
content: "（结果验证题）我会主动检查或验证AI给出的结果"
journey_stage: "信任AI"
question_type: "能力"
measurement_target: "结果验证能力（批判性思维）"
related_dimension: "V（验证者端）"
```

**注**：Q8是测量"验证者"倾向的核心题，高分=主动验证，低分=直接接受。

### 关键词

```json
["验证", "检查", "核实", "批判"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA对'验证'的理解（抽查/全检/交叉验证）",
    "TA的验证动机（怕错/学习/职业习惯）",
    "TA验证的方法是什么（搜索/对比/询问他人）",
    "TA是否区分'信任AI'和'需要验证'"
  ],
  "common_misunderstanding": [
    "认为'验证'就是'不信任'（其实是负责任的使用）",
    "把'偶尔检查'等同于'系统性验证'"
  ]
}
```

### 思考窗口2：经验叙事

```json
{
  "story_entries": [
    {
      "type": "第一次",
      "prompts": [
        "第一次意识到'必须验证AI结果'是什么时候？",
        "是什么经历让你建立验证习惯？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "有没有'验证后发现问题'的经历？",
        "有没有'没验证结果出错'的经历？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你的验证习惯有没有变化？（从轻信→严谨，或从过度验证→适度）"
      ]
    }
  ]
}
```

### 思考窗口3：选择解释

```json
{
  "high_score": {
    "score_range": [5, 6, 7],
    "may_mean": [
      "典型的验证者",
      "批判性思维强",
      "可能具有专业背景或职业习惯"
    ],
    "explore_direction": [
      "验证的方法是什么？（搜索/对比/专家确认）",
      "验证后发现错误，你会怎么处理？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "重要任务验证，小事直接接受",
      "验证意识存在但不系统"
    ],
    "explore_direction": [
      "什么样的结果你会验证？什么样的不会？",
      "判断标准是什么？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "倾向直接接受AI输出",
      "可能因效率优先或信任度高",
      "可能从未遇到需要验证的情况"
    ],
    "explore_direction": [
      "你不验证的原因是什么？（信任/没必要/没时间）",
      "如果结果出错，你怎么发现？怎么处理？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "结果验证能力", "→", "批判性思维", "→", "边界认知"
  ],
  "distinction": [
    "信任", "vs", "盲信",
    "（理性接受 vs 不加判断地接受）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q7",
    "trigger_keywords": ["交给", "信任", "复杂"],
    "association_note": "信任与验证是张力的两端，可在Q7时呼应"
  },
  {
    "target_question": "Q9",
    "trigger_keywords": ["边界", "局限", "适用"],
    "association_note": "验证经验形成边界认知，可在Q9时深入"
  },
  {
    "target_question": "Q12",
    "trigger_keywords": ["质疑", "权威", "盲从"],
    "association_note": "验证能力与权威质疑相关，可在Q12时深入"
  }
]
```

---

## 📝 Q9 完整Schema

### 基本信息

```yaml
question_id: "Q9"
content: "（适用边界题）我清楚AI擅长什么、不擅长什么"
journey_stage: "信任AI"
question_type: "能力"
measurement_target: "边界意识（适用性判断）"
related_dimension: "V（验证者端）"
```

### 关键词

```json
["边界", "适用", "局限", "擅长"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA对AI能力边界的认知清晰度",
    "TA的边界认知来源（经验/学习/听说）",
    "TA能否举出AI'不擅长'的具体例子",
    "TA的边界认知是否随时间变化"
  ],
  "common_misunderstanding": [
    "认为'清楚边界'就是'懂AI'（可能是表面的标签化认知）",
    "把'用过'等同于'知道边界'（可能是浅层使用）"
  ]
}
```

### 思考窗口2：经验叙事

```json
{
  "story_entries": [
    {
      "type": "第一次",
      "prompts": [
        "第一次意识到'AI也有不会的'是什么时候？",
        "那个发现是怎么发生的？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "有没有'以为AI会但其实不会'的经历？",
        "有没有'意外发现AI擅长某事'的经历？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对AI边界的认知有没有变化？（从高估→理性，或从低估→欣赏）"
      ]
    }
  ]
}
```

### 思考窗口3：选择解释

```json
{
  "high_score": {
    "score_range": [5, 6, 7],
    "may_mean": [
      "清晰的边界认知",
      "能具体说出AI擅长/不擅长的领域",
      "可能经过系统性思考"
    ],
    "explore_direction": [
      "你能举出AI'不擅长'的3个例子吗？",
      "这个边界认知是怎么形成的？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "边界认知模糊",
      "大概知道，但不具体"
    ],
    "explore_direction": [
      "你能说出AI擅长的领域吗？不擅长呢？",
      "有没有遇到过'以为会其实不会'的情况？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "边界认知不清",
      "可能高估或低估AI能力",
      "可能使用经验有限"
    ],
    "explore_direction": [
      "你觉得AI能做什么？不能做什么？",
      "如果让你给AI画一条'能力边界'，你会怎么画？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "边界意识", "→", "适用性判断", "→", "风险认知"
  ],
  "distinction": [
    "经验型认知", "vs", "标签化认知",
    "（亲身验证 vs 听别人说）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q8",
    "trigger_keywords": ["验证", "检查", "结果"],
    "association_note": "验证经验形成边界认知，可在Q8时追溯"
  },
  {
    "target_question": "Q12",
    "trigger_keywords": ["质疑", "权威", "盲从"],
    "association_note": "边界认知与批判思维相关，可在Q12时深入"
  },
  {
    "target_question": "Q15",
    "trigger_keywords": ["原则", "自律", "边界"],
    "association_note": "边界认知影响使用原则形成，可在Q15时深入"
  }
]
```

---

## 📝 Q10 完整Schema

### 基本信息

```yaml
question_id: "Q10"
content: "（社会影响题）我会思考AI对社会的影响（不仅仅是个人使用）"
journey_stage: "与AI相处"
question_type: "经验"
measurement_target: "社会影响思考（影响思考范围）"
related_dimension: "R（反思者端）"
```

### 关键词

```json
["社会", "影响", "未来", "宏观"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA是否区分'个人影响'和'社会影响'",
    "TA关注的社会影响维度（就业/伦理/教育/公平）",
    "TA的思考是'担心'还是'期待'，还是兼有",
    "TA的信息来源是什么（新闻/讨论/亲身观察）"
  ],
  "common_misunderstanding": [
    "认为'思考社会影响'就是'悲观'（也可能是积极期待）",
    "把'听说过AI议题'等同于'思考过'（可能是被动接收信息）"
  ]
}
```

### 思考窗口2：经验叙事

```json
{
  "story_entries": [
    {
      "type": "第一次",
      "prompts": [
        "第一次'跳出个人使用'思考AI的社会影响是什么时候？",
        "是什么触发了这种思考？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "最近一次让你'深思'的AI社会议题是什么？",
        "有没有和朋友/同事讨论过AI的社会影响？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对AI社会影响的看法有没有变化？（从乐观→担忧，或反之）"
      ]
    }
  ]
}
```

### 思考窗口3：选择解释

```json
{
  "high_score": {
    "score_range": [5, 6, 7],
    "may_mean": [
      "具有宏观视野",
      "关注AI的 broader implications",
      "可能读过相关讨论或参与过对话"
    ],
    "explore_direction": [
      "你最关注的社会影响维度是什么？（就业/伦理/教育）",
      "你觉得个人能做什么？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "偶尔思考，但不深入",
      "主要关注个人影响"
    ],
    "explore_direction": [
      "什么样的议题会让你'跳出来'思考？",
      "你觉得AI对社会是好事还是坏事？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "关注个人使用，较少思考宏观",
      "可能觉得'社会影响'离自己远"
    ],
    "explore_direction": [
      "你不思考社会影响的原因是什么？（没兴趣/没时间/觉得无关）",
      "如果让你想一个，你会想到什么？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "社会影响思考", "→", "宏观视野", "→", "未来预期"
  ],
  "distinction": [
    "个人视角", "vs", "社会视角",
    "（AI对我 vs AI对我们）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q2",
    "trigger_keywords": ["无处不在", "大家", "社会"],
    "association_note": "感知AI无处不在，可能延伸到社会影响思考，可在Q2时追溯"
  },
  {
    "target_question": "Q11",
    "trigger_keywords": ["隐私", "风险", "数据"],
    "association_note": "社会影响思考包括隐私风险，可在Q11时深入"
  },
  {
    "target_question": "Q14",
    "trigger_keywords": ["变化", "未来", "演进"],
    "association_note": "社会影响思考是概念演进的一部分，可在Q14时整合"
  }
]
```

---

## 📐 本文件小结

### 已完成的Schema（累计）

- ✅ Q1-Q5（见框架文档）
- ✅ Q6：新技术接触（学习能力）
- ✅ Q7：任务分配（信任形成）
- ✅ Q8：结果验证（批判性思维）
- ✅ Q9：适用边界（边界意识）
- ✅ Q10：社会影响（影响思考范围）

### 下一文件将完成

- Q11：隐私风险（风险意识）
- Q12：权威质疑（批判性思维）
- Q13：情绪应对（情绪调节）
- Q14：概念变化（概念重构）
- Q15：使用原则（元认知）

### 维度覆盖检查

| 维度 | 已覆盖题目 | 状态 |
|------|----------|------|
| E（探索者） | Q1, Q2, Q6 | ✅ 完成 |
| U（实用者） | Q3, Q4 | ✅ 完成 |
| T（信任者） | Q5, Q7 | ✅ 完成 |
| V（验证者） | Q8, Q9 | ✅ 完成（Q12待补） |
| R（反思者） | Q10 | 🔄 部分完成（Q11, Q13-Q15待补） |

---

**文档版本**: v1.0
**创建日期**: 2026-07-26
**状态**: 📝 Q6-Q10已完成
**下一步**: 继续生成Q11-Q15（见`议程3_四思考窗口Schema_Q11-Q15.md`）
