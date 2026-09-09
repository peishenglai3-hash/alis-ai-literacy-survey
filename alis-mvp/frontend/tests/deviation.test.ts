import { describe, it, expect } from "vitest";
import { scoreAllItems } from "../src/domain/scoring";
import { makeOverallMeanDeviation, makeDimensionResidualDeviation } from "../src/domain/deviation";
import { makeItem, makeCfg } from "./helpers";

const dev = makeOverallMeanDeviation();

describe("偏离选择器 — 单题闭环目标选择", () => {
  // 5 题，Q1 明显偏离（7），其余围绕 4
  const cfg = makeCfg([
    makeItem("Q1", "D1"),
    makeItem("Q2", "D1"),
    makeItem("Q3", "D2"),
    makeItem("Q4", "D2"),
    makeItem("Q5", "D3"),
  ]);
  const responses = { Q1: 7, Q2: 4, Q3: 4, Q4: 4, Q5: 4 };

  it("选与总体倾向偏离最大的一题", () => {
    const target = dev.select(scoreAllItems(responses, cfg), cfg);
    expect(target.itemId).toBe("Q1");
    expect(target.branch).toBe("high"); // raw 7 ≥ 中点
    expect(target.metric).toBe("overall-mean-abs-deviation");
  });

  it("确定性：同输入必同输出", () => {
    const a = dev.select(scoreAllItems(responses, cfg), cfg);
    const b = dev.select(scoreAllItems(responses, cfg), cfg);
    expect(a).toEqual(b);
  });

  it("偏离相等时按 pack 顺序 tie-break（取在前者）", () => {
    // Q1、Q5 对称偏离（6 与 2，总体均值 4）→ 取顺序在前的 Q1
    const tie = { Q1: 6, Q2: 4, Q3: 4, Q4: 4, Q5: 2 };
    const target = dev.select(scoreAllItems(tie, cfg), cfg);
    expect(target.itemId).toBe("Q1");
  });

  it("低分偏离走 low 分支", () => {
    const low = { Q1: 1, Q2: 5, Q3: 5, Q4: 5, Q5: 5 };
    const target = dev.select(scoreAllItems(low, cfg), cfg);
    expect(target.itemId).toBe("Q1");
    expect(target.branch).toBe("low"); // raw 1 < 中点
  });

  it("产出只含结构化选择器，无任何 probe 文本（铁律）", () => {
    const target = dev.select(scoreAllItems(responses, cfg), cfg);
    const keys = Object.keys(target).sort();
    expect(keys).toEqual(
      ["branch", "deviation", "dimensionId", "effectiveScore", "itemId", "metric", "rawScore"].sort(),
    );
    // 断言不含任何自然语言字段
    expect("text" in target).toBe(false);
    expect("probeText" in target).toBe(false);
  });
});

describe("维度残差策略（师门 2026-07-10 选定为默认）", () => {
  const resid = makeDimensionResidualDeviation();
  // D1: Q1,Q2 ; D2: Q3,Q4,Q5
  const cfg = makeCfg([
    makeItem("Q1", "D1"),
    makeItem("Q2", "D1"),
    makeItem("Q3", "D2"),
    makeItem("Q4", "D2"),
    makeItem("Q5", "D2"),
  ]);

  it("选'维度内部与自身均值残差最大'的题", () => {
    // D2:[4,4,7] 均值5 → Q5 残差2（全局最大）；D1:[5,5] 残差0
    const r = { Q1: 5, Q2: 5, Q3: 4, Q4: 4, Q5: 7 };
    const t = resid.select(scoreAllItems(r, cfg), cfg);
    expect(t.itemId).toBe("Q5");
    expect(t.branch).toBe("high"); // raw 7 ≥ 中点
    expect(t.metric).toBe("dimension-residual");
  });

  it("确定性 + tie-break 取 pack 顺序在前", () => {
    // D1:[6,4] 残差各1；D2:[4,4,4] 残差0 → Q1、Q2 平手 → 取 Q1
    const r = { Q1: 6, Q2: 4, Q3: 4, Q4: 4, Q5: 4 };
    const a = resid.select(scoreAllItems(r, cfg), cfg);
    const b = resid.select(scoreAllItems(r, cfg), cfg);
    expect(a).toEqual(b);
    expect(a.itemId).toBe("Q1");
  });

  it("单题维度残差恒为0、不被选中（不给单题维度硬追问）", () => {
    const cfg2 = makeCfg([makeItem("Q1", "D1"), makeItem("Q2", "D1"), makeItem("Q9", "D9")]);
    // Q9 属单题维度 D9，即便作答极端，其维度残差=0 → 不被选；D1 内部有残差
    const r = { Q1: 6, Q2: 4, Q9: 7 };
    const t = resid.select(scoreAllItems(r, cfg2), cfg2);
    expect(t.itemId).not.toBe("Q9");
    expect(t.dimensionId).toBe("D1");
  });
});
