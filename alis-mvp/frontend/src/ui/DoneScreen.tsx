import type { CommitResult } from "../api/client";
import type { ReactNode } from "react";

// 收尾页：致谢 + 落库回执 + 促进者提醒（音频另存、转写、认知访谈十分钟）。
// queued=true 表示本次因断网/后端不可达而离线暂存本机，联网后自动回传（点2）。
// v2.0：extraContent 用于简单模式展示访谈摘要。
// v3.4：新增 onExport prop——替换占位文本为实际导出按钮。
export function DoneScreen({
  commit,
  queued = false,
  onRestart,
  onExport,
  extraContent,
}: {
  commit: CommitResult | null;
  queued?: boolean;
  onRestart: () => void;
  /** v3.4: 导出访谈数据 */
  onExport?: () => void;
  extraContent?: ReactNode;
}) {
  return (
    <div className="card">
      <h2>这场访谈到这里，谢谢你</h2>
      <p className="muted">
        你的作答与刚才聊到的经历已记录，用于我们理解人们真实的 AI 使用方式。
        再次说明：结果只反映你自己的倾向差异，没有排名或优劣。
      </p>

      {queued && (
        <div className="offline-banner">
          当前未连上采集后端，本次作答已<strong>离线暂存在本机</strong>，恢复网络后会自动回传。
          促进者请注意：<strong>请勿清除本浏览器数据</strong>，并在联网后到"促进者控制台"确认已回传。
        </div>
      )}

      {commit && (
        <div className="disclaimer">
          已保存：作答 {commit.n_responses} 条 · 维度分 {commit.n_dimension_scores} 条 · 剖面{" "}
          {commit.n_profiles} 条 · 暴露反应 {commit.reaction_saved ? "1" : "0"} 条。
        </div>
      )}

      <div className="muted small" style={{ marginTop: 12 }}>
        促进者请核对：①录音已另存本机并将本地转写；②如安排认知访谈，最后十分钟挑 2-3 题追问“这题你是怎么理解的”；
        ③转写核对后 ≤7 天删除原始音频。
      </div>

      {extraContent}

      {/* v3.4: 数据导出按钮 */}
      {onExport && (
        <div className="row" style={{ marginTop: 18 }}>
          <button className="primary" onClick={onExport}>
            📥 导出访谈数据
          </button>
        </div>
      )}

      <div className="row" style={{ marginTop: 18 }}>
        <button className="ghost" onClick={onRestart}>
          开始下一场访谈
        </button>
      </div>
    </div>
  );
}
