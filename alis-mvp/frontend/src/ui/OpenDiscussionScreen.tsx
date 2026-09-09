// 开放性空间 — 认知地图布局（v3.6 727反馈2.0）。
// 来源：727反馈2.0/开放性空间_认知地图式原型.html（视觉基准）
//       + 给开发者_开放性空间与概念总结页面界面修改.md
//       + 开放性空间_认知地图设计思路.md
//
// 设计理念：开放性空间不是"问题清单"，而是"讨论地图"。
// 将原有的 OpenSpacePanel（卡片列表）+ ConceptSummaryPanel（独立页）
// 合并为一个三区认知地图页面：
//   左侧焦点区（60%）— 当前选中主题的具体问题
//   右侧导航区（35%）— 6个主题的导航卡片
//   底部对话记录区 — 访谈者记录讨论要点
// 访谈者有主导性——可以选择讨论顺序。

import { useState, useMemo } from "react";
import type { TypeDefV3 } from "../content/typeDefinitions";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import {
  OPEN_SPACE_QUESTIONS,
  renderQuestionText,
} from "../content/openSpace";
import { CONCEPT_SUMMARY_QUESTIONS } from "../content/conceptReflection";
import "./OpenDiscussionScreen.css";

// ============================================================================
// 6个讨论主题（合并开放空间9题 + 概念总结4题）
// ============================================================================

interface DiscussionTopic {
  id: string;
  name: string;
  icon: string;
  /** 一行说明：该主题聚焦的问题及与AI素养调研的关系 */
  description: string;
  /** 合并后的问题列表 */
  questions: DiscussionQuestion[];
}

interface DiscussionQuestion {
  id: string;
  text: string;
  purpose: string;
  /** 来源标记 */
  source: "open_space" | "concept_summary";
}

function buildTopics(typeDef: TypeDefV3): DiscussionTopic[] {
  // 为开放空间问题渲染类型名占位符
  const renderOS = (qId: string): string => {
    const q = OPEN_SPACE_QUESTIONS.find((oq) => oq.questionId === qId);
    if (!q) return "";
    return renderQuestionText(q, typeDef);
  };

  return [
    {
      id: "type_reflection",
      name: "类型反思",
      icon: "🖊️",
      description: "从测试结果出发，反思你与AI的关系",
      questions: [
        {
          id: "OS_Q1",
          text: renderOS("OS_Q1"),
          purpose: "让受访者反思类型是否准确，探索类型与自我认知的一致性/矛盾性",
          source: "open_space",
        },
        {
          id: "OS_Q2",
          text: renderOS("OS_Q2"),
          purpose: "开放反思空间，不受类型框架限制，了解受访者自己的概念框架",
          source: "open_space",
        },
      ],
    },
    {
      id: "ai_literacy",
      name: "AI素养理解",
      icon: "📖",
      description: "探索「AI素养」对你意味着什么，以及如何定义",
      questions: [
        {
          id: "OS_Q3",
          text: renderOS("OS_Q3"),
          purpose: "探索受访者的AI素养概念，挑战'能力 vs 风格'的预设",
          source: "open_space",
        },
        {
          id: "OS_Q4",
          text: renderOS("OS_Q4"),
          purpose: "探索受访者的价值判断，挑战'无优劣'的预设",
          source: "open_space",
        },
      ],
    },
    {
      id: "literacy_extension",
      name: "AI素养拓展",
      icon: "⭐",
      description: "从个人体验延伸到社会层面的影响和思考",
      questions: [
        {
          id: "OS_Q5",
          text: renderOS("OS_Q5"),
          purpose: "探索受访者对AI素养概念的拓展理解，获取对现有测试框架的补充建议",
          source: "open_space",
        },
      ],
    },
    {
      id: "personal_story",
      name: "个人故事",
      icon: "💬",
      description: "从类型回到具体经验，深化对AI使用的理解",
      questions: [
        {
          id: "OS_Q6",
          text: renderOS("OS_Q6"),
          purpose: "从类型回到具体经验，深化对类型的理解",
          source: "open_space",
        },
      ],
    },
    {
      id: "future_planning",
      name: "未来规划",
      icon: "🔮",
      description: "面对AI时代，你的学习策略和未来态度",
      questions: [
        {
          id: "OS_Q7",
          text: renderOS("OS_Q7"),
          purpose: "探索受访者的AI学习策略，了解对AI时代的态度",
          source: "open_space",
        },
        {
          id: "OS_Q8",
          text: renderOS("OS_Q8"),
          purpose: "探索受访者的未来规划，了解AI与个人生活的关系",
          source: "open_space",
        },
      ],
    },
    {
      id: "summary_reflection",
      name: "总结反思",
      icon: "📝",
      description: "回顾整个对话，重新定义和批判AI素养",
      questions: [
        {
          id: "OS_Q9",
          text: renderOS("OS_Q9"),
          purpose: "让受访者反思类型框架本身，获取对理论框架的批判性反馈",
          source: "open_space",
        },
        ...CONCEPT_SUMMARY_QUESTIONS.map((q) => ({
          id: q.id,
          text: q.guidanceText,
          purpose: q.purpose,
          source: "concept_summary" as const,
        })),
      ],
    },
  ];
}

