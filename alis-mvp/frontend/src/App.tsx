import { useEffect, useState, useMemo, useRef } from "react";
import { useMachine } from "@xstate/react";
import { evaluationMachine } from "./machine/evaluationMachine";
import { bundledPack } from "./content/bundledPack";
import type { QuestionPack } from "./domain/pack";
// v3.5: 设计令牌（Phase 0 — 全引擎共享视觉变量）
import "./design-tokens.css";
import {
  commitSession,
  getMe,
  getInterview,
  logout,
  saveInterview,
  ApiError,
  type Me,
  type SessionStartResult,
  type CommitResult,
  type CommitPayload,
} from "./api/client";
import { enqueueCommit, flushCommits } from "./offline/commitQueue";
import { SetupScreen } from "./ui/SetupScreen";
import { LoginScreen } from "./ui/LoginScreen";
import { LikertScreen } from "./ui/LikertScreen";
import { FullLikertScreen } from "./ui/FullLikertScreen";
import { ProfileView } from "./ui/ProfileView";
import { TypeCodeCard } from "./ui/TypeCodeCard";
import { ProbeDialog, type ProbeReactionOut } from "./ui/ProbeDialog";
import { DoneScreen } from "./ui/DoneScreen";
import { CompletionReportScreen } from "./ui/CompletionReportScreen";
import { ConsolePage } from "./ui/ConsolePage";
import { StyleResultScreen, type FeedbackChoice } from "./ui/StyleResultScreen";
import { InterviewScreen, type InterviewSession } from "./ui/InterviewScreen";
// v3.6: 开场介绍页（被访者向）
import { OpeningIntroScreen } from "./ui/OpeningIntroScreen";
// v3.4: 三种界面状态 + 数据导出
import { PreparingScreen } from "./ui/PreparingScreen";
import { ReviewScreen } from "./ui/ReviewScreen";
import { ExportDialog } from "./ui/ExportDialog";
import { exportData, type ExportData, type ExportFormat } from "./utils/dataExport";
import { exportInterviewPDF } from "./utils/interviewPDF";
import { aggregateRuleStats } from "./domain/crossQuestionEngine";
import { matchAllRepliesAgainstRules } from "./domain/crossQuestionEngine";
import type { ThoughtBubble } from "./ui/ThoughtBubblePanel";
import { classifyStyleV3, type StyleProfileV3, getJourneyForStyle } from "./domain/styleClassifier";
// v3.11 事故 1 修复：会话持久化（刷新恢复）+ 草稿清空
import { clearSession, loadSession, saveSession, loadSimpleResponses, saveSimpleResponses } from "./utils/sessionStore";
import {
  clearDraft,
  flushAllDrafts,
  readDraft,
  writeDraft,
} from "./utils/persistDraft";
import { InterviewGuard } from "./utils/errorBoundary";
import {
  recordsToInterviewSession,
  recordToInterviewRecord,
  snapshotToStyleProfile,
} from "./utils/interviewRestore";

// ============================================================================
// ALIS 采集流程（v2.0 双模式）。
// 简单模式（师门新设计）：15 题整体展示 → 风格结果 → 访谈记录（6 阶段认知旅程）
// 详细模式（v1.0 保留）：逐题 Likert → 连续剖面+字母码 → 单题追问 → 落库
// 铁律：两模式共享同一份 YAML 题库、同一个评分内核、同一套后端 API。
// ============================================================================
type Phase =
  | "answering"
  | "style-result"
  | "interview"
  | "expose"
  | "probe"
  | "reveal"
  | "committing"
  | "done";

export type AppMode = "simple" | "detailed";

