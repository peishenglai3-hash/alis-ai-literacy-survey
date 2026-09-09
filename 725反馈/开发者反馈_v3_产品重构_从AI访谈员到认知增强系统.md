# 开发者反馈 v3：产品重构 - 从AI访谈员到认知增强系统

**文档版本**: v1.0
**创建日期**: 2026-07-25
**反馈类型**: 产品定位重构 + 交互逻辑修改
**优先级**: P0（最高优先级，必须完成）
**预计工期**: 10天MVP

---

## 📋 执行摘要

### 核心问题

当前访谈引擎存在一个根本性的定位问题：

**❌ 错误假设**：AI知道应该问什么，所以把问题生成出来提供给访谈者。

**✅ 正确定位**：AI不知道现场应该问什么，但它能够帮助访谈者保持分析视角、提醒关键维度、激活可能遗漏的方向。

### 产品定位转变

**从**: AI访谈员（替访谈者提问）
**到**: 增强型访谈辅助系统（AI-augmented interviewer）

**不是**：
- 降低访谈难度
- 替代人类提问
- 控制访谈节奏

**而是**：
- 扩大访谈者的观察能力
- 提供认知支架
- 建立跨题关联

---

## 🔴 问题诊断

### 问题1：交互结构错误（线性流程）

**现状**：
```
💡 引导建议（3步深入）
├─ 第1步：让TA讲具体故事
│  └─ "你什么时候开始注意到AI的？"
├─ 第2步：让TA讲具体经验
│  └─ "能举个具体的例子吗？"
└─ 第3步：让TA反思判断标准
   └─ "有没有什么时候你会不确定？"
```

**问题**：
- ❌ 暗示访谈者必须按这个顺序提问
- ❌ 固定问题限制思维灵活性
- ❌ 访谈者容易变成"问题朗读者"
- ❌ 暗示AI"知道该问什么"

### 问题2：界面信息过多

**现状**：
- 显示完整的"三步深入"内容
- 显示"类型视角"具体说明
- 显示大量引导文字

**问题**：
- ❌ 访谈者阅读负担重
- ❌ 不符合访谈现场需求
- ❌ 信息层级不清晰

### 问题3：缺少跨题关联

**现状**：
- 每道题独立显示
- 没有跨题提醒机制
- 访谈者难以发现题目间关联

**问题**：
- ❌ Q1的回答可能涉及Q3，但无法提醒
- ❌ 访谈者需要记住所有题目才能发现关联
- ❌ 错过深入探索的机会

### 问题4：思维气泡系统定位不清

**现状**：
- 思维气泡只是"记录工具"
- 没有预设提示
- 没有跨题关联功能

**问题**：
- ❌ 没有充分发挥"认知支架"作用
- ❌ 没有帮助访谈者"看到更多可能性"

---

## ✅ 解决方案

### 核心修改：从"三步流程"到"四个思考窗口"

#### 修改1：交互结构重构

**旧结构**（删除）：
```javascript
// ❌ 删除这个
{
  "引导建议": {
    "第1步": "让TA讲具体故事",
    "第1步_问题": "你什么时候开始注意到AI的？",
    "第2步": "让TA讲具体经验",
    "第2步_问题": "能举个具体的例子吗？",
    "第3步": "让TA反思判断标准",
    "第3步_问题": "有没有什么时候你会不确定？"
  },
  "类型视角": {
    "摸鱼人": "作为好奇猫，你倾向于...",
    "质疑党": "作为谨慎狗，你倾向于..."
  }
}
```

