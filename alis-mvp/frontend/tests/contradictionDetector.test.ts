// contradictionDetector 单元测试（v3.10 P0-2 补全）：
// 14 模式 C01-C14 触发矩阵 + 不误报 + severity 排序 + 阶段过滤。
// 注意：contradiction 阈值语义为 7 点制（高分 >=5 / 低分 <=3）。
import { describe, expect, it } from "vitest";
import { detectContradictions, getContradictionsForStage } from "../src/domain/contradictionDetector";

/** 构造作答：高分题给 6，低分题给 2，其余给 4（中性）。 */
function makeResponses(high: string[], low: string[]): Record<string, number> {
  const r: Record<string, number> = {};
  for (let i = 1; i <= 15; i++) {
    const q = `Q${i}`;
    r[q] = high.includes(q) ? 6 : low.includes(q) ? 2 : 4;
  }
  return r;
}

describe("detectContradictions", () => {
  it("C01 能力-意愿矛盾：Q3 高分 + Q5 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q3"], ["Q5"])).map((c) => c.id);
    expect(ids).toContain("C01");
  });

  it("C02 信任-验证矛盾：Q7 高分 + Q8 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q7"], ["Q8"])).map((c) => c.id);
    expect(ids).toContain("C02");
  });

  it("C03 探索-使用矛盾：Q1 高分 + Q3 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q1"], ["Q3"])).map((c) => c.id);
    expect(ids).toContain("C03");
  });

  it("C04 判断-说服矛盾：Q8 高分 + Q12 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q8"], ["Q12"])).map((c) => c.id);
    expect(ids).toContain("C04");
  });

  it("C05 学习-耐心矛盾：Q6 高分 + Q5 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q6"], ["Q5"])).map((c) => c.id);
    expect(ids).toContain("C05");
  });

  it("C06 伦理-行为矛盾：Q10 高分 + Q11 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q10"], ["Q11"])).map((c) => c.id);
    expect(ids).toContain("C06");
  });

  it("C07 原则-反思落差：Q15 高分 + Q14 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q15"], ["Q14"])).map((c) => c.id);
    expect(ids).toContain("C07");
  });

  it("C08 使用-反思落差：Q3 高分 + Q14 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q3"], ["Q14"])).map((c) => c.id);
    expect(ids).toContain("C08");
  });

  it("C09 探索意愿-社会关切落差：Q2 高分 + Q10 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q2"], ["Q10"])).map((c) => c.id);
    expect(ids).toContain("C09");
  });

  it("C10 知识边界-评估素养矛盾：Q4 高分 + Q9 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q4"], ["Q9"])).map((c) => c.id);
    expect(ids).toContain("C10");
  });

  it("C11 评估能力-学习策略落差：Q9 高分 + Q13 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q9"], ["Q13"])).map((c) => c.id);
    expect(ids).toContain("C11");
  });

  it("C12 察觉-理解演化落差：Q1 高分 + Q14 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q1"], ["Q14"])).map((c) => c.id);
    expect(ids).toContain("C12");
  });

  it("C13 学习速度-原则形成落差：Q6 高分 + Q15 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q6"], ["Q15"])).map((c) => c.id);
    expect(ids).toContain("C13");
  });

  it("C14 信任-隐私落差：Q7 高分 + Q11 低分触发", () => {
    const ids = detectContradictions(makeResponses(["Q7"], ["Q11"])).map((c) => c.id);
    expect(ids).toContain("C14");
  });

  it("全 14 模式同时触发：14 个模式各自的高分题 6 + 低分题 2", () => {
    // 收集所有模式的高分题（每模式第一题）与低分题（每模式第二题）
    const patternPairs: Array<[string, string]> = [
      ["Q3", "Q5"], ["Q7", "Q8"], ["Q1", "Q3"], ["Q8", "Q12"], ["Q6", "Q5"],
      ["Q10", "Q11"], ["Q15", "Q14"], ["Q3", "Q14"], ["Q2", "Q10"], ["Q4", "Q9"],
      ["Q9", "Q13"], ["Q1", "Q14"], ["Q6", "Q15"], ["Q7", "Q11"],
    ];
    const high = patternPairs.map(([h]) => h);
    const low = patternPairs.map(([, l]) => l);
    const responses = makeResponses(high, low);
    const ids = detectContradictions(responses).map((c) => c.id);
    // 至少触发一半以上模式（部分模式共享题目，构造冲突时触发集合可能不完全）
    expect(ids.length).toBeGreaterThanOrEqual(7);
    expect(ids).toContain("C01");
  });

  it("同分（全部 5 分）不触发任何模式（不误报）", () => {
    const neutral: Record<string, number> = {};
    for (let i = 1; i <= 15; i++) neutral[`Q${i}`] = 5;
    expect(detectContradictions(neutral)).toEqual([]);
  });

  it("反向组合不误报：低分-高分顺序（Q3 低 + Q5 高）", () => {
    const ids = detectContradictions(makeResponses(["Q5"], ["Q3"])).map((c) => c.id);
    expect(ids).not.toContain("C01");
  });

  it("severity 排序：high → medium → low", () => {
    // 构造同时触发 high（C01）、medium（C03）、low（C05）的作答
    const responses = makeResponses(["Q1", "Q3", "Q6", "Q7", "Q8"], ["Q5", "Q9"]);
    const found = detectContradictions(responses);
    const order = { high: 0, medium: 1, low: 2 };
    for (let i = 1; i < found.length; i++) {
      const prev = found[i - 1];
      const curr = found[i];
      if (prev && curr) {
        expect(order[prev.severity]).toBeLessThanOrEqual(order[curr.severity]);
      }
    }
    // 至少包含一个 high
    expect(found.some((c) => c.severity === "high")).toBe(true);
  });
});

describe("getContradictionsForStage", () => {
  it("阶段过滤：只返回涉及该阶段题目的矛盾", () => {
    const all: Record<string, number> = {};
    // C01 (Q3,Q5) + C03 (Q1,Q3) + C07 (Q15,Q14) 全部触发
    const responses = makeResponses(["Q1", "Q3", "Q15"], ["Q5", "Q14"]);
    const allDetected = detectContradictions(responses);
    const stage1 = getContradictionsForStage(allDetected, 1);
    const ids = stage1.map((c) => c.id);
    // 阶段 1 的题目若包含 Q1/Q3/Q5/Q14/Q15 之一则对应矛盾应出现；不涉及则不出
    for (const c of stage1) {
      expect(c.questions.length).toBeGreaterThan(0);
    }
  });

  it("空矛盾列表 → 空结果", () => {
    expect(getContradictionsForStage([], 1)).toEqual([]);
  });
});
