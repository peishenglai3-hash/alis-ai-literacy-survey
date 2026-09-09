// 后端 API 客户端（S3 追问渲染 + S4 会话建立/整包落库）。
// 基址经 VITE_API_BASE 配置。
//   · 显式设了 VITE_API_BASE → 用它（内网部署可指定采集机 IP）。
//   · 开发（vite :5173）→ 默认打到本机 :8000 后端。
//   · 生产构建（由后端 uvicorn 同源托管 dist）→ 相对路径""＝同源，天然免跨域，
//     局域网上平板访问 http://采集机IP:8000/ 时 API 自动打回同机。
// 铁律：前端只把 S2 定死的 ProbeTarget 发给后端，后端不改选题/分支。
import type { ProbeTarget } from "../types";

const BASE: string =
  (import.meta.env.VITE_API_BASE as string | undefined) ??
  (import.meta.env.DEV ? "http://localhost:8000" : "");

async function postJSON<T>(path: string, body: unknown, signal?: AbortSignal): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include", // 携带会话 Cookie（同源自动带；dev 跨源 5173→8000 靠 CORS allow_credentials）
    body: JSON.stringify(body),
    signal,
  });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    // v3.11: 429 时解析 Retry-After 头（登录页倒计时展示）
    const retryAfter =
      resp.status === 429 ? Number(resp.headers.get("Retry-After")) || null : null;
    throw new ApiError(resp.status, detail, retryAfter);
  }
  return (await resp.json()) as T;
}

async function getJSON<T>(path: string): Promise<T> {
  const resp = await fetch(`${BASE}${path}`, { credentials: "include" });
  if (!resp.ok) {
    const detail = await resp.text().catch(() => "");
    const retryAfter =
      resp.status === 429 ? Number(resp.headers.get("Retry-After")) || null : null;
    throw new ApiError(resp.status, detail, retryAfter);
  }
  return (await resp.json()) as T;
}

/** 导出 CSV 的下载地址（浏览器直接 <a download> 即可，带 utf-8-sig BOM）。 */
export function exportUrl(kind: "wide" | "long"): string {
  return `${BASE}/export/${kind}.csv`;
}

/** 完整交付包（单个 ZIP：宽/长表 + 数据字典 + 统计 + README），供内网/U 盘一次性取走。 */
export function bundleUrl(): string {
  return `${BASE}/export/bundle.zip`;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public detail: string,
    public retryAfter: number | null = null, // v3.11: 429 时解析 Retry-After 头
  ) {
    super(`API ${status}: ${detail}`);
    this.name = "ApiError";
  }

  /** v3.12：是否可重试（网络/超时/5xx/429）—— 4xx（除 429）为客户端错误，不重试 */
  get retryable(): boolean {
    return this.status >= 500 || this.status === 429 || this.status === 0;
  }
}

// ============================================================================
// v3.12 网络层加固：超时 + 退避重试
// ============================================================================

/** v3.12 盲测修复：自定义超时错误——区分超时 abort 与用户 abort，确保超时可重试。 */
class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Request timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

/** 带超时的 fetch。超时时抛 TimeoutError（可重试），外部 AbortSignal abort 时抛 AbortError（不可重试）。 */
function fetchWithTimeout(
  url: string,
  init: RequestInit & { timeoutMs?: number },
  timeoutMs = 8000,
): { respPromise: Promise<Response>; ctrl: AbortController } {
  const ctrl = new AbortController();
  const existingSignal = init.signal;
  if (existingSignal) {
    existingSignal.addEventListener("abort", () => ctrl.abort());
  }
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => {
      ctrl.abort(); // 取消底层 fetch
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs),
  );
  const respPromise = Promise.race([
    fetch(url, { ...init, signal: ctrl.signal }),
    timeoutPromise,
  ]);
  return { respPromise, ctrl };
}

function isRetryableError(e: unknown): boolean {
  if (e instanceof TimeoutError) return true; // 超时可重试
  if (e instanceof ApiError) return e.retryable;
  if (e instanceof DOMException && e.name === "AbortError") return false; // 用户取消/卸载不重试
  return true; // TypeError（网络断开）等可重试
}