**新结构**（使用）：
```javascript
// ✅ 使用这个
{
  "思考窗口": {
    "题目理解": {
      "核心关注": [
        "TA如何理解'AI'",
        "TA认为什么算'真正使用AI'",
        "TA有没有质疑题目"
      ],
      "常见误区": ["把AI等同于机器人"]
    },
    "经验叙事": {
      "故事入口": [
        {
          "类型": "第一次接触",
          "提示": [
            "第一次听说AI是什么时候？",
            "第一次觉得AI和自己有关？"
          ]
        },
        {
          "类型": "典型经历",
          "提示": ["有没有一次经历改变了你对AI的看法？"]
        },
        {
          "类型": "变化节点",
          "提示": ["对AI的认识有没有变化？"]
        }
      ]
    },
    "选择解释": {
      "高分段": {
        "分数范围": [5, 6, 7],
        "可能意味着": ["能够识别AI应用", "对AI有一定判断标准"],
        "探索方向": ["这种判断来自哪里？", "判断标准是什么？"]
      },
      "中分段": {
        "分数范围": [3, 4],
        "可能意味着": ["对AI识别有一定把握", "但判断标准可能模糊"],
        "探索方向": ["什么时候能确定？", "什么时候不确定？"]
      },
      "低分段": {
        "分数范围": [1, 2],
        "可能意味着": ["对AI识别不太确定", "可能没有明确的判断标准"],
        "探索方向": ["你觉得AI是什么样的？", "你会怎么区分AI和非AI？"]
      }
    },
    "素养关联": {
      "涉及能力": ["AI识别能力", "AI理解能力", "技术判断能力"],
      "层级关系": ["AI识别能力", "→", "AI理解能力", "→", "技术判断能力"],
      "注意区分": ["描述知识", "vs", "描述经验判断"]
    }
  }
}
```

**关键改进**：
- ✅ 四个窗口并列呈现（不是线性流程）
- ✅ 访谈者自主选择使用哪个窗口
- ✅ 每个窗口提供"思考方向"，不是"固定问题"
- ✅ 删除"类型视角"（保持为背景信息）

---

#### 修改2：界面布局重构

**旧界面**（删除）：
```
┌─────────────────────────────────────┐
│  Q1: 我通常能够判断...              │
│  ───────────────────────────────────│
│                                     │
│  你的答案：6/7                      │
│                                     │
│  💡 引导建议（3步深入）             │
│  ├─ 第1步：让TA讲具体故事...        │
│  ├─ 第2步：让TA讲具体经验...        │
│  └─ 第3步：让TA反思判断标准...      │
│                                     │
│  🎯 类型视角：                      │
│  "作为好奇猫..."                    │
└─────────────────────────────────────┘
```

**新界面**（使用）：
```
┌─────────────────────────────────────────────────────────────────┐
│  阶段1: 初识 | Q1/3                  💭 想想（3）[深度倾听]  │
│  ────────────────────────────────────  ───────────────────────  │
│                                                                     │
│  Q1: 我通常能够判断，一个应用或服务是否真正使用了AI              │
│                                                                     │
│  关键词：识别 · 分辨 · 判断 ◇                                    │
│  ────────────────────────────────────                             │
│                                                                     │
│  你的答案：[1-7选择器]                                            │
│                                                                     │
│  被访者回答：[输入框]                                              │
│                                                                     │
│  ────────────────────────────────────                             │
│  【题目理解】│【经验叙事】│【选择解释】│【素养关联】                │
│                                                                     │
│  （点击任意窗口展开详细内容）                                        │
└─────────────────────────────────────────────────────────────────┘
```

**右侧悬浮面板**（思维气泡）：
```
┌─────────────────────────────────────────┐
│  💭 想想（3）                            │
│  ─────────────────────────────────────  │
│                                          │
│  ⏱️ 14:28  这个人如何理解"AI"？         │
│                                          │
│  ⏱️ 14:25  他的判断依据是什么？          │
│                                          │
│  ⏱️ 14:20  他有没有经历过误判？          │
│                                          │
│  ─────────────────────────────────────  │
│  [+ 添加想法]（按回车发送）              │
└─────────────────────────────────────────┘
```

**关键改进**：
- ✅ 中央极简（题目+关键词+答案）
- ✅ 四个窗口点击展开（不占用视觉空间）
- ✅ 右侧思维气泡（独立悬浮，60%透明）
- ✅ 信息分层（核心信息+扩展信息）

---

#### 修改3：数据结构重构

**创建新表**：

