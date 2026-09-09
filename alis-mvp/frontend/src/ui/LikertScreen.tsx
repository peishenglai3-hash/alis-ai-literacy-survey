import { useState } from "react";
import type { QuestionPack } from "../domain/pack";

// 15 题 Likert 作答（测量阶段）。逐题呈现，鼓励受访者停下想具体场景。
// 阶段隔离：本屏绝不显示任何评分/剖面；答齐 15 题后才允许"锁定"进入反馈。
// 锁定前可回看修改；锁定后（由父层驱动状态机）作答冻结。
export function LikertScreen({
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
  const items = pack.items;
  const [idx, setIdx] = useState(0);
  const item = items[idx];
  const total = items.length;
  const answeredCount = items.filter((it) => it.id in responses).length;
  const allAnswered = answeredCount === total;
  const { min, max, anchor_low, anchor_high, labels_zh, reference_card_zh } = pack.likert;
  const scale: number[] = [];
  for (let v = min; v <= max; v++) scale.push(v);
  const hasLabels = !!labels_zh;
  const hasCard = !!reference_card_zh;

  if (!item) return null;
  const current = responses[item.id];

  function pick(v: number) {
    if (!item) return;
    onAnswer(item.id, v);
    // 轻量自动前进：答完不是最后一题就跳下一题，保持节奏
    if (idx < total - 1) setTimeout(() => setIdx((i) => Math.min(i + 1, total - 1)), 180);
  }

  return (
    <div className="card">
      <div className="row spread small muted">
        <span>
          第 {idx + 1} / {total} 题
        </span>
        <span>已答 {answeredCount} / {total}</span>
      </div>
      <div className="progress">
        <span style={{ width: `${(answeredCount / total) * 100}%` }} />
      </div>

      <div className="stem">{item.stem_zh}</div>

      {/* 全标注等距锚点（点3）：每个选项有数字 + 词标，减少"1~7 分模糊"。 */}
      <div className={hasLabels ? "likert labeled" : "likert"} role="radiogroup" aria-label="认同程度">
        {scale.map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={current === v}
            aria-pressed={current === v}
            aria-label={labels_zh?.[v] ? `${v} ${labels_zh[v]}` : String(v)}
            onClick={() => pick(v)}
          >
            <span className="lk-num">{v}</span>
            {labels_zh?.[v] && <span className="lk-label">{labels_zh[v]}</span>}
          </button>
        ))}
      </div>
      <div className="anchors">
        <span>{anchor_low ?? `${min} 完全不同意`}</span>
        <span>{anchor_high ?? `${max} 完全同意`}</span>
      </div>

      {/* 校准参照卡（点3）：受访者/促进者可展开对齐尺度，进一步压缩各人尺度差异。 */}
      {hasCard && (
        <details className="refcard">
          <summary className="muted small">查看每个选项的含义（校准参照卡）</summary>
          <ul>
            {scale.map((v) => (
              <li key={v} className="small">
                <b>
                  {v} {labels_zh?.[v] ?? ""}
                </b>
                　{reference_card_zh?.[v]}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="row spread" style={{ marginTop: 20 }}>
        <button className="ghost" disabled={idx === 0} onClick={() => setIdx((i) => Math.max(0, i - 1))}>
          ← 上一题
        </button>
        {idx < total - 1 ? (
          <button className="ghost" onClick={() => setIdx((i) => Math.min(total - 1, i + 1))}>
            下一题 →
          </button>
        ) : (
          <button className="primary" disabled={!allAnswered} onClick={onLock}>
            {allAnswered ? "完成作答并查看" : `还有 ${total - answeredCount} 题未答`}
          </button>
        )}
      </div>
    </div>
  );
}
