// ALIS 评估状态机（S2 核心）—— XState v5。
// ============================================================================
// 铁律：逻辑在状态机，LLM 只碰语言。
//   本状态机不 import 任何 LLM 客户端、不做任何网络/异步调用。
//   评分/维度/剖面/追问目标全由确定性纯函数算出；产出的 probeTarget 只是
//   "选哪题+走哪个骨架分支"的结构化选择器，自然语言由 S3 的 LLM 渲染。
//
// 阶段隔离（测量 vs 测试）：
//   eliciting 阶段只收作答、绝不出剖面；LOCK 需 15 题答全，落 lockedAt 时间戳；
//   锁定后作答被冻结（ANSWER 不再受理），才进入 scoring→profiling→selectingProbe。
//   → 保证受访者看到"人格反馈"之前，其 Likert 作答已不可更改（对齐 S1 的 locked_at）。
//
// 时间戳可注入（clock）：默认取真实时间；测试注入固定时钟以保证可复现（对齐 S1 纪律）。
// ============================================================================
import { setup, assign } from "xstate";
import type { QuestionPack, ScoringConfig } from "../domain/pack";
import { deriveScoringConfig } from "../domain/pack";
import { scoreAllItems, scoreDimensions } from "../domain/scoring";
import { computeProfile, makeMidpointNorm, type NormStrategy } from "../domain/norms";
import { makeDimensionResidualDeviation, type DeviationStrategy } from "../domain/deviation";
import type { ItemScore, DimensionScore, DimensionProfile, ProbeTarget } from "../types";

export interface EvalInput {
  sessionId: string;
  facilitatorId: string;
  pack: QuestionPack;
  clock?: () => string; // 默认真实时间；测试注入固定值
  norm?: NormStrategy; // 默认占位常模；明春换真实常模
  deviation?: DeviationStrategy; // 默认总体均值偏离；可替换
}

interface EvalContext {
  sessionId: string;
  facilitatorId: string;
  scaleVersion: string;
  cfg: ScoringConfig;
  norm: NormStrategy;
  deviation: DeviationStrategy;
  clock: () => string;
  responses: Record<string, number>;
  lockedAt: string | null;
  itemScores: ItemScore[] | null;
  dimensionScores: DimensionScore[] | null;
  profile: DimensionProfile[] | null;
  probeTarget: ProbeTarget | null;
}

export type EvalEvent =
  | { type: "ANSWER"; itemId: string; rawScore: number }
  | { type: "LOCK" };

/** done 态产出。字段在 done 时按构造必然就位（锁定+评分+剖面+追问目标均已算出）。 */
export interface EvalOutput {
  sessionId: string;
  scaleVersion: string;
  lockedAt: string;
  dimensionScores: DimensionScore[];
  profile: DimensionProfile[];
  probeTarget: ProbeTarget;
}

function defaultClock(): string {
  return new Date().toISOString();
}

export const evaluationMachine = setup({
  types: {
    context: {} as EvalContext,
    events: {} as EvalEvent,
    input: {} as EvalInput,
    output: {} as EvalOutput,
  },
  guards: {
    // 只受理合法作答：题目存在 + 分值为 [min,max] 内整数（对齐 pack likert，当前 1..6）
    isValidAnswer: ({ context, event }) => {
      if (event.type !== "ANSWER") return false;
      if (!context.cfg.itemById.has(event.itemId)) return false;
      const { likertMin, likertMax } = context.cfg;
      return (
        Number.isInteger(event.rawScore) &&
        event.rawScore >= likertMin &&
        event.rawScore <= likertMax
      );
    },
    // 阶段隔离闸门：15 题全部答齐才允许 LOCK
    allAnswered: ({ context }) => context.cfg.itemOrder.every((id) => id in context.responses),
  },
  actions: {
    recordAnswer: assign(({ context, event }) => {
      if (event.type !== "ANSWER") return {};
      return { responses: { ...context.responses, [event.itemId]: event.rawScore } };
    }),
    stampLock: assign(({ context }) => ({ lockedAt: context.clock() })),
    computeScores: assign(({ context }) => {
      const itemScores = scoreAllItems(context.responses, context.cfg);
      const dimensionScores = scoreDimensions(itemScores, context.cfg);
      return { itemScores, dimensionScores };
    }),
    computeProfile: assign(({ context }) => ({
      profile: computeProfile(
        context.dimensionScores!,
        context.itemScores!,
        context.cfg,
        context.norm,
      ),
    })),
    selectProbe: assign(({ context }) => ({
      probeTarget: context.deviation.select(context.itemScores!, context.cfg),
    })),
  },
}).createMachine({
  id: "alisEvaluation",
  context: ({ input }) => ({
    sessionId: input.sessionId,
    facilitatorId: input.facilitatorId,
    scaleVersion: input.pack.scale_version,
    cfg: deriveScoringConfig(input.pack),
    norm: input.norm ?? makeMidpointNorm(),
    deviation: input.deviation ?? makeDimensionResidualDeviation(),
    clock: input.clock ?? defaultClock,
    responses: {},
    lockedAt: null,
    itemScores: null,
    dimensionScores: null,
    profile: null,
    probeTarget: null,
  }),
  initial: "eliciting",
  states: {
    // 只收作答；LOCK 前不出任何评分/剖面（测量阶段）
    eliciting: {
      on: {
        ANSWER: { guard: "isValidAnswer", actions: "recordAnswer" },
        LOCK: { guard: "allAnswered", target: "locked", actions: "stampLock" },
      },
    },
    // 已锁定：lockedAt 就位，作答冻结（此后 ANSWER 不再有处理器 → 被忽略）
    locked: {
      always: { target: "scoring" },
    },
    scoring: {
      entry: "computeScores",
      always: { target: "profiling" },
    },
    profiling: {
      entry: "computeProfile",
      always: { target: "selectingProbe" },
    },
    selectingProbe: {
      entry: "selectProbe",
      always: { target: "done" },
    },
    done: {
      type: "final",
    },
  },
  output: ({ context }): EvalOutput => ({
    sessionId: context.sessionId,
    scaleVersion: context.scaleVersion,
    lockedAt: context.lockedAt!,
    dimensionScores: context.dimensionScores!,
    profile: context.profile!,
    probeTarget: context.probeTarget!,
  }),
});
