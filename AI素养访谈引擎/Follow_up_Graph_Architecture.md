# 认知旅程追问图谱架构

## 一、核心设计理念转变

### 1.1 从"开放式对话"到"结构化认知旅程"

**原有设计的问题**：
- Follow-up Graph虽然有丰富的追问节点，但缺少明确的"旅程路径"
- 追问容易变成漫无目的的对话
- 15道题的叙事价值没有充分发挥

**新的设计理念**：
- 追问图谱嵌入到认知旅程的每个阶段
- 每道题的选择都成为"针对性追问的起点"
- 用户明确感知"我在哪里"、"要去哪里"

### 1.2 追问的四个层次（保持不变）

```
Layer 1: 基础理解层 (Basic Understanding)
    ↓
Layer 2: 经验追溯层 (Experience Elicitation)
    ↓
Layer 3: 矛盾挖掘层 (Contradiction Detection)
    ↓
Layer 4: 反思重构层 (Reflective Reconstruction)
```

### 1.3 新增：旅程阶段图谱

**关键创新**：从"开放式对话图谱"转向"旅程阶段图谱"

```json
{
  "journey_phase_graph": {
    "phase_id": "phase_2_how_do_you_use_ai",
    "phase_name": "你怎么用AI？",
    "phase_objective": "探讨AI使用的具体实践，特别是协作意愿",
    "framework_lens": "AI协作者",
    "questions_in_phase": ["Q3", "Q4", "Q5", "Q6"],
    "stage_number": 2
  }
}
```

---

## 二、Journey-Based Follow-up Graph 数据结构

### 2.1 旅程阶段节点定义

```python
class JourneyPhaseNode:
    """认知旅程阶段节点"""
    def __init__(self):
        self.phase_id = "string"              # 阶段ID
        self.phase_name = "string"            # 阶段名称
        self.stage_number = 1                # 阶段编号（1-6）
        self.objective = "string"             # 阶段目标
        self.framework_lens = "string"       # 风格框架透镜
        self.questions_in_phase = []         # 该阶段包含的题目
        self.entry_question = ""             # 阶段入口问题
        self.closure_question = ""            # 阶段总结问题
        self.question_graphs = {}            # 题目级追问图谱
        self.cross_question_analysis = {}   # 跨题目分析
```

### 2.2 题目级追问图谱（基于用户选择）

```python
class QuestionSpecificGraph:
    """题目级追问图谱"""
    def __init__(self):
        self.question_id = "string"           # 题目ID
        self.user_response = {
            "score": 0,                       # 用户得分（1-7）
            "original_choice": "",            # 用户原始选择
            "timestamp": ""                 # 回答时间
        }
        self.follow_up_sequence = []        # 追问序列
        self.framework_connections = []     # 与框架的连接
        self.contradiction_checks = []       # 矛盾检测点

    def generate_follow_up_sequence(self):
        """生成基于用户具体选择的追问序列"""
        sequence = [
            {
                "layer": "experience_elicitation",
                "objective": "追溯具体经历",
                "question": self._generate_experience_question(),
                "depth": 1
            },
            {
                "layer": "detail_probing",
                "objective": "挖掘过程细节",
                "question": self._generate_detail_question(),
                "depth": 2,
                "trigger": "user_gave_initial_experience"
            },
            {
                "layer": "framework_connection",
                "objective": "联系风格框架",
                "question": self._generate_framework_question(),
                "depth": 3,
                "trigger": "layer_2_completed"
            },
            {
                "layer": "contradiction_exploration",
                "objective": "探索矛盾与盲区",
                "question": self._generate_contradiction_question(),
                "depth": 4,
                "trigger": "detect_contradiction"
            },
            {
                "layer": "reflection_prompt",
                "objective": "引发深度反思",
                "question": self._generate_reflection_question(),
                "depth": 5,
                "trigger": "layer_4_completed"
            }
        ]
        return sequence
```

---

## 三、认知旅程的六个阶段

### 阶段1：认识AI (Q1, Q2)

**阶段目标**：带着"AI协作者"框架，重新审视"认识AI"的两个维度