```sql
CREATE TABLE question_schemas (
    question_id VARCHAR(10) PRIMARY KEY,
    content TEXT NOT NULL,

    关键词 JSON,
    核心能力 JSON,
    叙事路径 JSON,
    可能误区 JSON,

    思考窗口 JSON,
    思维气泡预设 JSON,
    跨题关联 JSON,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version VARCHAR(20) DEFAULT 'v2.0',
    人工审核 BOOLEAN DEFAULT FALSE
);
```

**完整数据示例**（Q1）：

```json
{
  "question_id": "Q1",
  "content": "我通常能够判断，一个应用或服务是否真正使用了AI",

  "关键词": ["识别", "分辨", "判断"],
  "核心能力": ["AI识别"],
  "叙事路径": ["接触", "体验", "判断"],
  "可能误区": ["把AI等同于机器人"],

  "思考窗口": {
    "题目理解": {
      "核心关注": [
        "TA如何理解'AI'",
        "TA认为什么算'真正使用AI'",
        "TA有没有质疑题目"
      ],
      "常见误区": ["把AI等同于机器人"]
    },
    "经验叙事": {
      "故事入口": [
        {
          "类型": "第一次接触",
          "提示": [
            "第一次听说AI是什么时候？",
            "第一次觉得AI和自己有关？"
          ]
        },
        {
          "类型": "典型经历",
          "提示": ["有没有一次经历改变了你对AI的看法？"]
        },
        {
          "类型": "变化节点",
          "提示": ["对AI的认识有没有变化？"]
        }
      ]
    },
    "选择解释": {
      "高分段": {
        "分数范围": [5, 6, 7],
        "可能意味着": ["能够识别AI应用", "对AI有一定判断标准"],
        "探索方向": ["这种判断来自哪里？"]
      }
    }
  },

  "思维气泡预设": [
    "这个人如何理解'AI'？",
    "他的判断依据是什么？",
    "他有没有经历过误判？"
  ],

  "跨题关联": [
    {
      "相关问题": "Q3",
      "触发关键词": ["使用", "工具", "ChatGPT"],
      "关联说明": "注意：此回答可能涉及Q3（使用AI）的使用习惯"
    }
  ]
}
```

---

#### 修改4：跨题关联功能

**触发逻辑**（基于关键词匹配）：

```javascript
// 检查被访者回答，触发跨题关联
function checkCrossQuestionAssociations(questionId, interviewAnswer) {
  const schema = getQuestionSchema(questionId);
  const associations = [];

  for (const rule of schema.跨题关联) {
    const hasKeyword = rule.触发关键词.some(kw =>
      interviewAnswer.toLowerCase().includes(kw.toLowerCase())
    );

    if (hasKeyword) {
      associations.push({
        相关问题: rule.相关问题,
        关联说明: rule.关联说明,
        探索提示: rule.探索提示
      });
    }
  }

  return associations;
}

// 在思维气泡中显示跨题关联
if (associations.length > 0) {
  associations.forEach(assoc => {
    addThoughtBubble({
      content: assoc.关联说明,
      type: "跨题关联",
      relatedQuestion: assoc.相关问题
    });
  });
}
```

---

## 🛠️ 技术实现规格

### 1. 前端组件重构

#### 1.1 主组件：CognitiveMap.jsx

