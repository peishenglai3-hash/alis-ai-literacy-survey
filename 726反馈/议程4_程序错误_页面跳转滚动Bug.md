# 议程4：程序错误 - 页面跳转滚动Bug

**文档版本**: v1.0
**创建日期**: 2026-07-26
**优先级**: 🔴 P0（技术修复）
**问题描述**: 所有页面跳转都先跳到页面底部，需要用户手动上滑
**预估工时**: 30分钟-1小时

---

## 🚨 核心问题诊断

### 问题现象

从项目开始至今，所有页面跳转都存在一个技术bug：

> **页面切换/题目切换/阶段切换时，新页面会先滚动到页面底部，而不是顶部。**

用户每次切换后都需要手动上滑才能看到新内容的顶部，严重影响使用体验。

### 影响的场景

| 场景 | 当前行为 | 期望行为 |
|------|---------|---------|
| 题目切换（Q1→Q2） | 显示Q2页面底部 | 显示Q2页面顶部 |
| 阶段切换（阶段1→阶段2） | 显示阶段2页面底部 | 显示阶段2页面顶部 |
| 进入结果页 | 显示结果页底部 | 显示结果页顶部 |
| 进入访谈页 | 显示访谈页底部 | 显示访谈页顶部 |
| 返回上一题 | 显示上一题底部 | 显示上一题顶部 |

### 问题严重性

- 🔴 **P0级技术bug**
- 影响所有用户的每次页面跳转
- 给用户"系统出问题"的错觉
- 与内容问题（议程1-3）独立，可以单独修复

### 根本原因分析

这是一个典型的前端路由/状态切换的**滚动位置未重置**问题。

#### 技术原因

在单页应用（SPA）中，当路由切换或状态变化导致组件重新渲染时，浏览器**默认保持当前的滚动位置**，不会自动回到顶部。

如果开发者没有显式地在路由切换/状态变化的钩子中调用 `window.scrollTo(0, 0)`，就会导致：
- 当前在页面底部（如长内容的底部）
- 点击"下一题"或"下一阶段"
- 新内容渲染，但滚动位置仍然是底部
- 用户看到的不是新内容的顶部，而是底部

---

## ✅ 修复方案

### 方案A：全局路由守卫修复（推荐）

**适用场景**：使用React Router/Vue Router等路由库的应用。

#### React实现

```jsx
// components/ScrollToTop.jsx
// 全局滚动控制组件

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // 路由变化时，滚动到顶部
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;  // 这是一个无UI的辅助组件
};

export default ScrollToTop;
```

```jsx
// App.jsx
// 在路由组件内部使用ScrollToTop

import { BrowserRouter as Router } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <Router>
      <ScrollToTop />  {/* ✅ 添加这一行 */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/test" element={<TestPage />} />
        <Route path="/interview" element={<InterviewPage />} />
        <Route path="/result" element={<ResultPage />} />
      </Routes>
    </Router>
  );
}
```

#### Vue实现

```javascript
// router/index.js
// 在路由配置中添加全局后置钩子

import { createRouter, createWebHistory } from 'vue-router';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    // 你的路由配置
  ]
});

// ✅ 添加全局后置钩子，每次路由切换后滚动到顶部
router.afterEach(() => {
  window.scrollTo(0, 0);
});

export default router;
```

### 方案B：组件级修复

**适用场景**：不使用路由库，或路由守卫不生效的情况。

#### React实现

在每个会触发页面切换的组件中，使用 `useEffect` 在状态变化时滚动到顶部。

```jsx
// components/InterviewPage.jsx

import { useEffect } from 'react';

const InterviewPage = ({ currentQuestion, currentStage }) => {
  // ✅ 当题目或阶段变化时，滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentQuestion, currentStage]);

  return (
    <div>
      {/* 页面内容 */}
    </div>
  );
};
```

```jsx
// components/ResultPage.jsx

import { useEffect } from 'react';

const ResultPage = () => {
  // ✅ 结果页加载时，滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div>
      {/* 结果页内容 */}
    </div>
  );
};
```

#### Vue实现

```vue
<template>
  <div>
    <!-- 页面内容 -->
  </div>
</template>

<script>
export default {
  watch: {
    // ✅ 当题目或阶段变化时，滚动到顶部
    currentQuestion() {
      window.scrollTo(0, 0);
    },
    currentStage() {
      window.scrollTo(0, 0);
    }
  },
  mounted() {
    // ✅ 组件加载时，滚动到顶部
    window.scrollTo(0, 0);
  }
}
</script>
```

### 方案C：导航按钮级修复（最简单）

**适用场景**：只想在点击"下一题"/"上一题"按钮时滚动到顶部。

