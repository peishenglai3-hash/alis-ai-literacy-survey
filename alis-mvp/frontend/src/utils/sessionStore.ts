// 会话状态持久化（v3.11 事故 1 修复：刷新后跳过 SetupScreen 直入访谈）。
//
// 问题：session/sessionId 只在 React 内存，刷新即回 SetupScreen 需重走同意+开题。
// 方案：localStorage 跨会话保存（关标签/杀后台不丢），7 天 TTL（跨天重开作废）。

const SESSION_KEY = "al:session:v1";
const SIMPLE_PREFIX = "al:simple-responses:v1:";
const TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 天

export interface StoredSession {
  session_id: string;
  facilitator_id: string;
  condition: string;
  scale_version?: string;
  mode: "simple" | "detailed";
  started_at: string;
  updated_at: string;
}

export function loadSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as Partial<StoredSession>;
    if (typeof s.session_id !== "string" || typeof s.mode !== "string") return null;
    // TTL：超过 7 天作废（防隔日误恢复旧会话）
    const updated = s.updated_at ? new Date(s.updated_at).getTime() : 0;
    if (Number.isFinite(updated) && Date.now() - updated > TTL_MS) {
      clearSession();
      return null;
    }
    return s as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(s: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ ...s, updated_at: new Date().toISOString() }));
  } catch {
    /* 静默 */
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    /* 静默 */
  }
}

export function saveSimpleResponses(sessionId: string, responses: Record<string, number>): void {
  try {
    localStorage.setItem(`${SIMPLE_PREFIX}${sessionId}`, JSON.stringify(responses));
  } catch {
    /* 静默 */
  }
}

export function loadSimpleResponses(sessionId: string): Record<string, number> | null {
  try {
    const raw = localStorage.getItem(`${SIMPLE_PREFIX}${sessionId}`);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as Record<string, number>;
  } catch {
    return null;
  }
}