// ============================================================================
// Props
// ============================================================================

export interface OpenDiscussionScreenProps {
  typeDef: TypeDefV3;
  styleResult: StyleProfileV3;
  onAddRecord: (note: string, reply: string) => void;
  onBackToInterview: () => void;
  onComplete: () => void;
}

// ============================================================================
// Component
// ============================================================================

export function OpenDiscussionScreen({
  typeDef,
  styleResult,
  onAddRecord,
  onBackToInterview,
  onComplete,
}: OpenDiscussionScreenProps) {
  const topics = useMemo(() => buildTopics(typeDef), [typeDef]);
  const [activeTopicId, setActiveTopicId] = useState<string>(topics[0]?.id ?? "");
  const [interviewerQuestion, setInterviewerQuestion] = useState("");
  const [note, setNote] = useState("");
  const [reply, setReply] = useState("");
  const [discussedIds, setDiscussedIds] = useState<Set<string>>(new Set());

  const activeTopic = topics.find((t) => t.id === activeTopicId) ?? topics[0];

  function handleTopicClick(topicId: string) {
    setActiveTopicId(topicId);
  }

  function handleSaveRecord() {
    if (!interviewerQuestion.trim() && !note.trim() && !reply.trim()) return;
    const record = [
      interviewerQuestion.trim() ? `❓ 提问：${interviewerQuestion.trim()}` : "",
      note.trim() ? `📝 笔记：${note.trim()}` : "",
      reply.trim() ? `💬 回复：${reply.trim()}` : "",
    ].filter(Boolean).join("\n");
    onAddRecord(record, reply);
    setInterviewerQuestion("");
    setNote("");
    setReply("");
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveRecord();
    }
  }

  function toggleDiscussed(questionId: string) {
    setDiscussedIds((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) next.delete(questionId);
      else next.add(questionId);
      return next;
    });
  }

  function handleQuestionClick(questionId: string) {
    toggleDiscussed(questionId);
  }

  if (!activeTopic) return null;

  return (
    <div className="od-container">
      {/* ======== 顶部标题 ======== */}
      <div className="od-header">
        <div className="od-completion-badge">
          <span>🎉</span>
          <span>15题完成！</span>
        </div>
        <h1 className="od-title">💬 开放性讨论空间</h1>
        <p className="od-subtitle">
          访谈的最后一站。这里有 {topics.length} 个话题可以一起探索，没有固定顺序，你的思考最重要。
        </p>
      </div>

      {/* ======== 主内容区：焦点区 + 导航区 ======== */}
      <div className="od-main">
        {/* ---- 左侧焦点区 ---- */}
        <div className="od-focus">
          <div className="od-focus-header">
            <div className="od-focus-icon">{activeTopic.icon}</div>
            <div className="od-focus-title-group">
              <h2 className="od-focus-title">{activeTopic.name}</h2>
              <p className="od-focus-dimension">
                受访者：{typeDef.fullName} · 风格：{styleResult.typeCode}
              </p>
            </div>
          </div>

          <div className="od-focus-content">
            {activeTopic.questions.map((q) => {
              const isDiscussed = discussedIds.has(q.id);
              return (
                <div
                  key={q.id}
                  className="od-question-item"
                  style={{
                    opacity: isDiscussed ? 0.65 : 1,
                    borderColor: isDiscussed ? "var(--ds-done, #3f9d77)" : "transparent",
                  }}
                  onClick={() => handleQuestionClick(q.id)}
                >
                  <p
                    className="od-question-text"
                    style={{
                      textDecoration: isDiscussed ? "line-through" : "none",
                    }}
                  >
                    {isDiscussed ? "✅ " : "💬 "}{q.text}
                  </p>
                  <p className="od-question-purpose">
                    🎯 {q.purpose}
                    {q.source === "concept_summary" && (
                      <span style={{
                        marginLeft: 8, padding: "1px 6px", borderRadius: 8,
                        background: "var(--ds-ai-soft, #f5ead7)",
                        color: "var(--ds-ai, #bd7a2e)",
                        fontSize: "10px", fontFamily: "var(--ds-mono)",
                      }}>概念总结</span>
                    )}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="od-expand-hint">
            <span>💡</span>
            <span>访谈者：点击问题标记已讨论，在下方记录讨论要点</span>
          </div>
        </div>

        {/* ---- 右侧导航区 ---- */}
        <div className="od-nav">
          <div className="od-nav-head">
            <span>🧭</span>
            <span>讨论地图（{topics.length}个话题）</span>
          </div>

          <div className="od-nav-grid">
            {topics.map((topic) => (
              <div
                key={topic.id}
                className={`od-nav-card${topic.id === activeTopicId ? " active" : ""}`}
                onClick={() => handleTopicClick(topic.id)}
              >
                <div className="od-nav-card-header">
                  <div className="od-nav-card-icon">{topic.icon}</div>
                  <div className="od-nav-card-title-group">
                    <h4 className="od-nav-card-title">{topic.name}</h4>
                  </div>
                  <span className="od-nav-card-count">{topic.questions.length}</span>
                </div>
                <p className="od-nav-card-preview">{topic.description}</p>
              </div>
            ))}
          </div>

          <div className="od-path-indicator">
            <span>当前话题</span>
            <span style={{ fontFamily: "var(--ds-mono)", color: "var(--ds-accent)", fontWeight: 600 }}>
              → {activeTopic.name}
            </span>
          </div>
        </div>
      </div>

      {/* ======== 底部对话记录区 ======== */}
      <div className="od-dialogue">
        <div className="od-dialogue-header">
          <span className="od-dialogue-icon">💬</span>
          <h4 className="od-dialogue-title">讨论记录</h4>
        </div>
        <p className="od-current-topic">
          当前讨论：<span>{activeTopic.name}</span>
        </p>
        <textarea
          className="od-dialogue-input"
          placeholder="访谈者：输入你想向受访者提出的问题…"
          value={interviewerQuestion}
          onChange={(e) => setInterviewerQuestion(e.target.value)}
          onKeyDown={handleKeyDown}
          style={{ borderColor: "var(--ds-accent, #6957c9)" }}
        />
        <textarea
          className="od-dialogue-input"
          style={{ marginTop: 8 }}
          placeholder="访谈者：记录讨论要点、被访者的关键观点、值得追踪的问题…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <textarea
          className="od-dialogue-input"
          style={{ marginTop: 8, minHeight: 48 }}
          placeholder="记录受访者的关键回复…"
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <div className="od-dialogue-actions">
          <button
            className="od-btn save"
            disabled={!interviewerQuestion.trim() && !note.trim() && !reply.trim()}
            onClick={handleSaveRecord}
          >
            + 添加记录
          </button>
          <span style={{ fontSize: 11, color: "var(--ds-faint)", fontFamily: "var(--ds-mono)" }}>
            Ctrl+Enter 快速保存
          </span>
        </div>
      </div>

      {/* ======== 导航按钮 ======== */}
      <div className="od-nav-buttons">
        <button className="od-btn secondary" onClick={onBackToInterview}>
          ← 返回访谈
        </button>
        <button className="od-btn primary" onClick={onComplete}>
          进入尾声 →
        </button>
      </div>
    </div>
  );
}