```jsx
// components/CognitiveMap.jsx

import React, { useState } from 'react';
import ThinkingWindows from './ThinkingWindows';
import WindowContent from './WindowContent';
import ThoughtBubblePanel from './ThoughtBubblePanel';

const CognitiveMap = ({ question, answer, notes, onAnswerChange, onNotesChange }) => {
  const [activeWindow, setActiveWindow] = useState(null);

  const handleToggleWindow = (windowType) => {
    setActiveWindow(activeWindow === windowType ? null : windowType);
  };

  return (
    <div className="cognitive-map">
      {/* 左侧：中央极简区 */}
      <div className="core-question">
        {/* 阶段进度 */}
        <div className="stage-progress">
          阶段1: 初识 | Q1/3
        </div>

        {/* 题目内容 */}
        <h2>{question.content}</h2>

        {/* 关键词 */}
        <div className="keywords">
          {question.关键词.map(kw => (
            <span key={kw} className="keyword">{kw}</span>
          )).join(' · ')}
          <span className="toggle-hint">◇</span>
        </div>

        {/* 答案选择器 */}
        <AnswerSelector
          value={answer}
          onChange={onAnswerChange}
        />

        {/* 被访者回答输入 */}
        <InterviewNotesInput
          placeholder="记录TA的理解、案例、经验、质疑..."
          value={notes}
          onChange={onNotesChange}
        />

        {/* 四个思考窗口按钮 */}
        <ThinkingWindows
          activeWindow={activeWindow}
          onToggle={handleToggleWindow}
        />

        {/* 窗口详细内容 */}
        {activeWindow && (
          <WindowContent
            windowType={activeWindow}
            content={question.思考窗口[activeWindow]}
            answer={answer}
            onClose={() => setActiveWindow(null)}
          />
        )}

        {/* 导航按钮 */}
        <div className="button-group">
          <button onClick={handlePrevious}>← 上一题</button>
          <button onClick={handleNext}>下一题 →</button>
        </div>
      </div>

      {/* 右侧：悬浮面板 */}
      <ThoughtBubblePanel
        mode="focused"
        interviewId={interviewId}
        currentQuestion={question.id}
        currentAnswer={answer}
      />
    </div>
  );
};

export default CognitiveMap;
```

#### 1.2 思考窗口按钮组件：ThinkingWindows.jsx

```jsx
// components/ThinkingWindows.jsx

import React from 'prop-types';

const ThinkingWindows = ({ activeWindow, onToggle }) => {
  const windows = [
    { name: '题目理解', key: '题目理解' },
    { name: '经验叙事', key: '经验叙事' },
    { name: '选择解释', key: '选择解释' },
    { name: '素养关联', key: '素养关联' }
  ];

  return (
    <div className="thinking-windows">
      {windows.map(window => (
        <button
          key={window.key}
          className={`window-button ${activeWindow === window.key ? 'active' : ''}`}
          onClick={() => onToggle(window.key)}
        >
          {window.name}
        </button>
      ))}
    </div>
  );
};

ThinkingWindows.propTypes = {
  activeWindow: PropTypes.string,
  onToggle: PropTypes.func.isRequired
};

export default ThinkingWindows;
```

#### 1.3 窗口内容组件：WindowContent.jsx

```jsx
// components/WindowContent.jsx

import React from 'prop-types';
import { getXxx } from './utils';

const WindowContent = ({ windowType, content, answer, onClose }) => {
  const renderContent = () => {
    switch (windowType) {
      case '题目理解':
        return (
          <div className="window-meaning">
            <h4>这个问题在问什么？</h4>
            <div className="keywords">
              {content.关键词.map(kw => <span key={kw}>{kw}</span>).join(' · ')}
            </div>

            <h5>可以关注：</h5>
            <ul>
              {content.核心关注.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>

            {content.常见误区 && (
              <>
                <h5>常见误区：</h5>
                <ul>
                  {content.常见误区.map((item, index) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );

      case '经验叙事':
        return (
          <div className="window-experience">
            <h4>可能的故事入口：</h4>
            {content.故事入口.map((entry, index) => (
              <div key={index} className="story-entry">
                <h5>{entry.类型}：</h5>
                <ul>
                  {entry.提示.map((tip, tipIndex) => (
                    <li key={tipIndex}>- {tip}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        );

      case '选择解释':
        // 根据答案分数选择对应的分段
        const scoreRange = getScoreRange(answer);
        const scoreContent = content[`${scoreRange}分段`];

        return (
          <div className="window-choice">
            <h4>你的选择：{answer}分</h4>

            <h5>可能意味着：</h5>
            <ul>
              {scoreContent.可能意味着.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>

            <h5>探索方向：</h5>
            <ul>
              {scoreContent.探索方向.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        );

      case '素养关联':
        return (
          <div className="window-literacy">
            <h4>研究关联：</h4>

            <h5>本题涉及：</h5>
            <div className="ability-chain">
              {content.层级关系.map((item, index) => (
                <span key={index}>
                  {item}
                  {index < content.层级关系.length - 1 && ' → '}
                </span>
              ))}
            </div>

            {content.注意区分 && (
              <>
                <h5>注意区分：</h5>
                <div className="distinction">
                  {content.注意区分.map((item, index) => (
                    <span key={index}>
                      {index % 2 === 0 ? <strong>{item}</strong> : item}
                      {index < content.注意区分.length - 1 && ' '}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="window-content">
      <button className="close-button" onClick={onClose}>
        ✕
      </button>
      {renderContent()}
    </div>
  );
};

WindowContent.propTypes = {
  windowType: PropTypes.string.isRequired,
  content: PropTypes.object.isRequired,
  answer: PropTypes.number,
  onClose: PropTypes.func.isRequired
};

// 辅助函数：根据分数获取分段
function getScoreRange(answer) {
  if (answer >= 5) return '高分';
  if (answer >= 3) return '中分';
  return '低分';
}

export default WindowContent;
```

