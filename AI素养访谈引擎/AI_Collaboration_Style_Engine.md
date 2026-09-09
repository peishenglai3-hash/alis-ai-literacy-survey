# AI协作风格判定引擎 - 技术设计文档

## 设计理念更新：从"分类引擎"到"旅程引擎"

**核心理念转变**：
- **旧**：15道题 → 分类计算 → 风格类型 → 访谈终点
- **新**：15道题 → 风格框架建立 → 6阶段认知旅程 → 旅程回望 → AI素养重构

**新增模块**：
- JourneyEngine：认知旅程规划与管理
- QuestionSpecificFollowUpExecutor：题目特定追问执行器
- JourneyStateManager：旅程状态追踪
- FrameworkLensCard：认知框架持续显示组件

---

## 一、核心数据结构（新增旅程模块）

### 1.0 认知旅程数据结构（新增）
```json
{
  "journey_state": {
    "current_stage": 3,
    "completed_stages": [1, 2],
    "user_framework": {
      "style_type": "AI协作者",
      "style_name_en": "AI Collaborator",
      "confidence": 0.85
    },
    "stage_progress": {
      "1": {
        "status": "completed",
        "questions_explored": ["Q1", "Q2"],
        "discoveries": ["不只把AI当工具，更看作合作对象", "会主动了解AI能力边界"],
        "start_time": "2025-01-15T10:00:00Z",
        "end_time": "2025-01-15T10:15:00Z"
      },
      "2": {
        "status": "completed",
        "questions_explored": ["Q3", "Q4", "Q5", "Q6"],
        "discoveries": ["持续协作能力强", "会调整表达与AI互动"],
        "start_time": "2025-01-15T10:15:00Z",
        "end_time": "2025-01-15T10:35:00Z"
      },
      "3": {
        "status": "current",
        "questions_explored": ["Q7"],
        "current_question": "Q8",
        "discoveries": ["选择性验证", "情境化判断"],
        "start_time": "2025-01-15T10:35:00Z"
      },
      "4": {"status": "pending"},
      "5": {"status": "pending"},
      "6": {"status": "pending"}
    },
    "cross_stage_tracking": {
      "Q10": {
        "stage_4_answer": "我会考虑对其他人的影响",
        "stage_5_planned": true,
        "contrast_ready": true
      },
      "Q11": {
        "stage_4_answer": "我会留意隐私问题",
        "stage_5_planned": true
      },
      "Q14": {
        "stage_4_answer": "我对AI的理解有变化",
        "stage_6_planned": true
      }
    },
    "conversation_history": [
      {
        "stage": 3,
        "question": "Q8",
        "system_message": "你在Q8中选择了'比较同意'：能够判断AI什么时候值得相信",
        "user_response": "是的，我会在重要事情上验证",
        "follow_up_triggered": "作为'AI协作者'，你什么时候会验证？",
        "timestamp": "2025-01-15T10:40:00Z"
      }
    ]
  }
}
```

### 1.1 6个认知阶段配置数据（新增）
```json
{
  "journey_stages": {
    "1": {
      "stage_id": 1,
      "stage_name": "认识AI",
      "stage_emoji": "🧠",
      "objective": "探索用户如何认识和理解AI",
      "framework_lens": "从'AI协作者'框架看：用户如何理解AI的能力边界",
      "questions_in_stage": ["Q1", "Q2"],
      "entry_question": "你之前在Q1和Q2中提到...",
      "closure_question": "通过这些探讨，我们发现作为'AI协作者'，你对AI的认识有其独特之处",
      "discovery_prompts": [
        "不只把AI当工具，更看作合作对象",
        "会主动了解AI能力边界",
        "对AI的认识建立在持续互动基础上"
      ]
    },
    "2": {
      "stage_id": 2,
      "stage_name": "使用AI",
      "stage_emoji": "💻",
      "objective": "探索用户如何使用AI",
      "framework_lens": "从'AI协作者'框架看：用户如何与AI协作完成目标",
      "questions_in_stage": ["Q3", "Q4", "Q5", "Q6"],
      "entry_question": "你之前在Q3-Q6中分享了你的使用方式...",
      "closure_question": "作为'AI协作者'，你的使用方式体现了什么特点？"
    },
    "3": {
      "stage_id": 3,
      "stage_name": "信任AI",
      "stage_emoji": "🔍",
      "objective": "探索用户如何建立对AI的信任",
      "framework_lens": "从'AI协作者'框架看：用户的信任判断机制",
      "questions_in_stage": ["Q7", "Q8", "Q9", "Q12"],
      "entry_question": "你之前在Q7-Q12中提到了你的验证方式...",
      "closure_question": "你的选择性信任体现了什么？"
    },
    "4": {
      "stage_id": 4,
      "stage_name": "与AI相处",
      "stage_emoji": "🤖",
      "objective": "探索AI如何影响用户的生活",
      "framework_lens": "从'AI协作者'框架看：用户与AI的协作边界",
      "questions_in_stage": ["Q10", "Q11", "Q14"],
      "entry_question": "让我们探讨AI如何影响你的生活...",
      "closure_question": "这些影响反映了什么样的协作关系？"
    },
    "5": {
      "stage_id": 5,
      "stage_name": "理解AI",
      "stage_emoji": "📖",
      "objective": "从个人视角扩展到社会/技术视角",
      "framework_lens": "从'AI协作者'框架看：用户对AI社会影响的理解",
      "questions_in_stage": ["Q10", "Q11"],
      "is_cross_stage": true,
      "cross_stage_pairs": {
        "Q10": {"from_stage": 4, "contrast_focus": "从个人影响到社会影响"},
        "Q11": {"from_stage": 4, "contrast_focus": "从隐私保护到技术风险"}
      },
      "entry_question": "之前我们讨论了个人层面的影响，现在让我们看看社会层面...",
      "closure_question": "从个人到社会，你对AI的理解有何扩展？"
    },
    "6": {
      "stage_id": 6,
      "stage_name": "重新定义AI",
      "stage_emoji": "✨",
      "objective": "整合整个旅程，重新理解'AI是什么'",
      "framework_lens": "从'AI协作者'框架看：用户如何重新定义AI",
      "questions_in_stage": ["Q14", "Q15"],
      "is_cross_stage": true,
      "cross_stage_pairs": {
        "Q14": {"from_stage": 4, "contrast_focus": "从个人认知变化到AI概念重构"}
      },
      "entry_question": "通过这段旅程，你对'什么是AI'的理解有变化吗？",
      "closure_question": "这段旅程让你如何重新定义AI？"
    }
  }
}
```

