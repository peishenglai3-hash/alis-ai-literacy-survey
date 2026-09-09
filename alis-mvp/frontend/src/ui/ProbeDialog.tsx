import { useEffect, useRef, useState } from "react";
import type { QuestionPack } from "../domain/pack";
import type { ProbeTarget } from "../types";
import { renderProbe, ApiError, type RenderProbeResult } from "../api/client";
import { Recorder, type AudioCapture } from "./Recorder";

// 单题追问对话。target 由 S2 状态机定死；本屏只把它发给后端 S3 渲染一句自然追问。
// 铁律：前端不决定问哪题；后端不改选题/分支；LLM 失败则回退骨架（fallback 标注）。
export interface ProbeReactionOut {
  itemId: string;
  exposed: boolean;
  expressLen: number | null;
  emotionIntensity: number | null;
  audio: AudioCapture | null;
}

export function ProbeDialog({
  sessionId,
  pack,
  target,
  exposed,
  onDone,
}: {
  sessionId: string;
  pack: QuestionPack;
  target: ProbeTarget;
  exposed: boolean;
  onDone: (r: ProbeReactionOut) => void;
}) {
  const [probe, setProbe] = useState<RenderProbeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [emotion, setEmotion] = useState<number | null>(null);
  const audioRef = useRef<AudioCapture | null>(null);

  const item = pack.items.find((i) => i.id === target.itemId);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr(null);
    renderProbe(sessionId, target)
      .then((r) => {
        if (alive) setProbe(r);
      })
      .catch((e) => {
        // 网络/后端不可用：给促进者一个可读的骨架兜底提示，不阻断访谈。
        const msg =
          e instanceof ApiError
            ? `后端 ${e.status}：${e.detail || "无详情"}`
            : `无法连接后端渲染追问（${String(e)}）。可先按题目下方骨架人工追问。`;
        if (alive) setErr(msg);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [sessionId, target]);

  function finish() {
    const trimmed = note.trim();
    onDone({
      itemId: target.itemId,
      exposed,
      expressLen: trimmed.length > 0 ? trimmed.length : null,
      emotionIntensity: emotion,
      audio: audioRef.current,
    });
  }

  const skeleton = item?.probe_tree?.[target.branch];

  return (
    <div className="card">
      <h2>聊聊这一题背后的经历</h2>
      <p className="muted small">题目：{item?.stem_zh}</p>

      {loading && <p className="muted">正在生成追问…</p>}
      {err && <div className="error">{err}</div>}

      {probe && (
        <>
          <div className="probe">{probe.probe_text}</div>
          {probe.fallback && (
            <div className="fallback-note">
              （此为骨架回退文案：LLM 暂不可用或输出异常，追问闭环仍在。可照此人工追问。）
            </div>
          )}
        </>
      )}
      {!probe && !loading && skeleton && (
        <div className="probe">{skeleton.replace(/^.*?追问[:：]\s*/, "")}</div>
      )}

      <label className="field" htmlFor="note">
        受访者叙述要点（促进者记录，可选；也可仅录音）
      </label>
      <textarea
        id="note"
        rows={4}
        placeholder="记下受访者讲到的具体经历、例外、场景切换……"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />

      <label className="field">这段经历讲述时的情绪强度（可选）</label>
      <div className="row">
        {[1, 2, 3, 4, 5, 6, 7].map((v) => (
          <button
            key={v}
            className="ghost"
            aria-pressed={emotion === v}
            style={emotion === v ? { background: "var(--accent)", color: "#fff" } : undefined}
            onClick={() => setEmotion(v)}
          >
            {v}
          </button>
        ))}
        <span className="small muted">1 平静 → 7 强烈</span>
      </div>

      <div style={{ marginTop: 14 }}>
        <Recorder
          sessionId={sessionId}
          targetItemId={target.itemId}
          onCaptured={(a) => {
            audioRef.current = a;
          }}
        />
      </div>

      <div className="row" style={{ marginTop: 20 }}>
        <button className="primary" onClick={finish}>
          完成这段追问
        </button>
        <span className="small muted">
          {exposed ? "（本场：先看相对位置再追问）" : "（本场：先追问，稍后再看相对位置）"}
        </span>
      </div>
    </div>
  );
}
