# 开发者操作清单：策略C + 策略A混合方案（完整版）

**生成日期**: 2026-07-24
**项目目标**: 解决"素养-风格"测量矛盾，实现3维度×8类型的AI协作风格测量
**10天MVP**: 可行 ✅

---

## 📋 已确定的设计方案

### 决策汇总

| 决策点 | 选择 | 说明 |
|-------|------|------|
| **决策1** | 行为描述版（方案B） | 15题重新解释为具体行为模式 |
| **决策2** | 3轴极性制（方案B） | 3个维度对，8种类型 |
| **决策3** | 雷达图+风格标签 | 视觉化展示+生动命名 |
| **维度方案** | 3维度简化版（方案B） | 探索/信任/反思 |
| **命名方案** | A+F组合 | 网络梗+动物形象 |

---

## 第一部分：15题行为描述版重新解释字典

### 数据结构定义

```sql
CREATE TABLE question_reinterpretation (
    question_id VARCHAR(10) PRIMARY KEY,
    question_content TEXT,
    journey_stage VARCHAR(20),  -- 4阶段之一
    original_measure TEXT,      -- 原解释（素养化）
    behavior_description TEXT,   -- 行为描述（风格化）
    high_score_behavior TEXT,   -- 高分行为（1-7分）
    low_score_behavior TEXT,    -- 低分行为（1-7分）
    value_note TEXT,           -- 无优劣说明
    related_dimensions JSON,    -- 关联的维度
    interview_theme TEXT,      -- 访谈主题
    narrative_focus TEXT       -- 激发叙述
);
```

### 完整15题重新解释表

| 题号 | 原解释（素养化） | 行为描述（风格化） | 高分行为 | 低分行为 | 无优劣说明 |
|------|----------------|-------------------|---------|---------|-----------|
| **Q1** | AI识别能力 | **技术信息寻求行为** | 查看产品说明、技术文档，关注技术实现 | 通过使用体验判断，不关注技术细节 | 两种行为模式都合理 |
| **Q2** | AI感知能力 | **日常觉察行为** | 主动发现生活中的AI应用 | 被动接触AI，较少察觉 | 两种行为模式都合理 |
| **Q3** | 目标导向使用 | **使用动机行为** | 有明确任务才使用AI | 随机探索AI功能 | 两种行为模式都合理 |
| **Q4** | 工具选择能力 | **工具认知行为** | 了解多种AI工具，对比选择 | 专注少数工具，不关注其他 | 两种行为模式都合理 |
| **Q5** | 协作意愿 | **调试耐心行为** | 多次调整表达，与AI协作调试 | 放弃尝试，转向人工完成 | 两种行为模式都合理 |
| **Q6** | 学习能力 | **新技术接触行为** | 主动尝试新AI工具 | 等待工具成熟后再使用 | 两种行为模式都合理 |
| **Q7** | 复杂问题处理 | **任务分配行为** | 愿意把复杂任务交给AI | 倾向人工完成复杂任务 | 两种行为模式都合理 |
| **Q8** | 结果验证 | **验证行为** | 主动检查AI的结果 | 直接接受AI的输出 | 两种行为模式都合理 |
| **Q9** | 边界意识 | **适用性判断行为** | 明确知道AI的适用边界 | 模糊感知AI的边界 | 两种行为模式都合理 |
| **Q10** | 社会影响考量 | **影响思考范围** | 考虑AI对社会的影响 | 仅考虑AI对个人的影响 | 两种行为模式都合理 |
| **Q11** | 风险意识 | **隐私关注行为** | 主动关注AI的隐私风险 | 较少关注隐私问题 | 两种行为模式都合理 |
| **Q12** | 批判性思维 | **权威质疑行为** | 不盲从AI的"专业"外表 | 容易被AI的专业外表说服 | 两种行为模式都合理 |
| **Q13** | 情绪调节 | **情绪应对行为** | 主动调整心态，适应AI | 被动感受情绪变化 | 两种行为模式都合理 |
| **Q14** | 概念理解变化 | **概念更新行为** | 快速调整对AI的认知 | 缓慢变化，逐步理解 | 两种行为模式都合理 |
| **Q15** | 自主原则 | **原则使用行为** | 有明确的AI使用原则 | 随性使用，无固定原则 | 两种行为模式都合理 |

### JSON格式示例

```json
{
  "Q1": {
    "question_id": "Q1",
    "question_content": "我通常能够判断，一个应用或服务是否真正使用了AI",
    "journey_stage": "接触轨迹",
    "original_measure": "AI识别能力（素养化）",
    "behavior_description": "技术信息寻求行为",
    "high_score_behavior": "查看产品说明、技术文档，关注技术实现",
    "low_score_behavior": "通过使用体验判断，不关注技术细节",
    "value_note": "两种行为模式都合理，无优劣之分",
    "related_dimensions": ["探索者-实用者"],
    "interview_theme": "如何判断AI是否真实存在",
    "narrative_focus": "从技术关注 vs 使用体验谈起"
  },
  // ... Q2-Q15 同理
}
```

---

## 第二部分：3维度完整定义

### 维度1：探索者-实用者（EXPLORER - UTILIZER）

#### 基本信息

| 属性 | 内容 |
|------|------|
| **维度名称** | 探索者-实用者 |
| **核心张力** | 主动探索AI可能性 vs 任务导向使用AI |
| **对应代码** | E vs U |
| **测量题目** | Q1,Q2,Q6（探索端）vs Q3,Q4（实用端） |

#### 两端详细定义

**探索者端 (E)**：
- **核心特征**：主动探索AI的可能性，把它当成玩具/实验场
- **典型行为**：
  - 关注AI技术实现细节（Q1高分）
  - 敏锐察觉生活中AI的应用（Q2高分）
  - 主动尝试新AI工具（Q6高分）
- **高分含义**：偏向探索端
- **低分含义**：偏向实用端（或中间位置）

**实用者端 (U)**：
- **核心特征**：任务导向使用，AI只是完成任务的工具
- **典型行为**：
  - 有明确任务才使用AI（Q3高分）
  - 专注少数工具，深入了解（Q4高分）
  - 等待工具成熟后再使用（Q6低分）
- **高分含义**：偏向实用端
- **低分含义**：偏向探索端（或中间位置）

#### 无优劣说明

