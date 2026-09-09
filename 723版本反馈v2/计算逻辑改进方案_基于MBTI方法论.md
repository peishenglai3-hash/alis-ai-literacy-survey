# AI素养访谈引擎计算逻辑改进方案
## 基于MBTI方法论,适配15题限制与10天MVP

---

## 一、问题诊断

### 当前存在的问题

**问题1：维度测量不均衡**
- AI Orientation: 6题 (Q1, Q2, Q3, Q4, Q5, Q6)
- AI Trust: 5题 (Q5, Q7, Q8, Q9, Q12)
- AI Relationship: 6题 (Q2, Q3, Q9, Q10, Q11, Q14)
- AI Responsibility: 5题 (Q10, Q11, Q12, Q13, Q15)

→ 部分题目跨维度(Q5, Q9, Q12),导致维度之间不独立

**问题2：计算方式过于简单**
```python
orientation_score = (Q1 + Q2 + Q3 + Q4 + Q5 + Q6) / 6
```
→ 直接计算平均分,无法体现"倾向性"和"强度"

**问题3：缺少置信度评估**
→ 用户不知道自己属于某种类型的"确信程度"有多大

**问题4：15题不够支撑传统心理测量的信度**
→ 每个维度题目不足,内部一致性无法保证

---

## 二、改进策略：MBTI思想 × 15题限制 × 10天MVP

### 核心思路

**不完全照搬MBTI的科学性要求**(因为15题做不到),而是**借用MBTI的计算框架**,实现:

1. 从"总分计算"转向"极性计算"
2. 从"类型标签"转向"类型+置信度"
3. 从"静态分类"转向"理解框架"

**关键定位调整**:

不追求 → "算法准确预测一个人的类型"

而追求 → "一个足够合理的分类装置,让用户面对这个分类时产生自我解释"

---

## 三、重新设计4个二元维度

### 改进原则

1. **维度独立**: 每个题目只属于一个维度的一端(不再跨维度)
2. **二元极性**: 每个维度有两个对立的倾向端
3. **题目平衡**: 每个维度至少3-4题,两端的题目数量尽量均衡
4. **基于现有15题**: 不新增题目,只是重新分组

---

### Dimension 1: AI Engagement（AI参与方式）

**测量核心**: 你如何进入和使用AI?

| 极性端 | 题目 | 测量内容 | 题目数量 |
|--------|------|---------|---------|
| **Explorer（探索型）** | Q1, Q2, Q6 | 主动识别AI、感知AI、学习新AI工具 | 3题 |
| **Utilizer（工具型）** | Q3, Q4 | 目标导向使用、工具选择能力 | 2题 |

**计算方式**:
```python
explorer_score = (Q1 + Q2 + Q6) / 3  # 探索倾向
utilizer_score = (Q3 + Q4) / 2      # 工具倾向

# 计算极性差值(类似MBTI的E vs I)
engagement_polarity = explorer_score - utilizer_score  # 范围: -6 到 +6
```

**类型判定**:
- `engagement_polarity > 1.5`: 强Explorer倾向
- `0.5 < engagement_polarity <= 1.5`: 中等Explorer倾向
- `-0.5 <= engagement_polarity <= 0.5`: 中立(混合型)
- `-1.5 <= engagement_polarity < -0.5`: 中等Utilizer倾向
- `engagement_polarity < -1.5`: 强Utilizer倾向

**置信度计算**:
```python
confidence_1 = abs(engagement_polarity) / 6  # 范围: 0% 到 100%
```

---

### Dimension 2: AI Trust（AI信任模式）

**测量核心**: 你如何建立对AI的信任?

| 极性端 | 题目 | 测量内容 | 题目数量 |
|--------|------|---------|---------|
| **Trusting（信任协作）** | Q5, Q7 | 愿意调整表达、逐步使用AI解决复杂问题 | 2题 |
| **Critical（批判验证）** | Q8, Q9, Q12 | 判断AI可靠性、边界意识、质疑精神 | 3题 |

**计算方式**:
```python
trusting_score = (Q5 + Q7) / 2           # 信任倾向
critical_score = (Q8 + Q9 + Q12) / 3      # 批判倾向

trust_polarity = trusting_score - critical_score  # 范围: -6 到 +6
```

