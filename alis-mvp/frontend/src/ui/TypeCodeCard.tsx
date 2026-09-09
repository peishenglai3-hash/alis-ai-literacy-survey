import type { QuestionPack } from "../domain/pack";
import type { DimensionProfile } from "../types";
import { deriveTypeCode } from "../domain/typecode";

// 类 MBTI 字母码卡片（点4）。永远与连续剖面 + CI 并排，非硬类型。
// 语言全部来自可编辑 Question Pack（type_code.intro_zh / disclaimer_zh / 极名/释义）；
// 字母由确定性纯函数 deriveTypeCode 派生，本组件只做呈现。
// 小写字母 = 该轴"未分化"（CI 跨切点），如实表达均衡。
export function TypeCodeCard({
  pack,
  profile,
}: {
  pack: QuestionPack;
  profile: DimensionProfile[];
}) {
  const tc = deriveTypeCode(profile, pack.type_code);
  if (!tc || tc.axes.length === 0) return null; // 师门删掉 type_code 段即整卡不出现
  const cfg = pack.type_code!;

  return (
    <div className="card typecode">
      <h2>你的 AI 使用风格速记</h2>
      {cfg.intro_zh && <p className="muted small">{cfg.intro_zh}</p>}

      <div className="tc-code" aria-label={`风格代号 ${tc.code}`}>
        {tc.axes.map((a) => (
          <span
            key={a.axisId}
            className={a.differentiated ? "tc-letter" : "tc-letter undiff"}
            title={`${a.nameZh}：${a.labelZh}${a.glossZh ? "（" + a.glossZh + "）" : ""}`}
          >
            <span className="g">{a.letter}</span>
            <span className="n">{a.differentiated ? a.labelZh : "均衡"}</span>
            <span className="u">{a.nameZh}</span>
          </span>
        ))}
      </div>

      <ul className="tc-axes">
        {tc.axes.map((a) => (
          <li key={a.axisId}>
            {a.nameZh}：
            {a.differentiated ? (
              <>
                <b>{a.labelZh}</b>
                {a.glossZh && <>（{a.glossZh}）</>}
              </>
            ) : (
              <>暂不明显（这方面你比较均衡）</>
            )}
          </li>
        ))}
      </ul>

      {cfg.disclaimer_zh && (
        <p className="muted small" style={{ marginTop: 10 }}>
          {cfg.disclaimer_zh}
        </p>
      )}
    </div>
  );
}