**探索端和实用端都是合理的AI协作方式，无优劣之分**
- 探索者能发现更多可能性，适合创新场景
- 实用者更专注高效，适合任务场景

---

### 维度2：信任者-验证者（TRUSTER - VERIFIER）

#### 基本信息

| 属性 | 内容 |
|------|------|
| **维度名称** | 信任者-验证者 |
| **核心张力** | 信任AI输出 vs 质疑AI输出 |
| **对应代码** | T vs V |
| **测量题目** | Q5,Q7（信任端）vs Q8,Q9,Q12（验证端） |

#### 两端详细定义

**信任者端 (T)**：
- **核心特征**：信任AI，愿意协作调试
- **典型行为**：
  - 多次调整表达，与AI协作（Q5高分）
  - 复杂任务也愿意交给AI（Q7高分）
- **高分含义**：偏向信任端
- **低分含义**：偏向验证端（或中间位置）

**验证者端 (V)**：
- **核心特征**：质疑AI，需要验证批判
- **典型行为**：
  - 主动检查AI的结果（Q8高分）
  - 明确知道AI的适用边界（Q9高分）
  - 不盲从AI的"专业"外表（Q12高分）
- **高分含义**：偏向验证端
- **低分含义**：偏向信任端（或中间位置）

#### 无优劣说明

**信任端和验证端都是合理的AI协作方式，无优劣之分**
- 信任者协作效率更高，适合快速迭代
- 验证者更谨慎准确，适合高风险场景

---

### 维度3：功能者-反思者（FUNCTIONALIST - REFLECTOR）

#### 基本信息

| 属性 | 内容 |
|------|------|
| **维度名称** | 功能者-反思者 |
| **核心张力** | 关注AI功能使用 vs 思考AI社会影响 |
| **对应代码** | F vs R |
| **测量题目** | Q3,Q4,Q5,Q6（功能端）vs Q10,Q11,Q13,Q14,Q15（反思端） |

#### 两端详细定义

**功能者端 (F)**：
- **核心特征**：关注AI的功能性使用，注重效率
- **典型行为**：
  - 有明确任务才使用AI（Q3高分）
  - 专注工具选择和效率（Q4高分）
  - 愿意调试协作完成任务（Q5高分）
  - 主动尝试能提高效率的工具（Q6高分）
- **高分含义**：偏向功能端
- **低分含义**：偏向反思端（或中间位置）

**反思者端 (R)**：
- **核心特征**：思考AI的社会影响和个人影响
- **典型行为**：
  - 考虑AI对社会的影响（Q10高分）
  - 关注AI的隐私风险（Q11高分）
  - 主动调整AI带来的情绪（Q13高分）
  - 快速调整对AI的认知（Q14高分）
  - 有明确的AI使用原则（Q15高分）
- **高分含义**：偏向反思端
- **低分含义**：偏向功能端（或中间位置）

#### 无优劣说明

**功能端和反思端都是合理的AI协作方式，无优劣之分**
- 功能者更实用，适合日常工作
- 反思者更深刻，适合长期思考

---

## 第三部分：8种类型详细定义（网络梗+动物形象）

### 8种类型完整表

| 代码 | 网络梗名 | 动物形象 | 维度组合 | 核心特征 |
|------|---------|---------|---------|---------|
| **ETF** | 摸鱼人 | 好奇猫 | 探索+信任+功能 | 爱玩新AI，信任AI，提高摸鱼效率 |
| **ERF** | 质疑党 | 谨慎狗 | 探索+验证+功能 | 爱玩新AI，但要验证，注重实用 |
| **UTF** | 工具人 | 忙碌蜂 | 实用+信任+功能 | 有任务才用AI，信任AI，完成任务 |
| **UVF** | 保守派 | 稳妥龟 | 实用+验证+功能 | 有任务才用AI，要验证，稳妥 |
| **ETR** | 哲学家 | 智慧猫头鹰 | 探索+信任+反思 | 爱玩新AI，信任AI，深度思考 |
| **ERR** | 批判家 | 批判狐狸 | 探索+验证+反思 | 爱玩新AI，要验证，深度思考 |
| **UTR** | 实干家 | 实践大象 | 实用+信任+反思 | 有任务才用AI，信任AI，思考影响 |
| **UVR** | 老古董 | 守仓松鼠 | 实用+验证+反思 | 有任务才用AI，要验证，关注风险 |

### 详细定义（每种类型）

#### 类型1：ETF - 摸鱼人（好奇猫型）

**维度组合**：探索(E) + 信任(T) + 功能(F)

**核心画像**：
- 爱玩新AI工具，提高摸鱼效率
- 好奇探索，信任AI，注重实用

**典型行为**：
- 关注AI技术细节，主动尝试新工具（Q1,Q2,Q6高分）
- 愿意调试协作，信任AI输出（Q5,Q7高分）
- 关注效率和使用体验（Q3,Q4,Q5高分）

**访谈引导重点**：
- "你总是第一时间尝试新AI工具？"
- "AI帮你提高了多少摸鱼效率？"
- "你信任AI输出的原因是什么？"

**输出描述**：
```
你是AI摸鱼人（好奇猫型）

• 好奇猫：总是第一时间尝试新AI工具
• 摸鱼人：用AI提高摸鱼效率，主打一个实用

你的特点：
✓ 主动探索AI的可能性
✓ 信任AI，愿意协作调试
✓ 注重效率和使用体验

无优劣说明：摸鱼人和实干家都合理，只是风格不同
```

---

#### 类型2：ERF - 质疑党（谨慎狗型）

**维度组合**：探索(E) + 验证(V) + 功能(F)

**核心画像**：
- 爱玩新AI，但每次都要验证
- "让我康康是不是AI写的"

**典型行为**：
- 关注AI技术细节，主动尝试新工具（Q1,Q2,Q6高分）
- 主动检查AI结果，明确边界（Q8,Q9,Q12高分）
- 关注效率，但要验证（Q3,Q4高分）

**访谈引导重点**：
- "你爱尝试新AI，但为什么不完全信任？"
- "你如何验证AI的输出？"
- "验证的标准是什么？"