/** 指数退避重试（1s/2s 封顶，maxRetries=2）。 */
async function retryWithBackoff<T>(
  fn: (attempt: number, signal: AbortSignal) => Promise<T>,
  maxRetries = 2,
): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt, new AbortController().signal);
    } catch (e) {
      lastErr = e;
      if (!isRetryableError(e)) throw e;
      if (attempt < maxRetries) {
        await new Promise((r) =>
          setTimeout(r, Math.min(1000 * 2 ** attempt, 4000)),
        );
      }
    }
  }
  throw lastErr;
}

export type Condition = "exposed" | "control";

export interface SessionStartResult {
  session_id: string;
  condition: Condition;
  scale_version: string;
}

export function startSession(input: {
  facilitator_id?: string; // 服务端用登录账号权威覆盖，前端传值仅作展示/兼容
  age_screen_pass: boolean;
  consent_ref?: string | null;
}): Promise<SessionStartResult> {
  return postJSON<SessionStartResult>("/session/start", {
    facilitator_id: input.facilitator_id ?? null,
    age_screen_pass: input.age_screen_pass,
    consent_ref: input.consent_ref ?? null,
    started_at: new Date().toISOString(),
  });
}

// ------------------------- 账号认证（管理员/促进者两级） -------------------------
export type Role = "admin" | "facilitator";

export interface Me {
  id: string;
  username: string;
  role: Role;
  display_name: string | null;
}

/** 登录：成功后服务端下发 HttpOnly 会话 Cookie；后续请求自动携带。 */
export function login(username: string, password: string): Promise<Me> {
  return postJSON<Me>("/auth/login", { username, password });
}

/** 登出：撤销当前会话并清除 Cookie。 */
export function logout(): Promise<{ ok: boolean }> {
  return postJSON<{ ok: boolean }>("/auth/logout", {});
}

/** 取当前登录态：未登录（401）返回 null，供 App 决定登录页 vs 采集端。 */
export async function getMe(): Promise<Me | null> {
  try {
    return await getJSON<Me>("/auth/me");
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) return null;
    throw e;
  }
}

export interface RenderProbeResult {
  probe_text: string;
  target_item_id: string;
  branch: string;
  model: string;
  fallback: boolean;
}

export function renderProbe(sessionId: string, target: ProbeTarget): Promise<RenderProbeResult> {
  // 只发结构化选择器（itemId + 分支 + 分值）；自然语言由后端注入理论包后渲染。
  return postJSON<RenderProbeResult>("/probe/render", {
    session_id: sessionId,
    asked_at: new Date().toISOString(),
    persist: true,
    target: {
      item_id: target.itemId,
      dimension_id: target.dimensionId,
      branch: target.branch,
      raw_score: target.rawScore,
      effective_score: target.effectiveScore,
    },
  });
}

export interface CommitPayload {
  session_id: string;
  locked_at: string;
  computed_at: string;
  responses: Array<{ item_id: string; raw_score: number; answered_at: string }>;
  dimension_scores: Array<{ dimension_id: string; score: number }>;
  profiles: Array<{
    dimension_id: string;
    percentile: number;
    ci_low: number | null;
    ci_high: number | null;
    self_named_label: string | null;
  }>;
  reaction: {
    item_id: string;
    exposed: boolean;
    express_len: number | null;
    emotion_intensity: number | null;
  } | null;
}

export interface CommitResult {
  session_id: string;
  n_responses: number;
  n_dimension_scores: number;
  n_profiles: number;
  reaction_saved: boolean;
}

export function commitSession(payload: CommitPayload): Promise<CommitResult> {
  return postJSON<CommitResult>("/session/commit", payload);
}

// ------------------------- S5 促进者控制台 -------------------------
export interface SessionSummary {
  session_id: string;
  facilitator_id: string;
  started_at: string | null;
  condition: Condition;
  n_responses: number;
  committed: boolean;
  has_reaction: boolean;
  n_narratives: number;
}

export interface SessionsList {
  count: number;
  sessions: SessionSummary[];
}

