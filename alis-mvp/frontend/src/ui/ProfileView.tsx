import type { QuestionPack } from "../domain/pack";
import type { DimensionProfile } from "../types";

interface Disclaimer {
  enabled?: boolean;
  short_zh?: string;
  long_zh?: string;
}

// 相对位置剖面（连续，非硬类型）。学术诚实：呈现"量表内相对位置"，非人群百分位。
// 伦理文案（profile_disclaimer）如实说明"不是排名、无好坏"。可高亮被追问的目标维度。
export function ProfileView({
  pack,
  profile,
  targetDimensionId,
  showLong = true,
}: {
  pack: QuestionPack;
  profile: DimensionProfile[];
  targetDimensionId?: string;
  showLong?: boolean;
}) {
  const nameById = new Map(pack.dimensions.map((d) => [d.id, d]));
  const disc = (pack as unknown as { profile_disclaimer?: Disclaimer }).profile_disclaimer ?? {};
  const anyNormed = profile.some((p) => p.normed);

  return (
    <div className="card">
      <h2>你在各维度的相对位置</h2>
      {disc.short_zh && <div className="disclaimer">{disc.short_zh}</div>}

      {profile.map((p) => {
        const dim = nameById.get(p.dimensionId);
        const isTarget = p.dimensionId === targetDimensionId;
        const ciLow = p.ciLow ?? p.percentile;
        const ciHigh = p.ciHigh ?? p.percentile;
        return (
          <div key={p.dimensionId} className={isTarget ? "bar target" : "bar"}>
            <div className="bar-head">
              <span>
                {dim?.name_zh ?? p.dimensionId}
                {isTarget && <span className="muted small">（下面就聊这一维）</span>}
              </span>
              <span className="muted small">相对位置 {Math.round(p.percentile)}</span>
            </div>
            <div className="track" aria-label={`${dim?.name_zh ?? p.dimensionId} 相对位置`}>
              {p.ciEstimable && (
                <div
                  className="ci"
                  style={{ left: `${ciLow}%`, width: `${Math.max(0, ciHigh - ciLow)}%` }}
                />
              )}
              <div className="dot" style={{ left: `${p.percentile}%` }} />
            </div>
          </div>
        );
      })}

      {!anyNormed && (
        <p className="muted small" style={{ marginTop: 12 }}>
          说明：本结果无标准化人群常模，以上为你在本量表 15 题作答内部的相对呈现（占位常模），
          规模化常模将于后续更大样本研究后另行建立。
        </p>
      )}
      {showLong && disc.long_zh && (
        <p className="muted small" style={{ marginTop: 8 }}>
          {disc.long_zh}
        </p>
      )}
    </div>
  );
}