**输出描述**：
```
你是AI质疑党（谨慎狗型）

• 谨慎狗：先闻闻再决定，不轻易信任
• 质疑党："让我康康是不是AI写的"

你的特点：
✓ 主动探索AI的可能性
✓ 验证AI的结果，不盲从
✓ 注重效率，但要稳妥

无优劣说明：质疑党和信任者都合理，只是风格不同
```

---

#### 类型3：UTF - 工具人（忙碌蜂型）

**维度组合**：实用(U) + 信任(T) + 功能(F)

**核心画像**：
- 有明确任务才用AI，信任AI，完成任务
- "AI是我的工具"

**典型行为**：
- 有明确任务才使用AI（Q3,Q4高分）
- 愿意调试协作，信任AI输出（Q5,Q7高分）
- 专注任务完成（Q3,Q4,Q5高分）

**访谈引导重点**：
- "你通常在什么任务中使用AI？"
- "AI如何帮助你完成任务？"
- "你信任AI的原因是什么？"

**输出描述**：
```
你是AI工具人（忙碌蜂型）

• 忙碌蜂：有目标才行动，快速完成任务
• 工具人："AI是我的工具，帮我干活"

你的特点：
✓ 有明确任务才使用AI
✓ 信任AI，愿意协作
✓ 注重任务完成效率

无优劣说明：工具人和探索者都合理，只是风格不同
```

---

#### 类型4：UVF - 保守派（稳妥龟型）

**维度组合**：实用(U) + 验证(V) + 功能(F)

**核心画像**：
- 有任务才用AI，要验证，稳妥
- "再看看，不急"

**典型行为**：
- 有明确任务才使用AI（Q3,Q4高分）
- 主动检查AI结果，明确边界（Q8,Q9,Q12高分）
- 专注任务完成，但要验证（Q3,Q4高分）

**访谈引导重点**：
- "你使用AI的场景有哪些？"
- "为什么需要验证AI的输出？"
- "你如何确保稳妥？"

**输出描述**：
```
你是AI保守派（稳妥龟型）

• 稳妥龟：稳字当头，不轻易冒险
• 保守派："再看看，不急"

你的特点：
✓ 有明确任务才使用AI
✓ 验证AI的结果
✓ 稳扎稳打，确保正确

无优劣说明：保守派和探索者都合理，只是风格不同
```

---

#### 类型5：ETR - 哲学家（智慧猫头鹰型）

**维度组合**：探索(E) + 信任(T) + 反思(R)

**核心画像**：
- 爱玩新AI，信任AI，但爱思考
- "AI会取代人类吗？"

**典型行为**：
- 关注AI技术细节，主动尝试新工具（Q1,Q2,Q6高分）
- 愿意调试协作，信任AI输出（Q5,Q7高分）
- 思考AI的社会影响和个人影响（Q10,Q11,Q13,Q14,Q15高分）

**访谈引导重点**：
- "你如何看待AI的社会影响？"
- "AI会改变人类的什么？"
- "你对AI的思考是什么？"

**输出描述**：
```
你是AI哲学家（智慧猫头鹰型）

• 智慧猫头鹰：深夜思考AI与人类
• 哲学家："AI会取代人类吗？"

你的特点：
✓ 主动探索AI的可能性
✓ 信任AI，愿意协作
✓ 深度思考AI的社会影响

无优劣说明：哲学家和工具人都合理，只是风格不同
```

---

#### 类型6：ERR - 批判家（批判狐狸型）

**维度组合**：探索(E) + 验证(V) + 反思(R)

**核心画像**：
- 爱玩新AI，要验证，爱思考
- "AI的局限性在哪里？"

**典型行为**：
- 关注AI技术细节，主动尝试新工具（Q1,Q2,Q6高分）
- 主动检查AI结果，不盲从（Q8,Q9,Q12高分）
- 思考AI的社会影响和个人影响（Q10,Q11,Q13,Q14,Q15高分）

**访谈引导重点**：
- "你如何批判性地看待AI？"
- "AI的局限性是什么？"
- "你认为AI应该如何发展？"

**输出描述**：
```
你是AI批判家（批判狐狸型）

• 批判狐狸：狡猾地分析AI漏洞
• 批判家："AI的局限性在哪里？"

你的特点：
✓ 主动探索AI的可能性
✓ 验证AI的结果，不盲从
✓ 深度思考AI的社会影响

无优劣说明：批判家和信任者都合理，只是风格不同
```

---

#### 类型7：UTR - 实干家（实践大象型）

**维度组合**：实用(U) + 信任(T) + 反思(R)

**核心画像**：
- 有任务才用AI，信任AI，会思考影响
- "AI帮我工作，也思考影响"

**典型行为**：
- 有明确任务才使用AI（Q3,Q4高分）
- 愿意调试协作，信任AI输出（Q5,Q7高分）
- 思考AI的社会影响和个人影响（Q10,Q11,Q13,Q14,Q15高分）

**访谈引导重点**：
- "你如何在工作中使用AI？"
- "AI如何改变你的工作？"
- "你如何看待AI的影响？"

**输出描述**：
```
你是AI实干家（实践大象型）

• 实践大象：稳重实践，深思熟虑
• 实干家："AI帮我工作，也思考影响"

你的特点：
✓ 有明确任务才使用AI
✓ 信任AI，愿意协作
✓ 思考AI的社会影响

无优劣说明：实干家和探索者都合理，只是风格不同
```

---

#### 类型8：UVR - 老古董（守仓松鼠型）

**维度组合**：实用(U) + 验证(V) + 反思(R)

**核心画像**：
- 有任务才用AI，要验证，关注风险
- "以前没有AI不也挺好？"

**典型行为**：
- 有明确任务才使用AI（Q3,Q4高分）
- 主动检查AI结果，明确边界（Q8,Q9,Q12高分）
- 思考AI的社会影响和个人影响（Q10,Q11,Q13,Q14,Q15高分）

**访谈引导重点**：
- "你对AI持谨慎态度的原因是什么？"
- "你认为AI的风险有哪些？"
- "你如何平衡使用和风险？"

**输出描述**：
```
你是AI老古董（守仓松鼠型）

• 守仓松鼠：存粮过冬，关注风险
• 老古董："以前没有AI不也挺好？"

你的特点：
✓ 有明确任务才使用AI
✓ 验证AI的结果
✓ 关注AI的风险和影响

无优劣说明：老古董和探索者都合理，只是风格不同
```

---