**类型判定**:
- `trust_polarity > 1.5`: 强Trusting倾向
- `0.5 < trust_polarity <= 1.5`: 中等Trusting倾向
- `-0.5 <= trust_polarity <= 0.5`: 中立(平衡型)
- `-1.5 <= trust_polarity < -0.5`: 中等Critical倾向
- `trust_polarity < -1.5`: 强Critical倾向

**置信度计算**:
```python
confidence_2 = abs(trust_polarity) / 6  # 范围: 0% 到 100%
```

---

### Dimension 3: AI Relationship（AI关系模式）

**测量核心**: AI在你生活中的位置?

| 极性端 | 题目 | 测量内容 | 题目数量 |
|--------|------|---------|---------|
| **Integrated（融合型）** | Q14 | AI认知演进、AI进入思维 | 1题 |
| **Instrumental（工具型）** | (无专门测量) | 纯粹工具化、效率导向 | 0题 |

**问题**: 这个维度在15题中测量不足

**MVP临时方案**:
- 暂时使用 `Q14 + Q2(AI感知敏感度)` 作为融合型指标
- 工具型通过 `engagement_polarity < 0` (Utilizer倾向)间接推断

```python
integrated_score = (Q14 + Q2) / 2
# 工具型倾向 = utilizer倾向
instrumental_inferred = (engagement_polarity < 0)

relationship_polarity = integrated_score - (utilizer_score if instrumental_inferred else 3.5)
```

**后期开发建议**: 新增题目测量"AI是否进入日常思维流程"

---

### Dimension 4: AI Reflection（AI反思模式）

**测量核心**: 你如何理解使用AI的责任和意义?

| 极性端 | 题目 | 测量内容 | 题目数量 |
|--------|------|---------|---------|
| **Reflective（反思型）** | Q10, Q11, Q15 | 社会影响、隐私风险、自主原则 | 3题 |
| **Practical（实用型）** | Q13 | 情绪调节、关注即时效果 | 1题 |

**计算方式**:
```python
reflective_score = (Q10 + Q11 + Q15) / 3  # 反思倾向
practical_score = Q13                      # 实用倾向

reflection_polarity = reflective_score - practical_score  # 范围: -6 到 +6
```

**类型判定**:
- `reflection_polarity > 1.5`: 强Reflective倾向
- `0.5 < reflection_polarity <= 1.5`: 中等Reflective倾向
- `-0.5 <= reflection_polarity <= 0.5`: 中立
- `-1.5 <= reflection_polarity < -0.5`: 中等Practical倾向
- `reflection_polarity < -1.5`: 强Practical倾向

**置信度计算**:
```python
confidence_4 = abs(reflection_polarity) / 6  # 范围: 0% 到 100%
```

---

## 四、8种类型的生成逻辑

### 不再是"预设8种类型",而是"基于4个轴的组合"

**原问题**: 4个二元维度 → 2×2×2×2 = 16种理论组合

**MVP解决方案**:
1. **优先级规则**: 选择"最显著的3个维度"作为类型判定依据
2. **类型映射表**: 建立维度组合 → 8种类型的映射关系

### 类型判定算法

```python
def determine_ai_type(polarities, confidences):
    """
    polarities: {
        'engagement': value,
        'trust': value,
        'relationship': value,
        'reflection': value
    }
    confidences: {
        'engagement': 0-1,
        'trust': 0-1,
        'relationship': 0-1,
        'reflection': 0-1
    }
    """

    # Step 1: 选择置信度最高的3个维度
    top_dimensions = sorted(
        [('engagement', confidences['engagement']),
         ('trust', confidences['trust']),
         ('relationship', confidences['relationship']),
         ('reflection', confidences['reflection'])],
        key=lambda x: x[1], reverse=True
    )[:3]

    # Step 2: 基于组合判定类型
    primary_dim, secondary_dim, tertiary_dim = top_dimensions

    # 规则树(简化版)
    if primary_dim[0] == 'engagement' and polarities['engagement'] > 0:
        # Explorer倾向
        if polarities['trust'] > 0:
            return "AI探索者"
        else:
            return "AI协作者"
    elif primary_dim[0] == 'engagement' and polarities['engagement'] < 0:
        # Utilizer倾向
        if polarities['trust'] < 0:
            return "AI验证者"
        else:
            return "AI实践家"
    elif primary_dim[0] == 'trust' and polarities['trust'] < 0:
        # Critical倾向
        if polarities['reflection'] > 0:
            return "AI反思者"
        else:
            return "AI观察者"
    elif polarities['engagement'] == 0 and polarities['trust'] == 0:
        return "AI平衡者"
    else:
        # 默认:根据最高置信度维度
        if polarities['engagement'] > 1.5:
            return "AI探索者"
        elif polarities['engagement'] < -1.5:
            return "AI实践家"
        elif polarities['trust'] < -1.5:
            return "AI验证者"
        elif polarities['trust'] > 1.5:
            return "AI协作者"
        elif polarities['reflection'] > 1.5:
            return "AI反思者"
        else:
            return "AI平衡者"
```

