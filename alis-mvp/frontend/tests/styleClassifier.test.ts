/**
 * styleClassifier v3.2 极性计算单元测试。
 */

import { describe, it, expect } from "vitest";
import {
  computePolarityV3,
  computeDimensionProfileV3,
  classifyStyleV3,
} from "../src/domain/styleClassifier";

// ============================================================================
// 计算精度测试
// ============================================================================

describe("computePolarityV3", () => {
  it("强 Explorer 倾向：Q1/Q2/Q6 全满分，Q3/Q4 全最低 → 极性 ≈ +6", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 7));
    [3, 4].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "E-U");
    expect(p.polarity).toBeCloseTo(6, 0);
    expect(p.confidence).toBeCloseTo(1.0, 0);
    expect(p.scores.positive).toBe(7);
    expect(p.scores.negative).toBe(1);
  });

  it("强 Utilizer 倾向：Q3/Q4 全满分，Q1/Q2/Q6 全最低 → 极性 ≈ -6", () => {
    const r: Record<string, number> = {};
    [3, 4].forEach((n) => (r[`Q${n}`] = 7));
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "E-U");
    expect(p.polarity).toBeCloseTo(-6, 0);
    expect(p.confidence).toBeCloseTo(1.0, 0);
  });

  it("强 Truster 倾向：Q5/Q7 满分 vs Q8/Q9/Q12 最低", () => {
    const r: Record<string, number> = {};
    [5, 7].forEach((n) => (r[`Q${n}`] = 7));
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "T-V");
    expect(p.polarity).toBeCloseTo(6, 0);
  });

  it("强 Verifier 倾向：Q8/Q9/Q12 满分 vs Q5/Q7 最低", () => {
    const r: Record<string, number> = {};
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 7));
    [5, 7].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "T-V");
    expect(p.polarity).toBeCloseTo(-6, 0);
  });

  it("全中立（全部 4 分）→ 各维度极性 ≈ 0", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const dims = computeDimensionProfileV3(r);
    for (const d of dims) {
      expect(d.polarity).toBeCloseTo(0, 1);
    }
  });

  it("未知维度返回零值", () => {
    const r: Record<string, number> = { Q1: 6 };
    const p = computePolarityV3(r, "nonexistent");
    expect(p.polarity).toBe(0);
    expect(p.confidence).toBe(0);
  });
});

// ============================================================================
// 8 种类型判定测试
// ============================================================================

describe("classifyStyleV3 — 8 种类型判定", () => {
  function mk(overrides: Record<string, number>): Record<string, number> {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;
    Object.assign(r, overrides);
    return r;
  }

  it("ETF（摸鱼人/好奇猫）：E端+T端+F端", () => {
    const r = mk({ Q1: 7, Q2: 7, Q6: 7, Q3: 1, Q4: 1, Q5: 7, Q7: 7, Q8: 1, Q9: 1, Q12: 1 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ETF");
    expect(result.typeConfidence).toBeGreaterThan(0.5);
    expect(result.typeDef.memeName).toBe("摸鱼人");
  });

  it("ERF（质疑党/谨慎狗）：E端+V端+F端", () => {
    const r = mk({ Q1: 7, Q2: 7, Q6: 7, Q3: 4, Q4: 4, Q5: 6, Q8: 7, Q9: 7, Q12: 7, Q7: 1, Q10: 1, Q11: 1, Q13: 1, Q14: 1, Q15: 1 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ERF");
  });

  it("UTF（工具人/忙碌蜂）：U端+T端+F端", () => {
    const r = mk({ Q3: 7, Q4: 7, Q1: 1, Q2: 1, Q6: 1, Q5: 7, Q7: 7, Q8: 1, Q9: 1, Q12: 1 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UTF");
  });

  it("UVF（保守派/稳妥龟）：U端+V端+F端", () => {
    const r = mk({ Q3: 7, Q4: 7, Q5: 7, Q6: 7, Q1: 1, Q2: 1, Q8: 7, Q9: 7, Q12: 7, Q7: 1, Q10: 1, Q11: 1, Q13: 1, Q14: 1, Q15: 1 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UVF");
  });

  it("ETR（哲学家/智慧猫头鹰）：E端+T端+R端", () => {
    const r = mk({ Q1: 7, Q2: 7, Q6: 7, Q3: 1, Q4: 1, Q5: 7, Q7: 7, Q8: 1, Q9: 1, Q12: 1, Q10: 7, Q11: 7, Q13: 7, Q14: 7, Q15: 7 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ETR");
  });

  it("ERR（批判家/批判狐狸）：E端+V端+R端", () => {
    const r = mk({ Q1: 7, Q2: 7, Q6: 7, Q3: 1, Q4: 1, Q8: 7, Q9: 7, Q12: 7, Q5: 1, Q7: 1, Q10: 7, Q11: 7, Q13: 7, Q14: 7, Q15: 7 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ERR");
  });

  it("UTR（实干家/实践大象）：U端+T端+R端", () => {
    const r = mk({ Q3: 7, Q4: 7, Q1: 1, Q2: 1, Q6: 1, Q5: 7, Q7: 7, Q8: 1, Q9: 1, Q12: 1, Q10: 7, Q11: 7, Q13: 7, Q14: 7, Q15: 7 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UTR");
  });

  it("UVR（老古董/守仓松鼠）：U端+V端+R端", () => {
    const r = mk({ Q3: 5, Q4: 5, Q5: 4, Q6: 4, Q1: 1, Q2: 1, Q8: 7, Q9: 7, Q12: 7, Q7: 1, Q10: 7, Q11: 7, Q13: 7, Q14: 7, Q15: 7 });
    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UVR");
  });

  it("数据不足返回兜底（有效回答<3）", () => {
    const result = classifyStyleV3({ Q1: 7 });
    expect(result.typeConfidence).toBe(0);
  });
});