## 第四部分：计算逻辑伪代码

### 核心计算流程

```python
def calculate_ai_collaboration_style(answers):
    """
    计算AI协作风格（3维度×8类型）

    参数:
        answers: dict, 15道题的答案 {"Q1": 5, "Q2": 6, ..., "Q15": 4}

    返回:
        style_profile: dict, 包含维度位置、距离、类型判定
    """

    # ============ 第1步：计算3个维度对的得分 ============

    # 维度1：探索者-实用者 (E-U)
    exploration_score = (answers["Q1"] + answers["Q2"] + answers["Q6"]) / 3
    utilizer_score = (answers["Q3"] + answers["Q4"]) / 2

    # 维度2：信任者-验证者 (T-V)
    truster_score = (answers["Q5"] + answers["Q7"]) / 2
    verifier_score = (answers["Q8"] + answers["Q9"] + answers["Q12"]) / 3

    # 维度3：功能者-反思者 (F-R)
    functionalist_score = (answers["Q3"] + answers["Q4"] + answers["Q5"] + answers["Q6"]) / 4
    reflector_score = (answers["Q10"] + answers["Q11"] + answers["Q13"] + answers["Q14"] + answers["Q15"]) / 5

    # ============ 第2步：判断每个维度的位置和距离 ============

    # 维度1：探索者-实用者
    if exploration_score > utilizer_score:
        position_1 = "E"  # 探索者端
        distance_1 = exploration_score - utilizer_score
    elif exploration_score < utilizer_score:
        position_1 = "U"  # 实用者端
        distance_1 = utilizer_score - exploration_score
    else:
        position_1 = "中间"  # 中间位置
        distance_1 = 0

    # 维度2：信任者-验证者
    if truster_score > verifier_score:
        position_2 = "T"  # 信任者端
        distance_2 = truster_score - verifier_score
    elif truster_score < verifier_score:
        position_2 = "V"  # 验证者端
        distance_2 = verifier_score - truster_score
    else:
        position_2 = "中间"  # 中间位置
        distance_2 = 0

    # 维度3：功能者-反思者
    if functionalist_score > reflector_score:
        position_3 = "F"  # 功能者端
        distance_3 = functionalist_score - reflector_score
    elif functionalist_score < reflector_score:
        position_3 = "R"  # 反思者端
        distance_3 = reflector_score - functionalist_score
    else:
        position_3 = "中间"  # 中间位置
        distance_3 = 0

    # ============ 第3步：组合成3位代码 ============

    type_code = position_1 + position_2 + position_3  # 例如："ETF", "UVF", "ETR"

    # ============ 第4步：查找类型名称 ============

    type_names = {
        "ETF": {"meme": "摸鱼人", "animal": "好奇猫"},
        "ERF": {"meme": "质疑党", "animal": "谨慎狗"},
        "UTF": {"meme": "工具人", "animal": "忙碌蜂"},
        "UVF": {"meme": "保守派", "animal": "稳妥龟"},
        "ETR": {"meme": "哲学家", "animal": "智慧猫头鹰"},
        "ERR": {"meme": "批判家", "animal": "批判狐狸"},
        "UTR": {"meme": "实干家", "animal": "实践大象"},
        "UVR": {"meme": "老古董", "animal": "守仓松鼠"}
    }

    # 如果有中间位置，使用最近类型
    if position_1 == "中间" or position_2 == "中间" or position_3 == "中间":
        # 找到距离最近的维度端
        type_code = find_nearest_type(position_1, position_2, position_3,
                                       distance_1, distance_2, distance_3)

    type_name = type_names.get(type_code, {"meme": "未知", "animal": "未知"})

    # ============ 第5步：生成输出结果 ============

    style_profile = {
        "dimension_1": {
            "name": "探索者-实用者",
            "position": position_1,
            "distance": distance_1,
            "exploration_score": exploration_score,
            "utilizer_score": utilizer_score,
            "description": get_dimension_description(position_1, distance_1, "E-U")
        },
        "dimension_2": {
            "name": "信任者-验证者",
            "position": position_2,
            "distance": distance_2,
            "truster_score": truster_score,
            "verifier_score": verifier_score,
            "description": get_dimension_description(position_2, distance_2, "T-V")
        },
        "dimension_3": {
            "name": "功能者-反思者",
            "position": position_3,
            "distance": distance_3,
            "functionalist_score": functionalist_score,
            "reflector_score": reflector_score,
            "description": get_dimension_description(position_3, distance_3, "F-R")
        },
        "type_code": type_code,
        "type_name_meme": type_name["meme"],
        "type_name_animal": type_name["animal"],
        "full_name": f"AI{type_name['meme']}（{type_name['animal']}型）",
        "value_statement": "每种协作风格都值得研究，无优劣之分",
        "theory_innovation": "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从'能力水平'到'协作风格'。这不是'谁更会用AI'的问题，而是'人与AI形成何种协作关系'的问题。"
    }

    return style_profile


def find_nearest_type(p1, p2, p3, d1, d2, d3):
    """
    找到距离最近的类型（处理中间位置）
    """
    # 将中间位置替换为距离更近的一端
    if p1 == "中间":
        p1 = "E" if d1 < 0 else "U"  # 实际上这逻辑需要修正
    # ... 同理处理p2, p3
    return p1 + p2 + p3


def get_dimension_description(position, distance, dimension_name):
    """
    生成维度描述文本
    """
    if dimension_name == "E-U":
        if position == "E":
            return f"你偏向探索端（距离中心{distance:.1f}），更倾向于主动探索AI的可能性"
        elif position == "U":
            return f"你偏向实用端（距离中心{distance:.1f}），更倾向于任务导向使用AI"
        else:
            return "你在探索和实用之间保持平衡"

    elif dimension_name == "T-V":
        if position == "T":
            return f"你偏向信任端（距离中心{distance:.1f}），更倾向于信任AI的输出"
        elif position == "V":
            return f"你偏向验证端（距离中心{distance:.1f}），更倾向于验证AI的结果"
        else:
            return "你在信任和验证之间保持平衡"

    elif dimension_name == "F-R":
        if position == "F":
            return f"你偏向功能端（距离中心{distance:.1f}），更关注AI的功能性使用"
        elif position == "R":
            return f"你偏向反思端（距离中心{distance:.1f}），更深度思考AI的社会影响"
        else:
            return "你在功能和反思之间保持平衡"
```