---

## 五、输出结果的设计

### 不输出: "你是AI探索者"

### 而是: 多层信息结构

```javascript
{
  // 第一层: 类型+置信度
  "primary_type": {
    "name": "AI探索者",
    "confidence": 68%,  // 基于多个维度的综合置信度
    "description": "你的AI交互倾向更接近AI探索者"
  },

  // 第二层: 维度剖面(为什么是这个类型?)
  "dimension_profile": {
    "engagement": {
      "polarity": "Explorer",
      "strength": 2.3,  // -6到+6
      "confidence": 38%,
      "meaning": "你更倾向于主动探索AI的可能性,而非仅作为任务工具"
    },
    "trust": {
      "polarity": "Trusting",
      "strength": 1.2,
      "confidence": 20%,
      "meaning": "你愿意信任AI并通过协作优化结果"
    },
    "relationship": {
      "polarity": "Integrated",
      "strength": 0.8,
      "confidence": 13%,
      "meaning": "AI已经开始进入你的思维流程"
    },
    "reflection": {
      "polarity": "Reflective",
      "strength": 0.5,
      "confidence": 8%,
      "meaning": "你会思考AI的社会影响和伦理问题"
    }
  },

  // 第三层: 反思问题(类型作为理解框架)
  "reflection_questions": [
    "这个描述符合你吗?完全符合?部分符合?还是不太符合?",
    "哪些特点很准确?哪些地方你觉得不像?",
    "你的Explorer倾向(2.3)较强,这意味着什么?又可能让你忽略了什么?"
  ],

  // 第四层: 类型对比(你与其他类型的关系)
  "type_comparison": {
    "similar_types": ["AI协作者", "AI实践家"],
    "opposite_type": "AI验证者",
    "contrast_description": "与AI验证者不同,你更愿意先尝试再验证"
  }
}
```

---

## 六、10天MVP实施计划

### Phase 1: 数据结构重构(P0, 2天)

**任务**:
1. 重新定义题目-维度的映射关系(独立,不跨维度)
2. 修改数据库Schema

```sql
CREATE TABLE dimension_questions (
    question_id INT,
    dimension ENUM('engagement', 'trust', 'relationship', 'reflection'),
    pole ENUM('positive', 'negative'),  -- 两端
    weight FLOAT DEFAULT 1.0
);

CREATE TABLE user_dimension_scores (
    user_id INT,
    dimension ENUM('engagement', 'trust', 'relationship', 'reflection'),
    pole_positive_score FLOAT,  -- Explorer/Trusting/Integrated/Reflective
    pole_negative_score FLOAT,  -- Utilizer/Critical/Instrumental/Practical
    polarity_value FLOAT,       -- positive - negative
    confidence FLOAT            -- abs(polarity) / max_range
);
```

3. 修改API返回格式(从单一类型 → 多层信息结构)

---

### Phase 2: 计算逻辑实现(P0, 3天)

**任务**:
1. 实现4个维度的极性计算
2. 实现置信度计算
3. 实现类型判定算法
4. 单元测试

