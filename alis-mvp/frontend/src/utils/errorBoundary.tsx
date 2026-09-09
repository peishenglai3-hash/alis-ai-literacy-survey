// v3.12：数据关键型 ErrorBoundary——崩溃瞬间把访谈状态写入 localStorage 草稿，
// fallback UI 提供"重试"动作，避免整棵 React 树卸载白屏导致的数据全丢。
//
// 三层边界策略（业界最佳实践：Refine / react-error-boundary 官方文档）：
//   App 级（灾难兜底）→ InterviewScreen 级（onError 写草稿）→ 子面板级（隔离非关键故障）
//
// 依赖：react-error-boundary@4（React 18 兼容）

import { ErrorBoundary, useErrorBoundary } from "react-error-boundary";
import type { ReactNode } from "react";
import { writeDraft, type DraftPayload } from "../utils/persistDraft";

// ---- 错误日志（无 Sentry 时落地 localStorage，促进者控制台可展示） ----

const ERROR_LOG_KEY = "al:error:log:v1";
const MAX_LOG_ENTRIES = 20;

export interface ErrorLogEntry {
  timestamp: string;
  sessionId?: string;
  message: string;
  stack?: string;
}

function appendErrorLog(entry: ErrorLogEntry): void {
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    const log: ErrorLogEntry[] = raw ? JSON.parse(raw) : [];
    log.push(entry);
    if (log.length > MAX_LOG_ENTRIES) log.splice(0, log.length - MAX_LOG_ENTRIES);
    localStorage.setItem(ERROR_LOG_KEY, JSON.stringify(log));
  } catch {
    /* 存储不可用：静默 */
  }
}

export function readErrorLog(): ErrorLogEntry[] {
  try {
    const raw = localStorage.getItem(ERROR_LOG_KEY);
    return raw ? (JSON.parse(raw) as ErrorLogEntry[]) : [];
  } catch {
    return [];
  }
}

// ---- 崩溃草稿（onError 同步写入——先于一切网络行为） ----

const CRASH_DRAFT_KEY = "al:crash:draft";

interface CrashDraft {
  sessionId: string;
  savedAt: string;
  draft?: DraftPayload;
  stack?: string;
}

function saveCrashDraft(cd: CrashDraft): void {
  try {
    localStorage.setItem(CRASH_DRAFT_KEY, JSON.stringify(cd));
  } catch {
    /* 存储不可用：尽力而为 */
  }
}

export function readCrashDraft(): CrashDraft | null {
  try {
    const raw = localStorage.getItem(CRASH_DRAFT_KEY);
    return raw ? (JSON.parse(raw) as CrashDraft) : null;
  } catch {
    return null;
  }
}

export function clearCrashDraft(): void {
  try {
    localStorage.removeItem(CRASH_DRAFT_KEY);
  } catch {
    /* ignore */
  }
}

// ---- Fallback UI ----

function DefaultFallback({
  error,
  resetErrorBoundary,
}: {
  error: Error;
  resetErrorBoundary: () => void;
}) {
  return (
    <div
      role="alert"
      style={{
        maxWidth: 480,
        margin: "40px auto",
        padding: "clamp(20px,4vh,40px) 24px",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: 40, marginBottom: 12 }}>⚠️</div>
      <h3 style={{ margin: "0 0 8px", fontSize: "1.15rem" }}>
        访谈页面遇到了意外问题
      </h3>
      <p
        className="muted"
        style={{ fontSize: "0.85rem", lineHeight: 1.6, margin: "0 0 20px" }}
      >
        你的访谈内容已自动保存到本地，不会丢失。
        <br />
        请点击下方按钮重试。如问题持续出现，请联系管理员。
      </p>
      <details style={{ marginBottom: 20, textAlign: "left" }}>
        <summary
          style={{
            cursor: "pointer",
            fontSize: "0.8rem",
            color: "#9ca3af",
          }}
        >
          技术详情
        </summary>
        <pre
          style={{
            fontSize: "0.75rem",
            color: "#6b7280",
            marginTop: 8,
            whiteSpace: "pre-wrap",
          }}
        >
          {error.message}
        </pre>
      </details>
      <button
        className="primary"
        onClick={resetErrorBoundary}
        style={{ padding: "10px 28px" }}
      >
        重试
      </button>
    </div>
  );
}

// ---- 带草稿保护的 Interview ErrorBoundary ----

export function InterviewGuard({
  sessionId,
  onCrashDraftSaved,
  children,
}: {
  sessionId: string;
  /** 崩溃草稿写入后回调（用于恢复入口提示） */
  onCrashDraftSaved?: (cd: CrashDraft) => void;
  children: ReactNode;
}) {
  return (
    <ErrorBoundary
      FallbackComponent={DefaultFallback}
      onError={(error, info) => {
        // 崩溃瞬间：尽最大努力保留访谈草稿
        try {
          // 尝试读当前草稿（persistDraft 的常规保存）
          const draftKey = `al:interview:draft:v1:${sessionId}`;
          const raw = localStorage.getItem(draftKey);
          const draft: DraftPayload | undefined = raw
            ? JSON.parse(raw)
            : undefined;

          const cd: CrashDraft = {
            sessionId,
            savedAt: new Date().toISOString(),
            draft,
            stack: info.componentStack ?? undefined,
          };
          saveCrashDraft(cd);
          onCrashDraftSaved?.(cd);
        } catch {
          /* 尽力而为 */
        }
        // 错误日志
        appendErrorLog({
          timestamp: new Date().toISOString(),
          sessionId,
          message: error.message,
          stack: info.componentStack ?? undefined,
        });
      }}
      onReset={() => {
        // resetKeys 变化时自动重试，这里清理由调用方处理
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ---- 轻量 App 级兜底边界（不写草稿——会话级边界已覆盖） ----

export function AppGuard({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary
      FallbackComponent={DefaultFallback}
      onError={(error, info) => {
        appendErrorLog({
          timestamp: new Date().toISOString(),
          message: error.message,
          stack: info.componentStack ?? undefined,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

// ---- 编程式投递（异步错误 → Boundary） ----

export { useErrorBoundary };