### 1.2 用户答题数据结构
```json
{
  "user_id": "string",
  "responses": {
    "Q1": 6,  // 1-7 Likert scale
    "Q2": 5,
    "Q3": 7,
    "Q4": 4,
    "Q5": 6,
    "Q6": 5,
    "Q7": 6,
    "Q8": 5,
    "Q9": 6,
    "Q10": 4,
    "Q11": 5,
    "Q12": 6,
    "Q13": 5,
    "Q14": 4,
    "Q15": 5
  },
  "timestamp": "ISO8601"
}
```

### 1.2 维度得分数据结构
```json
{
  "dimensions": {
    "AI_Orientation": {
      "score": 5.5,
      "tendency": "Explorer",
      "confidence": 0.85,
      "component_questions": ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"]
    },
    "AI_Trust": {
      "score": 5.2,
      "tendency": "Collaborator",
      "confidence": 0.72,
      "component_questions": ["Q5", "Q7", "Q8", "Q9", "Q12"]
    },
    "AI_Relationship": {
      "score": 4.8,
      "tendency": "Integrated",
      "confidence": 0.65,
      "component_questions": ["Q2", "Q3", "Q9", "Q10", "Q11", "Q14"]
    },
    "AI_Responsibility": {
      "score": 5.0,
      "tendency": "Self-focused",
      "confidence": 0.70,
      "component_questions": ["Q10", "Q11", "Q12", "Q13", "Q15"]
    }
  }
}
```

### 1.3 协作风格判定结果数据结构
```json
{
  "collaboration_style": {
    "primary_type": "AI协作者",
    "secondary_type": "AI探索者",
    "confidence": 0.82,
    "match_reasons": [
      "强协作意愿（Q5=6, Q7=6）",
      "融合型关系模式（Q14=4, Q2=5）",
      "平衡的责任模式"
    ]
  },
  "type_profile": {
    "name": "AI协作者",
    "name_en": "AI Collaborator",
    "description": "你不把AI看作工具，而看作需要不断交流和调整的合作对象。",
    "strengths": [
      "擅长通过持续互动调整AI结果",
      "能够灵活应对AI的不同表现",
      "符合生成式AI时代的交互模式"
    ],
    "blind_spots": [
      "在高度依赖互动时，可能降低对结果来源的验证",
      "可能形成过度依赖的风险"
    ],
    "reflection_questions": [
      "这个描述符合你吗？",
      "哪些地方不像？",
      "有没有具体经历可以证明？"
    ]
  }
}
```

---

## 二、评分计算引擎

### 2.1 维度计算器
```python
class DimensionCalculator:
    """维度得分计算器"""

    def __init__(self):
        self.dimension_mappings = {
            "AI_Orientation": {
                "questions": ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"],
                "weights": {
                    "Q1": 1.0,  # 能力识别
                    "Q2": 1.0,  # 感知敏感度
                    "Q3": 1.2,  # 目标导向使用（重要）
                    "Q4": 1.1,  # 工具选择能力
                    "Q5": 1.3,  # 协作意愿（最重要）
                    "Q6": 1.0   # 学习倾向
                }
            },
            "AI_Trust": {
                "questions": ["Q5", "Q7", "Q8", "Q9", "Q12"],
                "weights": {
                    "Q5": 1.0,   # 协作意愿
                    "Q7": 1.0,   # 解决过程信任
                    "Q8": 1.3,   # 判断能力（重要）
                    "Q9": 1.2,   # 边界意识
                    "Q12": 1.3   # 质疑精神（重要）
                }
            },
            "AI_Relationship": {
                "questions": ["Q2", "Q3", "Q9", "Q10", "Q11", "Q14"],
                "weights": {
                    "Q2": 1.1,   # 感知敏感度
                    "Q3": 1.0,   # 目标导向使用
                    "Q9": 1.0,   # 边界意识
                    "Q10": 1.0,  # 外部性思考
                    "Q11": 1.0,  # 风险意识
                    "Q14": 1.3   # 认知演进（重要）
                }
            },
            "AI_Responsibility": {
                "questions": ["Q10", "Q11", "Q12", "Q13", "Q15"],
                "weights": {
                    "Q10": 1.2,  # 外部性思考
                    "Q11": 1.0,  # 风险意识
                    "Q12": 1.1,  # 个人判断责任
                    "Q13": 1.0,  # 情绪调节责任
                    "Q15": 1.3   # 自主原则（重要）
                }
            }
        }

    def calculate_dimension_score(self, dimension_name, responses):
        """计算单个维度的得分"""
        config = self.dimension_mappings[dimension_name]
        questions = config["questions"]
        weights = config["weights"]

        weighted_sum = 0
        weight_sum = 0

        for question in questions:
            score = responses.get(question, 4)  # 默认中立
            weight = weights.get(question, 1.0)
            weighted_sum += score * weight
            weight_sum += weight

        final_score = weighted_sum / weight_sum
        return round(final_score, 2)

    def calculate_all_dimensions(self, responses):
        """计算所有维度得分"""
        results = {}
        for dimension in self.dimension_mappings.keys():
            score = self.calculate_dimension_score(dimension, responses)
            results[dimension] = {
                "score": score,
                "raw_score": score
            }
        return results
```