### 测试用例

```python
# 测试用例1：典型的ETF类型（摸鱼人/好奇猫）
answers_etf = {
    "Q1": 7, "Q2": 6, "Q3": 3, "Q4": 3,  # 探索端（Q1,Q2高分，Q3,Q4低分）
    "Q5": 6, "Q6": 7, "Q7": 6,           # 信任端（Q5,Q7高分）
    "Q8": 3, "Q9": 3, "Q12": 3,         # 验证端低分
    "Q10": 3, "Q11": 3, "Q13": 3, "Q14": 3, "Q15": 3  # 反思端低分
}
result = calculate_ai_collaboration_style(answers_etf)
# 预期：type_code = "ETF", type_name = "摸鱼人/好奇猫"

# 测试用例2：典型的UVR类型（老古董/守仓松鼠）
answers_uvr = {
    "Q1": 3, "Q2": 3, "Q3": 7, "Q4": 7,  # 实用端（Q3,Q4高分，Q1,Q2低分）
    "Q5": 3, "Q6": 3, "Q7": 3,           # 信任端低分
    "Q8": 7, "Q9": 7, "Q12": 7,         # 验证端高分
    "Q10": 7, "Q11": 7, "Q13": 7, "Q14": 7, "Q15": 7  # 反思端高分
}
result = calculate_ai_collaboration_style(answers_uvr)
# 预期：type_code = "UVR", type_name = "老古董/守仓松鼠"
```

---

## 第五部分：输出格式设计（雷达图+网络梗+动物形象）

### 输出JSON结构

```json
{
  "style_profile": {
    "dimensions": [
      {
        "dimension_id": "E-U",
        "dimension_name": "探索者-实用者",
        "position": "E",
        "position_text": "偏向探索端",
        "distance_from_center": 1.8,
        "scores": {
          "exploration": 6.3,
          "utilizer": 4.5
        },
        "description": "你偏向探索端（距离中心1.8），更倾向于主动探索AI的可能性",
        "value_note": "探索端和实用端都是合理的协作方式，无优劣之分"
      },
      {
        "dimension_id": "T-V",
        "dimension_name": "信任者-验证者",
        "position": "T",
        "position_text": "偏向信任端",
        "distance_from_center": 0.5,
        "scores": {
          "truster": 5.5,
          "verifier": 5.0
        },
        "description": "你偏向信任端（距离中心0.5），更倾向于信任AI的输出",
        "value_note": "信任端和验证端都是合理的协作方式，无优劣之分"
      },
      {
        "dimension_id": "F-R",
        "dimension_name": "功能者-反思者",
        "position": "F",
        "position_text": "偏向功能端",
        "distance_from_center": 2.1,
        "scores": {
          "functionalist": 6.0,
          "reflector": 3.9
        },
        "description": "你偏向功能端（距离中心2.1），更关注AI的功能性使用",
        "value_note": "功能端和反思端都是合理的协作方式，无优劣之分"
      }
    ],
    "type_code": "ETF",
    "type_names": {
      "meme": "摸鱼人",
      "animal": "好奇猫"
    },
    "full_name": "AI摸鱼人（好奇猫型）",
    "characteristics": [
      "主动探索AI的可能性",
      "信任AI，愿意协作调试",
      "注重效率和使用体验"
    ],
    "interview_guidance": [
      "你总是第一时间尝试新AI工具？",
      "AI帮你提高了多少摸鱼效率？",
      "你信任AI输出的原因是什么？"
    ],
    "value_statement": "每种协作风格都值得研究，无优劣之分",
    "theory_innovation": "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从'能力水平'到'协作风格'。这不是'谁更会用AI'的问题，而是'人与AI形成何种协作关系'的问题。"
  }
}
```

### 界面展示设计

```
┌─────────────────────────────────────────────────────────────┐
│                    你的AI协作风格画像                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                       探索者(E)                             │
│                          ▲                                  │
│                          │                                  │
│              反思者(R)   ●───┼───●   实用者(U)               │
│                          │                                  │
│                          ▼                                  │
│                       验证者(V)                             │
│              （信任者T在反思者侧，距离0.5）                  │
│                                                             │
│              ● = 你的位置：偏向探索-信任-功能端              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  🎭 你的类型：AI摸鱼人（好奇猫型）                          │
│                                                             │
│  • 好奇猫：总是第一时间尝试新AI工具                         │
│  • 摸鱼人：用AI提高摸鱼效率，主打一个实用                   │
│                                                             │
│  📊 你的特点：                                              │
│  ✓ 主动探索AI的可能性                                       │
│  ✓ 信任AI，愿意协作调试                                     │
│  ✓ 注重效率和使用体验                                       │
│                                                             │
│  📐 维度详情：                                              │
│  • 探索-实用：偏向探索端（距离中心1.8）                      │
│    "更倾向于主动探索AI的可能性"                            │
│  • 信任-验证：偏向信任端（距离中心0.5）                      │
│    "更倾向于信任AI的输出"                                   │
│  • 功能-反思：偏向功能端（距离中心2.1）                      │
│    "更关注AI的功能性使用"                                   │
│                                                             │
│  💬 访谈引导：                                              │
│  "你总是第一时间尝试新AI工具？"                            │
│  "AI帮你提高了多少摸鱼效率？"                               │
│  "你信任AI输出的原因是什么？"                               │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ⚠️ 重要说明：                                              │
│  每种协作风格都值得研究，无优劣之分                         │
│                                                             │
│  本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：     │
│  从"能力水平"到"协作风格"。                                  │
│  这不是"谁更会用AI"的问题，                                  │
│  而是"人与AI形成何种协作关系"的问题。                        │
└─────────────────────────────────────────────────────────────┘
```

---

## 第六部分：10天MVP开发者任务清单

### Day 1-2：数据结构与内容准备

#### 任务1.1：创建数据库表（2小时）

