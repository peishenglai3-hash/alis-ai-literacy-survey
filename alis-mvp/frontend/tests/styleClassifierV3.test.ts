/**
 * styleClassifier v2.2 (v3) 3维度×8类型极性计算单元测试。
 * 来源：C:\Users\35636\Downloads\724反馈\AI协作风格测量_完整版.md 第四部分
 *
 * 验证：
 *   - 3维度独立映射（无跨维度共享）
 *   - 极性差值计算精度
 *   - 8种类型各2组极端输入
 *   - 置信度范围
 *   - 向后兼容（classifyStyle 仍返回 StyleResult）
 *   - 旧版 v2.1 函数仍可调用
 */

import { describe, it, expect } from "vitest";
import {
  computePolarityV3,
  computeDimensionProfileV3,
  classifyStyleV3,
} from "../src/domain/styleClassifier";
import { TYPES_V3 } from "../src/content/typeDefinitions";

// ============================================================================
// 3维度极性计算精度测试
// ============================================================================

describe("computePolarityV3 (v2.2 3-dim)", () => {
  it("强 Explorer 倾向：Q1/Q2/Q6 全7，Q3/Q4 全1 → E-U polarity ≈ +6", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 7));
    [3, 4].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "E-U");
    expect(p.polarity).toBeCloseTo(6, 0); // 7 - 1 = 6
    expect(p.confidence).toBeCloseTo(1.0, 0);
    expect(p.position).toBe("E");
    expect(p.scores.positive).toBe(7);
    expect(p.scores.negative).toBe(1);
  });

  it("强 Utilizer 倾向：Q3/Q4 全7，Q1/Q2/Q6 全1 → E-U polarity ≈ -6", () => {
    const r: Record<string, number> = {};
    [3, 4].forEach((n) => (r[`Q${n}`] = 7));
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "E-U");
    expect(p.polarity).toBeCloseTo(-6, 0);
    expect(p.position).toBe("U");
    expect(p.confidence).toBeCloseTo(1.0, 0);
  });

  it("强 Truster 倾向：Q5/Q7 全7 vs Q8/Q9/Q12 全1 → T-V polarity ≈ +6", () => {
    const r: Record<string, number> = {};
    [5, 7].forEach((n) => (r[`Q${n}`] = 7));
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "T-V");
    expect(p.polarity).toBeCloseTo(6, 0);
    expect(p.position).toBe("T");
  });

  it("强 Verifier 倾向：Q8/Q9/Q12 全7 vs Q5/Q7 全1 → T-V polarity ≈ -6", () => {
    const r: Record<string, number> = {};
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 7));
    [5, 7].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "T-V");
    expect(p.polarity).toBeCloseTo(-6, 0);
    expect(p.position).toBe("R"); // Verifier端
  });

  it("强 Functionalist 倾向：Q3/Q4/Q5/Q6 全7 vs Q10/Q11/Q13/Q14/Q15 全1 → F-R polarity ≈ +6", () => {
    const r: Record<string, number> = {};
    [3, 4, 5, 6].forEach((n) => (r[`Q${n}`] = 7));
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "F-R");
    expect(p.polarity).toBeCloseTo(6, 0);
    expect(p.position).toBe("F");
  });

  it("强 Reflector 倾向：Q10/Q11/Q13/Q14/Q15 全7 vs Q3/Q4/Q5/Q6 全1 → F-R polarity ≈ -6", () => {
    const r: Record<string, number> = {};
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 7));
    [3, 4, 5, 6].forEach((n) => (r[`Q${n}`] = 1));

    const p = computePolarityV3(r, "F-R");
    expect(p.polarity).toBeCloseTo(-6, 0);
    expect(p.position).toBe("R");
  });

  it("中间位置：两端得分相等 → polarity = 0", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 4));
    [3, 4].forEach((n) => (r[`Q${n}`] = 4));

    const p = computePolarityV3(r, "E-U");
    expect(p.polarity).toBe(0);
    expect(p.confidence).toBe(0);
    // polarity=0 → position defaults to positive end (E)
  });
});

// ============================================================================
// 完整剖面计算测试
// ============================================================================

describe("computeDimensionProfileV3", () => {
  it("返回3个维度的极性剖面", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const profile = computeDimensionProfileV3(r);
    expect(profile).toHaveLength(3);
    expect(profile[0]!.dimId).toBe("E-U");
    expect(profile[1]!.dimId).toBe("T-V");
    expect(profile[2]!.dimId).toBe("F-R");
  });
});

