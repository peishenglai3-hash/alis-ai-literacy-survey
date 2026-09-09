import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { evaluationMachine } from "../src/machine/evaluationMachine";
import { validatePack, deriveScoringConfig } from "../src/domain/pack";
import { loadRealPack } from "./helpers";

const FIXED_CLOCK = "2026-07-10T00:00:00.000Z";

function runToDone(overrides: Record<string, number> = {}) {
  const pack = loadRealPack();
  const actor = createActor(evaluationMachine, {
    input: { sessionId: "s-1", facilitatorId: "f-1", pack, clock: () => FIXED_CLOCK },
  });
  actor.start();
  for (const it of pack.items) {
    actor.send({ type: "ANSWER", itemId: it.id, rawScore: overrides[it.id] ?? 4 });
  }
  actor.send({ type: "LOCK" });
  return actor.getSnapshot();
}

describe("真实 Question Pack — 防内容/逻辑漂移", () => {
  it("S1 交付的 YAML 结构校验通过：15 题 / 7 维度", () => {
    const pack = loadRealPack();
    expect(() => validatePack(pack)).not.toThrow();
    expect(pack.items).toHaveLength(15);
    expect(pack.dimensions).toHaveLength(7);
  });

  it("维度归属按量表原文校正：无单题维度，题数=[D1:2,D2:3,D3:2,D4:2,D5:2,D6:2,D7:2]", () => {
    const cfg = deriveScoringConfig(loadRealPack());
    const counts: Record<string, number> = {};
    for (const [dim, items] of cfg.itemsByDimension) counts[dim] = items.length;
    expect(counts).toEqual({ D1: 2, D2: 3, D3: 2, D4: 2, D5: 2, D6: 2, D7: 2 });
    // Q5→D2(Apply)、Q12+Q13→D6(人与AI关系)：与量表原文 A-G 分组一致
    expect(cfg.itemById.get("Q5")!.dimension).toBe("D2");
    expect(cfg.itemById.get("Q12")!.dimension).toBe("D6");
    expect(cfg.itemById.get("Q13")!.dimension).toBe("D6");
  });

  it("无单题维度 → 7 维 CI 全部可估（ciEstimable=true）", () => {
    const snap = runToDone({ Q1: 6, Q2: 3 });
    for (const p of snap.output!.profile) {
      expect(p.ciEstimable).toBe(true);
    }
  });
});

describe("端到端 — 评分内核完整跑通", () => {
  it("boot→done：产出 7 维剖面 + 单题追问目标", () => {
    const snap = runToDone({ Q1: 6 }); // 让 Q1 偏离（6 点量表最高分）
    expect(snap.status).toBe("done");
    const out = snap.output!;
    expect(out.dimensionScores).toHaveLength(7);
    expect(out.profile).toHaveLength(7);
    expect(out.lockedAt).toBe(FIXED_CLOCK);

    const cfg = deriveScoringConfig(loadRealPack());
    expect(cfg.itemById.has(out.probeTarget.itemId)).toBe(true);
    expect(["high", "low"]).toContain(out.probeTarget.branch);
  });

  it("铁律：probeTarget 只含结构化选择器，无任何自然语言字段", () => {
    const out = runToDone().output!;
    const t = out.probeTarget;
    expect(typeof t.itemId).toBe("string");
    expect(typeof t.branch).toBe("string");
    expect("text" in t).toBe(false);
    expect("probeText" in t).toBe(false);
    expect("question" in t).toBe(false);
  });

  it("完全确定性：同作答+同时钟 → 输出深度相等", () => {
    const a = runToDone({ Q3: 6, Q9: 2 }).output!;
    const b = runToDone({ Q3: 6, Q9: 2 }).output!;
    expect(a).toEqual(b);
  });

  it("连续剖面（非硬类型）：每维含 percentile 且 normed=false（占位常模）", () => {
    const out = runToDone().output!;
    for (const p of out.profile) {
      expect(typeof p.percentile).toBe("number");
      expect(p.normed).toBe(false);
      expect(p).not.toHaveProperty("type"); // 无硬类型字段（对齐 S1）
    }
  });
});
