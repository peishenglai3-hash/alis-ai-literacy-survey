import { useCallback, useRef, useState } from "react";

// 叙事录音 —— 双轨设计（对齐 S0：音频只留本地，绝不上传服务器/入库）。
//   主轨：浏览器 MediaRecorder（需 https 或 localhost + 麦克风权限）。
//   备轨：手动上传外部录音（录音笔/手机），任一环境都能采到叙事。
// 产出仅在本地生成可下载文件；促进者另存后由 S5 汇聚管线登记路径指针。
export interface AudioCapture {
  source: "browser" | "upload";
  filename: string;
  sizeBytes: number;
  url: string; // 本地 objectURL，供试听/下载；不外发
}

type Rec = "idle" | "recording" | "recorded";

export function Recorder({
  sessionId,
  targetItemId,
  onCaptured,
}: {
  sessionId: string;
  targetItemId: string;
  onCaptured: (a: AudioCapture | null) => void;
}) {
  const [state, setState] = useState<Rec>("idle");
  const [err, setErr] = useState<string | null>(null);
  const [capture, setCapture] = useState<AudioCapture | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const suggestName = (ext: string) =>
    `alis_${sessionId.slice(0, 8)}_${targetItemId}_${Date.now()}.${ext}`;

  const publish = useCallback(
    (a: AudioCapture | null) => {
      setCapture(a);
      onCaptured(a);
    },
    [onCaptured],
  );

  async function start() {
    setErr(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setErr("此环境不支持浏览器录音（需 https 或 localhost）。请用下方“上传录音”备轨。");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        stream.getTracks().forEach((t) => t.stop());
        const url = URL.createObjectURL(blob);
        publish({ source: "browser", filename: suggestName("webm"), sizeBytes: blob.size, url });
        setState("recorded");
      };
      mediaRef.current = mr;
      mr.start();
      setState("recording");
    } catch (e) {
      setErr(`无法访问麦克风（${String(e)}）。请检查权限，或用下方“上传录音”备轨。`);
    }
  }

  function stop() {
    mediaRef.current?.stop();
  }

  function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    publish({ source: "upload", filename: file.name, sizeBytes: file.size, url });
    setState("recorded");
  }

  function reset() {
    if (capture) URL.revokeObjectURL(capture.url);
    publish(null);
    setState("idle");
  }

  return (
    <div>
      <label className="field">录音（可选，主轨浏览器 / 备轨上传）</label>
      {err && <div className="error">{err}</div>}

      <div className="row">
        {state !== "recording" && (
          <button className="ghost" onClick={start}>
            ● 开始录音
          </button>
        )}
        {state === "recording" && (
          <button className="primary" onClick={stop}>
            <span className="rec-dot" />
            停止录音
          </button>
        )}
        <span className="small muted">或</span>
        <label className="ghost" style={{ cursor: "pointer" }}>
          上传录音（备轨）
          <input type="file" accept="audio/*" style={{ display: "none" }} onChange={onUpload} />
        </label>
      </div>

      {capture && (
        <div className="small" style={{ marginTop: 10 }}>
          <div className="muted">
            已捕获（{capture.source === "browser" ? "浏览器" : "上传"}）：{capture.filename} ·{" "}
            {(capture.sizeBytes / 1024).toFixed(0)} KB
          </div>
          <audio controls src={capture.url} style={{ width: "100%", marginTop: 6 }} />
          <div className="row" style={{ marginTop: 6 }}>
            <a className="ghost" href={capture.url} download={capture.filename}>
              另存音频文件
            </a>
            <button className="ghost" onClick={reset}>
              重录 / 清除
            </button>
          </div>
          <div className="muted" style={{ marginTop: 6 }}>
            提示：音频仅保存在本机，不会上传服务器。请促进者按流程另存后本地 Whisper 转写，
            转写核对后 ≤7 天删除原始音频。
          </div>
        </div>
      )}
    </div>
  );
}
