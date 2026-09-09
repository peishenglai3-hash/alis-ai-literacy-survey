import { useState, useEffect, useRef } from "react";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getJourneyForStyle, classifyStyleV3 } from "../domain/styleClassifier";
import { getStyleProfileV3 } from "../content/styleProfiles";
import { detectContradictions, getContradictionsForStage, type Contradiction } from "../domain/contradictionDetector";
import { STAGE_QUESTIONS, STAGE_NAMES } from "../content/stageQuestions";
import { getGuidanceForQuestion } from "../content/storyGuidance";
import { getQuestionSchema } from "../data/questionSchemasData";
import { ThinkingWindows } from "./ThinkingWindows";
import { PositioningModal } from "./PositioningModal";
import { OpenDiscussionScreen } from "./OpenDiscussionScreen";
import { ThoughtBubblePanel, type ThoughtBubble } from "./ThoughtBubblePanel";
import { InterviewEpilogue } from "./InterviewEpilogue";
import { CelebrationDialog, type AchievementCard } from "./CelebrationDialog";
import { RecordViewModal } from "./RecordViewModal";
import { INTERVIEWER_FREEDOM_NOTE } from "../content/typeDefinitions";
// v3.4: AI 信号检测 + 跨题规则引擎
import { detectSignals } from "../domain/signalDetector";
import { matchReplyAgainstRules, triggeredRuleToBubbleMeta } from "../domain/crossQuestionEngine";
// v3.8 Tier 3: LLM 个性化追问
import { fetchContradictionProbe } from "../api/client";
// v3.10: 分数标签唯一真源
import { scoreLabel } from "../utils/scoreLabel";
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

// ---- 分数→中文标签（v3.10 收敛：全项目唯一真源 utils/scoreLabel.ts） ----