```jsx
// components/NavigationButtons.jsx

const NavigationButtons = ({ onPrevious, onNext }) => {
  const handlePrevious = () => {
    onPrevious();
    // ✅ 点击后滚动到顶部
    window.scrollTo(0, 0);
  };

  const handleNext = () => {
    onNext();
    // ✅ 点击后滚动到顶部
    window.scrollTo(0, 0);
  };

  return (
    <div className="navigation-buttons">
      <button onClick={handlePrevious}>← 上一题</button>
      <button onClick={handleNext}>下一题 →</button>
    </div>
  );
};
```

### 方案对比

| 方案 | 覆盖范围 | 实现复杂度 | 推荐度 |
|------|---------|----------|--------|
| **方案A** | 所有路由切换 | 低（添加1个组件） | ⭐⭐⭐⭐⭐ |
| **方案B** | 组件内状态切换 | 中（修改多个组件） | ⭐⭐⭐⭐ |
| **方案C** | 仅按钮点击 | 低 | ⭐⭐⭐ |

**推荐**：优先使用方案A，如果方案A不覆盖所有场景（如组件内状态切换），补充方案B。

---

## 📐 平滑滚动优化（可选）

如果希望滚动体验更流畅，可以使用 `behavior: 'smooth'`：

```javascript
// 平滑滚动版本
window.scrollTo({
  top: 0,
  left: 0,
  behavior: 'smooth'  // ✅ 平滑滚动
});
```

**注意**：
- 平滑滚动会增加300-500ms的过渡时间
- 如果页面内容很长，可能让用户感觉"等待"
- 建议先用 `behavior: 'instant'` 或不指定（默认instant），测试后再决定是否用smooth

---

## 🔍 验收清单

### 功能验收

测试以下所有场景，确认页面跳转后都自动回到顶部：

- [ ] 进入测试页（首页→测试）
- [ ] 题目切换（Q1→Q2, Q2→Q3, ...）
- [ ] 阶段切换（阶段1→阶段2, 阶段2→阶段3, ...）
- [ ] 进入访谈页（测试完成→访谈）
- [ ] 进入结果页（访谈完成→结果）
- [ ] 返回上一题（Q3→Q2）
- [ ] 返回上一阶段（阶段2→阶段1）

### 边界情况验收

- [ ] 在页面底部点击"下一题"，新页面从顶部开始
- [ ] 在页面中间点击"下一题"，新页面从顶部开始
- [ ] 在页面顶部点击"下一题"，新页面仍然从顶部开始
- [ ] 快速连续切换多个题目，每次都回到顶部

### 兼容性验收

- [ ] Chrome浏览器测试通过
- [ ] Safari浏览器测试通过
- [ ] Firefox浏览器测试通过（如适用）
- [ ] 移动端测试通过（如适用）

---

## 📅 实施时间表

| 任务 | 工时 |
|------|------|
| 诊断当前路由/状态管理方式 | 10分钟 |
| 选择并实施方案A/B/C | 15-30分钟 |
| 测试所有跳转场景 | 15分钟 |
| 边界情况验证 | 10分钟 |

**总计**: 50分钟-1小时

---

## ⚠️ 常见陷阱

### 陷阱1：方案A不生效

**可能原因**：`ScrollToTop`组件没有放在`Router`内部。

```jsx
// ❌ 错误位置
<ScrollToTop />  // 在Router外部
<Router>
  <Routes>...</Routes>
</Router>

// ✅ 正确位置
<Router>
  <ScrollToTop />  // 在Router内部
  <Routes>...</Routes>
</Router>
```

### 陷阱2：useEffect依赖项错误

```javascript
// ❌ 错误（依赖项为空数组，只在首次加载时滚动）
useEffect(() => {
  window.scrollTo(0, 0);
}, []);  // 空数组

// ✅ 正确（依赖currentQuestion，题目变化时滚动）
useEffect(() => {
  window.scrollTo(0, 0);
}, [currentQuestion]);
```

### 陷阱3：滚动容器不是window

如果使用了自定义滚动容器（如`<div className="scroll-container">`），`window.scrollTo`不会生效。

```javascript
// ❌ 不生效（如果滚动容器不是window）
window.scrollTo(0, 0);

// ✅ 正确（滚动自定义容器）
const scrollContainer = document.querySelector('.scroll-container');
scrollContainer.scrollTo(0, 0);
```

**诊断方法**：在浏览器控制台执行 `window.scrollTo(0, 0)`，如果页面不滚动，说明滚动容器不是window。

---

## 🔗 关联文档

### 本次议程关联
- `议程0_总览与执行顺序.md` - 议程整体说明

### 外部参考
- [React Router: Scroll Restoration](https://reactrouter.com/web/guides/scroll-restoration)
- [Vue Router: Scroll Behavior](https://router.vuejs.org/guide/advanced/scroll-behavior.html)

---

**文档版本**: v1.0
**创建日期**: 2026-07-26
**状态**: 📝 待开发者执行
**修复优先级**: 🔴 P0
**预估工时**: 1小时内