export default function App() {
  const [session, setSession] = useState<{ res: SessionStartResult; facilitatorId: string } | null>(
    null,
  );
  const [showConsole, setShowConsole] = useState(false);
  const [me, setMe] = useState<Me | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [mode, setMode] = useState<AppMode>("simple"); // 默认简单模式（师门新设计）

  // v3.11 事故 1 修复：刷新后恢复会话（跳过 SetupScreen 直入访谈）。
  // session/sessionId 原只在内存——刷新即回 SetupScreen 需重走同意+开题。
  const [restoredSession, setRestoredSession] = useState<{ res: SessionStartResult; facilitatorId: string } | null>(null);

  // 启动即查登录态：未登录（401）→ 显示登录页；已登录 → 进入采集端。
  useEffect(() => {
    let alive = true;
    getMe()
      .then((m) => {
        if (!alive) return;
        setMe(m);
        // 已登录 → 尝试恢复上次会话（localStorage，7 天 TTL）
        if (m) {
          const stored = loadSession();
          if (stored) {
            setRestoredSession({
              res: {
                session_id: stored.session_id,
                condition: stored.condition as "exposed" | "control",
                scale_version: stored.scale_version ?? "2.2-draft",
              },
              facilitatorId: stored.facilitator_id,
            });
            setMode(stored.mode);
          }
        }
      })
      .catch(() => alive && setMe(null))
      .finally(() => alive && setAuthLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // PWA 离线回传：登录后才重放暂存的 commit（未登录重放会 401，数据仍保留不丢）。
  useEffect(() => {
    if (!me) return;
    const doFlush = () => {
      void flushCommits((p) => commitSession(p).then(() => undefined));
    };
    doFlush();
    window.addEventListener("online", doFlush);
    return () => window.removeEventListener("online", doFlush);
  }, [me]);

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // 忽略登出网络错误，本地照常清态
    }
    setSession(null);
    setRestoredSession(null);
    setShowConsole(false);
    setMode("simple");
    setMe(null);
    clearSession(); // v3.11: 清除持久化会话（防下次登录误恢复）
  }

  // 启动校验登录态：spinner。
  if (authLoading) {
    return (
      <div className="app">
        <div className="card muted">正在校验登录状态…</div>
      </div>
    );
  }

  // 未登录 → 全屏登录页（自带全视口居中布局，独占屏幕，点击网站即达）。
  if (!me) {
    return <LoginScreen onAuthed={setMe} />;
  }

  // 已登录 → 采集端 / 控制台。
  // v3.5: interview 阶段全宽（认知地图 1400px vs 默认 720px）。
  // .app--fullwidth 通过 flex 列布局实现视口锁定，无需 body class。
  const isFullWidth = session !== null && !showConsole;
  return (
    <div className={`app${isFullWidth ? " app--fullwidth" : ""}`}>
      <div className="brand row spread" style={isFullWidth ? { maxWidth: 1400, margin: "0 auto", width: "100%" } : undefined}>
        <div className="row" style={{ gap: 10, alignItems: "baseline" }}>
          <h1>ALIS</h1>
          <span className="ver">AI 素养情境化访谈 · 采集端</span>
        </div>
        <div className="row" style={{ gap: 8, alignItems: "center" }}>
          {/* 控制台仅管理员可见（含全量数据与导出） */}
          {!session && me.role === "admin" && (
            <button className="ghost small" onClick={() => setShowConsole((v) => !v)}>
              {showConsole ? "采集端" : "促进者控制台"}
            </button>
          )}
          <span className="muted small">
            {me.role === "admin" ? "管理员" : "促进者"}·{me.username}
          </span>
          <button className="ghost small" onClick={handleLogout}>
            退出登录
          </button>
        </div>
      </div>

      {showConsole && !session ? (
        <ConsolePage onBack={() => setShowConsole(false)} />
      ) : !session && !restoredSession ? (
        <SetupScreen
          facilitatorId={me.username}
          mode={mode}
          onModeChange={setMode}
          onStarted={(res, facilitatorId) => {
            // v3.11: 持久化会话（刷新恢复），并清空旧会话的作答暂存
            setSession({ res, facilitatorId });
            saveSession({
              session_id: res.session_id,
              facilitator_id: facilitatorId,
              condition: res.condition,
              mode,
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });
          }}
        />
      ) : (
        <Interview
          key={(session ?? restoredSession)!.res.session_id}
          pack={bundledPack}
          sessionId={(session ?? restoredSession)!.res.session_id}
          facilitatorId={(session ?? restoredSession)!.facilitatorId}
          condition={(session ?? restoredSession)!.res.condition}
          mode={mode}
          onRestart={() => {
            setSession(null);
            setRestoredSession(null);
            clearSession(); // v3.11: 新访谈 → 清除旧会话持久化
          }}
        />
      )}
    </div>
  );
}

// v3.4: 从 localStorage 加载思维气泡（精确 session 匹配）
function loadBubblesFromStorage(sessionId: string): ThoughtBubble[] {
  try {
    const raw = localStorage.getItem(`alis_bubbles_${sessionId}`);
    if (raw) return JSON.parse(raw) as ThoughtBubble[];
    return [];
  } catch {
    return [];
  }
}

function Interview({
  pack,
  sessionId,
  facilitatorId,
  condition,
  mode,
  onRestart,
}: {
  pack: QuestionPack;
  sessionId: string;
  facilitatorId: string;
  condition: "exposed" | "control";
  mode: AppMode;
  onRestart: () => void;
}) {
  // ---- 共享状态（详细模式） ----
  const [snap, send] = useMachine(evaluationMachine, {
    input: { sessionId, facilitatorId, pack },
  });
  const [answeredAt, setAnsweredAt] = useState<Record<string, string>>({});
  const [reaction, setReaction] = useState<ProbeReactionOut | null>(null);
  const [label, setLabel] = useState("");
  const [commit, setCommit] = useState<CommitResult | null>(null);
  const [queued, setQueued] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // ---- 共享状态（简单模式） ----
  const [simpleResponses, setSimpleResponses] = useState<Record<string, number>>({});
  const [styleResult, setStyleResult] = useState<StyleProfileV3 | null>(null);
  const [feedbackChoice, setFeedbackChoice] = useState<FeedbackChoice>(null);
  const [reflectionText, setReflectionText] = useState("");
  const [interviewSession, setInterviewSession] = useState<InterviewSession | null>(null);
  // v3.6: 开场介绍页（被访者向，在15题之前展示）
  const [showOpeningIntro, setShowOpeningIntro] = useState(true);
  // v3.11 事故 1 修复：保存状态（已保存/失败）+ 串行保存链 + 刷新恢复门
  const [saveState, setSaveState] = useState<{ status: "idle" | "saved" | "error"; at: Date | null }>({
    status: "idle",
    at: null,
  });
  const saveChain = useRef(Promise.resolve());
  const [restoreState, setRestoreState] = useState<"idle" | "loading" | "done">("idle");

  // A3 v3.11 泛化：草稿恢复——挂载时 + 恢复在线时自动重传（localStorage 跨会话，
  // 替代原 sessionStorage 单键；旧 alis_interview_* 键由 persistDraft 兼容迁移）。
  useEffect(() => {
    if (restoreState !== "done") return;
    const flushDrafts = () => {
      void flushAllDrafts((p) =>
        saveInterview(p as unknown as Parameters<typeof saveInterview>[0]).then(() => undefined),
      );
    };
    flushDrafts();
    window.addEventListener("online", flushDrafts);
    return () => window.removeEventListener("online", flushDrafts);
  }, [sessionId, restoreState]);

  // v3.11 恢复闭环：挂载时 getInterview 回填（后端为权威源——刷新不丢记录）。
  useEffect(() => {
    if (mode !== "simple") return;
    let alive = true;
    setRestoreState("loading");
    // 先回显本地作答快照（等 GET 覆盖）
    const localResponses = loadSimpleResponses(sessionId);
    if (localResponses) {
      setSimpleResponses((prev) => ({ ...localResponses, ...prev }));
    }
    getInterview(sessionId)
      .then((data) => {
        if (!alive) return;
        const restored = snapshotToStyleProfile(data.style_snapshot as never);
        if (restored) setStyleResult(restored);
        if (data.records.length > 0) {
          const prof = restored ?? styleResult;
          if (prof) {
            setInterviewSession(
              recordsToInterviewSession(
                data.records as never,
                prof,
                data.current_stage,
                data.completed_stages,
              ),
            );
          }
          setFeedbackChoice((data.style_snapshot?.feedbackChoice as FeedbackChoice) ?? null);
          setReflectionText(data.style_snapshot?.reflectionText ?? "");
        } else {
          // v3.12：后端无记录 → 读本地草稿兜底（前代码注释声称有此逻辑但从未实现）
          const draft = readDraft(sessionId);
          if (draft && draft.records && draft.records.length > 0) {
            const sr = draft.style_result as Record<string, unknown> | undefined;
            const prof = snapshotToStyleProfile({
              styleId: sr?.styleId,
              confidence: sr?.confidence,
              dimensionScores: sr?.dimensionScores,
            } as never) ?? styleResult;
            if (prof) {
              // draft records 使用 InterviewRecordIn 格式（与 save payload 一致）
              type DR = Record<string, unknown>;
              setInterviewSession(
                recordsToInterviewSession(
                  (draft.records as DR[]).map((r: DR) => ({
                    stage_id: (r.stage_id ?? r.stageId) as number,
                    question_id: (r.question_id ?? r.questionId ?? null) as string | null,
                    follow_up_id: (r.follow_up_id ?? r.followUpId ?? null) as string | null,
                    contradiction_id: (r.contradiction_id ?? r.contradictionId ?? null) as string | null,
                    interviewer_note: (r.interviewer_note ?? r.interviewerNote ?? "") as string,
                    respondent_reply: (r.respondent_reply ?? r.respondentReply ?? "") as string,
                    recorded_at: (r.recorded_at ?? r.recordedAt ?? r.timestamp ?? new Date().toISOString()) as string,
                  })),
                  prof,
                  (draft.current_stage ?? 1) as number,
                  (draft.completed_stages ?? []) as number[],
                ),
              );
            }
            setFeedbackChoice((draft.feedback_choice as FeedbackChoice) ?? null);
            setReflectionText((draft.reflection_text as string) ?? "");
          }
        }
        if (data.responses) setSimpleResponses(data.responses as Record<string, number>);
      })
      .catch(() => {
        // v3.12：网络失败 → 本地草稿兜底
        const draft = readDraft(sessionId);
        if (draft && draft.records && draft.records.length > 0) {
          const sr = draft.style_result as Record<string, unknown> | undefined;
          const prof = snapshotToStyleProfile({
            styleId: sr?.styleId,
            confidence: sr?.confidence,
            dimensionScores: sr?.dimensionScores,
          } as never) ?? styleResult;
          if (prof) {
            type DR = Record<string, unknown>;
            setInterviewSession(
              recordsToInterviewSession(
                (draft.records as DR[]).map((r: DR) => ({
                  stage_id: (r.stage_id ?? r.stageId) as number,
                  question_id: (r.question_id ?? r.questionId ?? null) as string | null,
                  follow_up_id: (r.follow_up_id ?? r.followUpId ?? null) as string | null,
                  contradiction_id: (r.contradiction_id ?? r.contradictionId ?? null) as string | null,
                  interviewer_note: (r.interviewer_note ?? r.interviewerNote ?? "") as string,
                  respondent_reply: (r.respondent_reply ?? r.respondentReply ?? "") as string,
                  recorded_at: (r.recorded_at ?? r.recordedAt ?? r.timestamp ?? new Date().toISOString()) as string,
                })),
                prof,
                (draft.current_stage ?? 1) as number,
                (draft.completed_stages ?? []) as number[],
              ),
            );
          }
        }
      })
      .finally(() => alive && setRestoreState("done"));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // v3.4: 三种界面状态 + 导出
  const [interviewMode, setInterviewMode] = useState<"preparing" | "interviewing" | "reviewing">("preparing");
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [reviewTriggeredRules, setReviewTriggeredRules] = useState<ReturnType<typeof aggregateRuleStats>>([]);

  // 简单模式的 7 点 Likert pack（覆盖 YAML 中的 6 点配置）
  const simplePack = useMemo<QuestionPack>(() => {
    const likertSimple = (pack as Record<string, unknown>).likert_simple as QuestionPack["likert"] | undefined;
    if (likertSimple) {
      return { ...pack, likert: likertSimple };
    }
    // 兜底：如果 YAML 没有 likert_simple 段，把 6 点扩成 7 点
    return {
      ...pack,
      likert: {
        ...pack.likert,
        max: 7,
        anchor_high: "非常同意（7）",
        labels_zh: {
          1: "非常不同意",
          2: "比较不同意",
          3: "有点不同意",
          4: "中立 / 不确定",
          5: "有点同意",
          6: "比较同意",
          7: "非常同意",
        },
        reference_card_zh: {
          1: "这句几乎完全不符合我",
          2: "多数情况下不符合我",
          3: "偏向不符合，但有例外",
          4: "中立或不确定",
          5: "偏向符合，但不稳定",
          6: "多数情况下符合我",
          7: "这句非常符合我",
        },
      },
    };
  }, [pack]);

  // ---- 共享状态 ----
  const [phase, setPhase] = useState<Phase>("answering");
  const output = snap.status === "done" ? snap.output : null;
  const exposed = condition === "exposed";

  // v3.2 726反馈 Task1: 每次 phase 变化时自动滚动到页面顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [phase]);

  // 详细模式：状态机跑到 done → 下一屏
  useEffect(() => {
    if (output && phase === "answering" && mode === "detailed") {
      setPhase(exposed ? "expose" : "probe");
    }
  }, [output, phase, exposed, mode]);

  // ---- 简单模式处理函数 ----
  function onSimpleAnswer(itemId: string, rawScore: number) {
    setSimpleResponses((m) => {
      const next = { ...m, [itemId]: rawScore };
      // v3.11 修复③: 15 题作答同步写 localStorage（刷新不丢——盲测①发现
      // saveSimpleResponses 无调用者，答完未进访谈即刷新则作答全丢）
      saveSimpleResponses(sessionId, next);
      return next;
    });
    setAnsweredAt((m) => ({ ...m, [itemId]: new Date().toISOString() }));
  }

  function onSimpleLock() {
    // 用V3 3维分类器判定风格
    const result = classifyStyleV3(simpleResponses);
    setStyleResult(result);
    setPhase("style-result");
  }

  function onEnterInterview(feedback: FeedbackChoice, reflection: string) {
    setFeedbackChoice(feedback);
    setReflectionText(reflection);
    setPhase("interview");
  }

  function onInterviewComplete(session: InterviewSession) {
    setInterviewSession(session);
    setPhase("done");
  }

  // v3.4: 进入回顾模式
  function onEnterReview() {
    // 构建回顾所需的跨题规则触发统计
    if (interviewSession) {
      const replies = interviewSession.records
        .filter((r) => r.respondentReply)
        .map((r) => ({ questionId: r.questionId ?? "", text: r.respondentReply }));
      const allTriggered = matchAllRepliesAgainstRules(replies);
      setReviewTriggeredRules(aggregateRuleStats(allTriggered));
    }
    setInterviewMode("reviewing");
  }

  // v3.4: 构建导出数据
  function buildExportData(): ExportData | null {
    if (!interviewSession || !styleResult) return null;
    const bubbles = loadBubblesFromStorage(sessionId);
    return {
      session: interviewSession,
      styleResult,
      responses: simpleResponses,
      bubbles,
      feedbackChoice,
      reflectionText,
      metadata: {
        exportedAt: new Date().toISOString(),
        version: "v3.8",
        facilitatorId,
        sessionId,
      },
    };
  }

  // v3.8: 从题库提取 Q1-Q15 题干（真源=question_pack_v2.1.yaml stem_zh）
  const questionTexts = useMemo(() => {
    const items = bundledPack.items;
    if (!items || items.length === 0) return {};
    const map: Record<string, string> = {};
    for (const item of items) {
      if (item.stem_zh) map[String(item.id)] = item.stem_zh;
    }
    return map;
  }, []);

  function handleExport(format: ExportFormat) {
    const data = buildExportData();
    if (!data) return;
    if (format === "pdf") {
      void exportInterviewPDF({
        ...data,
        questionTexts,
      });
    } else {
      exportData(data, format);
    }
    setShowExportDialog(false);
  }

  // ---- 详细模式处理函数 ----
  function onDetailedAnswer(itemId: string, rawScore: number) {
    setAnsweredAt((m) => ({ ...m, [itemId]: new Date().toISOString() }));
    send({ type: "ANSWER", itemId, rawScore });
  }

  async function doCommit() {
    if (!output) return;
    setPhase("committing");
    setErr(null);
    const targetDim = output.probeTarget.dimensionId;
    const payload: CommitPayload = {
      session_id: sessionId,
      locked_at: output.lockedAt,
      computed_at: new Date().toISOString(),
      responses: Object.entries(snap.context.responses).map(([item_id, raw_score]) => ({
        item_id,
        raw_score,
        answered_at: answeredAt[item_id] ?? output.lockedAt,
      })),
      dimension_scores: output.dimensionScores.map((d) => ({
        dimension_id: d.dimensionId,
        score: d.mean,
      })),
      profiles: output.profile.map((p) => ({
        dimension_id: p.dimensionId,
        percentile: p.percentile,
        ci_low: p.ciLow,
        ci_high: p.ciHigh,
        self_named_label: p.dimensionId === targetDim && label.trim() ? label.trim() : null,
      })),
      reaction: reaction
        ? {
            item_id: reaction.itemId,
            exposed: reaction.exposed,
            express_len: reaction.expressLen,
            emotion_intensity: reaction.emotionIntensity,
          }
        : null,
    };
    try {
      const r = await commitSession(payload);
      setCommit(r);
      setPhase("done");
    } catch (e) {
      if (e instanceof ApiError) {
        setErr(`落库失败 ${e.status}：${e.detail || "无详情"}`);
        setPhase("reveal");
      } else {
        try {
          await enqueueCommit(payload);
          setQueued(true);
          setPhase("done");
        } catch (e2) {
          setErr(`本地暂存也失败：${String(e2)}。请勿关闭页面，恢复网络后再点保存。`);
          setPhase("reveal");
        }
      }
    }
  }

  // ---- 渲染：简单模式 ----
  if (mode === "simple") {
    if (phase === "answering") {
      // v3.6: 被访者开场介绍页（在15题之前）
      if (showOpeningIntro) {
        return (
          <OpeningIntroScreen
            onStart={() => setShowOpeningIntro(false)}
          />
        );
      }
      return (
        <FullLikertScreen
          pack={simplePack}
          responses={simpleResponses}
          onAnswer={onSimpleAnswer}
          onLock={onSimpleLock}
        />
      );
    }

    if (phase === "style-result" && styleResult) {
      return (
        <StyleResultScreen
          styleResult={styleResult}
          onEnterInterview={onEnterInterview}
          onShowDetailProfile={() => {
            // TODO(Step 4): 将简单模式 7 点作答桥接到详细模式 6 点状态机
            // 当前暂不可用——状态机的 isValidAnswer guard 拒绝 7 分值
          }}
          showDetailAvailable={false}
        />
      );
    }

    if (phase === "interview" && styleResult) {
      const journey = getJourneyForStyle(styleResult.typeCode);

      // v3.4: 准备模式
      if (interviewMode === "preparing") {
        return (
          <PreparingScreen
            journey={journey}
            styleResult={styleResult}
            responses={simpleResponses}
            questionTexts={questionTexts}
            sessionId={sessionId}
            onStartInterview={() => setInterviewMode("interviewing")}
          />
        );
      }

      // v3.4: 回顾模式
      if (interviewMode === "reviewing" && interviewSession) {
        const bubbles = loadBubblesFromStorage(sessionId);
        return (
          <ReviewScreen
            session={interviewSession}
            styleResult={styleResult}
            bubbles={bubbles}
            responses={simpleResponses}
            triggeredRules={reviewTriggeredRules}
            onExport={() => setShowExportDialog(true)}
            onBackToInterview={() => setInterviewMode("interviewing")}
            onRestart={onRestart}
          />
        );
      }

      // v3.4: 访谈模式（原有认知地图）
      return (
        <InterviewGuard sessionId={sessionId}>
        <InterviewScreen
          styleResult={styleResult}
          responses={simpleResponses}
          sessionId={sessionId}
          saveState={saveState}
          // v3.11 修复②: 刷新后恢复的记录注入（getInterview 回填的 interviewSession）
          initialRecords={interviewSession?.records}
          onComplete={onInterviewComplete}
          onEnterReview={onEnterReview}
          onSaveProgress={(session) => {
            // v3.11 事故 1 修复：先同步写本机草稿（"最后已知状态"——刷新/卡顿不丢），
            // 再发 POST 后端；成功清除草稿；409（旧包）→ 拉最新对齐。
            // 串行链 saveChain 防并发 POST 乱序（配合后端 updated_at 409 双保险）。
            // v3.12：返回 Promise——epilogue 阻塞式等待保存完成后再展示庆祝弹窗。
            const payload = {
              session_id: sessionId,
              style_result: {
                styleId: styleResult.typeCode,
                confidence: styleResult.typeConfidence,
                dimensionScores: styleResult.dimensions.reduce((acc, d) => {
                  acc[d.dimId] = d.polarity;
                  return acc;
                }, {} as Record<string, number>),
                matchedRules: [styleResult.typeCode],
              },
              feedback_choice: feedbackChoice,
              reflection_text: reflectionText,
              records: session.records.map((r) => ({
                stage_id: r.stageId,
                question_id: r.questionId ?? null,
                follow_up_id: r.followUpId ?? null,
                contradiction_id: r.followUpId?.startsWith("CONTRADICTION_")
                  ? r.followUpId.replace("CONTRADICTION_", "")
                  : null,
                interviewer_note: r.interviewerNote,
                respondent_reply: r.respondentReply,
                recorded_at: r.timestamp,
              })),
              current_stage: session.currentStage,
              completed_stages: session.completedStages,
              responses: simpleResponses,
              updated_at: new Date().toISOString(),
            };
            // 1) 同步写草稿（先于一切，防卡顿刷新丢失）
            writeDraft({ v: 1, savedAt: new Date().toISOString(), ...payload } as never);
            // 2) 串行 POST（防并发乱序），返回 Promise 供调用方 await
            const task = saveChain.current.then(async () => {
              try {
                await saveInterview(payload as Parameters<typeof saveInterview>[0]);
                clearDraft(sessionId);
                setSaveState({ status: "saved", at: new Date() });
              } catch (e) {
                if (e instanceof ApiError && e.status === 409) {
                  try {
                    const latest = await getInterview(sessionId);
                    if (latest.records.length > 0) {
                      setInterviewSession((prev) =>
                        prev ? { ...prev, records: latest.records.map(recordToInterviewRecord) } : prev,
                      );
                    }
                  } catch {
                    /* 拉取失败保留草稿待重试 */
                  }
                  setSaveState({ status: "error", at: new Date() });
                } else {
                  setSaveState({ status: "error", at: new Date() });
                }
              }
            });
            saveChain.current = task;
            return task; // v3.12：返回 Promise 供 epilogue await
          }}
        />
        </InterviewGuard>
      );
    }

    if (phase === "done" && interviewSession && styleResult) {
      const bubbles = loadBubblesFromStorage(sessionId);
      return (
        <InterviewGuard sessionId={sessionId}>
        <CompletionReportScreen
          styleResult={styleResult}
          responses={simpleResponses}
          questionTexts={questionTexts}
          session={interviewSession}
          bubbles={bubbles}
          feedbackChoice={feedbackChoice}
          reflectionText={reflectionText}
          facilitatorId={facilitatorId}
          sessionId={sessionId}
          onRestart={onRestart}
        />
        </InterviewGuard>
      );
    }

    return <div className="card muted">正在加载…</div>;
  }

  // ---- 渲染：详细模式（v1.0 保留） ----
  if (phase === "answering") {
    return (
      <LikertScreen
        pack={pack}
        responses={snap.context.responses}
        onAnswer={onDetailedAnswer}
        onLock={() => send({ type: "LOCK" })}
      />
    );
  }

  if (!output) return <div className="card muted">正在计算…</div>;

  if (phase === "expose") {
    return (
      <>
        <ProfileView
          pack={pack}
          profile={output.profile}
          targetDimensionId={output.probeTarget.dimensionId}
          showLong={false}
        />
        <TypeCodeCard pack={pack} profile={output.profile} />
        <div className="card">
          <p className="muted small">
            接下来，我们就上面标出的那一维，聊聊你选择背后的一段具体经历。
          </p>
          <button className="primary" onClick={() => setPhase("probe")}>
            开始追问
          </button>
        </div>
      </>
    );
  }

  if (phase === "probe") {
    return (
      <ProbeDialog
        sessionId={sessionId}
        pack={pack}
        target={output.probeTarget}
        exposed={exposed}
        onDone={(r) => {
          setReaction(r);
          setPhase("reveal");
        }}
      />
    );
  }

  if (phase === "reveal" || phase === "committing") {
    return (
      <>
        <ProfileView
          pack={pack}
          profile={output.profile}
          targetDimensionId={output.probeTarget.dimensionId}
          showLong={true}
        />
        <TypeCodeCard pack={pack} profile={output.profile} />
        <div className="card">
          <label className="field" htmlFor="label">
            给这一维起个属于你自己的名字（可选）
          </label>
          <input
            id="label"
            type="text"
            placeholder="例如：谨慎的尝鲜者"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          {err && <div className="error">{err}</div>}
          <div className="row" style={{ marginTop: 16 }}>
            <button className="primary" disabled={phase === "committing"} onClick={doCommit}>
              {phase === "committing" ? "正在保存…" : "完成并保存"}
            </button>
          </div>
        </div>
      </>
    );
  }

  return <DoneScreen commit={commit} queued={queued} onRestart={onRestart} />;
}