**阶段配置**：
```json
{
  "stage_1": {
    "stage_number": 1,
    "stage_name": "认识AI",
    "questions": ["Q1", "Q2"],
    "objective": "带着风格框架，重新审视'认识AI'的两个维度",
    "framework_lens": "AI协作者",
    "entry_question": "让我们开始第一段旅程：认识AI。作为{framework}，你在'认识AI'方面的得分是{scores}。这意味着你{implication}。我们想更深入了解：",
    "question_graphs": {
      "Q1": {
        "question_text": "我通常能够判断，一个应用或服务是否真正使用了AI",
        "follow_up_sequence": [
          {
            "layer": "experience_elicitation",
            "question": "你选择了{response}（{score}分）。能讲一个你最近识别AI应用的具体例子吗？",
            "depth": 1
          },
          {
            "layer": "detail_probing",
            "question": "当时你是怎么判断出来的？有什么判断标准？",
            "depth": 2
          },
          {
            "layer": "framework_connection",
            "question": "这个识别能力如何体现了'{framework}'的特征？",
            "depth": 3
          }
        ]
      },
      "Q2": {
        "question_text": "我发现，自己已经越来越容易注意到生活中哪些地方正在使用AI",
        "follow_up_sequence": [
          {
            "layer": "experience_elicitation",
            "question": "你选择了{response}（{score}分）。能讲一个你最近注意到生活中AI应用的例子吗？",
            "depth": 1
          },
          {
            "layer": "detail_probing",
            "question": "这个AI应用对你的日常生活产生了什么影响？",
            "depth": 2
          }
        ]
      }
    },
    "closure_question": "在这个'认识AI'的阶段，你发现了什么关于自己的新理解？"
  }
}
```

### 阶段2：使用AI (Q3, Q4, Q5, Q6)

**阶段目标**：探讨AI使用的具体实践，特别是"AI协作者"框架下的协作意愿

**核心题目Q5的追问图谱**：
```json
{
  "Q5_journey_graph": {
    "question_text": "当AI没有理解我的意思时，我通常会尝试调整表达，而不是马上放弃",
    "user_response": {
      "score": 6,
      "framework_implication": "这正是'AI协作者'的典型特征：当AI没有理解时，你愿意调整表达继续协作。"
    },
    "follow_up_sequence": [
      {
        "layer": "experience_elicitation",
        "question": "你选择了'通常会尝试调整表达'（6分）。能详细讲一个你最近和AI'来回调整'的经历吗？",
        "depth": 1
      },
      {
        "layer": "detail_probing",
        "question": "当时你在做什么任务？AI第一次的回答是什么？你怎么调整的？调整了几次？",
        "depth": 2
      },
      {
        "layer": "process_exploration",
        "question": "最终结果如何？这个结果如果第一次就得到，和多次调整后得到，对你来说有区别吗？",
        "depth": 2
      },
      {
        "layer": "framework_connection",
        "question": "这次经历如何体现了'{framework}'的特征？",
        "depth": 3
      },
      {
        "layer": "contradiction_exploration",
        "question": "有没有什么时候你不愿意继续调整，而是选择放弃使用AI？",
        "depth": 4
      }
    ]
  }
}
```

**跨题目矛盾检测（Q5与Q8）**：
```json
{
  "cross_question_contradiction": {
    "pattern": "高协作意愿与中等验证意识",
    "detection": {
      "Q5_score": ">= 6",
      "Q8_score": "<= 5"
    },
    "exploration_strategy": [
      {
        "step": "expose_pattern",
        "question": "我注意到一个有趣的组合：Q5={Q5}（高协作意愿），Q8={Q8}（中等验证）。作为'{framework}'，这可能意味着什么？"
      },
      {
        "step": "explore_implication",
        "question": "当你在和AI持续协作时，是否会因为投入太多精力而降低验证？"
      },
      {
        "step": "seek_concrete_example",
        "question": "能讲一个协作很顺利，但后来发现问题的事例吗？"
      }
    ]
  }
}
```

### 阶段3：信任AI (Q7, Q8, Q9, Q12)

**阶段目标**：探讨"AI协作者"的盲区——验证意识

