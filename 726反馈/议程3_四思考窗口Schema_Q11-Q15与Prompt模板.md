# 议程3：四思考窗口Question Schema（Q11-Q15）+ AI生成Prompt模板

**文档版本**: v1.0
**创建日期**: 2026-07-26
**优先级**: 🔴 P0（🔥 **今日重点**）
**本文件覆盖**: Q11-Q15完整Schema + AI生成Prompt模板 + 实施指南
**承接**: `议程3_四思考窗口Schema_框架与Q1-Q5.md` 和 `议程3_四思考窗口Schema_Q6-Q10.md`

---

## 📝 Q11 完整Schema

### 基本信息

```yaml
question_id: "Q11"
content: "（隐私风险题）我会关注使用AI时的隐私和数据安全问题"
journey_stage: "与AI相处"
question_type: "经验"
measurement_target: "隐私风险意识"
related_dimension: "R（反思者端）"
```

### 关键词

```json
["隐私", "数据", "风险", "安全"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA对'隐私风险'的具体理解（知道哪些风险）",
    "TA的关注是主动的还是被动的（新闻驱动 vs 主动思考）",
    "TA是否采取过保护措施（不输入敏感信息/用代理工具等）",
    "TA对'数据被收集'的态度（接受/担忧/无感）"
  ],
  "common_misunderstanding": [
    "认为'关注隐私'就是'不用AI'（其实是负责任地使用）",
    "把'听说过数据泄露'等同于'有关注意识'（可能是信息被动接收）"
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
        "第一次意识到'用AI有隐私风险'是什么时候？",
        "是什么让你意识到的？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "有没有'因为隐私考虑而不使用AI'的经历？",
        "有没有'输入了敏感信息后后悔'的经历？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对隐私风险的关注度有没有变化？（从无感→敏感，或反之）"
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
      "高度关注隐私",
      "可能采取过保护措施",
      "对数据流向敏感"
    ],
    "explore_direction": [
      "你采取过哪些保护措施？",
      "你觉得这些措施有效吗？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "知道有风险，但关注度一般",
      "偶尔注意，不系统"
    ],
    "explore_direction": [
      "什么样的信息你会避免输入？什么样的无所谓？",
      "你的判断标准是什么？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "较少关注隐私问题",
      "可能觉得'没什么好隐瞒'",
      "可能优先便利性"
    ],
    "explore_direction": [
      "你不关注隐私的原因是什么？（没必要/不懂/嫌麻烦）",
      "如果发生数据泄露，你会怎么应对？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "风险意识", "→", "隐私保护能力", "→", "数据敏感度"
  ],
  "distinction": [
    "被动接收信息", "vs", "主动评估风险",
    "（听说有风险 vs 主动判断风险）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q9",
    "trigger_keywords": ["边界", "局限", "适用"],
    "association_note": "边界意识包括隐私边界，可在Q9时追溯"
  },
  {
    "target_question": "Q10",
    "trigger_keywords": ["社会", "影响", "数据"],
    "association_note": "隐私是社会影响的重要维度，可在Q10时呼应"
  },
  {
    "target_question": "Q13",
    "trigger_keywords": ["情绪", "焦虑", "担心"],
    "association_note": "隐私风险可能引发焦虑情绪，可在Q13时深入"
  }
]
```

---

## 📝 Q12 完整Schema

### 基本信息

```yaml
question_id: "Q12"
content: "（权威质疑题）我不会因为AI表现得'专业'就盲从它的输出"
journey_stage: "信任AI"
question_type: "能力"
measurement_target: "权威质疑能力（批判性思维）"
related_dimension: "V（验证者端）"
```

### 关键词