**测试用例**:
```python
# 测试用例1: 强Explorer倾向
test_case_1 = {
    'Q1': 6, 'Q2': 6, 'Q6': 6,  # Explorer: 6
    'Q3': 3, 'Q4': 3,           # Utilizer: 3
    'Q5': 5, 'Q7': 5,           # Trusting: 5
    'Q8': 3, 'Q9': 3, 'Q12': 3  # Critical: 3
}
# 预期: engagement_polarity = +3(强Explorer), trust_polarity = +2(中等Trusting)

# 测试用例2: 混合型
test_case_2 = {
    'Q1': 4, 'Q2': 4, 'Q6': 4,  # Explorer: 4
    'Q3': 4, 'Q4': 4,           # Utilizer: 4
    ...
}
# 预期: 所有polarity接近0 → AI平衡者
```

---

### Phase 3: 前端界面调整(P1, 3天)

**任务**:
1. 结果页展示多层信息结构
   - 类型名称 + 置信度(突出显示)
   - 4个维度的剖面(可视化雷达图)
   - 反思问题(引导讨论)
2. 添加"质疑类型"按钮
   - "这个描述不符合我" → 触发访谈引擎中的反思问题

---

### Phase 4: 访谈引擎集成(P1, 2天)

**任务**:
1. 每个问题的"类型视角层"基于新的维度剖面生成
2. 类型不再只是一个标签,而是"理解框架"
3. 在访谈结束时,触发"类型反思"环节

---

## 七、后期迭代计划(非MVP)

### Iteration 1: 题库扩充(30题版本)

**目标**: 每个维度至少5-6题

```
新增题目方向:
- Engagement: 新增"尝试新AI工具的频率"、"主动学习AI知识的意愿"
- Trust: 新增"AI错误时的应对策略"、"对AI能力的边界认知"
- Relationship: 新增"是否会和AI讨论想法"、"AI是否影响日常决策"
- Reflection: 新增"对AI取代人类工作的看法"、"AI伦理的关注程度"
```

### Iteration 2: 统计验证

**目标**: 提升心理测量学可信度

1. **内部一致性**: Cronbach α > 0.7
2. **结构效度**: EFA验证题目是否形成预设维度
3. **类型稳定性**: Test-retest(两周后重测)
4. **成员验证**: 访谈中询问"是否符合?"

### Iteration 3: 动态校准

**目标**: 基于真实数据调整权重

```python
# 不是所有题目权重都是1
weights = calibrate_based_on_user_feedback(
    initial_weights = {'Q1': 1.0, 'Q2': 1.0, ...},
    feedback_data = "用户访谈中'是否符合'的回答"
)
```

---

## 八、重要定位声明

### 在界面上需要明确的说明

```
💡 关于这个测试

这不是一个心理测试,而是一个反思性工具。

- 15题无法完全准确描述一个人的AI交互方式
- 类型结果不是为了"贴标签",而是为了"引发讨论"
- 我们更关心的是"你是否认同这个描述",以及"为什么认同或不认同"

真正的AI素养,不是由学者预先定义的标准能力,
而是普通人在日常生活中如何认识、理解、与AI交互的实践智慧。

这个类型框架,是我们帮助你探索这种实践智慧的起点。
```

---

## 九、关键代码实现(Python示例)