### 2.2 倾向判定器
```python
class TendencyClassifier:
    """维度倾向判定器"""

    def __init__(self):
        self.tendency_thresholds = {
            "strong_A": 5.5,
            "moderate_A": 4.5,
            "neutral": 3.5,
            "moderate_B": 2.5,
            "strong_B": 0
        }

        self.tendency_types = {
            "AI_Orientation": {
                "Explorer": ["Q1_high", "Q2_high", "Q6_high"],
                "Navigator": ["Q3_high", "Q4_high", "Q5_high"]
            },
            "AI_Trust": {
                "Verifier": ["Q8_high", "Q9_high", "Q12_high"],
                "Collaborator": ["Q5_high", "Q7_high"]
            },
            "AI_Relationship": {
                "Instrumental": ["Q3_high", "Q9_high"],
                "Integrated": ["Q2_high", "Q14_high"]
            },
            "AI_Responsibility": {
                "Self-focused": ["Q3_high", "Q7_high"],
                "Social-aware": ["Q10_high", "Q11_high", "Q15_high"]
            }
        }

    def classify_tendency(self, dimension_name, score, responses):
        """判定维度倾向"""
        # 1. 基于分数判定基础倾向
        if score >= 5.5:
            level = "strong"
        elif score >= 4.5:
            level = "moderate_A"
        elif score >= 3.5:
            level = "neutral"
        elif score >= 2.5:
            level = "moderate_B"
        else:
            level = "strong_B"

        # 2. 基于题目组合判定具体类型
        tendency_types = self.tendency_types[dimension_name]
        tendency_type = self._determine_type(dimension_name, responses, tendency_types)

        # 3. 计算置信度
        confidence = self._calculate_confidence(dimension_name, tendency_type, responses)

        return {
            "level": level,
            "type": tendency_type,
            "confidence": confidence
        }

    def _determine_type(self, dimension_name, responses, tendency_types):
        """基于题目组合判定具体类型"""
        type_scores = {}

        for type_name, question_conditions in tendency_types.items():
            score = 0
            count = 0

            for condition in question_conditions:
                question = condition.split("_")[0]  # "Q1"
                requirement = condition.split("_")[1]  # "high"

                question_score = responses.get(question, 4)

                if requirement == "high" and question_score >= 5:
                    score += 1
                elif requirement == "low" and question_score <= 3:
                    score += 1

                count += 1

            type_scores[type_name] = score / count if count > 0 else 0

        # 返回得分最高的类型
        return max(type_scores, key=type_scores.get)

    def _calculate_confidence(self, dimension_name, tendency_type, responses):
        """计算倾向判定的置信度"""
        tendency_types = self.tendency_types[dimension_name]
        question_conditions = tendency_types[tendency_type]

        match_count = 0
        total_count = len(question_conditions)

        for condition in question_conditions:
            question = condition.split("_")[0]
            requirement = condition.split("_")[1]
            question_score = responses.get(question, 4)

            if requirement == "high" and question_score >= 5:
                match_count += 1
            elif requirement == "low" and question_score <= 3:
                match_count += 1

        return round(match_count / total_count, 2)
```

### 2.3 协作风格判定器
```python
class CollaborationStyleClassifier:
    """协作风格判定器"""

    def __init__(self):
        self.style_rules = {
            "AI探索者": {
                "required_conditions": [
                    "AI_Orientation == Explorer",
                    "AI_Trust == Collaborator",
                    "Q5 >= 5",
                    "Q7 >= 5"
                ],
                "priority": 1
            },
            "AI实践家": {
                "required_conditions": [
                    "AI_Orientation == Navigator",
                    "AI_Relationship == Instrumental",
                    "Q3 >= 5",
                    "Q4 >= 5"
                ],
                "priority": 2
            },
            "AI验证者": {
                "required_conditions": [
                    "AI_Trust == Verifier",
                    "Q8 >= 5",
                    "Q12 >= 5"
                ],
                "priority": 3
            },
            "AI协作者": {
                "required_conditions": [
                    "AI_Trust == Collaborator",
                    "AI_Relationship == Integrated",
                    "Q5 >= 6",
                    "Q7 >= 6"
                ],
                "priority": 4
            },
            "AI依赖型使用者": {
                "required_conditions": [
                    "AI_Trust.score >= 6",
                    "AI_Relationship == Integrated",
                    "Q12 <= 4"
                ],
                "priority": 5
            },
            "AI观察者": {
                "required_conditions": [
                    "AI_Orientation.score <= 4",
                    "AI_Trust == Verifier",
                    "Q12 >= 6"
                ],
                "priority": 6
            },
            "AI反思者": {
                "required_conditions": [
                    "AI_Responsibility == Social-aware",
                    "Q10 >= 5",
                    "Q15 >= 5"
                ],
                "priority": 7
            },
            "AI平衡者": {
                "required_conditions": [
                    "all_dimensions_balanced",
                    "variance < 2"
                ],
                "priority": 8
            }
        }

    def classify_style(self, dimensions_data, responses):
        """判定协作风格"""
        matched_styles = []
        style_confidences = {}

        # 1. 检查每种风格的匹配条件
        for style_name, style_config in self.style_rules.items():
            match_result, confidence = self._check_style_conditions(
                style_name,
                style_config,
                dimensions_data,
                responses
            )

            if match_result:
                matched_styles.append(style_name)
                style_confidences[style_name] = confidence

        # 2. 如果没有匹配，返回平衡者
        if not matched_styles:
            return self._get_balancer_profile()

        # 3. 返回置信度最高的风格
        primary_style = max(style_confidences, key=style_confidences.get)

        # 4. 如果有多个匹配，返回次要类型
        secondary_style = None
        if len(matched_styles) > 1:
            secondary_style = [s for s in matched_styles if s != primary_style][0]

        return {
            "primary_type": primary_style,
            "secondary_type": secondary_style,
            "confidence": style_confidences[primary_style],
            "matched_styles": matched_styles
        }

    def _check_style_conditions(self, style_name, style_config, dimensions_data, responses):
        """检查风格匹配条件"""
        conditions = style_config["required_conditions"]
        matched_conditions = 0

        for condition in conditions:
            if self._evaluate_condition(condition, dimensions_data, responses):
                matched_conditions += 1

        # 计算置信度
        confidence = matched_conditions / len(conditions)

        # 至少满足50%的条件才认为匹配
        is_matched = matched_conditions / len(conditions) >= 0.5

        return is_matched, confidence

    def _evaluate_condition(self, condition, dimensions_data, responses):
        """评估单个条件"""
        try:
            if "==" in condition:
                # AI_Orientation == Explorer
                parts = condition.split(" == ")
                dimension = parts[0]
                value = parts[1]

                return dimensions_data[dimension]["tendency"]["type"] == value

            elif ">=" in condition:
                # Q5 >= 5
                parts = condition.split(" >= ")
                question = parts[0]
                threshold = int(parts[1])

                return responses.get(question, 0) >= threshold

            elif "<=" in condition:
                # Q12 <= 4
                parts = condition.split(" <= ")
                question = parts[0]
                threshold = int(parts[1])

                return responses.get(question, 7) <= threshold

            elif "score" in condition:
                # AI_Trust.score >= 6
                parts = condition.split(".score")
                dimension = parts[0]
                operator = parts[1].strip().split()[0]
                threshold = int(parts[1].strip().split()[1])

                if operator == ">=":
                    return dimensions_data[dimension]["score"] >= threshold
                elif operator == "<=":
                    return dimensions_data[dimension]["score"] <= threshold

            elif condition == "all_dimensions_balanced":
                # 检查所有维度是否平衡（方差<2）
                scores = [d["score"] for d in dimensions_data.values()]
                variance = np.var(scores) if scores else 0
                return variance < 2

            elif "variance" in condition:
                # variance < 2
                parts = condition.split()
                operator = parts[0]
                threshold = float(parts[1])

                scores = [d["score"] for d in dimensions_data.values()]
                variance = np.var(scores) if scores else 0

                if operator == "variance":
                    return variance < threshold

        except Exception as e:
            print(f"条件评估错误: {condition}, 错误: {e}")
            return False

        return False

    def _get_balancer_profile(self):
        """返回平衡者配置"""
        return {
            "primary_type": "AI平衡者",
            "secondary_type": None,
            "confidence": 0.5,
            "matched_styles": ["AI平衡者"]
        }
```

