# 给开发者：下方钻取区Tab折叠问题修复

**文档版本**: v1.0
**创建日期**: 2026-07-27
**优先级**: 🔴 P0（核心交互缺陷）
**关联文档**: v3.3认知地图布局_可视化.html（视觉基准）

---

## 📋 问题描述

### 现象

访谈界面的下方钻取区虽然已经实现了Tab栏（四个标签：题目理解、经验叙事、选择解释、素养关联），但**四个思考窗口的内容仍然以完整模块的方式全部显示**，没有实现"默认折叠，点击tab展开其一"的交互逻辑。

### 预期行为

- 默认状态：下方钻取区折叠，只显示Tab栏，不显示任何内容
- 点击Tab：展开对应Tab的内容，其他Tab内容保持隐藏
- 再次点击同一Tab：折叠回默认状态

### 当前行为

- 默认状态：所有四个思考窗口的内容都显示出来
- 点击Tab：Tab栏有选中状态，但内容全部显示

---

## 🎯 问题定位

### 问题组件

`InterviewScreen.tsx` 第614行附近的 `ThinkingWindows` 组件调用

### 根因分析

从代码来看：

```tsx
{/* 展开的 Tab 内容 */}
{activeDrillTab && !drillCollapsed && (
  <div className="drill-body">
    <ThinkingWindows questionId={primaryQuestionId} score={primaryScore} />
  </div>
)}
```

InterviewScreen.tsx 的折叠逻辑是正确的：
- `drillCollapsed` 控制折叠状态（默认为 true）
- `activeDrillTab` 控制选中的 tab（默认为 null）
- 只有当 `activeDrillTab && !drillCollapsed` 都为 true 时才显示内容

**问题在于**：`ThinkingWindows` 组件本身渲染了所有四个思考窗口，而不是根据 `activeDrillTab` 只渲染选中的那个。

---

## 🛠️ 修改方案

### 方案A：修改 InterviewScreen.tsx（推荐尝试）

**修改位置**：`InterviewScreen.tsx` 第614行

**原代码**：
```tsx
{activeDrillTab && !drillCollapsed && (
  <div className="drill-body">
    <ThinkingWindows questionId={primaryQuestionId} score={primaryScore} />
  </div>
)}
```

**修改为**：
```tsx
{activeDrillTab && !drillCollapsed && (
  <div className="drill-body">
    <ThinkingWindows 
      questionId={primaryQuestionId} 
      score={primaryScore}
      activeTab={activeDrillTab}  // 新增：传入选中的tab
    />
  </div>
)}
```

### 方案B：修改 ThinkingWindows 组件

如果方案A不行，需要找到并修改 `ThinkingWindows` 组件的定义文件。

**修改思路**：

1. 添加 `activeTab` 参数到组件接口
2. 根据 `activeTab` 只渲染对应的内容
3. 未选中时返回 `null`

**参考实现**：

```tsx
interface ThinkingWindowsProps {
  questionId: string;
  score: number;
  activeTab?: string;  // 新增：选中的tab
}

export function ThinkingWindows({ questionId, score, activeTab }: ThinkingWindowsProps) {
  // 只渲染选中的tab对应的内容
  if (!activeTab) return null;
  
  // 根据activeTab渲染对应的内容
  switch (activeTab) {
    case 'meaning':
      return <MeaningWindow questionId={questionId} score={score} />;
    case 'experience':
      return <ExperienceWindow questionId={questionId} score={score} />;
    case 'choice':
      return <ChoiceWindow questionId={questionId} score={score} />;
    case 'literacy':
      return <LiteracyWindow questionId={questionId} score={score} />;
    default:
      return null;
  }
}
```

### Tab ID 对照表

| Tab标签 | 对应的 activeTab 值 |
|---------|-------------------|
| 题目理解 | `meaning` |
| 经验叙事 | `experience` |
| 选择解释 | `choice` |
| 素养关联 | `literacy` |

---

## ✅ 验收标准

修改完成后，请验证以下行为：

### 1. 默认状态
- ✅ 下方钻取区只显示Tab栏，不显示任何内容
- ✅ 页面无纵向滚动（1920×1080视口）

### 2. 点击Tab
- ✅ 点击"题目理解"Tab：只显示题目理解的内容
- ✅ 点击"经验叙事"Tab：只显示经验叙事的内容
- ✅ 点击"选择解释"Tab：只显示选择解释的内容
- ✅ 点击"素养关联"Tab：只显示素养关联的内容

### 3. 再次点击同一Tab
- ✅ 内容折叠回默认状态
- ✅ Tab选中状态清除

### 4. 切换题目时
- ✅ 下方钻取区自动折叠
- ✅ Tab选中状态清除

---

## 📁 参考文件

| 文件 | 路径 | 用途 |
|------|------|------|
| InterviewScreen.tsx | 代码文件/v3_727/InterviewScreen.tsx | 主要修改位置 |
| InterviewScreen.css | 代码文件/v3_727/InterviewScreen.css | 样式参考 |
| v3.3认知地图布局_可视化.html | 反馈文件/v3_727/v3.3认知地图布局_可视化.html | 视觉基准（双击打开查看） |

---

## 💬 补充说明

这个问题的修复不需要改动CSS，主要是组件交互逻辑的调整。

如果遇到问题，请优先检查：
1. `activeDrillTab` 的值是否正确传递
2. `ThinkingWindows` 组件是否正确处理了 `activeTab` 参数
3. Tab ID 对照表是否匹配

---

**文档版本**: v1.0
**创建日期**: 2026-07-27
**状态**: 📝 待开发者实施