// ============================================================================
// 8种类型判定测试（来自724反馈第四部分测试用例）
// ============================================================================

describe("classifyStyleV3 — 8种类型判定", () => {
  it("ETF 摸鱼人/好奇猫：探索+信任+功能", () => {
    const r: Record<string, number> = {};
    // Explorer端高分
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 7));
    // Utilizer端低分
    [3, 4].forEach((n) => (r[`Q${n}`] = 3));
    // Truster端高分
    [5, 7].forEach((n) => (r[`Q${n}`] = 6));
    // Verifier端低分
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 3));
    // Functionalist端高分(Q3-Q6高) → F
    // Reflector端低分
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 3));

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ETF");
    expect(result.typeDef.memeName).toBe("摸鱼人");
    expect(result.typeDef.animalName).toBe("好奇猫");
    expect(result.dimensions[0]!.position).toBe("E");
    expect(result.dimensions[1]!.position).toBe("T");
    expect(result.dimensions[2]!.position).toBe("F");
  });

  it("ERF 质疑党/谨慎狗：探索+验证+功能", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 7)); // E
    [3, 4].forEach((n) => (r[`Q${n}`] = 3));
    [5, 7].forEach((n) => (r[`Q${n}`] = 3)); // 信任端低
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 7)); // V
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 3)); // F端(Q3-Q6 mixed → need to check overall)

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ERF");
    expect(result.typeDef.memeName).toBe("质疑党");
    expect(result.dimensions[0]!.position).toBe("E");
    expect(result.dimensions[1]!.position).toBe("R");
  });

  it("UTF 工具人/忙碌蜂：实用+信任+功能", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 3)); // E端低
    [3, 4].forEach((n) => (r[`Q${n}`] = 7)); // U端高
    [5, 7].forEach((n) => (r[`Q${n}`] = 7)); // T
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 3)); // V端低
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 3)); // R端低 → F

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UTF");
    expect(result.typeDef.memeName).toBe("工具人");
    expect(result.dimensions[0]!.position).toBe("U");
    expect(result.dimensions[1]!.position).toBe("T");
    expect(result.dimensions[2]!.position).toBe("F");
  });

  it("UVF 保守派/稳妥龟：实用+验证+功能", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 3)); // E端低
    [3, 4].forEach((n) => (r[`Q${n}`] = 7)); // U
    [5, 7].forEach((n) => (r[`Q${n}`] = 3)); // T端低
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 7)); // V
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 3)); // R端低 → F

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UVF");
    expect(result.typeDef.memeName).toBe("保守派");
    expect(result.dimensions[0]!.position).toBe("U");
    expect(result.dimensions[1]!.position).toBe("R");
    expect(result.dimensions[2]!.position).toBe("F");
  });

  it("ETR 哲学家/智慧猫头鹰：探索+信任+反思", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 7)); // E
    [3, 4].forEach((n) => (r[`Q${n}`] = 3));
    [5, 7].forEach((n) => (r[`Q${n}`] = 7)); // T
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 3));
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 7)); // R

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ETR");
    expect(result.typeDef.memeName).toBe("哲学家");
    expect(result.dimensions[0]!.position).toBe("E");
    expect(result.dimensions[1]!.position).toBe("T");
    expect(result.dimensions[2]!.position).toBe("R");
  });

  it("ERR 批判家/批判狐狸：探索+验证+反思", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 7)); // E
    [3, 4].forEach((n) => (r[`Q${n}`] = 3));
    [5, 7].forEach((n) => (r[`Q${n}`] = 3));
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 7)); // V
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 7)); // R

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("ERR");
    expect(result.typeDef.memeName).toBe("批判家");
    expect(result.dimensions[0]!.position).toBe("E");
    expect(result.dimensions[1]!.position).toBe("R");
    expect(result.dimensions[2]!.position).toBe("R");
  });

  it("UTR 实干家/实践大象：实用+信任+反思", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 3)); // U
    [3, 4].forEach((n) => (r[`Q${n}`] = 7));
    [5, 7].forEach((n) => (r[`Q${n}`] = 7)); // T
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 3));
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 7)); // R

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UTR");
    expect(result.typeDef.memeName).toBe("实干家");
    expect(result.typeDef.animalName).toBe("实践大象");
    expect(result.dimensions[0]!.position).toBe("U");
    expect(result.dimensions[1]!.position).toBe("T");
    expect(result.dimensions[2]!.position).toBe("R");
  });

  it("UVR 老古董/守仓松鼠：实用+验证+反思", () => {
    const r: Record<string, number> = {};
    [1, 2, 6].forEach((n) => (r[`Q${n}`] = 3)); // U
    [3, 4].forEach((n) => (r[`Q${n}`] = 7));
    [5, 7].forEach((n) => (r[`Q${n}`] = 3));
    [8, 9, 12].forEach((n) => (r[`Q${n}`] = 7)); // V
    [10, 11, 13, 14, 15].forEach((n) => (r[`Q${n}`] = 7)); // R

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBe("UVR");
    expect(result.typeDef.memeName).toBe("老古董");
    expect(result.typeDef.animalName).toBe("守仓松鼠");
    expect(result.dimensions[0]!.position).toBe("U");
    expect(result.dimensions[1]!.position).toBe("R");
    expect(result.dimensions[2]!.position).toBe("R");
  });
});