---

## 三、协作风格详细画像系统

### 3.1 风格画像数据库
```python
COLLABORATION_STYLE_PROFILES = {
    "AI探索者": {
        "name_en": "AI Explorer",
        "emoji": "🔍",
        "keywords": ["探索", "尝试", "学习", "好奇"],
        "description": "你喜欢主动接触新的AI工具，将AI视为拓展能力的新空间。",
        "detailed_description": """
        作为AI探索者，你对新技术充满好奇。当听到新的AI应用时，你会想要亲自试试。
        你享受探索AI可能性的过程，即使不一定有明确的任务目标。
        对你来说，使用AI更像是一种探索之旅，而不仅仅是提高效率的工具。
        """,
        "strengths": [
            {
                "title": "学习能力强",
                "description": "能够快速掌握新的AI工具和功能",
                "evidence_questions": ["Q6"]
            },
            {
                "title": "适应技术变化",
                "description": "对AI技术的快速迭代有较强适应力",
                "evidence_questions": ["Q1", "Q2"]
            },
            {
                "title": "开放性思维",
                "description": "愿意尝试不同的AI解决方案",
                "evidence_questions": ["Q5", "Q6"]
            }
        ],
        "blind_spots": [
            {
                "title": "容易追逐新工具",
                "description": "可能过度关注新功能，而忽视实际需求",
                "reflection_question": "你是否曾经为了尝试新AI而偏离了原本的任务目标？"
            },
            {
                "title": "可靠性关注不足",
                "description": "可能在使用过程中忽视验证和风险",
                "reflection_question": "你如何判断一个新AI工具是否可信？"
            }
        ],
        "development_suggestions": [
            "在使用新AI工具前，先明确任务目标",
            "建立AI结果的验证习惯",
            "关注AI的伦理和社会影响"
        ],
        "reflection_questions": [
            "这个描述符合你吗？完全符合？部分符合？还是不太符合？",
            "哪些特点很准确？哪些地方你觉得不像？",
            "能不能讲一个你最近探索AI工具的具体经历？",
            "你觉得这种探索方式给你带来了什么？又可能让你忽略了什么？"
        ],
        "follow_up_triggers": [
            {
                "condition": "Q6 >= 6",
                "question": "你学习新AI工具时，通常会怎么学？能举个例子吗？"
            },
            {
                "condition": "Q8 <= 4",
                "question": "在使用新AI工具时，你会如何验证它的结果是否可靠？"
            },
            {
                "condition": "Q10 <= 4",
                "question": "你在探索AI时，会考虑它的社会影响吗？"
            }
        ]
    },

    "AI实践家": {
        "name_en": "AI Practitioner",
        "emoji": "⚡",
        "keywords": ["效率", "任务", "应用", "务实"],
        "description": "你不会盲目追逐AI，而是在明确需求时寻找最合适的AI解决方案。",
        "detailed_description": """
        作为AI实践家，你对AI的使用有明确的目的性。你不会因为好奇而使用AI，
        而是在遇到具体问题时，会思考AI是否是解决这个问题的最佳工具。
        你注重效率和实际效果，善于将AI转化为生产力。
        """,
        "strengths": [
            {
                "title": "目标明确",
                "description": "使用AI时任务导向清晰",
                "evidence_questions": ["Q3", "Q4"]
            },
            {
                "title": "转化能力强",
                "description": "能够有效将AI用于实际问题解决",
                "evidence_questions": ["Q3", "Q7"]
            },
            {
                "title": "工具选择能力强",
                "description": "知道什么场景用什么AI工具",
                "evidence_questions": ["Q4", "Q9"]
            }
        ],
        "blind_spots": [
            {
                "title": "可能忽略AI潜力",
                "description": "过度关注当前任务，可能错过AI的其他可能性",
                "reflection_question": "你有没有想过AI还能帮你完成哪些意想不到的任务？"
            },
            {
                "title": "学习新工具动力不足",
                "description": "如果现有工具够用，可能不愿意尝试新工具",
                "reflection_question": "你会主动了解新的AI工具吗？"
            }
        ],
        "development_suggestions": [
            "偶尔尝试一些没有明确目的的AI探索",
            "关注AI技术的最新发展",
            "思考AI如何改变你的工作方式，而不仅仅是提高效率"
        ],
        "reflection_questions": [
            "这个描述符合你吗？",
            "你在使用AI时，是否总是有明确的任务目标？",
            "有没有哪次AI的使用让你意外发现了新的可能性？",
            "你觉得这种务实的使用方式有什么局限性吗？"
        ],
        "follow_up_triggers": [
            {
                "condition": "Q4 >= 6",
                "question": "你是如何了解不同AI工具的特点的？"
            },
            {
                "condition": "Q6 <= 4",
                "question": "如果让你学习一个全新的AI工具，你会觉得困难吗？"
            },
            {
                "condition": "Q9 >= 6",
                "question": "你能具体说说你是如何判断哪些任务适合AI吗？"
            }
        ]
    },

    # ... 其他7种风格的详细配置（由于篇幅原因，这里省略，实际实现时需要补全）
    # "AI验证者"
    # "AI协作者"
    # "AI依赖型使用者"
    # "AI观察者"
    # "AI反思者"
    # "AI平衡者"
}
```