**核心题目Q8的追问图谱**：
```json
{
  "Q8_journey_graph": {
    "question_text": "面对AI给出的回答，我通常能够判断它什么时候值得相信，什么时候需要进一步确认",
    "user_response": {
      "score": 5,
      "framework_implication": "验证意识中等，可能需要关注潜在盲区"
    },
    "follow_up_sequence": [
      {
        "layer": "experience_elicitation",
        "question": "你选择了'通常能够判断'（{score}分）。能讲一个你最近验证AI结果的例子吗？",
        "depth": 1
      },
      {
        "layer": "detail_probing",
        "question": "特别是你经过多次调整得到满意结果后，你还会验证吗？还是因为'协作过程顺利'而降低了验证？",
        "depth": 2,
        "trigger": "detected_Q5_Q8_contradiction"
      },
      {
        "layer": "framework_connection",
        "question": "你的验证方式如何体现了或补充了'{framework}'的特征？",
        "depth": 3
      },
      {
        "layer": "reflection_prompt",
        "question": "通过这个经历，你对'判断能力'这个维度有什么新的理解？",
        "depth": 4
      }
    ]
  }
}
```

### 阶段4-6：后续阶段

按照相同的逻辑设计，每个阶段都包含：
1. **阶段配置**：目标、题目、框架透镜
2. **题目级追问图谱**：基于用户具体选择的追问序列
3. **跨题目分析**：检测矛盾和模式
4. **阶段总结问题**：引导反思和整合

---

## 四、跨越性题目的特殊处理

### 4.1 跨阶段重复题目设计

**用户确认的策略**：允许跨阶段重复，体现认知复杂性

```json
{
  "cross_stage_questions": {
    "Q10": {
      "primary_stage": 4,
      "secondary_stages": [5],
      "stage_specific_focus": {
        4: {
          "stage_name": "与AI相处",
          "focus_aspect": "AI对你的生活和工作的影响",
          "follow_up_angle": "个人体验"
        },
        5: {
          "stage_name": "理解AI",
          "focus_aspect": "AI对社会和他人影响，你的思考",
          "follow_up_angle": "社会反思"
        }
      },
      "connection_strategy": "在阶段4探讨个人影响，在阶段5探讨社会影响，形成对比和深化"
    },
    "Q11": {
      "primary_stage": 4,
      "secondary_stages": [5],
      "stage_specific_focus": {
        4: {
          "stage_name": "与AI相处",
          "focus_aspect": "你对隐私和数据安全的个人关注",
          "follow_up_angle": "个人实践"
        },
        5: {
          "stage_name": "理解AI",
          "focus_aspect": "隐私和伦理的社会层面思考",
          "follow_up_angle": "社会责任"
        }
      }
    },
    "Q14": {
      "primary_stage": 4,
      "secondary_stages": [6],
      "stage_specific_focus": {
        4: {
          "stage_name": "与AI相处",
          "focus_aspect": "AI融入你生活的程度",
          "follow_up_angle": "使用体验"
        },
        6: {
          "stage_name": "重新定义AI",
          "focus_aspect": "过去一年你对AI概念的理解变化",
          "follow_up_angle": "认知演进"
        }
      }
    }
  }
}
```

### 4.2 跨阶段连接设计

**Q10在阶段4和阶段5的连接**：
```
阶段4（与AI相处）的Q10追问：
"使用AI时，我会考虑它可能对其他人、组织或社会产生什么影响。"

[用户回答和追问]

...

阶段4过渡到阶段5：
"在上一个阶段，我们探讨了AI对你个人的影响。现在让我们进入下一阶段：AI对社会的影响。

我注意到在Q10中，你提到会考虑AI对'其他人、组织或社会'的影响。
这其实已经开始触及AI的社会维度了。"

阶段5（理解AI）的Q10追问（跨阶段重复）：
"在讨论AI对你个人的影响后，我想更深入地探讨：
你觉得AI对社会的影响中，哪一点最值得关注？这和你个人的使用体验有什么联系？"
```

---

## 五、Follow-up Graph 执行引擎

### 5.1 Journey-Based 执行器