#### 1.4 CSS样式

```css
/* components/CognitiveMap.css */

/* 主容器 */
.cognitive-map {
  display: flex;
  gap: 20px;
  position: relative;
  padding: 20px;
  max-width: 1400px;
  margin: 0 auto;
}

/* 中央极简区 */
.core-question {
  flex: 1;
  max-width: 65%;
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 阶段进度 */
.stage-progress {
  font-size: 14px;
  color: #666;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}

/* 题目标题 */
.core-question h2 {
  font-size: 20px;
  color: #2d3436;
  margin-bottom: 16px;
  line-height: 1.6;
}

/* 关键词 */
.keywords {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 16px 0;
  font-size: 14px;
  color: #636e72;
}

.keyword {
  color: #6c5ce7;
  font-weight: 500;
}

.toggle-hint {
  color: #b2bec3;
  font-size: 12px;
  cursor: help;
}

/* 答案选择器 */
.answer-selector {
  margin: 20px 0;
}

/* 被访者回答输入 */
.interview-notes-input {
  width: 100%;
  min-height: 80px;
  padding: 12px;
  border: 1px solid #dfe6e9;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

.interview-notes-input:focus {
  outline: none;
  border-color: #6c5ce7;
  box-shadow: 0 0 0 3px rgba(108, 92, 231, 0.1);
}

/* 四个思考窗口按钮 */
.thinking-windows {
  display: flex;
  gap: 8px;
  margin: 20px 0;
}

.window-button {
  flex: 1;
  padding: 10px 16px;
  border: 1px solid #dfe6e9;
  background: #fff;
  border-radius: 8px;
  font-size: 14px;
  color: #636e72;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.window-button:hover {
  border-color: #6c5ce7;
  color: #6c5ce7;
  background: #f8f9fa;
}

.window-button.active {
  background: #6c5ce7;
  border-color: #6c5ce7;
  color: #fff;
}

/* 窗口内容（展开） */
.window-content {
  position: relative;
  margin-top: 16px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #6c5ce7;
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.window-content .close-button {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #b2bec3;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
}

.window-content .close-button:hover {
  color: #636e72;
}

.window-content h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: #2d3436;
}

.window-content h5 {
  margin: 16px 0 8px 0;
  font-size: 14px;
  color: #636e72;
}

.window-content ul {
  margin: 0;
  padding-left: 20px;
}

.window-content li {
  margin-bottom: 4px;
  font-size: 14px;
  color: #2d3436;
  line-height: 1.6;
}

/* 按钮组 */
.button-group {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.button-group button {
  flex: 1;
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.button-group button:first-child {
  background: #f1f2f6;
  color: #636e72;
}

.button-group button:first-child:hover {
  background: #dfe6e9;
}

.button-group button:last-child {
  background: #6c5ce7;
  color: #fff;
}

.button-group button:last-child:hover {
  background: #5a4ad1;
}

/* 右侧悬浮面板（复用现有ThoughtBubblePanel组件） */
.thought-bubble-panel {
  position: fixed;
  right: 20px;
  top: 20px;
  width: 300px;
  max-height: calc(100vh - 40px);
  opacity: 0.6;
  transition: opacity 0.3s ease;
  z-index: 1000;
}

.thought-bubble-panel:hover {
  opacity: 0.8;
}
```