### 3.2 画像生成器
```python
class ProfileGenerator:
    """风格画像生成器"""

    def __init__(self):
        self.profiles = COLLABORATION_STYLE_PROFILES

    def generate_profile(self, style_name, dimensions_data, responses):
        """生成完整的风格画像"""
        profile_template = self.profiles.get(style_name, self.profiles["AI平衡者"])

        # 基于用户答题情况，个性化画像内容
        personalized_profile = {
            "basic_info": {
                "style_name": profile_template["name_en"],
                "chinese_name": style_name,
                "emoji": profile_template["emoji"],
                "keywords": profile_template["keywords"]
            },
            "description": profile_template["description"],
            "detailed_description": profile_template["detailed_description"],
            "strengths": self._personalize_strengths(
                profile_template["strengths"],
                dimensions_data,
                responses
            ),
            "blind_spots": self._personalize_blind_spots(
                profile_template["blind_spots"],
                dimensions_data,
                responses
            ),
            "development_suggestions": profile_template["development_suggestions"],
            "reflection_questions": profile_template["reflection_questions"],
            "personalized_follow_up": self._generate_follow_up_questions(
                profile_template.get("follow_up_triggers", []),
                responses
            ),
            "evidence_summary": self._generate_evidence_summary(
                profile_template,
                dimensions_data,
                responses
            )
        }

        return personalized_profile

    def _personalize_strengths(self, strengths_template, dimensions_data, responses):
        """个性化优势描述"""
        personalized_strengths = []

        for strength in strengths_template:
            evidence_questions = strength.get("evidence_questions", [])

            # 查找支撑该优势的题目得分
            evidence_scores = []
            for question in evidence_questions:
                if question in responses:
                    score = responses[question]
                    evidence_scores.append({
                        "question": question,
                        "score": score,
                        "level": self._score_to_level(score)
                    })

            # 只有在有明显支撑时才显示该优势
            if evidence_scores and any(s["score"] >= 5 for s in evidence_scores):
                personalized_strengths.append({
                    "title": strength["title"],
                    "description": strength["description"],
                    "evidence": evidence_scores
                })

        return personalized_strengths

    def _personalize_blind_spots(self, blind_spots_template, dimensions_data, responses):
        """个性化盲区描述"""
        personalized_blind_spots = []

        for blind_spot in blind_spots_template:
            reflection_question = blind_spot.get("reflection_question", "")

            personalized_blind_spots.append({
                "title": blind_spot["title"],
                "description": blind_spot["description"],
                "reflection_question": reflection_question
            })

        return personalized_blind_spots

    def _generate_follow_up_questions(self, follow_up_triggers, responses):
        """生成个性化追问问题"""
        follow_up_questions = []

        for trigger in follow_up_triggers:
            condition = trigger.get("condition", "")
            question = trigger.get("question", "")

            if self._evaluate_condition(condition, responses):
                follow_up_questions.append(question)

        return follow_up_questions

    def _evaluate_condition(self, condition, responses):
        """评估追问条件"""
        if ">=" in condition:
            parts = condition.split(" >= ")
            question = parts[0]
            threshold = int(parts[1])
            return responses.get(question, 0) >= threshold
        elif "<=" in condition:
            parts = condition.split(" <= ")
            question = parts[0]
            threshold = int(parts[1])
            return responses.get(question, 7) <= threshold

        return False

    def _generate_evidence_summary(self, profile_template, dimensions_data, responses):
        """生成证据总结"""
        evidence_summary = {
            "dimension_scores": {},
            "key_contributing_questions": []
        }

        # 维度得分
        for dimension_name, dimension_data in dimensions_data.items():
            evidence_summary["dimension_scores"][dimension_name] = {
                "score": dimension_data["score"],
                "tendency": dimension_data["tendency"]["type"]
            }

        # 关键贡献题目（高分或低分题目）
        for question, score in responses.items():
            if score >= 6 or score <= 2:
                evidence_summary["key_contributing_questions"].append({
                    "question": question,
                    "score": score,
                    "significance": "high" if score >= 6 else "low"
                })

        return evidence_summary

    def _score_to_level(self, score):
        """将分数转换为等级描述"""
        if score >= 6:
            return "很高"
        elif score >= 5:
            return "较高"
        elif score >= 4:
            return "中等"
        elif score >= 3:
            return "较低"
        else:
            return "很低"
```

---

## 四、完整流程集成

### 4.1 主流程控制器
```python
class AIInterviewEngine:
    """AI访谈引擎主控制器"""

    def __init__(self):
        self.dimension_calculator = DimensionCalculator()
        self.tendency_classifier = TendencyClassifier()
        self.style_classifier = CollaborationStyleClassifier()
        self.profile_generator = ProfileGenerator()

    def process_user_responses(self, responses):
        """处理用户答题，返回完整分析结果"""

        # Step 1: 计算各维度得分
        dimensions_data = self.dimension_calculator.calculate_all_dimensions(responses)

        # Step 2: 判定各维度倾向
        for dimension_name, dimension_info in dimensions_data.items():
            score = dimension_info["score"]
            tendency_result = self.tendency_classifier.classify_tendency(
                dimension_name, score, responses
            )
            dimension_info["tendency"] = tendency_result

        # Step 3: 判定协作风格
        style_result = self.style_classifier.classify_style(
            dimensions_data, responses
        )

        # Step 4: 生成个性化画像
        profile = self.profile_generator.generate_profile(
            style_result["primary_type"],
            dimensions_data,
            responses
        )

        # Step 5: 汇总完整结果
        complete_result = {
            "user_responses": responses,
            "dimensions": dimensions_data,
            "collaboration_style": style_result,
            "profile": profile,
            "interview_guidance": self._generate_interview_guidance(
                style_result, profile, responses
            )
        }

        return complete_result

    def _generate_interview_guidance(self, style_result, profile, responses):
        """生成访谈指导"""
        return {
            "opening_questions": profile.get("reflection_questions", [])[:3],
            "follow_up_questions": profile.get("personalized_follow_up", []),
            "deep_dive_areas": self._identify_deep_dive_areas(profile, responses),
            "potential_contradictions": self._detect_potential_contradictions(
                profile, responses
            )
        }

    def _identify_deep_dive_areas(self, profile, responses):
        """识别需要深入讨论的领域"""
        deep_dive_areas = []

        # 基于画像中的盲区识别
        for blind_spot in profile.get("blind_spots", []):
            deep_dive_areas.append({
                "area": blind_spot["title"],
                "entry_question": blind_spot["reflection_question"]
            })

        return deep_dive_areas

    def _detect_potential_contradictions(self, profile, responses):
        """检测潜在矛盾"""
        contradictions = []

        # 检测高使用频率与低验证之间的矛盾
        if responses.get("Q3", 0) >= 5 and responses.get("Q8", 0) <= 4:
            contradictions.append({
                "type": "使用与验证矛盾",
                "description": "你频繁使用AI，但验证意识相对较低",
                "question": "你觉得在什么情况下必须验证AI的结果？"
            })

        # 检测高隐私关注与低实际保护之间的矛盾
        if responses.get("Q11", 0) >= 5 and responses.get("Q10", 0) <= 3:
            contradictions.append({
                "type": "隐私关注与实际行动矛盾",
                "description": "你关注隐私，但可能较少考虑社会影响",
                "question": "你如何在使用AI时平衡隐私和社会影响？"
            })

        return contradictions
```

---

## 五、MVP实现优先级

### 阶段1: 核心计算引擎（Week 1-2）
- [x] 维度计算器
- [x] 倾向判定器
- [x] 协作风格判定器
- [x] 基础画像生成器

### 阶段2: 用户界面（Week 2-3）
- [ ] 问卷展示界面
- [ ] 结果展示界面
- [ ] 追问界面

