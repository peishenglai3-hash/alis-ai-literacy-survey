import { useState, useEffect } from "react";
import type { QuestionPack } from "../domain/pack";

// 15 题整体展示（v2.0 访谈引擎——师门新设计）。
// 一次性显示全部 15 题，可滚动，可回看修改，MBTI 式整体自我画像体验。
// 保留逐题模式作为备选（通过 mode prop 切换）。

export function FullLikertScreen({
  pack,
  responses,
  onAnswer,
  onLock,
}: {
  pack: QuestionPack;
  responses: Record<string, number>;
  onAnswer: (itemId: string, rawScore: number) => void;
  onLock: () => void;
}) {
  // v3.2 726反馈 Task1: 进入页面时自动滚动到顶部
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const items = pack.items;
  const total = items.length;
  const answeredCount = items.filter((it) => it.id in responses).length;
  const allAnswered = answeredCount === total;
  const { min, max, anchor_low, anchor_high, labels_zh, reference_card_zh } = pack.likert;
  const scale: number[] = [];
  for (let v = min; v <= max; v++) scale.push(v);
  const hasLabels = !!labels_zh;
  const [showCard, setShowCard] = useState(false);

  // 自动滚动到第一道未答题
  function scrollToFirstUnanswered() {
    const firstUnanswered = items.find((it) => !(it.id in responses));
    if (firstUnanswered) {
      const el = document.getElementById(`question-${firstUnanswered.id}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  return (
    <div className="full-likert-container">
      {/* 顶部固定栏 */}
      <div className="full-likert-header">
        <div className="brand-row">
          <h2>发现你的AI交互类型</h2>
          <span className="muted small">15 个问题 · 没有标准答案，依据你的真实经验选择</span>
        </div>
        <div className="header-actions">
          <div className="progress-summary">
            <span className="progress-count">
              {answeredCount} / {total}
            </span>
            <div className="progress mini">
              <span style={{ width: `${(answeredCount / total) * 100}%` }} />
            </div>
          </div>
          {!allAnswered && (
            <button className="ghost small" onClick={scrollToFirstUnanswered}>
              跳到下一题 ↓
            </button>
          )}
          <button
            className="primary"
            disabled={!allAnswered}
            onClick={onLock}
          >
            {allAnswered ? "查看我的AI交互类型 →" : `还有 ${total - answeredCount} 题未答`}
          </button>
        </div>
      </div>

      {/* 量表说明 */}
      <div className="scale-legend">
        <span className="muted small">{anchor_low ?? `${min} 非常不同意`}</span>
        <div className="scale-pills">
          {scale.map((v) => (
            <span key={v} className="scale-pill">
              <b>{v}</b>
              {hasLabels && labels_zh?.[v] && <span className="pill-label">{labels_zh[v]}</span>}
            </span>
          ))}
        </div>
        <span className="muted small">{anchor_high ?? `${max} 非常同意`}</span>
      </div>

      {/* 校准参照卡（可折叠） */}
      {reference_card_zh && (
        <details className="refcard inline" open={showCard} onToggle={(e) => setShowCard((e.target as HTMLDetailsElement).open)}>
          <summary className="muted small">查看每个选项的详细含义（校准参照卡）</summary>
          <div className="refcard-grid">
            {scale.map((v) => (
              <div key={v} className="refcard-item">
                <b>{v} {labels_zh?.[v] ?? ""}</b>
                <span className="muted">{reference_card_zh?.[v]}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* 15 题列表 */}
      <div className="questions-scroll">
        {items.map((item, idx) => {
          const current = responses[item.id];
          const isAnswered = item.id in responses;
          return (
            <div
              key={item.id}
              id={`question-${item.id}`}
              className={`question-block ${isAnswered ? "answered" : ""}`}
            >
              <div className="question-head">
                <span className="question-num">{idx + 1}</span>
                <span className="question-stem">{item.stem_zh}</span>
                {isAnswered && (
                  <span className="answered-badge" title={`已选：${current}`}>
                    ✓ {labels_zh?.[current ?? 0] ?? current}
                  </span>
                )}
              </div>
              <div
                className={hasLabels ? "likert labeled scroll-likert" : "likert scroll-likert"}
                role="radiogroup"
                aria-label={`第 ${idx + 1} 题`}
              >
                {scale.map((v) => (
                  <button
                    key={v}
                    role="radio"
                    aria-checked={current === v}
                    className={`lk-btn ${current === v ? "selected" : ""}`}
                    onClick={() => onAnswer(item.id, v)}
                  >
                    <span className="lk-num">{v}</span>
                    {hasLabels && labels_zh?.[v] && (
                      <span className="lk-label">{labels_zh[v]}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部提交栏 */}
      <div className="full-likert-footer">
        <span className="muted small">
          {allAnswered
            ? "全部完成！点击下方按钮查看你的AI交互类型。"
            : `已答 ${answeredCount} 题，还有 ${total - answeredCount} 题等待你的选择。`}
        </span>
        <button className="primary large" disabled={!allAnswered} onClick={onLock}>
          {allAnswered ? "查看我的AI交互类型 →" : `还有 ${total - answeredCount} 题未答`}
        </button>
      </div>

      <style>{`
        .full-likert-container {
          max-width: 720px;
          margin: 0 auto;
          padding: 0 16px 120px;
        }
        .full-likert-header {
          position: sticky;
          top: 0;
          z-index: 10;
          background: var(--bg, #fff);
          padding: 16px 0 12px;
          border-bottom: 1px solid var(--border, #e5e7eb);
        }
        .brand-row { margin-bottom: 8px; }
        .brand-row h2 { margin: 0; font-size: 1.25rem; }
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .progress-summary {
          display: flex;
          align-items: center;
          gap: 8px;
          flex: 1;
          min-width: 120px;
        }
        .progress-count { font-weight: 700; font-size: 1.1rem; }
        .progress.mini {
          flex: 1;
          height: 6px;
          background: var(--track, #e5e7eb);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress.mini span {
          display: block;
          height: 100%;
          background: var(--primary, #7c3aed);
          border-radius: 3px;
          transition: width 0.3s ease;
        }
        .scale-legend {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 0;
          flex-wrap: wrap;
        }
        .scale-pills {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .scale-pill {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 4px 8px;
          border-radius: 8px;
          background: var(--surface, #f3f4f6);
          font-size: 0.75rem;
          line-height: 1.2;
        }
        .scale-pill b { font-size: 0.85rem; }
        .pill-label { color: var(--muted, #6b7280); font-size: 0.65rem; }
        .refcard.inline { margin: 0 0 16px; }
        .refcard-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 8px;
          margin-top: 8px;
        }
        .refcard-item {
          padding: 8px;
          background: var(--surface, #f9fafb);
          border-radius: 6px;
          font-size: 0.8rem;
        }
        .refcard-item b { display: block; margin-bottom: 2px; }
        .questions-scroll {
          display: flex;
          flex-direction: column;
          gap: 20px;
          padding-bottom: 40px;
        }
        .question-block {
          padding: 16px;
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 12px;
          transition: border-color 0.2s, background 0.2s;
        }
        .question-block.answered {
          border-color: var(--primary-light, #c4b5fd);
          background: var(--primary-bg, #f5f3ff);
        }
        .question-head {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          margin-bottom: 12px;
        }
        .question-num {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--primary, #7c3aed);
          color: #fff;
          font-weight: 700;
          font-size: 0.85rem;
          flex-shrink: 0;
        }
        .question-block.answered .question-num {
          background: var(--success, #10b981);
        }
        .question-stem { flex: 1; line-height: 1.5; }
        .answered-badge {
          flex-shrink: 0;
          padding: 2px 8px;
          background: var(--success-bg, #d1fae5);
          color: var(--success, #059669);
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: 600;
        }
        .likert.scroll-likert {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }
        .lk-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 10px;
          border: 1.5px solid var(--border, #d1d5db);
          border-radius: 10px;
          background: var(--bg, #fff);
          cursor: pointer;
          transition: all 0.15s;
          min-width: 44px;
        }
        .lk-btn:hover { border-color: var(--primary, #7c3aed); }
        .lk-btn.selected {
          border-color: var(--primary, #7c3aed);
          background: var(--primary, #7c3aed);
          color: #fff;
        }
        .lk-btn.selected .lk-label { color: rgba(255,255,255,0.8); }
        .lk-num { font-weight: 700; font-size: 0.9rem; }
        .lk-label { font-size: 0.65rem; color: var(--muted, #6b7280); }
        .full-likert-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: var(--bg, #fff);
          border-top: 1px solid var(--border, #e5e7eb);
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          z-index: 10;
          flex-wrap: wrap;
        }
        .full-likert-footer .primary.large {
          padding: 10px 24px;
          font-size: 1rem;
        }
      `}</style>
    </div>
  );
}
