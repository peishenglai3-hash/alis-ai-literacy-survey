import { describe, it, expect } from "vitest";
import { createActor } from "xstate";
import { evaluationMachine } from "../src/machine/evaluationMachine";
import { loadRealPack } from "./helpers";

const FIXED_CLOCK = "2026-07-10T00:00:00.000Z";

function newActor() {
  const pack = loadRealPack();
  return createActor(evaluationMachine, {
    input: {
      sessionId: "s-iso-1",
      facilitatorId: "f-1",
      pack,
      clock: () => FIXED_CLOCK,
    },
  });
}

describe("阶段隔离 — 测量 vs 测试（学术关键）", () => {
  it("未答齐 15 题时 LOCK 被拒：停在 eliciting、无 lockedAt、无剖面", () => {
    const actor = newActor();
    actor.start();
    const pack = loadRealPack();
    // 只答前 14 题
    for (const it of pack.items.slice(0, 14)) {
      actor.send({ type: "ANSWER", itemId: it.id, rawScore: 4 });
    }
    actor.send({ type: "LOCK" });
    const snap = actor.getSnapshot();
    expect(snap.value).toBe("eliciting");
    expect(snap.context.lockedAt).toBeNull();
    expect(snap.context.profile).toBeNull(); // 反馈绝不早于锁定
  });

  it("eliciting 阶段绝不产出评分/剖面（锁定前无任何反馈）", () => {
    const actor = newActor();
    actor.start();
    const pack = loadRealPack();
    for (const it of pack.items) actor.send({ type: "ANSWER", itemId: it.id, rawScore: 5 });
    // 尚未 LOCK
    const snap = actor.getSnapshot();
    expect(snap.value).toBe("eliciting");
    expect(snap.context.itemScores).toBeNull();
    expect(snap.context.dimensionScores).toBeNull();
    expect(snap.context.profile).toBeNull();
  });

  it("LOCK 后落 lockedAt（来自注入时钟，可复现），并跑到 done", () => {
    const actor = newActor();
    actor.start();
    const pack = loadRealPack();
    for (const it of pack.items) actor.send({ type: "ANSWER", itemId: it.id, rawScore: 5 });
    actor.send({ type: "LOCK" });
    const snap = actor.getSnapshot();
    expect(snap.status).toBe("done");
    expect(snap.context.lockedAt).toBe(FIXED_CLOCK);
    expect(snap.context.profile).toHaveLength(7);
  });

  it("锁定后作答被冻结：ANSWER 不再改动 responses（Likert 不可更改）", () => {
    const actor = newActor();
    actor.start();
    const pack = loadRealPack();
    for (const it of pack.items) actor.send({ type: "ANSWER", itemId: it.id, rawScore: 5 });
    actor.send({ type: "LOCK" });
    const before = { ...actor.getSnapshot().context.responses };
    // 锁定后试图篡改第一题
    actor.send({ type: "ANSWER", itemId: pack.items[0]!.id, rawScore: 1 });
    expect(actor.getSnapshot().context.responses).toEqual(before);
  });

  it("非法作答被守卫拦下（越界分值不进入 responses）", () => {
    const actor = newActor();
    actor.start();
    const pack = loadRealPack();
    actor.send({ type: "ANSWER", itemId: pack.items[0]!.id, rawScore: 99 });
    actor.send({ type: "ANSWER", itemId: "NOT_AN_ITEM", rawScore: 4 });
    expect(Object.keys(actor.getSnapshot().context.responses)).toHaveLength(0);
  });
});
