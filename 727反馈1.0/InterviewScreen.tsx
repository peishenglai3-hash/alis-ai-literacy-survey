import { useState, useEffect, useRef } from "react";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getJourneyForStyle, classifyStyleV3 } from "../domain/styleClassifier";
import { getStyleProfileV3 } from "../content/styleProfiles";
import { detectContradictions, getContradictionsForStage, type Contradiction } from "../domain/contradictionDetector";
import { STAGE_QUESTIONS, STAGE_NAMES } from "../content/stageQuestions";
import { getGuidanceForQuestion } from "../content/storyGuidance";
import { getQuestionSchema } from "../data/questionSchemasData";
import { QuestionContextPanel } from "./QuestionContextPanel";
import { ThinkingWindows } from "./ThinkingWindows";
import { CrossQuestionHints } from "./CrossQuestionHints";
import { PositioningModal, ConceptSummaryPanel } from "./PositioningModal";
import { OpenSpacePanel } from "./OpenSpacePanel";
import { ThoughtBubblePanel, type ThoughtBubble } from "./ThoughtBubblePanel";
import { InterviewEpilogue } from "./InterviewEpilogue";
import { CelebrationDialog, type AchievementCard } from "./CelebrationDialog";
import { INTERVIEWER_FREEDOM_NOTE } from "../content/typeDefinitions";
// v3.4: AI 信号检测 + 跨题规则引擎
import { detectSignals, signalToBubbleMeta } from "../domain/signalDetector";
import { matchReplyAgainstRules, triggeredRuleToBubbleMeta } from "../domain/crossQuestionEngine";
import "./InterviewScreen.css";

// v3.5 认知地图布局（定点重写）：中央焦点区 + 右侧觉察带 + 下方钻取区。
// 来源：727反馈1.0/v3.3认知地图布局_可视化.html（视觉基准）+ 设计系统与全流程布局策略.md
// 策略：匹配 HTML 基准的三区 Grid；删除旧大文本区、记录滚动区、下一题预览。

export interface InterviewRecord {
  stageId: number;
  questionId?: string;
  followUpId?: string;
  interviewerNote: string;
  respondentReply: string;
  timestamp: string;
}

export interface InterviewSession {
  styleResult: StyleProfileV3;
  records: InterviewRecord[];
  currentStage: number;
  completedStages: number[];
  startedAt: string;
}

// ---- 钻取区窗口定义（匹配 HTML 基准的四个 Tab） ----
const DRILL_WINDOWS = [
  { id: "meaning",    emoji: "📘", label: "题目理解" },
  { id: "experience", emoji: "📖", label: "经验叙事" },
  { id: "choice",     emoji: "🎚", label: "选择解释" },
  { id: "literacy",   emoji: "🔗", label: "素养关联" },
] as const;

// ---- 分数→中文标签 ----
function getScoreLabel(score: number): string {
  if (score >= 7) return "非常同意";
  if (score >= 6) return "比较同意";
  if (score >= 5) return "有点同意";
  if (score >= 4) return "中立 / 不确定";
  if (score >= 3) return "有点不同意";
  if (score >= 2) return "比较不同意";
  return "非常不同意";
}