### 阶段3: 追问图谱（Week 3-4）
- [ ] 基础追问逻辑
- [ ] 矛盾检测逻辑
- [ ] 故事挖掘逻辑

### 阶段4: 访谈系统（Week 4-5）
- [ ] AI访谈Agent
- [ ] 人工Facilitator界面
- [ ] 完整流程测试

### 阶段5: 数据分析（Week 5-6）
- [ ] 访谈数据整理
- [ ] 模式识别
- [ ] 研究报告生成

---

## 六、认知旅程引擎模块（新增）

### 6.1 JourneyEngine（旅程规划引擎）
```python
class JourneyEngine:
    """认知旅程规划与执行引擎"""

    def __init__(self):
        self.stage_configs = self._load_journey_stages()
        self.state_manager = JourneyStateManager()
        self.follow_up_executor = QuestionSpecificFollowUpExecutor()

    def initialize_journey(self, user_framework, responses):
        """初始化认知旅程"""
        journey_plan = {
            "user_framework": user_framework,
            "total_stages": 6,
            "current_stage": 1,
            "stage_sequence": [1, 2, 3, 4, 5, 6],
            "estimated_duration": "45-60分钟",
            "stage_questions": {
                1: ["Q1", "Q2"],
                2: ["Q3", "Q4", "Q5", "Q6"],
                3: ["Q7", "Q8", "Q9", "Q12"],
                4: ["Q10", "Q11", "Q14"],
                5: ["Q10", "Q11"],  # 跨阶段重复
                6: ["Q14", "Q15"]   # 跨阶段重复
            },
            "cross_stage_questions": ["Q10", "Q11", "Q14"]
        }

        self.state_manager.initialize(journey_plan, responses)
        return journey_plan

    def get_stage_entry_question(self, stage_id, user_framework, responses):
        """获取阶段进入问题"""
        stage_config = self.stage_configs[stage_id]

        # 构建个性化进入问题
        questions_in_stage = stage_config["questions_in_stage"]
        first_question = questions_in_stage[0]

        entry_template = stage_config["entry_question"]
        framework_lens = stage_config["framework_lens"]

        # 从用户在第一题的回答中提取上下文
        user_answer = responses.get(first_question, 4)
        answer_context = self._get_answer_context(first_question, user_answer)

        entry_question = f"""
        {entry_template}

        你在{first_question}中选择了{self._score_to_text(user_answer)}。
        {framework_lens}

        能具体说说吗？
        """

        return entry_question

    def get_stage_closure_question(self, stage_id, stage_discoveries):
        """获取阶段结束问题"""
        stage_config = self.stage_configs[stage_id]

        closure_template = stage_config["closure_question"]
        discovery_summary = "\n".join([f"• {d}" for d in stage_discoveries])

        closure_question = f"""
        ✨ 本阶段完成！

        💡 我们发现了：
        {discovery_summary}

        {closure_template}

        📍 下一阶段：{self.stage_configs[stage_id + 1]["stage_name"]}
        """

        return closure_question

    def transition_to_next_stage(self, current_stage_id):
        """过渡到下一阶段"""
        current_state = self.state_manager.get_state()

        if current_stage_id < 6:
            next_stage_id = current_stage_id + 1
            current_state["current_stage"] = next_stage_id
            current_state["stage_progress"][str(next_stage_id)]["status"] = "current"
            current_state["completed_stages"].append(current_stage_id)

            self.state_manager.update_state(current_state)
            return True, next_stage_id
        else:
            # 旅程完成
            return False, None

    def _get_answer_context(self, question_id, score):
        """获取题目回答上下文"""
        question_contexts = {
            "Q1": {1: "不太能判断", 4: "有时能判断", 7: "通常能判断"},
            "Q2": {1: "很少注意到", 4: "有时注意到", 7: "很容易注意到"},
            # ... 其他题目的上下文
        }
        return question_contexts.get(question_id, {}).get(score, "")

    def _score_to_text(self, score):
        """将分数转换为文字描述"""
        score_map = {
            1: "非常不同意", 2: "不同意", 3: "有点不同意",
            4: "中立", 5: "有点同意", 6: "同意", 7: "非常同意"
        }
        return score_map.get(score, "")
```