```json
["质疑", "权威", "盲从", "专业外表"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA对'专业外表'的免疫力如何",
    "TA是否区分'AI看起来对'和'AI真的对'",
    "TA质疑的依据是什么（常识/专业背景/直觉）",
    "TA在什么情境下更容易盲从（紧急/不熟悉/权威背书）"
  ],
  "common_misunderstanding": [
    "认为'质疑'就是'反对AI'（其实是理性使用）",
    "把'不盲从'等同于'不相信'（可能是验证后相信）"
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
        "第一次意识到'AI看起来专业但其实是错'是什么时候？",
        "那次经历让你对AI的看法有什么变化？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "有没有'被AI的自信说服但后来发现错了'的经历？",
        "有没有'坚持质疑最后证明自己对'的经历？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对'AI专业外表'的态度有没有变化？（从信任→质疑，或反之）"
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
      "强烈的批判意识",
      "对AI的'专业外表'保持距离",
      "可能具有专业背景或独立思考习惯"
    ],
    "explore_direction": [
      "你质疑的依据是什么？（专业背景/常识/直觉）",
      "有没有'质疑后发现自己错了'的经历？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "重要问题会质疑，小事直接接受",
      "质疑意识存在但不稳定"
    ],
    "explore_direction": [
      "什么样的AI输出你会质疑？什么样的不会？",
      "判断标准是什么？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "倾向相信AI的专业性",
      "可能因效率优先或缺乏质疑习惯",
      "可能从未遇到需要质疑的情况"
    ],
    "explore_direction": [
      "你不质疑的原因是什么？（信任/没必要/不懂）",
      "如果AI结果有问题，你怎么发现？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "批判性思维", "→", "权威质疑能力", "→", "独立判断"
  ],
  "distinction": [
    "理性信任", "vs", "盲从",
    "（评估后接受 vs 不加判断地接受）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q8",
    "trigger_keywords": ["验证", "检查", "结果"],
    "association_note": "验证是质疑的行动表现，可在Q8时追溯"
  },
  {
    "target_question": "Q9",
    "trigger_keywords": ["边界", "局限", "适用"],
    "association_note": "质疑能力与边界认知相关，可在Q9时呼应"
  }
]
```

---

## 📝 Q13 完整Schema

### 基本信息

```yaml
question_id: "Q13"
content: "（情绪应对题）当AI让我感到挫败或焦虑时，我能调整心态继续使用"
journey_stage: "与AI相处"
question_type: "实践"
measurement_target: "情绪应对能力（情绪调节）"
related_dimension: "R（反思者端）"
```

### 关键词

```json
["情绪", "挫败", "焦虑", "调节"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA在使用AI时的典型情绪反应（挫败/焦虑/兴奋/平静）",
    "TA的情绪触发点是什么（结果不好/不会用/对比他人）",
    "TA的调节方式是什么（休息/换工具/坚持/求助）",
    "TA是否区分'对AI的情绪'和'对自己的情绪'"
  ],
  "common_misunderstanding": [
    "认为'调整心态'就是'压抑情绪'（其实是积极应对）",
    "把'没情绪'等同于'情绪调节能力强'（可能是不投入）"
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
        "第一次因AI感到挫败/焦虑是什么时候？",
        "是什么具体情境触发的？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "最近一次因AI产生负面情绪的经历",
        "有没有'从挫败到突破'的转变经历？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你对AI的情绪反应有没有变化？（从易挫败→平静，或反之）"
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
      "情绪调节能力强",
      "能区分'工具问题'和'自我价值'",
      "可能具有成长型思维"
    ],
    "explore_direction": [
      "你的调节方式是什么？（休息/换工具/求助）",
      "这种能力是怎么形成的？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "视情境而定",
      "有时能调节，有时被情绪影响"
    ],
    "explore_direction": [
      "什么样的情境容易让你失控？",
      "什么样的情境你能保持平静？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "情绪反应强烈",
      "可能因挫败而减少使用",
      "可能把'AI不会用'等同于'自己不行'"
    ],
    "explore_direction": [
      "你最强烈的情绪反应是什么时候？",
      "有没有因为情绪而放弃使用AI的经历？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "情绪调节", "→", "挫败应对", "→", "心理韧性"
  ],
  "distinction": [
    "工具型情绪", "vs", "自我型情绪",
    "（对AI不满 vs 对自己不满）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q5",
    "trigger_keywords": ["调试", "耐心", "协作"],
    "association_note": "调试耐心是情绪调节的一部分，可在Q5时追溯"
  },
  {
    "target_question": "Q11",
    "trigger_keywords": ["焦虑", "担心", "隐私"],
    "association_note": "隐私风险可能引发焦虑，可在Q11时呼应"
  }
]
```

---

## 📝 Q14 完整Schema

### 基本信息

```yaml
question_id: "Q14"
content: "（概念变化题）我对AI的理解和态度，在过去一段时间发生了明显变化"
journey_stage: "重新定义AI"
question_type: "经验"
measurement_target: "概念重构能力（认知演进）"
related_dimension: "R（反思者端）"
```

### 关键词