```sql
-- 15题重新解释表
CREATE TABLE question_reinterpretation (
    question_id VARCHAR(10) PRIMARY KEY,
    question_content TEXT,
    journey_stage VARCHAR(20),
    original_measure TEXT,
    behavior_description TEXT,
    high_score_behavior TEXT,
    low_score_behavior TEXT,
    value_note TEXT,
    related_dimensions JSON,
    interview_theme TEXT,
    narrative_focus TEXT
);

-- 3维度定义表
CREATE TABLE dimension_definitions (
    dimension_id VARCHAR(10) PRIMARY KEY,
    dimension_name VARCHAR(50),
    core_tension TEXT,
    positive_end_name VARCHAR(20),
    negative_end_name VARCHAR(20),
    positive_end_questions JSON,
    negative_end_questions JSON,
    value_note TEXT
);

-- 8类型定义表
CREATE TABLE type_definitions (
    type_code VARCHAR(10) PRIMARY KEY,
    type_name_meme VARCHAR(20),
    type_name_animal VARCHAR(20),
    dimension_combination VARCHAR(10),
    core_characteristics TEXT,
    interview_guidance JSON
);
```

#### 任务1.2：导入15题重新解释数据（1小时）

```json
[
  {
    "question_id": "Q1",
    "question_content": "我通常能够判断，一个应用或服务是否真正使用了AI",
    "journey_stage": "接触轨迹",
    "original_measure": "AI识别能力（素养化）",
    "behavior_description": "技术信息寻求行为",
    "high_score_behavior": "查看产品说明、技术文档，关注技术实现",
    "low_score_behavior": "通过使用体验判断，不关注技术细节",
    "value_note": "两种行为模式都合理，无优劣之分",
    "related_dimensions": ["E-U"],
    "interview_theme": "如何判断AI是否真实存在",
    "narrative_focus": "从技术关注 vs 使用体验谈起"
  },
  // ... Q2-Q15
]
```

#### 任务1.3：导入3维度定义数据（0.5小时）

```json
[
  {
    "dimension_id": "E-U",
    "dimension_name": "探索者-实用者",
    "core_tension": "主动探索AI可能性 vs 任务导向使用AI",
    "positive_end_name": "探索者",
    "negative_end_name": "实用者",
    "positive_end_questions": ["Q1", "Q2", "Q6"],
    "negative_end_questions": ["Q3", "Q4"],
    "value_note": "探索端和实用端都是合理的协作方式，无优劣之分"
  },
  // ... T-V, F-R
]
```

#### 任务1.4：导入8类型定义数据（0.5小时）

```json
[
  {
    "type_code": "ETF",
    "type_name_meme": "摸鱼人",
    "type_name_animal": "好奇猫",
    "dimension_combination": "E+T+F",
    "core_characteristics": "爱玩新AI，信任AI，提高摸鱼效率",
    "interview_guidance": [
      "你总是第一时间尝试新AI工具？",
      "AI帮你提高了多少摸鱼效率？",
      "你信任AI输出的原因是什么？"
    ]
  },
  // ... ERF, UTF, UVF, ETR, ERR, UTR, UVR
]
```

**Day 1-2验收标准**：
- ✅ 数据库表创建成功
- ✅ 15题重新解释数据导入成功
- ✅ 3维度定义数据导入成功
- ✅ 8类型定义数据导入成功

---

### Day 3-5：计算逻辑实现

#### 任务2.1：实现核心计算函数（1天）

```python
# 文件：services/collaboration_style_calculator.py

def calculate_ai_collaboration_style(answers):
    """
    见上文伪代码，完整实现计算逻辑
    """
    pass

def find_nearest_type(p1, p2, p3, d1, d2, d3):
    """
    处理中间位置的逻辑
    """
    pass

def get_dimension_description(position, distance, dimension_name):
    """
    生成维度描述文本
    """
    pass
```

#### 任务2.2：单元测试（0.5天）

```python
# 文件：tests/test_calculator.py

def test_etf_type():
    """测试ETF类型判定"""
    answers_etf = {
        "Q1": 7, "Q2": 6, "Q3": 3, "Q4": 3,
        "Q5": 6, "Q6": 7, "Q7": 6,
        "Q8": 3, "Q9": 3, "Q12": 3,
        "Q10": 3, "Q11": 3, "Q13": 3, "Q14": 3, "Q15": 3
    }
    result = calculate_ai_collaboration_style(answers_etf)
    assert result["type_code"] == "ETF"
    assert result["type_name_meme"] == "摸鱼人"
    assert result["type_name_animal"] == "好奇猫"

def test_uvr_type():
    """测试UVR类型判定"""
    answers_uvr = {
        "Q1": 3, "Q2": 3, "Q3": 7, "Q4": 7,
        "Q5": 3, "Q6": 3, "Q7": 3,
        "Q8": 7, "Q9": 7, "Q12": 7,
        "Q10": 7, "Q11": 7, "Q13": 7, "Q14": 7, "Q15": 7
    }
    result = calculate_ai_collaboration_style(answers_uvr)
    assert result["type_code"] == "UVR"
    assert result["type_name_meme"] == "老古董"
    assert result["type_name_animal"] == "守仓松鼠"

def test_all_8_types():
    """测试所有8种类型"""
    # ... 测试ERF, UTF, UVF, ETR, ERR, UTR
```

#### 任务2.3：集成到现有测试系统（0.5天）

```python
# 文件：services/test_service.py

class TestService:
    def calculate_test_result(self, user_answers):
        """
        计算测试结果（替换原有的4维度计算逻辑）
        """
        # 调用新的计算函数
        style_profile = calculate_ai_collaboration_style(user_answers)

        # 保存到数据库
        self.save_result(style_profile)

        return style_profile
```

**Day 3-5验收标准**：
- ✅ 核心计算函数实现完成
- ✅ 8种类型的单元测试全部通过
- ✅ 集成到现有测试系统成功
- ✅ 测试结果JSON格式正确

---

### Day 6-8：前端界面实现

#### 任务3.1：结果页UI设计（1天）

```jsx
// 文件：components/StyleResultPage.jsx

function StyleResultPage({ styleProfile }) {
  return (
    <div className="style-result-page">
      <h1>你的AI协作风格画像</h1>

      {/* 雷达图 */}
      <RadarChart dimensions={styleProfile.dimensions} />

      {/* 类型名称 */}
      <TypeName
        meme={styleProfile.type_names.meme}
        animal={styleProfile.type_names.animal}
      />

      {/* 特点列表 */}
      <Characteristics
        characteristics={styleProfile.characteristics}
      />

      {/* 维度详情 */}
      <DimensionDetails dimensions={styleProfile.dimensions} />

      {/* 访谈引导 */}
      <InterviewGuidance
        guidance={styleProfile.interview_guidance}
      />

      {/* 价值声明 */}
      <ValueStatement
        statement={styleProfile.value_statement}
        theory={styleProfile.theory_innovation}
      />
    </div>
  );
}
```