### 6.2 QuestionSpecificFollowUpExecutor（题目特定追问执行器）
```python
class QuestionSpecificFollowUpExecutor:
    """题目特定追问执行器"""

    def __init__(self):
        self.follow_up_templates = self._load_follow_up_templates()

    def generate_follow_up_for_question(self, question_id, user_score, user_framework, stage_context):
        """为特定题目生成个性化追问"""

        template = self.follow_up_templates.get(question_id, {})

        # 基于分数和框架生成追问
        follow_up_questions = []

        # 1. 经验唤起层
        experience_question = self._generate_experience_question(
            question_id, user_score, template
        )
        follow_up_questions.append(experience_question)

        # 2. 框架连接层
        framework_question = self._generate_framework_question(
            question_id, user_framework, template
        )
        follow_up_questions.append(framework_question)

        # 3. 跨题矛盾检测层
        contradiction_questions = self._generate_contradiction_questions(
            question_id, user_score, user_framework
        )
        follow_up_questions.extend(contradiction_questions)

        # 4. AI素养桥接层
        ai_literacy_question = self._generate_ai_literacy_question(
            question_id, stage_context, template
        )
        follow_up_questions.append(ai_literacy_question)

        return follow_up_questions

    def _generate_experience_question(self, question_id, user_score, template):
        """生成经验唤起问题"""
        experience_templates = {
            "Q7": {
                "high": "你在Q7中选择了'非常同意'：即使遇到复杂问题，也能逐步利用AI解决。能具体讲一个你与AI协作解决复杂问题的例子吗？",
                "medium": "你在Q7中选择了'中立'：有时能利用AI解决复杂问题。你通常在什么情况下会寻求AI的帮助？",
                "low": "你在Q7中选择了'不同意'：不太能利用AI解决复杂问题。是什么让你对AI解决复杂问题缺乏信心？"
            },
            "Q8": {
                "high": "你在Q8中选择了'非常同意'：能够判断AI什么时候值得相信。你的判断标准是什么？",
                "medium": "你在Q8中选择了'中立'：有时能判断AI是否可信。你觉得判断AI可信度难吗？",
                "low": "你在Q8中选择了'不同意'：不太能判断AI是否可信。这种不确定性让你如何使用AI？"
            }
        }

        question_templates = experience_templates.get(question_id, {})

        if user_score >= 6:
            return question_templates.get("high", "")
        elif user_score >= 4:
            return question_templates.get("medium", "")
        else:
            return question_templates.get("low", "")

    def _generate_framework_question(self, question_id, user_framework, template):
        """生成框架连接问题"""
        framework_type = user_framework["style_type"]

        framework_questions = {
            "AI协作者": {
                "Q7": "作为'AI协作者'，你什么时候愿意信任AI处理复杂问题？",
                "Q8": "作为'AI协作者'，你什么时候会验证，什么时候不会？",
                "Q5": "作为'AI协作者'，这种'调整表达'的做法说明你把AI看作什么？"
            },
            "AI探索者": {
                "Q1": "作为'AI探索者'，你如何判断一个应用真正使用了AI？",
                "Q6": "作为'AI探索者'，你学习新AI工具时通常怎么做？"
            }
        }

        return framework_questions.get(framework_type, {}).get(question_id, "")

    def _generate_contradiction_questions(self, question_id, user_score, user_framework, all_responses):
        """生成跨题矛盾检测问题"""

        contradiction_patterns = {
            ("Q3", "high", "Q5", "low"): {
                "question": "你在Q3表示能用AI完成很多事情，但在Q5表示遇到不理解时会放弃。这种矛盾你怎么看？",
                "type": "使用与协作矛盾"
            },
            ("Q5", "high", "Q8", "low"): {
                "question": "你在Q5表示愿意与AI协作，但在Q8表示验证意识不强。这两者之间有张力吗？",
                "type": "协作与验证矛盾"
            },
            ("Q7", "high", "Q8", "high"): {
                "question": "你既愿意信任AI处理复杂问题（Q7高分），又会验证结果（Q8高分）。这种'选择性信任'你是如何管理的？",
                "type": "信任与验证平衡"
            }
        }

        # 检测是否存在矛盾模式
        for pattern in contradiction_patterns.keys():
            q1, score_level1, q2, score_level2 = pattern

            if question_id == q1:
                score1 = user_score
                score2 = all_responses.get(q2, 4)

                if self._matches_score_level(score1, score_level1) and self._matches_score_level(score2, score_level2):
                    return contradiction_patterns[pattern]["question"]

        return None

    def _generate_ai_literacy_question(self, question_id, stage_context, template):
        """生成AI素养桥接问题"""
        ai_literacy_connections = {
            "Q7": "这种逐步利用AI解决复杂问题的能力，其实是AI素养研究关注的'问题分解能力'",
            "Q8": "这种判断AI可信度的能力，正是AI素养的核心：'批判性评估'",
            "Q9": "这种判断任务适用性的能力，体现了AI素养中的'边界意识'",
            "Q12": "这种不盲从权威的质疑精神，是AI素养教育的重要目标"
        }

        connection = ai_literacy_connections.get(question_id, "")
        if connection:
            return f"你知道吗？{connection}。你觉得这种能力重要吗？"

        return ""
```

### 6.3 JourneyStateManager（旅程状态管理器）
```python
class JourneyStateManager:
    """认知旅程状态管理器"""

    def __init__(self):
        self.current_state = None

    def initialize(self, journey_plan, responses):
        """初始化旅程状态"""
        self.current_state = {
            "current_stage": 1,
            "completed_stages": [],
            "user_framework": journey_plan["user_framework"],
            "stage_progress": {},
            "cross_stage_tracking": {},
            "conversation_history": [],
            "user_responses": responses,
            "journey_discoveries": [],
            "framework_adjustments": []
        }

        # 初始化各阶段状态
        for stage_id in range(1, 7):
            self.current_state["stage_progress"][str(stage_id)] = {
                "status": "pending" if stage_id > 1 else "current",
                "questions_explored": [],
                "discoveries": [],
                "start_time": None,
                "end_time": None
            }

        # 初始化跨阶段题目追踪
        for question in ["Q10", "Q11", "Q14"]:
            self.current_state["cross_stage_tracking"][question] = {
                "answers": [],
                "stages_seen": []
            }

    def update_stage_progress(self, stage_id, question_id, discovery):
        """更新阶段进度"""
        stage_key = str(stage_id)
        stage_progress = self.current_state["stage_progress"][stage_key]

        # 添加题目探索记录
        if question_id not in stage_progress["questions_explored"]:
            stage_progress["questions_explored"].append(question_id)

        # 添加发现
        if discovery and discovery not in stage_progress["discoveries"]:
            stage_progress["discoveries"].append(discovery)

        # 添加到总发现列表
        if discovery and discovery not in self.current_state["journey_discoveries"]:
            self.current_state["journey_discoveries"].append(discovery)

    def record_conversation(self, stage_id, question_id, system_message, user_response, follow_up_triggered):
        """记录对话历史"""
        conversation_entry = {
            "stage": stage_id,
            "question": question_id,
            "system_message": system_message,
            "user_response": user_response,
            "follow_up_triggered": follow_up_triggered,
            "timestamp": datetime.now().isoformat()
        }

        self.current_state["conversation_history"].append(conversation_entry)

    def record_cross_stage_answer(self, question_id, answer, stage_id):
        """记录跨阶段题目的回答"""
        if question_id in self.current_state["cross_stage_tracking"]:
            tracking = self.current_state["cross_stage_tracking"][question_id]
            tracking["answers"].append({
                "stage": stage_id,
                "answer": answer,
                "timestamp": datetime.now().isoformat()
            })
            tracking["stages_seen"].append(stage_id)

    def get_state(self):
        """获取当前状态"""
        return self.current_state

    def update_state(self, new_state):
        """更新状态"""
        self.current_state = new_state

    def get_journey_summary(self):
        """获取旅程总结"""
        completed_stages = len(self.current_state["completed_stages"])

        summary = {
            "total_stages": 6,
            "completed_stages": completed_stages,
            "current_stage": self.current_state["current_stage"],
            "total_discoveries": len(self.current_state["journey_discoveries"]),
            "discoveries_by_stage": {},
            "conversation_turns": len(self.current_state["conversation_history"]),
            "completion_rate": completed_stages / 6
        }

        # 按阶段汇总发现
        for stage_id, progress in self.current_state["stage_progress"].items():
            if progress["discoveries"]:
                summary["discoveries_by_stage"][stage_id] = progress["discoveries"]

        return summary
```