```json
["变化", "演进", "重构", "以前vs现在"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA能否清晰描述'变化前'和'变化后'的具体差异",
    "TA的变化方向是什么（从陌生→熟悉，从乐观→理性等）",
    "TA的变化触发点是什么（具体事件/渐进积累/他人影响）",
    "TA是否意识到自己的变化（元认知）"
  ],
  "common_misunderstanding": [
    "认为'发生变化'就是'变得更好'（也可能是从乐观到担忧）",
    "把'用过更多AI'等同于'理解发生变化'（可能是量变不是质变）"
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
        "第一次意识到'我对AI的看法变了'是什么时候？",
        "是哪个具体事件触发的？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "能用一句话描述'以前的我'和'现在的我'吗？",
        "有没有某个事件让你的看法'突然转变'？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你预期未来你的看法还会变吗？往哪个方向？"
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
      "清晰的概念演进",
      "可能具有反思习惯",
      "能具体描述变化的轨迹"
    ],
    "explore_direction": [
      "能用一句话描述'以前的你'和'现在的你'吗？",
      "这个变化是好事还是坏事？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "感受到变化，但不那么清晰",
      "可能是渐进的，没有明显节点"
    ],
    "explore_direction": [
      "你感受到的变化主要在哪方面？（使用/态度/理解）",
      "这个变化是怎么发生的？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "看法相对稳定",
      "可能从未系统反思过",
      "可能使用经验较短"
    ],
    "explore_direction": [
      "你觉得自己的看法稳定是因为什么？（深思熟虑/不关心/没变化）",
      "如果发生变化，你希望往哪个方向？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "概念重构", "→", "认知演进", "→", "反思能力"
  ],
  "distinction": [
    "量变积累", "vs", "质变重构",
    "（用得更多 vs 想法本质改变）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q1",
    "trigger_keywords": ["以前", "现在", "判断"],
    "association_note": "判断标准的变化是概念演进的一部分，可在Q1时追溯"
  },
  {
    "target_question": "Q2",
    "trigger_keywords": ["越来越", "变化", "感知"],
    "association_note": "感知变化是概念演进的一部分，可在Q2时追溯"
  },
  {
    "target_question": "Q15",
    "trigger_keywords": ["原则", "未来", "打算"],
    "association_note": "概念变化影响使用原则，可在Q15时深入"
  }
]
```

---

## 📝 Q15 完整Schema

### 基本信息

```yaml
question_id: "Q15"
content: "（使用原则题）我有自己明确的AI使用原则或边界"
journey_stage: "重新定义AI"
question_type: "反思"
measurement_target: "使用原则（元认知能力）"
related_dimension: "R（反思者端）"
```

### 关键词

```json
["原则", "边界", "自律", "元认知"]
```

### 思考窗口1：题目理解

```json
{
  "focus_points": [
    "TA的使用原则是否清晰（能具体说出来）",
    "TA的原则来源是什么（自我反思/他人影响/职业规范）",
    "TA的原则是'约束性'还是'引导性'",
    "TA是否定期反思和调整原则"
  ],
  "common_misunderstanding": [
    "认为'有原则'就是'限制使用'（也可能是积极引导）",
    "把'偶尔想过'等同于'有原则'（需要能清晰表达）"
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
        "第一次意识到'我需要原则'是什么时候？",
        "是什么触发了这种意识？"
      ]
    },
    {
      "type": "典型经历",
      "prompts": [
        "你的原则是什么？能说3条吗？",
        "有没有'违反自己原则'的经历？当时什么感受？"
      ]
    },
    {
      "type": "变化",
      "prompts": [
        "你的原则有没有变化？（从模糊→清晰，或从严格→灵活）"
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
      "清晰的使用原则",
      "强烈的元认知能力",
      "可能经过系统反思"
    ],
    "explore_direction": [
      "你的原则是什么？能说3条吗？",
      "这些原则是怎么形成的？"
    ]
  },
  "mid_score": {
    "score_range": [3, 4],
    "may_mean": [
      "有模糊的原则，但不清晰",
      "偶尔反思，不系统"
    ],
    "explore_direction": [
      "如果让你说一条原则，你会说什么？",
      "在什么情境下你会想到'要有原则'？"
    ]
  },
  "low_score": {
    "score_range": [1, 2],
    "may_mean": [
      "随性使用，无固定原则",
      "可能优先便利性",
      "可能从未反思过"
    ],
    "explore_direction": [
      "你没有原则的原因是什么？（没必要/没想过/随性）",
      "如果让你现在定一条原则，你会定什么？"
    ]
  }
}
```

### 思考窗口4：素养关联

```json
{
  "ability_chain": [
    "元认知", "→", "使用原则", "→", "自我调节能力"
  ],
  "distinction": [
    "约束性原则", "vs", "引导性原则",
    "（不该做什么 vs 应该做什么）"
  ]
}
```

### 跨题关联

```json
[
  {
    "target_question": "Q9",
    "trigger_keywords": ["边界", "局限", "适用"],
    "association_note": "边界认知是使用原则的基础，可在Q9时追溯"
  },
  {
    "target_question": "Q14",
    "trigger_keywords": ["变化", "演进", "反思"],
    "association_note": "概念变化影响原则形成，可在Q14时追溯"
  }
]
```

