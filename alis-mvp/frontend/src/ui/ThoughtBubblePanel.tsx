// 思维气泡面板（v3.5 视觉更新）。
// 来源：727反馈1.0/v3.3认知地图布局_可视化.html（视觉基准）+ 设计系统与全流程布局策略.md
// v3.5 更新：样式迁移至设计令牌（--ds-*），source 驱动配色（preset/cross/ai/manual）。
//
// MVP 设计：
//   - 觉察带内 flow 布局（v3.3 起从 fixed 移入）
//   - 输入框 + Enter 发送气泡
//   - 悬浮气泡队列（显示最新 5 个）
//   - 点击"✓处理"气泡消失
//   - localStorage 持久化（跨阶段保留）
//   - 信号/跨题气泡由外部注入（v3.4）

import { useState, useEffect, useRef } from "react";
import { getBubblePresets } from "../content/crossQuestionLinks";

export interface ThoughtBubble {
  id: string;
  content: string;
  status: "pending" | "processed";
  mode: "deep-listen" | "quick-record";
  createdAt: string;
  processedAt?: string;
  // v3.4 扩展：AI 信号 + 跨题规则气泡字段（可选，向后兼容）
  source?: "manual" | "preset" | "cross_question" | "interviewee_signal";
  targetQuestion?: string;
  matchedKeyword?: string;
  confidence?: "high" | "medium" | "low";
  subtype?: string;
}

interface ThoughtBubblePanelProps {
  sessionId?: string;
  currentStageId?: number;
  currentQuestionId?: string;
  // v3.4: 外部注入的 AI 信号气泡 + 跨题规则气泡
  externalBubbles?: ThoughtBubble[];
}

const STORAGE_KEY_PREFIX = "alis_bubbles_";

function loadBubbles(sessionId: string): ThoughtBubble[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PREFIX + sessionId);
    return raw ? (JSON.parse(raw) as ThoughtBubble[]) : [];
  } catch {
    return [];
  }
}

function saveBubbles(sessionId: string, bubbles: ThoughtBubble[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + sessionId, JSON.stringify(bubbles));
  } catch { /* 静默失败 */ }
}