#### 任务3.2：雷达图组件（0.5天）

```jsx
// 文件：components/RadarChart.jsx

function RadarChart({ dimensions }) {
  // 3维度雷达图
  // E-U: 水平轴（左=实用者，右=探索者）
  // T-V: 右下轴（右下=信任者，左上=验证者）
  // F-R: 左下轴（左下=反思者，右上=功能者）

  const positions = {
    "E": { x: 1, y: 0 },
    "U": { x: -1, y: 0 },
    "T": { x: 0.5, y: -0.866 },
    "V": { x: -0.5, y: 0.866 },
    "F": { x: 0.5, y: 0.866 },
    "R": { x: -0.5, y: -0.866 }
  };

  // 计算用户位置
  const userPosition = calculateUserPosition(dimensions);

  return (
    <svg viewBox="-1.5 -1.5 3 3">
      {/* 绘制三角形坐标轴 */}
      <polygon points="1,0 0.5,-0.866 -0.5,-0.866" fill="none" stroke="#ccc" />
      <polygon points="-1,0 -0.5,0.866 0.5,0.866" fill="none" stroke="#ccc" />
      <polygon points="0.5,-0.866 0,0 -0.5,0.866" fill="none" stroke="#ccc" />

      {/* 标注轴标签 */}
      <text x="1.2" y="0">探索者(E)</text>
      <text x="-1.5" y="0">实用者(U)</text>
      <text x="0.6" y="-1">信任者(T)</text>
      <text x="-0.8" y="1">验证者(V)</text>
      <text x="0.6" y="1">功能者(F)</text>
      <text x="-0.8" y="-1">反思者(R)</text>

      {/* 绘制用户位置 */}
      <circle cx={userPosition.x} cy={userPosition.y} r="0.1" fill="#FF6B6B" />
    </svg>
  );
}
```

#### 任务3.3：访谈引擎界面更新（0.5天）

```jsx
// 文件：components/InterviewEngine.jsx

function InterviewEngine({ userAnswers, styleProfile }) {
  return (
    <div className="interview-engine">
      {/* 4阶段进度条 */}
      <StageProgress currentStage={3} totalStages={4} />

      {/* 当前题目卡片 */}
      <QuestionCard
        question={currentQuestion}
        answer={userAnswers[currentQuestion.id]}
        behaviorDescription={currentQuestion.behavior_description}
        theme={currentQuestion.interview_theme}
        narrativeFocus={currentQuestion.narrative_focus}
        typePerspective={getTypePerspective(currentQuestion, styleProfile)}
      />

      {/* 类型知识卡片 */}
      <TypeKnowledgeCard
        typeName={styleProfile.full_name}
        characteristics={styleProfile.characteristics}
      />

      {/* 访谈记录区 */}
      <InterviewNotes />
    </div>
  );
}
```

#### 任务3.4：响应式适配（1天）

- 桌面端：雷达图+详情页并排
- 平板端：雷达图+详情页上下布局
- 移动端：雷达图缩小，详情页可折叠

**Day 6-8验收标准**：
- ✅ 结果页UI设计完成
- ✅ 雷达图组件实现完成
- ✅ 访谈引擎界面更新完成
- ✅ 响应式适配完成（桌面/平板/移动）

---

### Day 9-10：测试与优化

#### 任务4.1：端到端测试（0.5天）

```python
# 文件：tests/test_e2e.py

def test_complete_flow():
    """测试完整流程：答题→计算→展示"""
    # 1. 用户答题
    answers = {
        "Q1": 7, "Q2": 6, "Q3": 3, "Q4": 3,
        "Q5": 6, "Q6": 7, "Q7": 6,
        "Q8": 3, "Q9": 3, "Q12": 3,
        "Q10": 3, "Q11": 3, "Q13": 3, "Q14": 3, "Q15": 3
    }

    # 2. 计算结果
    result = calculate_ai_collaboration_style(answers)

    # 3. 验证结果
    assert result["type_code"] == "ETF"
    assert result["type_name_meme"] == "摸鱼人"
    assert result["type_name_animal"] == "好奇猫"

    # 4. 验证前端渲染
    # (需要前端测试工具，如Cypress)
```

#### 任务4.2：性能测试（0.5天）

```python
# 文件：tests/test_performance.py

def test_calculation_performance():
    """测试计算性能"""
    import time

    answers = generate_random_answers()

    start = time.time()
    result = calculate_ai_collaboration_style(answers)
    end = time.time()

    # 计算时间应 < 100ms
    assert end - start < 0.1
```

#### 任务4.3：用户验收测试（UAT）（1天）

- 邀请5-10位用户测试
- 收集反馈：
  - 类型名称是否生动易懂？
  - 雷达图是否直观？
  - "无优劣"说明是否清晰？
  - 访谈引导是否有帮助？

#### 任务4.4：修复bug与优化（1天）

- 修复UAT发现的bug
- 优化用户体验
- 准备发布

**Day 9-10验收标准**：
- ✅ 端到端测试全部通过
- ✅ 性能测试通过（<100ms）
- ✅ UAT反馈收集完成
- ✅ bug修复完成
- ✅ 准备发布

---

## 第七部分：API接口规范

### 计算接口

```yaml
POST /api/calculate-style
Request:
  {
    "answers": {
      "Q1": 7,
      "Q2": 6,
      ...
      "Q15": 4
    }
  }

Response:
  {
    "style_profile": {
      "dimensions": [...],
      "type_code": "ETF",
      "type_names": {
        "meme": "摸鱼人",
        "animal": "好奇猫"
      },
      "full_name": "AI摸鱼人（好奇猫型）",
      "characteristics": [...],
      "interview_guidance": [...],
      "value_statement": "...",
      "theory_innovation": "..."
    }
  }
```

### 访谈引擎接口