```python
class AIInteractionProfileClassifier:
    """
    AI交互倾向分类模型
    基于MBTI的维度极性思想,适配15题限制
    """

    def __init__(self):
        # 定义题目-维度映射(不再跨维度)
        self.dimension_mapping = {
            'engagement': {
                'explorer': [1, 2, 6],      # Q1, Q2, Q6
                'utilizer': [3, 4]          # Q3, Q4
            },
            'trust': {
                'trusting': [5, 7],         # Q5, Q7
                'critical': [8, 9, 12]      # Q8, Q9, Q12
            },
            'relationship': {
                'integrated': [2, 14],      # Q2(复用), Q14
                'instrumental': []          # 推断:utilizer倾向
            },
            'reflection': {
                'reflective': [10, 11, 15], # Q10, Q11, Q15
                'practical': [13]           # Q13
            }
        }

    def calculate_dimension_polarity(self, answers, dimension):
        """
        计算单个维度的极性

        返回: {
            'pole_scores': {'positive': X, 'negative': Y},
            'polarity': X - Y,
            'confidence': abs(X - Y) / max_range
        }
        """
        mapping = self.dimension_mapping[dimension]
        positive_questions = mapping['explorer' if dimension == 'engagement' else
                                       'trusting' if dimension == 'trust' else
                                       'integrated' if dimension == 'relationship' else
                                       'reflective']
        negative_questions = mapping['utilizer' if dimension == 'engagement' else
                                       'critical' if dimension == 'trust' else
                                       'instrumental' if dimension == 'relationship' else
                                       'practical']

        # 计算两端平均分
        positive_score = sum(answers[f'Q{q}'] for q in positive_questions) / len(positive_questions)
        negative_score = sum(answers[f'Q{q}'] for q in negative_questions) / len(negative_questions) if negative_questions else 3.5

        # 极性差值
        polarity = positive_score - negative_score

        # 置信度(标准化到0-1)
        max_range = 6.0
        confidence = abs(polarity) / max_range

        return {
            'pole_scores': {'positive': positive_score, 'negative': negative_score},
            'polarity': polarity,
            'confidence': confidence
        }

    def determine_primary_type(self, dimension_polarities):
        """
        基于维度极性判定主要类型

        返回: {
            'type_name': 'AI探索者',
            'confidence': 0.68,
            'dimension_profile': {...}
        }
        """
        # 计算综合置信度(取前3个维度的平均)
        sorted_dims = sorted(
            dimension_polarities.items(),
            key=lambda x: x[1]['confidence'],
            reverse=True
        )[:3]

        avg_confidence = sum(d[1]['confidence'] for d in sorted_dims) / 3

        # 基于规则树判定类型
        engagement = dimension_polarities['engagement']['polarity']
        trust = dimension_polarities['trust']['polarity']
        reflection = dimension_polarities['reflection']['polarity']

        if engagement > 1.5 and trust > 0.5:
            type_name = "AI探索者"
        elif engagement < -1.5 and trust < -0.5:
            type_name = "AI验证者"
        elif engagement < -1.5 and trust > -0.5:
            type_name = "AI实践家"
        elif trust > 1.5 and engagement > -0.5:
            type_name = "AI协作者"
        elif trust < -1.5 and reflection > 0.5:
            type_name = "AI反思者"
        elif abs(engagement) < 0.5 and abs(trust) < 0.5:
            type_name = "AI平衡者"
        else:
            type_name = "AI观察者"

        return {
            'type_name': type_name,
            'confidence': avg_confidence,
            'dimension_profile': dimension_polarities
        }

    def classify(self, answers):
        """
        完整分类流程

        输入: answers = {'Q1': 6, 'Q2': 5, ..., 'Q15': 4}
        输出: 多层信息结构
        """
        # Step 1: 计算每个维度的极性
        dimension_polarities = {}
        for dimension in ['engagement', 'trust', 'relationship', 'reflection']:
            dimension_polarities[dimension] = self.calculate_dimension_polarity(answers, dimension)

        # Step 2: 判定主要类型
        result = self.determine_primary_type(dimension_polarities)

        # Step 3: 添加反思问题
        result['reflection_questions'] = [
            "这个描述符合你吗?完全符合?部分符合?还是不太符合?",
            "哪些特点很准确?哪些地方你觉得不像?",
            f"你的{result['dimension_profile']['engagement']['polarity']}倾向较强,这意味着什么?又可能让你忽略了什么?"
        ]

        return result
```

---

## 十、总结

### 核心改进

1. **从总分到极性**: 计算Explorer vs Utilizer,而非简单的总分
2. **从类型到置信度**: 输出"类型+确信程度",而非绝对标签
3. **从标签到框架**: 类型作为"理解工具",引发访谈讨论
4. **从科学到反思**: 不假装成为心理测量工具,明确定位为反思性框架

### 保留现有设计

- 8种类型名称和描述(完全保留)
- 15道题目(不新增,只重新分组)
- 6阶段认知旅程(完全保留)

### 10天MVP可行性

- ✅ 数据结构重构(2天)
- ✅ 计算逻辑实现(3天)
- ✅ 前端界面调整(3天)
- ✅ 访谈引擎集成(2天)

### 后期迭代方向

- 扩充到30题(提升信度)
- 统计验证(内部一致性、结构效度)
- 动态校准(基于用户反馈)

### 关键定位

> "一个足够合理的分类装置,让用户面对这个分类时产生自我解释"

这才是本项目真正追求的目标,也是社会学质性研究的核心价值。
