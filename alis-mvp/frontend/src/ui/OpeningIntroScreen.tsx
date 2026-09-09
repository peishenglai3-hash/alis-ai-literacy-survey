// 开场介绍页（v3.6 727反馈2.0 议程6）。
// 来源：727反馈2.0/议程6_引导语与节奏系统_逐点文案.md §①
//
// 时机：访谈开始前，被访者首次接触界面时
// 任务：说明主题、无标准答案、时间预估
// 受众：被访者（第二人称、平视、无术语）
// 去价值化清单已通过（详见议程6逐点文案）

import { GUIDANCE_SCRIPTS } from "../content/guidanceScripts";

export interface OpeningIntroScreenProps {
  onStart: () => void;
}

export function OpeningIntroScreen({ onStart }: OpeningIntroScreenProps) {
  const intro = GUIDANCE_SCRIPTS.intro;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(1200px 600px at 80% -10%, #f6f2ea 0%, transparent 60%)," +
          "radial-gradient(900px 500px at -10% 110%, #eee9df 0%, transparent 55%)," +
          "var(--ds-bg, #efebe3)",
        padding: "32px 16px",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          background: "var(--ds-surface, #fff)",
          borderRadius: "var(--ds-r-card, 14px)",
          padding: "40px 36px",
          boxShadow: "var(--ds-shadow-card)",
          textAlign: "center",
        }}
      >
        {/* 图标 */}
        <div style={{ fontSize: "3rem", marginBottom: 16 }}>🤝</div>

        {/* 标题 */}
        <h1
          style={{
            fontFamily: "var(--ds-serif)",
            fontSize: "26px",
            color: "var(--ds-ink)",
            margin: "0 0 20px",
            fontWeight: 600,
          }}
        >
          {intro.title}
        </h1>

        {/* 正文 */}
        <div
          style={{
            fontSize: "15.5px",
            lineHeight: 1.85,
            color: "var(--ds-ink-2, #4a4754)",
            textAlign: "left",
            whiteSpace: "pre-line",
            marginBottom: 28,
          }}
        >
          {intro.body}
        </div>

        {/* 按钮 */}
        <button
          className="primary"
          onClick={onStart}
          style={{
            padding: "14px 36px",
            fontSize: "1.05rem",
            fontWeight: 600,
            borderRadius: 12,
            border: "none",
            background: "var(--ds-accent, #6957c9)",
            color: "#fff",
            cursor: "pointer",
            fontFamily: "var(--ds-sans)",
            transition: "all 0.15s ease",
          }}
        >
          {intro.button}
        </button>

        {/* 脚注 */}
        <p
          style={{
            marginTop: 18,
            fontSize: "12.5px",
            color: "var(--ds-faint)",
          }}
        >
          你的所有回答将被保密，仅用于学术研究。
        </p>
      </div>
    </div>
  );
}