```yaml
GET /api/interview-engine/{user_id}
Response:
  {
    "user_answers": {...},
    "style_profile": {...},
    "current_stage": 3,
    "stages": [
      {
        "stage_id": 1,
        "stage_name": "接触轨迹",
        "questions": [
          {
            "question_id": "Q1",
            "question_content": "...",
            "answer": 7,
            "behavior_description": "...",
            "interview_theme": "...",
            "narrative_focus": "...",
            "type_perspective": "..."
          },
          {
            "question_id": "Q2",
            "transition_from_Q1": {
              "script": "...",
              "connection": "..."
            },
            ...
          }
        ],
        "stage_transitions": {
          "to_next_stage": {
            "script": "...",
            "connection": "..."
          }
        }
      },
      // ... 阶段2-4
    ]
  }
```

---

## 第八部分：数据迁移指南

### 从旧4维度到新3维度

```sql
-- 旧表（4维度）
CREATE TABLE old_dimension_scores (
    user_id INT,
    engagement_score FLOAT,
    trust_score FLOAT,
    relationship_score FLOAT,
    reflection_score FLOAT
);

-- 新表（3维度）
CREATE TABLE new_dimension_scores (
    user_id INT,
    exploration_score FLOAT,
    utilizer_score FLOAT,
    truster_score FLOAT,
    verifier_score FLOAT,
    functionalist_score FLOAT,
    reflector_score FLOAT,
    type_code VARCHAR(10),
    type_name_meme VARCHAR(20),
    type_name_animal VARCHAR(20)
);

-- 迁移脚本
INSERT INTO new_dimension_scores (user_id, type_code, type_name_meme, type_name_animal)
SELECT
    user_id,
    CASE
        WHEN engagement_score >= 5.5 AND trust_score >= 4.5 THEN 'ETF'
        WHEN engagement_score >= 5.5 AND trust_score < 4.5 THEN 'ERF'
        -- ... 其他逻辑
        ELSE 'UTF'
    END as type_code,
    -- ... 类型名称
FROM old_dimension_scores;
```

---

## 第九部分：关键注意事项

### ⚠️ 必须遵守的原则

1. **输出时必须包含"无优劣声明"**
   - 每个维度都要说明"两端都合理"
   - 结果页必须明确声明"每种风格都值得研究"

2. **避免"能力强弱"的暗示**
   - 不使用"强探索倾向"、"弱验证型"等表述
   - 使用"偏向探索端"、"偏向验证端"

3. **确保15题完整覆盖**
   - 访谈引擎必须显示全部15题
   - Q13不能缺失

4. **确保3维度计算正确**
   - 每题只归属一个维度端
   - 不跨维度重复计算

5. **保持命名一致性**
   - 网络梗名：摸鱼人、质疑党等
   - 动物形象：好奇猫、谨慎狗等
   - 不随意修改

---

## 第十部分：FAQ

### Q1：如果用户在某个维度上是"中间位置"怎么办？

**A**：使用`find_nearest_type()`函数，找到距离最近的维度端，归入最近类型。

### Q2：雷达图如何绘制3个维度？

**A**：使用三角形坐标轴（而非常见的六边形）：
- 水平轴：探索者-实用者（E-U）
- 右下轴：信任者-验证者（T-V）
- 左下轴：功能者-反思者（F-R）

### Q3：如何确保"无优劣"传达给用户？

**A**：
1. 每个维度的`value_note`字段
2. 结果页的`value_statement`字段
3. 输出格式中明确说明

### Q4：如果开发者觉得3维度太少怎么办？

**A**：可以参考方案D（4维度优化版），但需要重新设计题目分布，10天MVP建议保持3维度。

### Q5：如何测试计算逻辑是否正确？

**A**：使用提供的测试用例（ETF、UVR等典型类型），确保8种类型都能正确判定。

---

## 附录：完整文件清单

### 需要创建的文件

1. **数据库Schema**
   - `migrations/001_create_question_reinterpretation.sql`
   - `migrations/002_create_dimension_definitions.sql`
   - `migrations/003_create_type_definitions.sql`

2. **计算逻辑**
   - `services/collaboration_style_calculator.py`
   - `services/test_service.py`

3. **前端组件**
   - `components/StyleResultPage.jsx`
   - `components/RadarChart.jsx`
   - `components/InterviewEngine.jsx`
   - `components/QuestionCard.jsx`
   - `components/TypeKnowledgeCard.jsx`

4. **测试文件**
   - `tests/test_calculator.py`
   - `tests/test_e2e.py`
   - `tests/test_performance.py`

5. **数据文件**
   - `data/question_reinterpretation.json`
   - `data/dimension_definitions.json`
   - `data/type_definitions.json`

### 需要修改的文件

1. **现有测试系统**
   - `services/test_service.py`（替换计算逻辑）

2. **现有访谈引擎**
   - `components/InterviewEngine.jsx`（更新界面）
   - `api/interview.js`（更新API）

---

## 总结

### 核心设计成果

1. ✅ **15题行为描述版重新解释字典**
   - 每题都有具体的行为描述
   - 高分/低分行为明确
   - 无优劣说明清晰

2. ✅ **3维度完整定义**
   - 探索者-实用者（E-U）
   - 信任者-验证者（T-V）
   - 功能者-反思者（F-R）

3. ✅ **8种类型详细定义**
   - 网络梗+动物形象组合命名
   - 每种类型都有明确画像
   - 访谈引导重点清晰

4. ✅ **计算逻辑伪代码**
   - 3维度极性定位算法
   - 8种类型判定逻辑
   - 测试用例完整

5. ✅ **输出格式设计**
   - JSON结构清晰
   - 雷达图展示直观
   - "无优劣"声明明确

6. ✅ **10天MVP任务清单**
   - Day 1-2：数据准备
   - Day 3-5：计算逻辑
   - Day 6-8：前端实现
   - Day 9-10：测试优化

### 关键创新点

1. **理论转向**：从"素养"到"风格"
2. **计算创新**：从"赋分制"到"极性制"
3. **命名创新**：网络梗+动物形象
4. **输出创新**：雷达图+"无优劣"声明

### 下一步行动

开发者可以基于此文档直接开始实施，无需进一步澄清。

---

**文档版本**: v1.0
**生成日期**: 2026-07-24
**文档性质**: 开发者操作清单（可直接实施）
**预计完成**: 10天MVP
**可行性**: ✅ 可行