---

## 🤖 AI生成Prompt模板

### 用途

本Prompt用于**离线生成**更多题目的Question Schema（如未来扩展到Q16+，或对Q1-Q15进行内容迭代）。**生成后必须经过人工审核**才能入库。

### Prompt模板

```
你是一个质性研究专家，正在为一道AI素养访谈题设计访谈辅助内容。

## 题目信息
- 题目ID: {question_id}
- 题目内容: {question_content}
- 测量目标: {measurement_target}
- 关联维度: {related_dimension}
- 所属阶段: {journey_stage}

## 任务要求
请基于以上题目信息，生成四个思考窗口的内容。

## 输出格式（严格JSON）

```json
{
  "question_id": "{question_id}",
  "keywords": ["关键词1", "关键词2", "关键词3"],
  "thinking_windows": {
    "meaning": {
      "focus_points": [
        "核心关注点1（具体到这道题）",
        "核心关注点2",
        "核心关注点3",
        "核心关注点4"
      ],
      "common_misunderstanding": [
        "常见误区1",
        "常见误区2"
      ]
    },
    "experience": {
      "story_entries": [
        {
          "type": "第一次",
          "prompts": ["具体提示1", "具体提示2"]
        },
        {
          "type": "典型经历",
          "prompts": ["具体提示1"]
        },
        {
          "type": "变化",
          "prompts": ["具体提示1"]
        }
      ]
    },
    "choice": {
      "high_score": {
        "score_range": [5, 6, 7],
        "may_mean": ["可能意味着1", "可能意味着2", "可能意味着3"],
        "explore_direction": ["探索方向1", "探索方向2"]
      },
      "mid_score": {
        "score_range": [3, 4],
        "may_mean": ["可能意味着1", "可能意味着2"],
        "explore_direction": ["探索方向1", "探索方向2"]
      },
      "low_score": {
        "score_range": [1, 2],
        "may_mean": ["可能意味着1", "可能意味着2", "可能意味着3"],
        "explore_direction": ["探索方向1", "探索方向2"]
      }
    },
    "literacy": {
      "ability_chain": ["能力1", "→", "能力2", "→", "能力3"],
      "distinction": ["维度A", "vs", "维度B", "（说明）"]
    }
  },
  "cross_question_associations": [
    {
      "target_question": "QX",
      "trigger_keywords": ["关键词1", "关键词2"],
      "association_note": "关联说明"
    }
  ]
}
```

## 内容设计原则

1. **关键词必须是该题独有**
   - ❌ 错误：用"识别·分辨·判断"作为所有题的关键词
   - ✅ 正确：根据题目具体含义设计关键词

2. **素养关联必须对应测量目标**
   - ❌ 错误：所有题都用"AI识别→AI理解→技术判断"
   - ✅ 正确：根据题目测量的具体能力设计关联链

3. **经验叙事必须结合题目语境**
   - ❌ 错误：所有题的故事入口都是"第一次接触AI"
   - ✅ 正确：根据题目主题设计故事入口（如Q5是"调试AI的经历"）

4. **语言要口语化**
   - ❌ 错误：使用学术术语
   - ✅ 正确：使用日常语言

5. **保持开放性**
   - ❌ 错误：暗示"正确答案"
   - ✅ 正确：强调"每种回答都值得理解"

## 参考示例

请参考以下Q1的完整Schema作为质量基准：

[此处插入Q1的完整Schema作为few-shot示例]

## 注意事项

- 不要提供固定问题，而是提供思考方向
- 高分/中分/低分都要有具体的内容，不能用占位符
- 跨题关联要基于具体的语境，不能是"通用关联"
```

### 人工审核标准

生成的Schema必须满足以下标准才能入库：

1. **关键词独有性**：3-5个关键词必须是该题特有，不能与其他题重复
2. **核心关注具体性**：focus_points必须具体到这道题，不能是通用问题
3. **故事入口语境化**：story_entries必须结合题目主题，不能是"第一次接触AI"的通用模板
4. **素养关联对应性**：ability_chain必须对应题目的measurement_target
5. **三档解释完整性**：high/mid/low必须有差异化的内容，不能简单重复
6. **跨题关联合理性**：trigger_keywords必须是与目标题相关的具体词汇

---

## 📐 实施指南

### 开发者执行步骤

#### Step 1：数据库表结构调整（1小时）