export function InterviewScreen({
  styleResult,
  responses,
  sessionId,
  onComplete,
  onSaveProgress,
  onEnterReview,
  saveState = { status: "idle", at: null },
  initialRecords,
}: {
  styleResult: StyleProfileV3;
  responses: Record<string, number>;
  sessionId: string;
  onComplete: (session: InterviewSession) => void;
  /** v3.12：保存回调返回 Promise——epilogue 阻塞式等待保存完成后再跳转 */
  onSaveProgress?: (session: InterviewSession) => Promise<void>;
  /** v3.4: 从回顾模式进入（Celebration "查看访谈记录"按钮） */
  onEnterReview?: () => void;
  /** v3.11: 保存状态（App 层维护——已保存/失败/空闲） */
  saveState?: { status: "idle" | "saved" | "error"; at: Date | null };
  /** v3.11 修复②: 刷新后从后端恢复的初始记录（App getInterview 回填注入） */
  initialRecords?: InterviewRecord[];
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
  // v3.6: showConceptSummary 已移除——概念总结内容合并入 OpenDiscussionScreen。
  // isLastStage → advanceStage → 直接显示尾声页。
  // v3.3 议程5：尾声页 + 庆祝弹窗
  const [showEpilogue, setShowEpilogue] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // ---- v3.8 Tier 3: LLM 个性化追问 ----
  const [personalizedPrompts, setPersonalizedPrompts] = useState<Record<string, string>>({});
  const [personalizingIds, setPersonalizingIds] = useState<Set<string>>(new Set());

  // ---- v3.4: AI 信号检测 + 跨题规则引擎状态 ----
  const [signalBubbles, setSignalBubbles] = useState<ThoughtBubble[]>([]);
  const [crossBubbles, setCrossBubbles] = useState<ThoughtBubble[]>([]);
  const triggeredRuleIds = useRef<Set<string>>(new Set()); // 已触发规则去重

  // ---- 阶段状态管理 ----
  const [currentStageIdx, setCurrentStageIdx] = useState(0);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  // v3.11 修复②：刷新后从后端恢复的初始记录（App 层 getInterview 回填后注入）。
  // 原缺陷：恢复数据只进 App 层 interviewSession，InterviewScreen 内部 records
  // 独立 state 刷新即空 → 已填记录不可见 + 续填会覆盖删除后端旧记录（比原事故更严重）。
  const [records, setRecords] = useState<InterviewRecord[]>(initialRecords ?? []);
  // v3.12 修复：initialRecords 是异步注入的（getInterview 在 mount 后返回），
  // useState 默认值只在首次挂载生效。加入 useEffect 同步后续到达的恢复记录——
  // 仅在当前 records 为空时覆盖（防覆盖用户已输入的新记录）。
  const [initialRecordsApplied, setInitialRecordsApplied] = useState(false);
  useEffect(() => {
    if (!initialRecordsApplied && initialRecords && initialRecords.length > 0 && records.length === 0) {
      setRecords(initialRecords);
      setInitialRecordsApplied(true);
    }
  }, [initialRecords, initialRecordsApplied, records.length]);
  const [quickReply, setQuickReply] = useState("");       // v3.5: 快速输入框（替代旧双 textarea）
  const [followUpQ, setFollowUpQ] = useState("");        // v3.6.3: 访谈者追问输入
  const [stageContradictions, setStageContradictions] = useState<Contradiction[]>([]);

  // v3.11 事故 1 修复（盲测①修正）：400ms 防抖逐题保存。
  // 盲测发现原实现缺陷：setTimeout 回调捕获"当次渲染"的 buildSession 闭包，
  // 其 records 不含刚加入的记录 → 每次保存落后一条（n_records=0/1/2），最后一条必丢。
  // 修复：recordsRef 镜像最新 records（每次渲染同步），定时器读 ref（永远最新），
  // 闭包不过期。flushPersist 同样基于 ref 构建 session。
  const recordsRef = useRef<InterviewRecord[]>([]);
  recordsRef.current = records;
  const currentStageIdxRef = useRef(0);
  currentStageIdxRef.current = currentStageIdx;
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const persistNow = () => {
    const session: InterviewSession = {
      styleResult,
      records: [...recordsRef.current],
      currentStage: journey[currentStageIdxRef.current]?.id ?? 1,
      completedStages: [...new Set(recordsRef.current.map((r) => r.stageId)), journey[currentStageIdxRef.current]?.id ?? 1],
      startedAt: recordsRef.current[0]?.timestamp ?? new Date().toISOString(),
    };
    onSaveProgress?.(session);
  };
  const schedulePersist = () => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      persistTimer.current = null;
      persistNow();
    }, 400);
  };
  const flushPersist = () => {
    if (persistTimer.current) {
      clearTimeout(persistTimer.current);
      persistTimer.current = null;
      persistNow();
    }
  };
  // 卸载 + 页面隐藏时兜底 flush（pagehide 比 beforeunload 在移动端更可靠）
  useEffect(() => {
    const flush = () => flushPersist();
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flushPersist();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // v3.5: drill zone 默认折叠 + Tab 选择
  const [drillCollapsed, setDrillCollapsed] = useState(true);
  const [activeDrillTab, setActiveDrillTab] = useState<string | null>(null);
  // v3.6.4: 记录查看弹窗 + 保存反馈
  const [showRecordModal, setShowRecordModal] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<"idle" | "success">("idle");
  const saveFeedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    setFollowUpQ("");
    setCurrentQuestionIdx(0);
    setDrillCollapsed(true);
    setActiveDrillTab(null);
    // v3.8: 阶段切换时清空上一阶段的 LLM 追问缓存，节省内存
    setPersonalizedPrompts({});
    setPersonalizingIds(new Set());
  }, [currentStageIdx]);

  // v3.8 Tier 3: 阶段切换后自动拉取 LLM 个性化追问
  useEffect(() => {
    if (stageContradictions.length === 0) return;
    if (!sessionId) return;

    // 收集受访者已给出的文本回复（用于个性化上下文）
    const replies: Record<string, string> = {};
    for (const r of records) {
      if (r.questionId && r.respondentReply) {
        // 取最近一条该题的回复
        replies[r.questionId] = r.respondentReply;
      }
    }

    const controller = new AbortController();
    // v3.10: 超时从 3s 放宽至 8s——DeepSeek 生产延迟常 2-8s，共享单个 3s 定时器
    // 会 abort 全部在途请求，导致个性化追问大概率全部降级为硬编码（Tier 3 形同虚设）。
    // 权衡：后端限流 10 次/分钟仍有余量；按钮有 loading 态兜底。
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    // 并行请求所有 contradiction 的 LLM 追问（8s 全局超时）
    const fetchPromises = stageContradictions.map(async (c) => {
      setPersonalizingIds((prev) => new Set(prev).add(c.id));
      try {
        // v3.10: 只发送受访者实际作答过的题（??: 0 会把未答题伪装成 0 分发给 LLM）
        const answeredScores: Record<string, number> = {};
        for (const qId of c.questions) {
          const s = responses[qId];
          if (s !== undefined) answeredScores[qId] = s;
        }
        const result = await fetchContradictionProbe({
          session_id: sessionId,
          contradiction_id: c.id,
          contradiction_type: c.type,
          question_ids: c.questions,
          likert_scores: answeredScores,
          respondent_replies: Object.fromEntries(
            c.questions.map((qId) => [qId, replies[qId] ?? ""]),
          ),
          fallback_prompt: c.prompt,
        }, controller.signal);
        // v3.10: fallback 标志诚实化——LLM 回退时不得显示"✨ 使用智能追问"
        // （按钮自然显示"使用此追问" + 硬编码文案）
        if (!result.fallback) {
          setPersonalizedPrompts((prev) => ({
            ...prev,
            [c.id]: result.personalized_prompt,
          }));
        }
      } catch {
        // 任何失败静默降级——按钮点击时用硬编码兜底（fallback_prompt）
      } finally {
        setPersonalizingIds((prev) => {
          const next = new Set(prev);
          next.delete(c.id);
          return next;
        });
      }
    });

    Promise.allSettled(fetchPromises).then(() => clearTimeout(timeoutId));

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [stageContradictions, sessionId]);

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
    // v3.11 事故 1 修复：逐题保存——新记录触发 400ms 防抖持久化
    // （不再只等阶段切换——同阶段填 2-3 条 Q&A 刷新即丢的主因）
    schedulePersist();

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

  /** v3.6.4: 双输入区保存——追问 + 回答 + 按钮反馈 */
  function handleQuickSave() {
    const q = followUpQ.trim();
    const reply = quickReply.trim();
    if (!q && !reply) return;
    addRecord(q, reply);
    setFollowUpQ("");
    setQuickReply("");
    // 保存成功反馈：按钮变绿 1.2s
    setSaveFeedback("success");
    if (saveFeedbackTimer.current) clearTimeout(saveFeedbackTimer.current);
    saveFeedbackTimer.current = setTimeout(() => setSaveFeedback("idle"), 1200);
  }

  /** v3.6.4: 编辑某条记录 */
  function handleUpdateRecord(index: number, updated: InterviewRecord) {
    setRecords((prev) => {
      const next = [...prev];
      next[index] = updated;
      return next;
    });
  }

  /** v3.6.4: 删除某条记录 */
  function handleDeleteRecord(index: number) {
    setRecords((prev) => prev.filter((_, i) => i !== index));
  }

  function advanceStage() {
    // v3.11: 切阶段前 flush 防抖中的保存（addRecord 已触发 schedulePersist，
    // 此处 flush 使"最后一条输入"在切阶段瞬间落库，不遗漏）
    flushPersist();

    if (isLastStage) {
      // v3.6: 概念总结已并入 OpenDiscussionScreen，直接进入尾声
      setShowEpilogue(true);
    } else {
      setCurrentStageIdx((i) => i + 1);
    }
    window.scrollTo(0, 0);
  }

  function goBackStage() {
    if (isFirstStage) return;
    setCurrentStageIdx((i) => i - 1);
    window.scrollTo(0, 0);
  }

  // v2.3 P0修复：阶段内题目导航
  function nextQuestion() {
    // v3.6.3: 自动保存未提交的追问 + 回复（防止切换题目时输入丢失）
    if (followUpQ.trim() || quickReply.trim()) {
      addRecord(followUpQ.trim(), quickReply.trim());
      setFollowUpQ("");
      setQuickReply("");
    }
    if (isLastQuestion) {
      advanceStage();
    } else {
      setCurrentQuestionIdx((i) => i + 1);
      setFollowUpQ("");
      setQuickReply("");
      setDrillCollapsed(true);
      setActiveDrillTab(null);
      window.scrollTo(0, 0);
    }
  }

  function prevQuestion() {
    // v3.6.3: 自动保存未提交的追问 + 回复
    if (followUpQ.trim() || quickReply.trim()) {
      addRecord(followUpQ.trim(), quickReply.trim());
      setFollowUpQ("");
      setQuickReply("");
    }
    if (isFirstQuestion) {
      goBackStage();
    } else {
      setCurrentQuestionIdx((i) => i - 1);
      setFollowUpQ("");
      setQuickReply("");
      setDrillCollapsed(true);
      setActiveDrillTab(null);
      window.scrollTo(0, 0);
    }
  }

  // v3.6: 直接显示尾声页（概念总结已并入 OpenDiscussionScreen）
  function goToEpilogue() {
    setShowEpilogue(true);
    window.scrollTo(0, 0);
  }

  // v3.3 议程5：尾声页 → 保存 + 庆祝弹窗
  // v3.12：阻塞式——先 await 保存完成，确认成功后才展示庆祝弹窗。
  const [savingEpilogue, setSavingEpilogue] = useState(false);
  async function handleSaveAndCelebrate() {
    const session = buildSession();
    setSavingEpilogue(true);
    try {
      if (onSaveProgress) await onSaveProgress(session);
    } catch {
      // 保存失败——不阻塞，草稿已写（onSaveProgress 内 writeDraft），
      // 用户仍可进庆祝弹窗，后续 flushAllDrafts 补传
    } finally {
      setSavingEpilogue(false);
    }
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
              maxHeight: "85vh", overflowY: "auto",
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

      {/* ======== v3.3 议程5：对话尾声页 ======== */}
      {showEpilogue && (
        <InterviewEpilogue
          journeyLabels={journeyLabels}
          onBack={() => { setShowEpilogue(false); }}
          onSaveAndComplete={handleSaveAndCelebrate}
          saving={savingEpilogue}
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

      {/* ======== v3.6.4: 访谈记录查看/编辑弹窗 ======== */}
      {showRecordModal && (
        <RecordViewModal
          records={records}
          currentStageId={safeStage.id}
          onUpdateRecord={handleUpdateRecord}
          onDeleteRecord={handleDeleteRecord}
          onClose={() => setShowRecordModal(false)}
        />
      )}

      {/* ================================================================
           v3.5 认知地图布局（定点重写 —— 匹配 HTML 基准）
           三区：FOCUS（中央焦点）+ AWARENESS（右侧觉察）+ DRILL（下方钻取）
           1920×1080 零滚动 · 三区全可见
           ================================================================ */}
      {!showEpilogue && !showCelebration && (
        <div className="cognitive-map">

          {/* ======== 中央焦点区 ======== */}
          <section className="focus-zone">
            <div className="zone-tag"><i></i>FOCUS · 必须看</div>

            {/* v3.11 保存状态条：田野用户"数据安全"安心信号——稳态安静、异常才出声 */}
            <div className="save-status-bar" role="status" aria-live="polite">
              {saveState.status === "saved" ? (
                <span className="save-status-ok">
                  <i className="dot ok"></i> 已保存 {saveState.at ? new Date(saveState.at).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>
              ) : saveState.status === "error" ? (
                <span className="save-status-err">
                  <i className="dot err"></i> 网络不稳，内容已保存到本机 · 先别刷新或关闭页面
                </span>
              ) : (
                <span className="save-status-idle">
                  <i className="dot idle"></i> 输入会自动保存，放心记录
                </span>
              )}
            </div>

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

            {/* v3.6: 开放性空间（阶段5）— 认知地图布局 */}
            {isOpenSpace && profile && (
              <OpenDiscussionScreen
                typeDef={v3Result.typeDef}
                styleResult={v3Result}
                onAddRecord={(note, reply) => {
                  if (note.trim() || reply.trim()) addRecord(note, reply);
                }}
                onBackToInterview={() => {
                  setCurrentStageIdx(currentStageIdx - 1);
                  window.scrollTo(0, 0);
                }}
                onComplete={goToEpilogue}
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
                      <span className="verdict"><b>{primaryScore}</b> · {scoreLabel(primaryScore)}</span>
                    </div>
                  </div>
                )}

                {/* 矛盾检测提示 */}
                {stageContradictions.length > 0 && (
                  <div className="contradiction-alert">
                    <h4>⚠️ 发现可能的矛盾</h4>
                    {stageContradictions.map((c) => {
                      const isLoading = personalizingIds.has(c.id);
                      const personalized = personalizedPrompts[c.id];
                      const displayPrompt = personalized ?? c.prompt;
                      const isPersonalized = !!personalized;
                      return (
                      <div key={c.id} className="contradiction-item">
                        <p className="small">{c.description}</p>
                        <p className="prompt-text">💬 {displayPrompt}</p>
                        <button
                          className="btn"
                          style={{
                            fontSize: "0.75rem",
                            padding: "4px 10px",
                            marginTop: 4,
                            opacity: isLoading ? 0.5 : 1,
                          }}
                          disabled={isLoading}
                          onClick={() => setFollowUpQ(displayPrompt)}
                        >
                          {isLoading
                            ? "✨ 生成中..."
                            : isPersonalized
                              ? "✨ 使用智能追问"
                              : "使用此追问"}
                        </button>
                      </div>
                      );
                    })}
                  </div>
                )}

                {/* 阶段入口引导（首次进入本阶段） */}
                {stageRecords.length === 0 && (
                  <div className="entry-guide">
                    <p>💡 {safeStage.entryPrompt}</p>
                  </div>
                )}

                {/* v3.6.4: 双输入区 — 访谈者追问 + 受访者回答（纯点击操作） */}
                <div className="dual-input-area">
                  {/* 追问输入（访谈者） */}
                  <div className="dual-input-row follow-up-row">
                    <label className="dual-input-label">
                      <span className="dual-input-icon">🎤</span>
                      追问问题
                    </label>
                    <input
                      type="text"
                      className="dual-input-field follow-up-field"
                      placeholder="输入你的追问问题…（如矛盾检测的提示可一键填充）"
                      value={followUpQ}
                      onChange={(e) => setFollowUpQ(e.target.value)}
                    />
                    <span className="dual-input-hint">点击按钮保存</span>
                  </div>

                  {/* 回复输入（受访者） */}
                  <div className="dual-input-row reply-row">
                    <label className="dual-input-label">
                      <span className="dual-input-icon">💬</span>
                      受访者回答
                    </label>
                    <textarea
                      className="dual-input-field reply-field"
                      placeholder="记录受访者的回答…（支持长文本 / 关键词 / 逐字引用）"
                      value={quickReply}
                      onChange={(e) => setQuickReply(e.target.value)}
                      rows={3}
                    />
                    <span className="dual-input-hint">点击按钮保存</span>
                  </div>

                  {/* 保存 + 查看按钮行 */}
                  <div className="dual-input-actions">
                    <button
                      className={`btn save-btn${saveFeedback === "success" ? " saved" : ""}`}
                      // v3.11: 防连点——保存成功瞬间禁用 1.2s（避免重复 addRecord）
                      disabled={(!followUpQ.trim() && !quickReply.trim()) || saveFeedback === "success"}
                      onClick={handleQuickSave}
                    >
                      {saveFeedback === "success" ? "✅ 已保存" : "💾 保存记录"}
                    </button>
                    <button
                      className="btn view-records-btn"
                      onClick={() => setShowRecordModal(true)}
                    >
                      📋 查看记录
                      {records.filter((r) => r.stageId === safeStage.id).length > 0 && (
                        <span className="view-records-count">
                          {records.filter((r) => r.stageId === safeStage.id).length}
                        </span>
                      )}
                    </button>
                    <span className="save-hint-text">
                      {/* v3.11: 自动保存上线后，按钮职责从"防丢"降级为"本条入账" */}
                      {!followUpQ.trim() && !quickReply.trim()
                        ? "输入会自动保存，点按钮确认本条"
                        : "已输入内容，点击左侧按钮确认本条"}
                    </span>
                  </div>
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
                  ? (isLastStage ? "进入尾声 →" : "下一阶段 →")
                  : (isLastQuestion ? (isLastStage ? "进入尾声 →" : "下一阶段 →") : "下一题 →")}
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
                  <ThinkingWindows questionId={primaryQuestionId} score={primaryScore} activeTab={activeDrillTab ?? undefined} />
                </div>
              )}
            </section>
          )}

        </div>
      )}
    </>
  );
}