```python
class JourneyFollowUpExecutor:
    """认知旅程追问执行器"""

    def __init__(self):
        self.current_stage = 1
        self.current_question = None
        self.conversation_history = []
        self.user_responses = {}
        self.framework_lens = None

    def execute_journey_phase(self, stage_config, user_responses):
        """执行特定阶段的追问"""
        # 1. 阶段入口
        entry_question = self._generate_entry_question(stage_config)

        # 2. 为每道题生成追问图谱
        for question_id in stage_config["questions_in_phase"]:
            question_graph = self._generate_question_graph(
                question_id,
                user_responses[question_id],
                stage_config["framework_lens"]
            )
            stage_config["question_graphs"][question_id] = question_graph

        # 3. 跨题目分析
        cross_analysis = self._analyze_cross_questions(
            stage_config["questions_in_phase"],
            user_responses
        )
        stage_config["cross_question_analysis"] = cross_analysis

        # 4. 阶段总结
        closure_question = self._generate_closure_question(stage_config)

        return {
            "entry_question": entry_question,
            "question_graphs": stage_config["question_graphs"],
            "cross_analysis": cross_analysis,
            "closure_question": closure_question
        }

    def _generate_entry_question(self, stage_config):
        """生成阶段入口问题"""
        framework = stage_config["framework_lens"]
        stage_name = stage_config["stage_name"]

        entry_template = f"""
让我们进入第{self.current_stage}段旅程：{stage_name}。

        作为{framework}，这个阶段特别重要，因为{objective}。

        在测试中，你在这一阶段的表现是：
        {scores_summary}

        我们想更深入地了解：
        """

        return entry_template

    def _generate_question_graph(self, question_id, user_response, framework):
        """为特定题目生成追问图谱"""
        graph = {
            "question_id": question_id,
            "user_response": user_response,
            "framework": framework,
            "follow_up_sequence": []
        }

        # 基于用户得分和框架，生成个性化追问序列
        score = user_response.get("score", 4)

        if score >= 6:
            graph["follow_up_sequence"].extend([
                {
                    "layer": "experience_elicitation",
                    "question": f"你选择了'这个陈述'（{score}分，比较高）。这让我想知道：",
                    "follow_up": "能详细讲一个相关经历吗？"
                },
                {
                    "layer": "framework_connection",
                    "question": f"这个选择很好地体现了{framework}的{trait}特征。",
                    "follow_up": "你觉得这个特征在你的AI使用中如何体现？"
                }
            ])
        elif score <= 3:
            graph["follow_up_sequence"].extend([
                {
                    "layer": "experience_elicitation",
                    "question": f"你选择了'这个陈述'（{score}分，比较低）。这可能意味着：",
                    "follow_up": "能讲一个你最近的具体经历吗？"
                },
                {
                    "layer": "contradiction_exploration",
                    "question": f"作为{framework}，这个选择似乎和框架特征不太一致。",
                    "follow_up": "你觉得这是为什么？"
                }
            ])
        else:  # 中等得分
            graph["follow_up_sequence"].extend([
                {
                    "layer": "experience_elicitation",
                    "question": f"你选择了'这个陈述'（{score}分）。",
                    "follow_up": "能讲一个相关经历吗？"
                }
            ])

        return graph

    def _analyze_cross_questions(self, question_ids, user_responses):
        """分析跨题目的模式"""
        analysis = {
            "patterns": [],
            "contradictions": [],
            "complementarities": []
        }

        # 检测Q5与Q8的矛盾
        if "Q5" in question_ids and "Q12" in question_ids:
            q5_score = user_responses.get("Q5", {}).get("score", 4)
            q8_score = user_responses.get("Q8", {}).get("score", 4)
            q12_score = user_responses.get("Q12", {}).get("score", 4)

            if q5_score >= 6 and q8_score <= 5:
                analysis["contradictions"].append({
                    "type": "高协作意愿与中等验证意识",
                    "questions": ["Q5", "Q8"],
                    "exploration_strategy": [
                        "我注意到一个组合：Q5={q5}（高协作），Q8={q8}（中等验证）。",
                        "作为'AI协作者'，这可能意味着什么？",
                        "当你在和AI持续协作时，是否会因为投入太多精力而降低验证？"
                    ]
                })

        return analysis
```