export function InterviewScreen({
  styleResult,
  responses,
  onComplete,
  onSaveProgress,
  onEnterReview,
}: {
  styleResult: StyleProfileV3;
  responses: Record<string, number>;
  onComplete: (session: InterviewSession) => void;
  onSaveProgress?: (session: InterviewSession) => void;
  /** v3.4: 从回顾模式进入（Celebration "查看访谈记录"按钮） */
  onEnterReview?: () => void;
}) {
  // v3.2: 直接使用V3分类器结果
  const v3Result = classifyStyleV3(responses);
  const profile = getStyleProfileV3(v3Result.typeCode);
  const journey = getJourneyForStyle(v3Result.typeCode);
  const allContradictions = detectContradictions(responses);
  const totalStages = journey.length;

  // ---- 弹窗/页面流状态 ----
  const [showPositioning, setShowPositioning] = useState(true);
  const [showFreedomNote, setShowFreedomNote] = useState(false);
  const [showConceptSummary, setShowConceptSummary] = useState(false);
  // v3.3 议程5：尾声页 + 庆祝弹窗
  const [showEpilogue, setShowEpilogue] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // ---- v3.4: AI 信号检测 + 跨题规则引擎状态 ----
  const [signalBubbles, setSignalBubbles] = useState<ThoughtBubble[]>([]);
  const [crossBubbles, setCrossBubbles] = useState<ThoughtBubble[]>([]);
  const triggeredRuleIds = useRef<Set<string>>(new Set()); // 已触发规则去重

  // ---- 阶段状态管理 ----
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [quickReply, setQuickReply] = useState("");       // v3.5: 快速输入框（替代旧双 textarea）
  const [stageContradictions, setStageContradictions] = useState<Contradiction[]>([]);
  // v3.5: drill zone 默认折叠 + Tab 选择
  const [drillCollapsed, setDrillCollapsed] = useState(true);
  const [activeDrillTab, setActiveDrillTab] = useState<string | null>(null);

  // ---- 当前题目 ----
  const stage = journey[currentStageIdx];
  if (!stage) {
    return <div className="card muted">旅程数据加载失败，请返回重试。</div>;
  }
  const safeStage = stage;
  const stageQuestions = STAGE_QUESTIONS[safeStage.id] ?? [];
  const isOpenSpace = safeStage.id === 5;

  const primaryQuestionId = stageQuestions[currentQuestionIdx] ?? stageQuestions[0] ?? "";
  const primaryScore = responses[primaryQuestionId];
  const currentGuidance =
    !isOpenSpace && primaryQuestionId && primaryScore !== undefined
      ? getGuidanceForQuestion(primaryQuestionId, responses)
      : undefined;
  const questionSchema = !isOpenSpace && primaryQuestionId
    ? getQuestionSchema(primaryQuestionId)
    : undefined;

  const isFirstStage = currentStageIdx === 0;
  const isLastStage = currentStageIdx === totalStages - 1;
  const isFirstQuestion = currentQuestionIdx === 0;
  const isLastQuestion = currentQuestionIdx >= stageQuestions.length - 1;
  const totalStageQuestions = stageQuestions.length;

  // 切换阶段时刷新矛盾检测、重置题目索引
  useEffect(() => {
    setStageContradictions(getContradictionsForStage(allContradictions, safeStage.id));
    setQuickReply("");
    setCurrentQuestionIdx(0);
    setDrillCollapsed(true);
    setActiveDrillTab(null);
  }, [currentStageIdx]);

  function buildSession(): InterviewSession {
    const s = safeStage;
    const completedStages = [...new Set(records.map((r) => r.stageId)), s.id];
    return {
      styleResult,
      records: [...records],
      currentStage: s.id,
      completedStages: [...new Set(completedStages)],
      startedAt: records[0]?.timestamp ?? new Date().toISOString(),
    };
  }

  function addRecord(note: string, reply: string) {
    const record: InterviewRecord = {
      stageId: safeStage.id,
      questionId: primaryQuestionId,
      interviewerNote: note.trim(),
      respondentReply: reply.trim(),
      timestamp: new Date().toISOString(),
    };
    setRecords((prev) => [...prev, record]);

    // v3.4: AI 信号检测
    if (reply.trim()) {
      const allReplies = records
        .filter((r) => r.respondentReply)
        .map((r) => r.respondentReply);
      const signals = detectSignals(
        reply,
        responses[primaryQuestionId],
        primaryQuestionId,
        allReplies,
      );
      if (signals.length > 0) {
        const newSignalBubbles: ThoughtBubble[] = signals.map((s) => ({
          id: s.id,
          content: s.content,
          status: "pending" as const,
          mode: "deep-listen" as const,
          createdAt: new Date().toISOString(),
          source: "interviewee_signal" as const,
          subtype: s.subtype,
          confidence: s.confidence,
        }));
        setSignalBubbles((prev) => [...prev, ...newSignalBubbles]);
      }

      // v3.4: 跨题规则引擎
      const triggered = matchReplyAgainstRules(
        reply,
        primaryQuestionId,
        triggeredRuleIds.current,
      );
      if (triggered.length > 0) {
        const newCrossBubbles: ThoughtBubble[] = triggered.map((r) => {
          const meta = triggeredRuleToBubbleMeta(r);
          triggeredRuleIds.current.add(`${r.link.fromQuestion}→${r.link.toQuestion}`);
          return {
            id: meta.id,
            content: meta.content,
            status: "pending" as const,
            mode: "deep-listen" as const,
            createdAt: meta.createdAt,
            source: "cross_question" as const,
            targetQuestion: meta.targetQuestion,
            matchedKeyword: meta.matchedKeyword,
          };
        });
        setCrossBubbles((prev) => [...prev, ...newCrossBubbles]);
      }
    }
  }

  /** v3.5: 快速输入框回车保存 */
  function handleQuickSave() {
    const reply = quickReply.trim();
    if (!reply) return;
    addRecord("", reply);
    setQuickReply("");
  }

  function advanceStage() {
    const session = buildSession();
    onSaveProgress?.(session);

    if (isLastStage) {
      setShowConceptSummary(true);
    } else {
      setCurrentStageIdx((i) => i + 1);
    }
    window.scrollTo(0, 0);
  }

  function finalComplete() {
    onComplete(buildSession());
  }

  function goBackStage() {
    if (isFirstStage) return;
    setCurrentStageIdx((i) => i - 1);
    window.scrollTo(0, 0);
  }

  // v2.3 P0修复：阶段内题目导航
  function nextQuestion() {
    if (isLastQuestion) {
      advanceStage();
    } else {
      setCurrentQuestionIdx((i) => i + 1);
      setQuickReply("");
      setDrillCollapsed(true);
      setActiveDrillTab(null);
      window.scrollTo(0, 0);
    }
  }

  function prevQuestion() {
    if (isFirstQuestion) {
      goBackStage();
    } else {
      setCurrentQuestionIdx((i) => i - 1);
      setQuickReply("");
      setDrillCollapsed(true);
      setActiveDrillTab(null);
      window.scrollTo(0, 0);
    }
  }

  // v3.3 议程5：概念总结 → 尾声页
  function goToEpilogue() {
    setShowConceptSummary(false);
    setShowEpilogue(true);
    window.scrollTo(0, 0);
  }

  // v3.3 议程5：尾声页 → 保存 + 庆祝弹窗
  function handleSaveAndCelebrate() {
    const session = buildSession();
    onSaveProgress?.(session);
    setShowEpilogue(false);
    setShowCelebration(true);
  }

  // v3.3 议程5：庆祝弹窗关闭 → 完成
  function handleCelebrationClose() {
    setShowCelebration(false);
    onComplete(buildSession());
  }

  const stageRecords = records.filter((r) => r.stageId === safeStage.id);

  // 旅程标签（用于尾声页）
  const journeyLabels = journey
    .filter((s) => s.id <= 4)
    .map((s) => STAGE_NAMES[s.id] ?? s.nameZh);

  // v3.3 议程5：庆祝弹窗成就卡片数据
  const celebrationCards: AchievementCard[] = (() => {
    const session = buildSession();
    const durationMin = session.startedAt
      ? Math.round((Date.now() - new Date(session.startedAt).getTime()) / 60000)
      : null;
    const answeredCount = Object.values(responses).filter((v) => v !== undefined && v !== null).length;
    const stagesCovered = session.completedStages.length;
    const code = session.startedAt
      ? new Date(session.startedAt).toISOString().slice(0, 10).replace(/-/g, "")
      : "---";
    return [
      { icon: "⏱️", value: durationMin !== null ? `${durationMin} 分钟` : "已保存", label: "访谈时长" },
      { icon: "📝", value: `${answeredCount} 题`, label: "完整回答" },
      { icon: "🗺️", value: `${stagesCovered} / 6`, label: "维度覆盖" },
      { icon: "🏷️", value: `#${code}`, label: "受访者编号" },
    ];
  })();

  return (
    <>
      {/* ======== 定位说明弹窗 ======== */}
      {showPositioning && (
        <PositioningModal onDismiss={() => {
          setShowPositioning(false);
          setShowFreedomNote(true);
        }} />
      )}

      {/* ======== 访谈者自由度提示弹窗 ======== */}
      {showFreedomNote && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.4)", padding: 16,
          }}
          onClick={() => setShowFreedomNote(false)}
        >
          <div
            style={{
              maxWidth: 420, width: "100%", background: "var(--ds-surface, #fff)",
              borderRadius: 12, padding: "24px 28px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <span style={{ fontSize: "2rem" }}>💭</span>
              <h2 style={{ margin: "8px 0 0", fontSize: "1.2rem" }}>
                {INTERVIEWER_FREEDOM_NOTE.title}
              </h2>
            </div>
            <p style={{ fontSize: "0.9rem", lineHeight: 1.7, margin: "0 0 12px", textAlign: "center" }}>
              {INTERVIEWER_FREEDOM_NOTE.body}
            </p>
            <ul style={{ margin: "0 0 20px", paddingLeft: 20, fontSize: "0.85rem", lineHeight: 2 }}>
              {INTERVIEWER_FREEDOM_NOTE.points.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>
            <div style={{ textAlign: "center" }}>
              <button className="primary" onClick={() => setShowFreedomNote(false)}>
                开始访谈
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======== 概念总结页 ======== */}
      {showConceptSummary && (
        <div style={{ maxWidth: 960, margin: "0 auto", padding: "0 16px 80px" }}>
          <ConceptSummaryPanel />
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20, gap: 12 }}>
            <button className="ghost" onClick={() => setShowConceptSummary(false)}>
              ← 返回访谈
            </button>
            <button className="primary" onClick={goToEpilogue}>
              继续尾声 →
            </button>
          </div>
        </div>
      )}

      {/* ======== v3.3 议程5：对话尾声页 ======== */}
      {showEpilogue && (
        <InterviewEpilogue
          journeyLabels={journeyLabels}
          onBack={() => { setShowEpilogue(false); setShowConceptSummary(true); }}
          onSaveAndComplete={handleSaveAndCelebrate}
        />
      )}

      {/* ======== v3.3 议程5：访谈者收尾弹窗 ======== */}
      {showCelebration && (
        <CelebrationDialog
          achievements={celebrationCards}
          interviewerName="管理员·lps"
          onReview={onEnterReview}
          onClose={handleCelebrationClose}
        />
      )}

      {/* ================================================================
           v3.5 认知地图布局（定点重写 —— 匹配 HTML 基准）
           三区：FOCUS（中央焦点）+ AWARENESS（右侧觉察）+ DRILL（下方钻取）
           1920×1080 零滚动 · 三区全可见
           ================================================================ */}
      {!showConceptSummary && !showEpilogue && !showCelebration && (
        <div className="cognitive-map">

          {/* ======== 中央焦点区 ======== */}
          <section className="focus-zone">
            <div className="zone-tag"><i></i>FOCUS · 必须看</div>

            {/* 阶段标签 + 题号 + 进度 */}
            <div className="focus-head">
              <span className="stage-pill">
                阶段 {safeStage.id > 4 ? safeStage.id : safeStage.id} · <b>{STAGE_NAMES[safeStage.id] ?? safeStage.nameZh}</b>
              </span>
              {!isOpenSpace && primaryQuestionId && (
                <span className="qno">
                  <b>{primaryQuestionId}</b> / 本阶段 {currentQuestionIdx + 1}·{totalStageQuestions}
                </span>
              )}
              <div className="stage-progress">
                {journey.filter((s) => s.id <= 4).map((s, i) => (
                  <span key={s.id} style={{ display: "inline-flex", alignItems: "center", gap: 0 }}>
                    {i > 0 && <i className="sep" style={{ margin: "0 5px" }}></i>}
                    <span className="sg">
                      <i className={`mk ${i < currentStageIdx ? "done" : i === currentStageIdx ? "cur" : "todo"}`}></i>
                      {STAGE_NAMES[s.id] ?? s.nameZh}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* 开放性空间（阶段5）—— 保持原有逻辑 */}
            {isOpenSpace && profile && (
              <OpenSpacePanel
                typeDef={v3Result.typeDef}
                onAddRecord={(note, reply) => {
                  if (note.trim() || reply.trim()) addRecord(note, reply);
                }}
              />
            )}

            {/* 非开放空间：题目 + 答案 + 快速输入 */}
            {!isOpenSpace && (
              <>
                {/* 题目文本 */}
                {currentGuidance && (
                  <h1 className="question">{currentGuidance.questionText}</h1>
                )}

                {/* 关键词 */}
                {questionSchema && questionSchema.keywords.length > 0 && (
                  <div className="keywords">
                    {questionSchema.keywords.map((kw) => (
                      <span key={kw} className="kw">{kw}</span>
                    ))}
                  </div>
                )}

                {/* 答案块（展示 Likert 评分） */}
                {primaryScore !== undefined && (
                  <div className="answer-block">
                    <div className="lab">受访者作答</div>
                    <div className="txt">"{currentGuidance?.questionText ?? primaryQuestionId}"</div>
                    <div className="scale">
                      <div className="nums">
                        {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                          <span key={n} className={`num${n === primaryScore ? " sel" : ""}`}>{n}</span>
                        ))}
                      </div>
                      <span className="verdict"><b>{primaryScore}</b> · {getScoreLabel(primaryScore)}</span>
                    </div>
                  </div>
                )}

                {/* 矛盾检测提示 */}
                {stageContradictions.length > 0 && (
                  <div className="contradiction-alert">
                    <h4>⚠️ 发现可能的矛盾</h4>
                    {stageContradictions.map((c) => (
                      <div key={c.id} className="contradiction-item">
                        <p className="small">{c.description}</p>
                        <p className="prompt-text">💬 {c.prompt}</p>
                        <button
                          className="btn"
                          style={{ fontSize: "0.75rem", padding: "4px 10px", marginTop: 4 }}
                          onClick={() => setQuickReply(c.prompt)}
                        >
                          使用此追问
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* 阶段入口引导（首次进入本阶段） */}
                {stageRecords.length === 0 && (
                  <div className="entry-guide">
                    <p>💡 {safeStage.entryPrompt}</p>
                  </div>
                )}

                {/* 快速输入框（v3.5: 替代旧双 textarea） */}
                <div className="quick-input">
                  <span className="plus">＋</span>
                  <input
                    type="text"
                    placeholder="记录受访者的关键回复（关键词式，不是大段文本）…"
                    value={quickReply}
                    onChange={(e) => setQuickReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleQuickSave();
                      }
                    }}
                  />
                  <span className="hint">⏎ 保存</span>
                </div>
              </>
            )}

            {/* 导航行 */}
            <div className="nav-row">
              <button
                className="btn"
                disabled={isFirstStage && isFirstQuestion}
                onClick={prevQuestion}
              >
                ← 上一题
              </button>
              <span className="pos">
                {isOpenSpace
                  ? `阶段 ${currentStageIdx + 1}/${totalStages}`
                  : `${currentQuestionIdx + 1} / 15`}
              </span>
              <button className="btn primary" onClick={nextQuestion}>
                {isOpenSpace
                  ? (isLastStage ? "进入概念总结 →" : "下一阶段 →")
                  : (isLastQuestion ? (isLastStage ? "进入概念总结 →" : "下一阶段 →") : "下一题 →")}
              </button>
            </div>
          </section>

          {/* ======== 右侧觉察带 ======== */}
          <aside className="awareness-zone">
            <div className="zone-tag"><i></i>AWARENESS · 可能想到</div>

            <ThoughtBubblePanel
              sessionId={`interview_${v3Result.typeCode}`}
              currentStageId={safeStage.id}
              currentQuestionId={primaryQuestionId || undefined}
              externalBubbles={[...signalBubbles, ...crossBubbles]}
            />

            {/* 访谈进度（觉察带底部） */}
            <div className="interview-progress-bar">
              <div className="title">📊 访谈进度</div>
              {journey.filter((s) => s.id <= 4).map((s, i) => (
                <div
                  key={s.id}
                  className="stage-row"
                  style={{
                    color: i < currentStageIdx
                      ? "var(--ds-done)"
                      : i === currentStageIdx
                        ? "var(--ds-accent)"
                        : "var(--ds-muted)",
                    fontWeight: i === currentStageIdx ? 600 : 400,
                  }}
                >
                  <span>{i < currentStageIdx ? "✓" : i === currentStageIdx ? "▶" : "○"}</span>
                  <span>{STAGE_NAMES[s.id] ?? s.nameZh}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* ======== 下方钻取区（v3.5: Tab 式，匹配 HTML 基准） ======== */}
          {!isOpenSpace && primaryQuestionId && primaryScore !== undefined && questionSchema && (
            <section className={`drill-zone${drillCollapsed ? " collapsed" : ""}`}>
              <div className="zone-tag"><i></i>DRILL · 想深挖（默认折叠）</div>

              <div className="drill-tabs">
                {DRILL_WINDOWS.map((w) => (
                  <button
                    key={w.id}
                    className={`drill-tab${activeDrillTab === w.id && !drillCollapsed ? " active" : ""}`}
                    onClick={() => {
                      if (drillCollapsed) {
                        setDrillCollapsed(false);
                        setActiveDrillTab(w.id);
                      } else {
                        setActiveDrillTab(activeDrillTab === w.id ? null : w.id);
                        if (activeDrillTab === w.id) setDrillCollapsed(true);
                      }
                    }}
                  >
                    <span className="ic">{w.emoji}</span>
                    {w.label}
                    {activeDrillTab === w.id && !drillCollapsed && (
                      <span className="badge">展开</span>
                    )}
                  </button>
                ))}
              </div>

              {/* 展开的 Tab 内容 */}
              {activeDrillTab && !drillCollapsed && (
                <div className="drill-body">
                  <ThinkingWindows questionId={primaryQuestionId} score={primaryScore} />
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </>
  );
}