```sql
-- 确保question_schemas表结构符合本次Schema
-- 参见议程3_框架与Q1-Q5.md中的TypeScript接口定义

ALTER TABLE question_schemas
  ADD COLUMN IF NOT EXISTS keywords JSON,
  ADD COLUMN IF NOT EXISTS thinking_windows JSON,
  ADD COLUMN IF NOT EXISTS cross_question_associations JSON;
```

#### Step 2：导入15题完整Schema数据（2小时）

将本文件（及框架文档、Q6-Q10文档）中的JSON数据，整理为SQL INSERT语句或JSON配置文件，导入数据库。

**推荐方式**：创建一个`question_schemas_data.json`文件，包含所有15题的Schema，然后批量导入。

```javascript
// data/question_schemas_data.js

const questionSchemas = {
  Q1: { /* 来自框架文档 */ },
  Q2: { /* 来自框架文档 */ },
  Q3: { /* 来自框架文档 */ },
  Q4: { /* 来自框架文档 */ },
  Q5: { /* 来自框架文档 */ },
  Q6: { /* 来自Q6-Q10文档 */ },
  Q7: { /* 来自Q6-Q10文档 */ },
  Q8: { /* 来自Q6-Q10文档 */ },
  Q9: { /* 来自Q6-Q10文档 */ },
  Q10: { /* 来自Q6-Q10文档 */ },
  Q11: { /* 来自本文件 */ },
  Q12: { /* 来自本文件 */ },
  Q13: { /* 来自本文件 */ },
  Q14: { /* 来自本文件 */ },
  Q15: { /* 来自本文件 */ }
};

export default questionSchemas;
```

#### Step 3：前端组件调整（2小时）

修改`WindowContent.jsx`组件，确保能正确渲染本次Schema的字段结构。

**关键修改点**：
- 题目理解窗口：渲染`focus_points`和`common_misunderstanding`
- 经验叙事窗口：渲染`story_entries`（type + prompts）
- 选择解释窗口：根据答案分数选择high/mid/low，渲染`may_mean`和`explore_direction`
- 素养关联窗口：渲染`ability_chain`和`distinction`

#### Step 4：跨题关联逻辑（1小时）

修改访谈引擎，根据被访者回答的关键词，触发跨题关联提示。

```javascript
// 基于本Schema的cross_question_associations字段
function checkCrossQuestionAssociations(questionId, interviewAnswer) {
  const schema = getQuestionSchema(questionId);
  const associations = [];

  for (const rule of schema.cross_question_associations) {
    const hasKeyword = rule.trigger_keywords.some(kw =>
      interviewAnswer.toLowerCase().includes(kw.toLowerCase())
    );

    if (hasKeyword) {
      associations.push({
        target_question: rule.target_question,
        association_note: rule.association_note
      });
    }
  }

  return associations;
}
```

### 验收清单

- [ ] 数据库中15题的Schema数据完整
- [ ] 每道题的关键词是独有的（非通用占位符）
- [ ] 每道题的素养关联链对应实际测量能力
- [ ] 每道题的跨题关联规则明确
- [ ] 前端能正确渲染四思考窗口的具体内容
- [ ] 选择解释窗口能根据分数动态切换high/mid/low
- [ ] 跨题关联能在被访者回答包含触发词时提示

---

## 📐 议程3整体小结

### 完成的交付物

1. ✅ **Question Schema框架规范**（框架文档）
2. ✅ **15题完整Schema数据**（Q1-Q15分布在3个文档）
3. ✅ **AI生成Prompt模板**（本文件）
4. ✅ **实施指南**（本文件）

### 核心改进对比

| 维度 | 725版本（问题） | 726版本（本次） |
|------|---------------|---------------|
| **关键词** | 通用占位符 | 每题独有3-5个 |
| **素养关联** | 所有题相同 | 对应测量目标 |
| **经验叙事** | 通用"第一次接触AI" | 结合题目语境 |
| **跨题关联** | 无明确规则 | 触发关键词+目标题号 |
| **三档解释** | 部分题缺失 | 15题全部完整 |

### 维度覆盖完成度

| 维度 | 题目 | 状态 |
|------|------|------|
| E（探索者） | Q1, Q2, Q6 | ✅ |
| U（实用者） | Q3, Q4 | ✅ |
| T（信任者） | Q5, Q7 | ✅ |
| V（验证者） | Q8, Q9, Q12 | ✅ |
| R（反思者） | Q10, Q11, Q13, Q14, Q15 | ✅ |

**全部15题Schema已完成。**

---

**文档版本**: v1.0
**创建日期**: 2026-07-26
**状态**: 📝 全部15题Schema已完成
**下一步**: 开发者按实施指南执行；同时进入议程4（页面跳转Bug）