### 5.2 阶段过渡管理

```python
class StageTransitionManager:
    """阶段过渡管理器"""

    def __init__(self):
        self.current_stage = 1
        self.stage_history = []

    def transition_to_next_stage(self, completed_stage, journey_discoveries):
        """过渡到下一个阶段"""
        if self.current_stage < 6:
            # 记录当前阶段的发现
            self.stage_history.append({
                "stage": self.current_stage,
                "discoveries": journey_discoveries,
                "timestamp": datetime.now()
            })

            # 生成过渡信息
            transition_info = self._generate_transition_info(
                self.current_stage,
                self.current_stage + 1,
                journey_discoveries
            )

            self.current_stage += 1
            return transition_info

        return None  # 旅程已完成

    def _generate_transition_info(self, from_stage, to_stage, discoveries):
        """生成阶段过渡信息"""
        stage_names = {
            1: "认识AI",
            2: "使用AI",
            3: "信任AI",
            4: "与AI相处",
            5: "理解AI",
            6: "重新定义AI"
        }

        key_discoveries = discoveries[:2]  # 取最关键的2个发现

        return {
            "transition_message": f"""
第一阶段旅程完成：{stage_names[from_stage]}

            关键发现：
            {self._format_discoveries(key_discoveries)}

            ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

            准备进入第二段旅程：{stage_names[to_stage]}
            """,
            "next_stage_objective": self._get_stage_objective(to_stage)
        }
```

---

## 六、与风格画像的集成

### 6.1 框架透镜系统

**FrameworkLensCard的设计**：
```json
{
  "framework_lens_system": {
    "display_config": {
      "persistent": true,
      "position": "sidebar",
      "expandable": true,
      "dynamic_highlights": true
    },
    "content_structure": {
      "framework_name": "AI协作者",
      "core_traits": [
        {
          "trait": "持续协作能力强",
          "status": "currently_discussing",  // 当前正在探讨
          "related_questions": ["Q5", "Q7"],
          "user_evidence": []
        },
        {
          "trait": "灵活应对AI的不同表现",
          "status": "pending",  // 待探讨
          "related_questions": ["Q3", "Q4"],
          "user_evidence": []
        },
        {
          "trait": "共创思维",
          "status": "pending",
          "related_questions": ["Q6", "Q7"],
          "user_evidence": []
        }
      ],
      "blind_spots": [
        {
          "blindspot": "可能降低验证意识",
          "status": "next_stage_discuss",  // 下一段探讨
          "related_questions": ["Q8", "Q12"],
          "contradiction_evidence": []
        },
        {
          "blindspot": "可能形成过度依赖",
          "status": "pending",
          "related_questions": ["Q10", "Q14"],
          "contradiction_evidence": []
        }
      ]
    }
  }
}
```

### 6.2 动态特征追踪

```python
class FrameworkLensTracker:
    """框架透镜追踪器"""

    def __init__(self, framework_config):
        self.framework_config = framework_config
        self.traits_evidence = {}
        self.blind_spots_evidence = {}
        self.framework_adjustments = []

    def record_trait_evidence(self, trait_name, question_id, user_response):
        """记录特征证据"""
        if trait_name not in self.traits_evidence:
            self.traits_evidence[trait_name] = []

        self.traits_evidence[trait_name].append({
            "question_id": question_id,
            "user_score": user_response["score"],
            "user_answer": user_response["answer"],
            "timestamp": datetime.now()
        })

        # 动态更新特征状态
        self._update_trait_status(trait_name)

    def record_blind_spot_evidence(self, blind_spot_name, question_id, contradiction_detected):
        """记录盲区证据"""
        if blind_spot_name not in self.blind_spots_evidence:
            self.blind_spots_evidence[blind_spot_name] = []

        self.blind_spots_evidence[blind_spot_name].append({
            "question_id": question_id,
            "contradiction_detected": contradiction_detected,
            "timestamp": datetime.now()
        })

    def generate_framework_status(self):
        """生成框架状态报告"""
        return {
            "framework_name": self.framework_config["framework_name"],
            "trait_confidence": self._calculate_trait_confidence(),
            "blind_spot_alerts": self._identify_blind_spot_alerts(),
            "adjustment_suggestions": self._generate_adjustment_suggestions()
        }
```