### 6.4 FrameworkLensCard（认知框架组件）
```python
class FrameworkLensCard:
    """认知框架持续显示组件"""

    def __init__(self):
        self.framework_display_config = {
            "persistent_elements": [
                "style_type",
                "current_stage",
                "stage_progress",
                "stage_questions",
                "stage_discoveries"
            ],
            "update_triggers": [
                "stage_transition",
                "discovery_made",
                "framework_adjustment"
            ]
        }

    def get_framework_card_data(self, journey_state):
        """获取框架卡片显示数据"""
        current_stage = journey_state["current_stage"]
        user_framework = journey_state["user_framework"]

        card_data = {
            "framework_name": user_framework["style_type"],
            "framework_name_en": user_framework["style_name_en"],
            "current_stage": self._get_stage_name(current_stage),
            "stage_emoji": self._get_stage_emoji(current_stage),
            "stage_progress": self._calculate_stage_progress(journey_state),
            "stage_questions": self._get_current_stage_questions(current_stage),
            "stage_discoveries": self._get_current_stage_discoveries(journey_state, current_stage),
            "journey_progress_bar": self._generate_progress_bar(journey_state)
        }

        return card_data

    def _calculate_stage_progress(self, journey_state):
        """计算阶段进度"""
        completed = len(journey_state["completed_stages"])
        total = 6
        return f"{completed}/{total}"

    def _generate_progress_bar(self, journey_state):
        """生成进度条"""
        completed_stages = journey_state["completed_stages"]
        current_stage = journey_state["current_stage"]

        progress_bar = []
        for i in range(1, 7):
            if i in completed_stages:
                progress_bar.append("✅")
            elif i == current_stage:
                progress_bar.append("🔄")
            else:
                progress_bar.append("⏳")

        return " ".join(progress_bar)
```

---

## 七、集成更新：从分类引擎到旅程引擎

### 7.1 更新后的主流程控制器
```python
class AIInterviewEngine:
    """AI访谈引擎主控制器（更新版）"""

    def __init__(self):
        # 原有模块
        self.dimension_calculator = DimensionCalculator()
        self.tendency_classifier = TendencyClassifier()
        self.style_classifier = CollaborationStyleClassifier()
        self.profile_generator = ProfileGenerator()

        # 新增旅程模块
        self.journey_engine = JourneyEngine()
        self.state_manager = JourneyStateManager()
        self.follow_up_executor = QuestionSpecificFollowUpExecutor()
        self.framework_card = FrameworkLensCard()

    def process_user_responses(self, responses):
        """处理用户答题，返回完整分析结果"""

        # Step 1: 计算各维度得分（原有）
        dimensions_data = self.dimension_calculator.calculate_all_dimensions(responses)

        # Step 2: 判定各维度倾向（原有）
        for dimension_name, dimension_info in dimensions_data.items():
            score = dimension_info["score"]
            tendency_result = self.tendency_classifier.classify_tendency(
                dimension_name, score, responses
            )
            dimension_info["tendency"] = tendency_result

        # Step 3: 判定协作风格（原有）
        style_result = self.style_classifier.classify_style(
            dimensions_data, responses
        )

        # Step 4: 生成个性化画像（原有）
        profile = self.profile_generator.generate_profile(
            style_result["primary_type"],
            dimensions_data,
            responses
        )

        # Step 5: 初始化认知旅程（新增）
        user_framework = {
            "style_type": style_result["primary_type"],
            "style_name_en": profile["basic_info"]["style_name"],
            "confidence": style_result["confidence"]
        }

        journey_plan = self.journey_engine.initialize_journey(user_framework, responses)

        # Step 6: 汇总完整结果
        complete_result = {
            "user_responses": responses,
            "dimensions": dimensions_data,
            "collaboration_style": style_result,
            "profile": profile,
            "journey_plan": journey_plan,
            "interview_guidance": self._generate_interview_guidance(
                style_result, profile, responses, journey_plan
            )
        }

        return complete_result

    def start_journey_stage(self, journey_state, stage_id):
        """开始特定阶段的旅程"""
        user_framework = journey_state["user_framework"]
        responses = journey_state["user_responses"]

        # 获取阶段进入问题
        entry_question = self.journey_engine.get_stage_entry_question(
            stage_id, user_framework, responses
        )

        # 更新状态
        self.state_manager.update_stage_progress(stage_id, None, "开始阶段")

        return {
            "stage_id": stage_id,
            "entry_question": entry_question,
            "framework_card_data": self.framework_card.get_framework_card_data(journey_state)
        }

    def process_question_follow_up(self, journey_state, question_id, user_response):
        """处理题目追问"""
        stage_id = journey_state["current_stage"]
        user_framework = journey_state["user_framework"]
        responses = journey_state["user_responses"]

        # 生成个性化追问
        follow_up_questions = self.follow_up_executor.generate_follow_up_for_question(
            question_id,
            responses.get(question_id, 4),
            user_framework,
            stage_id
        )

        # 记录对话
        self.state_manager.record_conversation(
            stage_id, question_id, user_response, follow_up_questions
        )

        return {
            "follow_up_questions": follow_up_questions,
            "question_context": self._get_question_context(question_id)
        }

    def complete_journey_stage(self, journey_state, stage_discoveries):
        """完成阶段"""
        stage_id = journey_state["current_stage"]

        # 获取阶段结束问题
        closure_question = self.journey_engine.get_stage_closure_question(
            stage_id, stage_discoveries
        )

        # 更新状态
        self.state_manager.update_stage_progress(stage_id, None, stage_discoveries)

        # 过渡到下一阶段
        has_next, next_stage_id = self.journey_engine.transition_to_next_stage(stage_id)

        return {
            "closure_question": closure_question,
            "has_next_stage": has_next,
            "next_stage_id": next_stage_id,
            "journey_summary": self.state_manager.get_journey_summary()
        }
```

---

## 八、MVP实现优先级更新

### 阶段1: 核心计算引擎（Week 1-2）
- [x] 维度计算器
- [x] 倾向判定器
- [x] 协作风格判定器
- [x] 基础画像生成器

### 阶段2: 用户界面（Week 2-3）
- [ ] 问卷展示界面
- [ ] 结果展示界面（风格框架呈现）
- [ ] 追问界面

### 阶段2.5: 旅程引擎（Week 3）
- [ ] JourneyEngine实现
- [ ] JourneyStateManager实现
- [ ] QuestionSpecificFollowUpExecutor实现
- [ ] FrameworkLensCard组件实现
- [ ] 6个阶段配置数据结构

### 阶段3: 旅程界面（Week 3-4）
- [ ] 旅程地图可视化
- [ ] 阶段过渡界面
- [ ] 题目特定追问界面
- [ ] 跨阶段题目处理界面

### 阶段4: 访谈系统（Week 4-5）
- [ ] AI访谈Agent（旅程模式）
- [ ] 人工Facilitator界面
- [ ] 完整流程测试

### 阶段5: 数据分析（Week 5-6）
- [ ] 访谈数据整理
- [ ] 模式识别
- [ ] 研究报告生成
