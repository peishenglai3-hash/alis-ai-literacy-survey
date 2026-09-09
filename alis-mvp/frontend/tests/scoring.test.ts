import { describe, it, expect } from "vitest";
import { scoreItem, scoreDimensions } from "../src/domain/scoring";
import { makeMidpointNorm, computeProfile } from "../src/domain/norms";
import { makeItem, makeCfg } from "./helpers";
import type { ItemScore } from "../src/types";

describe("scoreItem — 正向与反向计分", () => {
  const cfg = makeCfg([makeItem("Q1", "D1", false), makeItem("Q2", "D1", true)]);

  it("正向题：effective === raw", () => {
    expect(scoreItem(5, cfg.itemById.get("Q1")!, cfg).effectiveScore).toBe(5);
  });

  it("反向题：effective = (min+max) - raw", () => {
    const rev = cfg.itemById.get("Q2")!;
    expect(scoreItem(7, rev, cfg).effectiveScore).toBe(1);
    expect(scoreItem(1, rev, cfg).effectiveScore).toBe(7);
    expect(scoreItem(4, rev, cfg).effectiveScore).toBe(4); // 中点自反
  });

  it("越界/非整数分值拒绝（对齐 S1 CheckConstraint 1..7）", () => {
    const it1 = cfg.itemById.get("Q1")!;
    expect(() => scoreItem(0, it1, cfg)).toThrow(RangeError);
    expect(() => scoreItem(8, it1, cfg)).toThrow(RangeError);
    expect(() => scoreItem(3.5, it1, cfg)).toThrow(RangeError);
  });
});

describe("scoreDimensions — 多题与单题维度", () => {
  const cfg = makeCfg([
    makeItem("Q1", "D1"),
    makeItem("Q2", "D1"),
    makeItem("Q3", "D6"), // 单题维度（模拟 D6=Q13）
  ]);
  const itemScores: ItemScore[] = [
    { itemId: "Q1", dimensionId: "D1", rawScore: 6, effectiveScore: 6, reverseScored: false },
    { itemId: "Q2", dimensionId: "D1", rawScore: 4, effectiveScore: 4, reverseScored: false },
    { itemId: "Q3", dimensionId: "D6", rawScore: 7, effectiveScore: 7, reverseScored: false },
  ];

  it("多题维度取有效分均值", () => {
    const dims = scoreDimensions(itemScores, cfg);
    const d1 = dims.find((d) => d.dimensionId === "D1")!;
    expect(d1.mean).toBe(5);
    expect(d1.nItems).toBe(2);
    expect(d1.sum).toBe(10);
  });

  it("单题维度 nItems=1，均值即该题分", () => {
    const d6 = scoreDimensions(itemScores, cfg).find((d) => d.dimensionId === "D6")!;
    expect(d6.nItems).toBe(1);
    expect(d6.mean).toBe(7);
  });
});

describe("makeMidpointNorm — 占位常模与 CI 兜底", () => {
  const norm = makeMidpointNorm();

  it("均值线性映射到 0..100（中点=50，满分=100，最低=0）", () => {
    const cfg = makeCfg([makeItem("Q1", "D1"), makeItem("Q2", "D1")]);
    const dims = scoreDimensions(
      [
        { itemId: "Q1", dimensionId: "D1", rawScore: 4, effectiveScore: 4, reverseScored: false },
        { itemId: "Q2", dimensionId: "D1", rawScore: 4, effectiveScore: 4, reverseScored: false },
      ],
      cfg,
    );
    const p = computeProfile(dims, [
      { itemId: "Q1", dimensionId: "D1", rawScore: 4, effectiveScore: 4, reverseScored: false },
      { itemId: "Q2", dimensionId: "D1", rawScore: 4, effectiveScore: 4, reverseScored: false },
    ], cfg, norm)[0]!;
    expect(p.percentile).toBe(50);
    expect(p.normed).toBe(false); // 学术诚实：非真常模
    expect(p.normSource).toBe("provisional-midpoint");
  });

  it("多题维度可估 CI（均值±1.96·SE 映射到 0..100）", () => {
    const cfg = makeCfg([makeItem("Q1", "D1"), makeItem("Q2", "D1")]);
    const scores: ItemScore[] = [
      { itemId: "Q1", dimensionId: "D1", rawScore: 6, effectiveScore: 6, reverseScored: false },
      { itemId: "Q2", dimensionId: "D1", rawScore: 4, effectiveScore: 4, reverseScored: false },
    ];
    const dims = scoreDimensions(scores, cfg);
    const p = computeProfile(dims, scores, cfg, norm)[0]!;
    expect(p.ciEstimable).toBe(true);
    expect(p.ciLow).not.toBeNull();
    expect(p.ciHigh).not.toBeNull();
    expect(p.ciLow!).toBeLessThan(p.percentile);
    expect(p.ciHigh!).toBeGreaterThan(p.percentile);
  });

  it("单题维度 CI 不可估 → 标记而非崩（ciEstimable=false，ci=null）", () => {
    const cfg = makeCfg([makeItem("Q3", "D6")]);
    const scores: ItemScore[] = [
      { itemId: "Q3", dimensionId: "D6", rawScore: 7, effectiveScore: 7, reverseScored: false },
    ];
    const dims = scoreDimensions(scores, cfg);
    const p = computeProfile(dims, scores, cfg, norm)[0]!;
    expect(p.ciEstimable).toBe(false);
    expect(p.ciLow).toBeNull();
    expect(p.ciHigh).toBeNull();
    expect(p.percentile).toBe(100); // 均值仍算得出
  });
});