---

## 七、MVP阶段的Follow-up Graph简化版

### 7.1 简化的阶段结构

```json
{
  "mvp_journey_phases": [
    {
      "stage_id": 1,
      "stage_name": "认识AI",
      "questions": ["Q1", "Q2"],
      "follow_up_strategy": "linear_progression",
      "max_depth_per_question": 3
    },
    {
      "stage_id": 2,
      "stage_name": "使用AI",
      "questions": ["Q3", "Q4", "Q5", "Q6"],
      "follow_up_strategy": "linear_progression",
      "max_depth_per_question": 3
    },
    {
      "stage_id": 3,
      "stage_name": "信任AI",
      "questions": ["Q7", "Q8", "Q9", "Q12"],
      "follow_up_strategy": "linear_progression",
      "max_depth_per_question": 3
    },
    {
      "stage_id": 4,
      "stage_name": "与AI相处",
      "questions": ["Q10", "Q11", "Q14"],
      "follow_up_strategy": "linear_progression",
      "max_depth_per_question": 3
    },
    {
      "stage_id": 5,
      "stage_name": "理解AI",
      "questions": ["Q10", "Q11"],
      "follow_up_strategy": "linear_progression",
      "max_depth_per_question": 2
    },
    {
      "stage_id": 6,
      "stage_name": "重新定义AI",
      "questions": ["Q14", "Q15"],
      "follow_up_strategy": "reflection_focused",
      "max_depth_per_question": 2
    }
  ]
}
```

### 7.2 简化的追问序列

```python
class MVPFollowUpGenerator:
    """MVP版追问生成器"""

    def generate_mvp_follow_up(self, question_id, user_score, framework):
        """生成MVP级追问"""
        templates = {
            "high_score": [
                f"你选择了'非常同意'（{user_score}分）。能详细讲一个相关经历吗？",
                "当时具体的情况是怎样的？",
                "这个经历如何体现了'{framework}'的特征？"
            ],
            "medium_score": [
                f"你选择了'有点同意'（{user_score}分）。能讲一个相关例子吗？",
                "你觉得这个陈述准确吗？",
                "有没有例外情况？"
            ],
            "low_score": [
                f"你选择了'不太同意'（{user_score}分）。能讲讲你的想法吗？",
                "这种选择和'{framework}'的框架有什么关系？",
                "有没有什么经历让你这样选择？"
            ]
        }

        if user_score >= 6:
            return templates["high_score"]
        elif user_score <= 3:
            return templates["low_score"]
        else:
            return templates["medium_score"]
```

---

## 八、关键设计原则总结

### 8.1 结构化优先于开放性

**原则**：从"开放式对话"转向"结构化认知旅程"

**实现**：
- 每个阶段有明确的目标和边界
- 每道题都有基于用户选择的追问路径
- 用户清楚知道"我在哪里"、"要去哪里"

### 8.2 题目选择的价值最大化

**原则**：每道题的选择都成为深度追问的起点

**实现**：
- 用户得分（1-7）决定追问的起点
- 用户的具体回答内容触发个性化追问
- 跨题目的矛盾检测成为重要切入点

### 8.3 风格框架的持续作用

**原则**：风格类型贯穿整个旅程，作为理解框架

**实现**：
- 侧边栏持续显示框架特征和盲区
- 动态追踪用户证据与框架的关系
- 在旅程回望中重新审视框架准确性

### 8.4 跨越性题目的多维度探讨

**原则**：允许Q10、Q11、Q14在多个阶段重复探讨

**实现**：
- 为跨越性题目设计阶段特定的关注角度
- 在阶段过渡中连接不同维度的探讨
- 形成认知复杂性和深度的体验

---

这个重构后的Follow-up Graph架构，从"开放式对话"转向了"结构化认知旅程"，让15道题的叙事路径成为访谈的核心组织逻辑，每道题的选择都成为深度追问的起点，充分发挥了用户认真选择的价值。