export function ThoughtBubblePanel({
  sessionId = "default",
  currentStageId,
  currentQuestionId,
  externalBubbles = [],
}: ThoughtBubblePanelProps) {
  const [bubbles, setBubbles] = useState<ThoughtBubble[]>(() => loadBubbles(sessionId));
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"deep-listen" | "quick-record">("quick-record");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // 持久化到 localStorage
  useEffect(() => {
    saveBubbles(sessionId, bubbles);
  }, [bubbles, sessionId]);

  // sessionId 变化时重新加载（跨会话隔离）
  useEffect(() => {
    setBubbles(loadBubbles(sessionId));
  }, [sessionId]);

  // 展开时自动聚焦输入框
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  function addBubble() {
    const content = input.trim();
    if (!content) return;
    const bubble: ThoughtBubble = {
      id: `b_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      content,
      status: "pending",
      mode,
      createdAt: new Date().toISOString(),
      source: "manual",
    };
    setBubbles((prev) => [bubble, ...prev]);
    setInput("");
  }

  function markProcessed(bubbleId: string) {
    setBubbles((prev) =>
      prev.map((b) =>
        b.id === bubbleId
          ? { ...b, status: "processed", processedAt: new Date().toISOString() }
          : b,
      ),
    );
  }

  function removeBubble(bubbleId: string) {
    setBubbles((prev) => prev.filter((b) => b.id !== bubbleId));
  }

  const pendingBubbles = bubbles.filter((b) => b.status === "pending");
  // v3.4: 合并外部气泡（AI信号 + 跨题规则）和手动气泡，按时间排序
  const allBubbles = [...bubbles, ...externalBubbles].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const allPending = allBubbles.filter((b) => b.status === "pending");
  const displayBubbles = allPending.slice(0, 5);
  const processedCount = bubbles.filter((b) => b.status === "processed").length;

  // ---- v3.5: source → 样式映射（匹配 HTML 基准的 .src.* 颜色系统） ----
  function bubbleSourceClass(b: ThoughtBubble): string {
    if (b.source === "interviewee_signal") return "ai";
    if (b.source === "cross_question") return "cross";
    if (b.source === "preset") return "preset";
    return "manual";
  }

  function bubbleSourceLabel(b: ThoughtBubble): string | null {
    if (b.source === "interviewee_signal") {
      const subtypeLabel =
        b.subtype === "hedging" ? "犹豫"
        : b.subtype === "emotion_marker" ? "情绪"
        : b.subtype === "keyword_repetition" ? "重复"
        : "落差";
      return `✦ AI 推测 · ${subtypeLabel}`;
    }
    if (b.source === "cross_question") return `🔗 跨题 · ${b.targetQuestion ?? ""}`;
    if (b.source === "preset") return "🏷 预设 · Schema";
    if (b.source === "manual") return "✎ 手动 · 访谈者";
    return null;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* 标题栏 */}
      <div className="aw-head">
        <h3>💭 想想</h3>
        <span className="cnt">({allPending.length})</span>
      </div>
      <div className="aw-sub">余光可见 · 悬停聚焦 · 单击展开</div>

      {/* 模式切换 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
        <select
          value={mode}
          onChange={(e) => setMode(e.target.value as "deep-listen" | "quick-record")}
          style={{
            fontSize: "11px", padding: "3px 8px",
            border: `1px solid var(--ds-line)`, borderRadius: 6,
            background: "var(--ds-surface, #fff)",
            color: "var(--ds-ink-2)",
            fontFamily: "var(--ds-mono)",
            flex: 1,
          }}
        >
          <option value="quick-record">快速记录</option>
          <option value="deep-listen">深度倾听</option>
        </select>
        {currentStageId && currentQuestionId && (
          <span style={{ fontSize: "10px", color: "var(--ds-faint)", whiteSpace: "nowrap", fontFamily: "var(--ds-mono)" }}>
            阶段{currentStageId} · {currentQuestionId}
          </span>
        )}
      </div>

      {/* 气泡队列（匹配 HTML 基准 .bubble 样式） */}
      {displayBubbles.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 360, overflowY: "auto", marginBottom: 10 }}>
          {displayBubbles.map((b) => {
            const srcClass = bubbleSourceClass(b);
            const srcLabel = bubbleSourceLabel(b);
            const isAi = b.source === "interviewee_signal";

            return (
              <div key={b.id} className="bubble">
                <div className="ts">
                  ⏱ {new Date(b.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <div className="body">
                  {b.mode === "deep-listen" && !isAi && "🤫 "}
                  {b.content}
                </div>
                {srcLabel && (
                  <span className={`src ${srcClass}`}>{srcLabel}</span>
                )}
                {b.source === "cross_question" && b.targetQuestion && (
                  <div className="link">↗ 跳转 {b.targetQuestion}</div>
                )}
                {/* 操作按钮 */}
                <div style={{ display: "flex", gap: 4, justifyContent: "flex-end", marginTop: 4 }}>
                  <button
                    onClick={() => markProcessed(b.id)}
                    style={{
                      fontSize: "10px", padding: "1px 6px",
                      border: `1px solid var(--ds-line)`, borderRadius: 4,
                      background: "transparent", color: "var(--ds-muted)",
                      cursor: "pointer", fontFamily: "var(--ds-mono)",
                    }}
                  >
                    ✓ 处理
                  </button>
                  <button
                    onClick={() => removeBubble(b.id)}
                    style={{
                      fontSize: "10px", padding: "1px 6px",
                      border: "none", borderRadius: 4,
                      background: "transparent", color: "var(--ds-faint)",
                      cursor: "pointer",
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {displayBubbles.length === 0 && (
        <div style={{ padding: "8px 0", textAlign: "center", marginBottom: 10 }}>
          <p style={{ fontSize: "11px", color: "var(--ds-faint)", margin: 0 }}>
            {processedCount > 0
              ? `已处理 ${processedCount} 条想法`
              : "输入你的灵感或想法，回车发送"}
          </p>
        </div>
      )}

      {/* 输入区 */}
      <div style={{ borderTop: `1px solid var(--ds-line-soft)`, paddingTop: 10 }}>
        {/* 预设提示词（快速填入） */}
        {currentQuestionId && !input.trim() && (
          <div style={{ marginBottom: 6, display: "flex", flexWrap: "wrap", gap: 3 }}>
            {getBubblePresets(currentQuestionId).slice(0, 3).map((preset, i) => (
              <button
                key={i}
                onClick={() => setInput(preset)}
                style={{
                  fontSize: "10px", padding: "2px 7px", borderRadius: 8,
                  border: `1px dashed var(--ds-line)`,
                  background: "var(--ds-surface-2, #f6f3ec)",
                  cursor: "pointer", whiteSpace: "nowrap",
                  maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis",
                  color: "var(--ds-ink-2)", fontFamily: "var(--ds-sans)",
                }}
                title={preset}
              >
                💡 {preset}
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={inputRef}
          rows={2}
          placeholder={
            mode === "deep-listen"
              ? "深度倾听：记录洞察..."
              : "快速记录：写下想法..."
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              addBubble();
            }
          }}
          style={{
            width: "100%", padding: "7px 9px", fontSize: "12px",
            border: `1px solid var(--ds-line)`, borderRadius: 7,
            resize: "none", boxSizing: "border-box",
            fontFamily: "var(--ds-sans)", color: "var(--ds-ink)",
            background: "var(--ds-surface, #fff)",
          }}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
          <span style={{ fontSize: "10px", color: "var(--ds-faint)", fontFamily: "var(--ds-mono)" }}>
            Enter 发送 · Shift+Enter 换行
          </span>
          <button
            disabled={!input.trim()}
            onClick={addBubble}
            style={{
              fontSize: "11px", padding: "3px 12px",
              border: `1px solid var(--ds-line)`, borderRadius: 7,
              background: "var(--ds-ink)", color: "#fff",
              cursor: input.trim() ? "pointer" : "not-allowed",
              opacity: input.trim() ? 1 : 0.4,
              fontFamily: "var(--ds-sans)", fontWeight: 500,
            }}
          >
            + 记录
          </button>
        </div>
      </div>
    </div>
  );
}