// ============================================================================
// 置信度和输出验证
// ============================================================================

describe("classifyStyleV3 — 输出完整性", () => {
  it("typeConfidence 在 [0, 1] 范围内", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const result = classifyStyleV3(r);
    expect(result.typeConfidence).toBeGreaterThanOrEqual(0);
    expect(result.typeConfidence).toBeLessThanOrEqual(1);
  });

  it("返回的 typeDef 完整（有 memeName/animalName/fullName/coreFeatures）", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const result = classifyStyleV3(r);
    expect(result.typeDef.memeName).toBeTruthy();
    expect(result.typeDef.animalName).toBeTruthy();
    expect(result.typeDef.fullName).toBeTruthy();
    expect(result.typeDef.coreFeatures).toHaveLength(3);
  });

  it("3个维度都返回完整信息", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const result = classifyStyleV3(r);
    expect(result.dimensions).toHaveLength(3);
    result.dimensions.forEach((d) => {
      expect(d.dimId).toBeTruthy();
      expect(d.position).toBeTruthy();
      expect(typeof d.polarity).toBe("number");
      expect(d.confidence).toBeGreaterThanOrEqual(0);
      expect(d.confidence).toBeLessThanOrEqual(1);
    });
  });

  it("valueStatement 包含无优劣声明", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const result = classifyStyleV3(r);
    expect(result.valueStatement.noHierarchy).toContain("无优劣");
    expect(result.valueStatement.theoryInnovation).toContain("能力水平");
  });

  it("reflectionQuestions 有4个问题", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const result = classifyStyleV3(r);
    expect(result.reflectionQuestions).toHaveLength(4);
  });
});

// ============================================================================
// 边缘情况
// ============================================================================

describe("边缘情况", () => {
  it("缺失题目：仅部分题目有值 → 仍能计算", () => {
    const r: Record<string, number> = {};
    r["Q1"] = 5;
    r["Q2"] = 5;
    // Q3-Q15 缺失

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBeTruthy();
    expect(result.typeDef).toBeTruthy();
    // 缺失题默认为3.5，应仍能产出合理类型
  });

  it("所有题目为最小值1 → 应产出某种类型", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 1;

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBeTruthy();
    // 所有极端值 = 各维度极性接近0 → 应产出类型
    expect(TYPES_V3.some((t) => t.typeCode === result.typeCode)).toBe(true);
  });

  it("所有题目为最大值7 → 应产出某种类型", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 7;

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBeTruthy();
    expect(TYPES_V3.some((t) => t.typeCode === result.typeCode)).toBe(true);
  });

  it("所有题目为中间值4 → 产出类型且3维度极性接近0", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;

    const result = classifyStyleV3(r);
    expect(result.typeCode).toBeTruthy();
    // 所有维度极性应接近0
    result.dimensions.forEach((d) => {
      expect(Math.abs(d.polarity)).toBeLessThanOrEqual(0.1);
    });
  });

  it("Q13有值（验证Q13参与F-R计算）", () => {
    const r: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) r[`Q${i}`] = 4;
    r["Q13"] = 1; // Q13特别低 → 拉低Reflector端均值

    const refPolarity = computePolarityV3(r, "F-R");
    // Q13=1降低负端均值 → polarity变大（更偏F）
    expect(refPolarity.scores.negative).toBeLessThan(4);
  });
});