export function listSessions(): Promise<SessionsList> {
  return getJSON<SessionsList>("/sessions");
}

export interface Stats {
  n_sessions: number;
  by_condition: { exposed: number; control: number };
  n_reactions: number;
  express_len_mean: { exposed: number | null; control: number | null };
  express_len_n: { exposed: number; control: number };
}

export function getStats(): Promise<Stats> {
  return getJSON<Stats>("/stats");
}

// ------------------------- v2.0 访谈引擎 持久化 -------------------------
export interface InterviewRecordIn {
  stage_id: number;
  question_id?: string | null;
  follow_up_id?: string | null;
  contradiction_id?: string | null;
  interviewer_note: string;
  respondent_reply: string;
  recorded_at: string;
}

export interface InterviewSavePayload {
  session_id: string;
  style_result: {
    typeCode?: string;
    typeConfidence?: number;
    dimensions?: { id: string; position: string; polarity: number }[];
    matchedRules?: string[];
    // legacy fields (deprecated, kept for backward compat)
    styleId?: string;
    confidence?: number;
    dimensionScores?: Record<string, number>;
  };
  feedback_choice: string | null;
  reflection_text: string | null;
  records: InterviewRecordIn[];
  current_stage: number;
  completed_stages: number[];
}

export interface InterviewSaveResult {
  session_id: string;
  n_records: number;
  current_stage: number;
  completed_stages: number[];
}

export function saveInterview(payload: InterviewSavePayload): Promise<InterviewSaveResult> {
  return postJSON<InterviewSaveResult>("/interview/save", payload);
}

export interface InterviewRecordOut {
  stage_id: number;
  question_id: string | null;
  follow_up_id: string | null;
  contradiction_id: string | null;
  interviewer_note: string;
  respondent_reply: string;
  recorded_at: string | null;
}

export interface InterviewStyleSnapshot {
  styleId: string;
  confidence: number;
  dimensionScores: Record<string, number>;
  feedbackChoice: string | null;
  reflectionText: string | null;
}

export interface InterviewGetResult {
  session_id: string;
  style_snapshot: InterviewStyleSnapshot | null;
  n_records: number;
  records: InterviewRecordOut[];
  // v3.11 恢复闭环：进度位置 + 15 题作答（旧数据为 null/空，前端兜底推导）
  current_stage: number | null;
  completed_stages: number[];
  responses?: Record<string, number> | null;
  updated_at?: string | null;
}

export function getInterview(sessionId: string, signal?: AbortSignal): Promise<InterviewGetResult> {
  // v3.12：8s 超时 + 2 次退避重试（防网络半死挂起恢复回路）
  return retryWithBackoff(
    (_attempt, retrySignal) => {
      const combined = new AbortController();
      if (signal) signal.addEventListener("abort", () => combined.abort());
      retrySignal.addEventListener("abort", () => combined.abort());
      const { respPromise } = fetchWithTimeout(
        `${BASE}/interview/session/${encodeURIComponent(sessionId)}`,
        { credentials: "include", signal: combined.signal },
        8000,
      );
      return respPromise.then((resp) => {
        if (!resp.ok) {
          const retryAfter =
            resp.status === 429 ? Number(resp.headers.get("Retry-After")) || null : null;
          throw new ApiError(resp.status, resp.statusText, retryAfter);
        }
        return resp.json() as Promise<InterviewGetResult>;
      });
    },
    2,
  );
}

// ------------------------- v3.8 Tier 3 LLM 矛盾追问 -------------------------
export interface ContradictionProbeIn {
  session_id: string;
  contradiction_id: string;
  contradiction_type: string;
  question_ids: string[];
  likert_scores: Record<string, number>;
  respondent_replies: Record<string, string>;
  fallback_prompt: string;
}

export interface ContradictionProbeOut {
  personalized_prompt: string;
  model: string;
  fallback: boolean;
}

export function fetchContradictionProbe(
  payload: ContradictionProbeIn,
  signal?: AbortSignal,
): Promise<ContradictionProbeOut> {
  return postJSON<ContradictionProbeOut>("/interview/contradiction-probe", payload, signal);
}
