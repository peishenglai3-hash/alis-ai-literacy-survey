# ALIS Frontend — 评分内核（S2）

> 逻辑在状态机，LLM 只碰语言。本包只做**确定性评分/剖面/追问目标选择**，不含 UI（UI 留 S4）、不含任何 LLM 调用（语言渲染留 S3）。

## 跑起来
```bash
npm install
npm run typecheck   # tsc --noEmit
npm test            # vitest run（24 用例）
```

## 结构
```
src/
  types.ts                    结构化产出类型（ItemScore/DimensionScore/DimensionProfile/ProbeTarget）
  domain/
    pack.ts                   Question Pack 类型 + 校验 + 派生 ScoringConfig（单一真源=后端 YAML）
    scoring.ts                scoreItem（含反向计分）→ scoreDimensions（维度均值）
    norms.ts                  【可替换扩展点#1】NormStrategy：MVP 占位常模 makeMidpointNorm；明春换 makeSampleNorm
    deviation.ts              【可替换扩展点#2】DeviationStrategy：单题闭环追问目标选择
    util.ts                   round2 / clamp
  machine/
    evaluationMachine.ts      XState v5 评估状态机：eliciting→locked→scoring→profiling→selectingProbe→done
tests/                        24 用例（scoring/deviation/phaseIsolation/machine）
```

## 三条铁律级不变量（有测试守着）
1. **逻辑在状态机**：评分/维度/剖面/追问目标全由确定性纯函数算出；`probeTarget` 只含结构化选择器（itemId + high/low 分支），**无任何自然语言字段**。语言由 S3 的 LLM 按 `probe_tree[branch]` 渲染。
2. **阶段隔离（测量 vs 测试）**：`eliciting` 阶段绝不出剖面；`LOCK` 需 15 题答全并落 `lockedAt`；锁定后作答冻结。→ 受访者看到人格反馈前，Likert 已不可改（对齐 S1 `locked_at`）。
3. **连续剖面非硬类型**：每维产出 `percentile / ciLow / ciHigh`，无 `type` 字段（对齐 S1 `personality_profiles`）。

## 留足可修改空间（本轮部署要求）
- **内容**：题目/维度/反向标记/追问骨架全来自后端 `content/question_pack_v2.1.yaml`，师门 7 月末改 YAML 即可，本层零改动。
- **常模**：`NormStrategy` 可插拔。MVP=占位（`normed:false`），明春 N≥300 实现 `makeSampleNorm()` 换真实百分位。
- **偏离度量**：`DeviationStrategy` 可插拔（默认"总体均值偏离"，可换极端度/维度残差/索引性）。

## 学术诚实点（需师门知会）
- MVP 的 `percentile` 是**量表内相对位置**，不是总体百分位（无常模样本），已用 `normed:false` + `normSource` 标注。
- **D6 仅 Q13 一题**（2b 指出的"因子欠识别"）：单题维度 CI 不可估 → `ciEstimable:false`，剖面照出但明确标记，交师门 7 月末议扩题。