---

### 2. 后端API重构

#### 2.1 新增API端点

**获取Question Schema**：
```javascript
// GET /api/questions/:questionId/schema

app.get('/api/questions/:questionId/schema', async (req, res) => {
  try {
    const { questionId } = req.params;

    const schema = await db.findOne(
      'question_schemas',
      { question_id: questionId }
    );

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Question schema not found'
      });
    }

    res.json({
      success: true,
      schema: {
        question_id: schema.question_id,
        content: schema.content,
        关键词: JSON.parse(schema.关键词),
        核心能力: JSON.parse(schema.核心能力),
        思考窗口: JSON.parse(schema.思考窗口),
        思维气泡预设: JSON.parse(schema.思维气泡预设),
        跨题关联: JSON.parse(schema.跨题关联)
      }
    });

  } catch (error) {
    console.error('获取Question Schema失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

**跨题关联检查**：
```javascript
// POST /api/associations/check

app.post('/api/associations/check', async (req, res) => {
  try {
    const { questionId, interviewAnswer } = req.body;

    const schema = await db.findOne(
      'question_schemas',
      { question_id: questionId }
    );

    if (!schema) {
      return res.status(404).json({
        success: false,
        error: 'Question schema not found'
      });
    }

    const 跨题关联 = JSON.parse(schema.跨题关联);
    const associations = [];

    for (const rule of 跨题关联) {
      const triggerKeywords = rule.触发关键词 || [];
      const hasKeyword = triggerKeywords.some(kw =>
        interviewAnswer.toLowerCase().includes(kw.toLowerCase())
      );

      if (hasKeyword) {
        associations.push({
          相关问题: rule.相关问题,
          关联说明: rule.关联说明,
          探索提示: rule.探索提示
        });
      }
    }

    res.json({
      success: true,
      associations
    });

  } catch (error) {
    console.error('跨题关联检查失败:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});
```

---

### 3. 数据库迁移脚本

```sql
-- ==========================================
-- 访谈引擎数据库迁移：从三步模板到四窗口
-- 版本：v2.0
-- 日期：2026-07-25
-- 执行方式：mysql -u root -p interview_engine < migration_v2.0.sql
-- ==========================================

-- 1. 创建新表：question_schemas

CREATE TABLE IF NOT EXISTS question_schemas (
    question_id VARCHAR(10) PRIMARY KEY COMMENT '题目ID',
    content TEXT NOT NULL COMMENT '题目内容',

    关键词 JSON COMMENT '关键词数组',
    核心能力 JSON COMMENT '核心能力数组',
    叙事路径 JSON COMMENT '叙事路径数组',
    可能误区 JSON COMMENT '常见误区数组',

    思考窗口 JSON COMMENT '四个思考窗口的完整内容',
    思维气泡预设 JSON COMMENT '思维气泡预设问题数组',
    跨题关联 JSON COMMENT '跨题关联规则数组',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    version VARCHAR(20) DEFAULT 'v2.0',
    人工审核 BOOLEAN DEFAULT FALSE COMMENT '是否经过人工审核',

    INDEX idx_created_at (created_at),
    INDEX idx_人工审核 (人工审核)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='题目Schema：四个思考窗口';

-- 2. 迁移现有数据（从旧表interview_questions）

INSERT INTO question_schemas (
    question_id,
    content,
    version
)
SELECT
    question_id,
    content,
    'v2.0' as version
FROM interview_questions;

-- 3. 备份旧表

RENAME TABLE interview_guidance TO interview_guidance_backup_v1;
RENAME TABLE question_type_perspectives TO question_type_perspectives_backup_v1;

-- 4. 创建思维气泡表（如果还没有）

CREATE TABLE IF NOT EXISTS thought_bubbles (
    id INT PRIMARY KEY AUTO_INCREMENT,
    interview_id VARCHAR(50) NOT NULL,
    bubble_id VARCHAR(100) NOT NULL UNIQUE,

    content TEXT NOT NULL,
    status ENUM('pending', 'processed') DEFAULT 'pending',

    current_question VARCHAR(10),
    question_answer INT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP NULL,

    INDEX idx_interview_id (interview_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='访谈者的思维气泡记录';

-- 5. 插入Q1示例数据（供测试）

INSERT INTO question_schemas (
    question_id,
    content,
    关键词,
    核心能力,
    叙事路径,
    可能误区,
    思考窗口,
    思维气泡预设,
    跨题关联,
    version,
    人工审核
) VALUES (
    'Q1',
    '我通常能够判断，一个应用或服务是否真正使用了AI',
    JSON_ARRAY('识别', '分辨', '判断'),
    JSON_ARRAY('AI识别'),
    JSON_ARRAY('接触', '体验', '判断'),
    JSON_ARRAY('把AI等同于机器人', '把AI等同于ChatGPT'),
    '{
      "题目理解": {
        "核心关注": [
          "TA如何理解\"AI\"",
          "TA认为什么算\"真正使用AI\"",
          "TA有没有质疑题目"
        ],
        "常见误区": ["把AI等同于机器人"]
      },
      "经验叙事": {
        "故事入口": [
          {
            "类型": "第一次接触",
            "提示": [
              "第一次听说AI是什么时候？",
              "第一次觉得AI和自己有关？"
            ]
          },
          {
            "类型": "典型经历",
            "提示": ["有没有一次经历改变了你对AI的看法？"]
          }
        ]
      },
      "选择解释": {
        "高分段": {
          "分数范围": [5, 6, 7],
          "可能意味着": ["能够识别AI应用", "对AI有一定判断标准"],
          "探索方向": ["这种判断来自哪里？"]
        }
      },
      "素养关联": {
        "涉及能力": ["AI识别能力"],
        "层级关系": ["AI识别能力"],
        "注意区分": ["描述知识", "vs", "描述经验判断"]
      }
    }',
    JSON_ARRAY('这个人如何理解"AI"？', '他的判断依据是什么？'),
    JSON_ARRAY(
      '{"相关问题": "Q3", "触发关键词": ["使用", "工具"], "关联说明": "注意：可能涉及Q3"}'
    ),
    'v2.0',
    TRUE
);

-- 迁移完成
SELECT 'Migration v2.0 completed successfully!' as status;
```

---

## 📅 10天MVP开发计划

### Day 1-2（P0）：数据结构与内容

**任务清单**：
- [ ] 创建`question_schemas`数据表
- [ ] 人工编写Q1-Q3的完整Schema
- [ ] 定义四个思考窗口的标准格式
- [ ] 编写数据填充脚本

**验收标准**：
- ✅ Q1-Q3的Schema可以正确写入数据库
- ✅ 可以正确读取并显示在前端

---

### Day 3-4（P0）：界面重构

**任务清单**：
- [ ] 修改前端组件结构
  - 删除`GuidanceSuggestions`组件
  - 删除`TypePerspective`组件
  - 创建`ThinkingWindows`、`WindowButton`、`WindowContent`组件
- [ ] 实现窗口点击展开/折叠功能
- [ ] 修改CSS布局（中央极简+窗口展开动画）

**验收标准**：
- ✅ Q1可以正确显示四个思考窗口按钮
- ✅ 点击按钮可以展开详细内容
- ✅ 窗口展开/折叠动画流畅

---

### Day 5-6（P0）：基础交互

**任务清单**：
- [ ] 实现四个思考窗口的动态内容显示
  - "题目理解"窗口
  - "经验叙事"窗口
  - "选择解释"窗口（根据分数动态显示）
  - "素养关联"窗口
- [ ] 实现思维气泡的时间戳和状态管理
- [ ] 实现跨题关联逻辑（基于关键词匹配）

**验收标准**：
- ✅ 选择不同分数时，"选择解释"窗口内容正确变化
- ✅ 跨题关联能在适当时候提示
- ✅ 思维气泡可以正常记录和查看

---

### Day 7-8（P0）：跨题关联与测试

**任务清单**：
- [ ] 实现跨题关联提示功能
- [ ] 测试跨题关联触发（Q1→Q3, Q1→Q7）
- [ ] 优化跨题关联提示
- [ ] 测试完整流程（Q1-Q3）

**验收标准**：
- ✅ 跨题关联能在适当时候提示
- ✅ 关联提示准确、有帮助
- ✅ 完整流程测试通过

---

### Day 9（P1）：AI生成内容

**任务清单**：
- [ ] 使用AI生成Q4-Q15的Schema
- [ ] 人工审核和调整
- [ ] 写入数据库
- [ ] 测试所有15题的显示

**验收标准**：
- ✅ 所有15题都有完整的Schema
- ✅ 四个思考窗口内容质量一致

---

### Day 10（P1）：优化与测试

**任务清单**：
- [ ] 界面优化（间距、字体、颜色）
- [ ] 交互优化（动画、快捷键）
- [ ] 完整流程测试
- [ ] 用户反馈收集

**验收标准**：
- ✅ 访谈者不觉得界面信息过多
- ✅ 能够快速找到需要的内容
- ✅ 觉得AI"扩大了观察"，不是"干扰访谈"

---

## ✅ 验收标准

### 功能验收

- [ ] 四个思考窗口可以正确显示
- [ ] 窗口点击展开/折叠功能正常
- [ ] "选择解释"根据分数动态变化
- [ ] 思维气泡可以正常记录和查看
- [ ] 跨题关联在适当时候提示
- [ ] 所有15题都有完整Schema

### 体验验收

- [ ] 访谈者不觉得界面信息过多
- [ ] 能够快速找到需要的内容
- [ ] 能够自主掌控访谈节奏
- [ ] 觉得AI"扩大了观察"，不是"干扰访谈"
- [ ] 界面流畅、无卡顿

### 研究价值验收

- [ ] 四个思考窗口帮助访谈者多角度理解
- [ ] 跨题关联提醒被忽略的关联
- [ ] 思维气泡记录有价值的灵感
- [ ] 访谈记录体现"并列关系"（15题独立）
- [ ] 访谈记录体现"历时关系"（4阶段叙事）

---

## 📞 支持与反馈

### 文档参考

1. **访谈引擎产品重构_从AI访谈员到认知增强系统_探讨议程.md**
   - 完整的设计理念和7个议程

2. **访谈引擎产品重构_修改现有版本_具体操作计划.md**
   - 修改现有版本的详细步骤和代码示例

3. **AI协作风格测量_开发者指南_v3.md**
   - 项目背景和3维度系统

### 常见问题

**Q1：为什么要删除"三步深入"？**

A：因为它是线性流程，暗示访谈者必须按这个顺序提问。新的"四个思考窗口"是并列呈现，访谈者可以自主选择使用哪个窗口。

**Q2：为什么删除"类型视角"？**

A：类型应该作为"背景信息"，而不是每道题都有具体的"类型视角"。类型持续显示在右侧悬浮面板（思维气泡）。

**Q3：跨题关联如何触发？**

A：基于关键词匹配。当被访者回答中包含触发关键词时，在思维气泡中显示跨题关联提示。

**Q4：思维气泡预设从哪里来？**

A：在Question Schema中预定义（人工编写或AI生成+人工审核）。

**Q5：为什么是"离线生成+人工审核"，而不是"实时生成"？**

A：实时生成质量不可控，无法人工审核。离线生成+人工审核可以确保质量，访谈时按需调用。

---

**文档版本**: v1.0
**创建日期**: 2026-07-25
**状态**: 待实施
**下一步**: 开发者开始执行修改计划
**预计完成**: Day 10
**联系人**: [您的姓名]
