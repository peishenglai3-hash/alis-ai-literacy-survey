// scoreLabel 单元测试（v3.10）：7 点制分数 → 中文锚点词，行为契约全覆盖。
import { describe, expect, it } from "vitest";
import { scoreLabel } from "../src/utils/scoreLabel";

describe("scoreLabel", () => {
  it("7 → 非常同意（上边界）", () => {
    expect(scoreLabel(7)).toBe("非常同意");
  });

  it("8 → 非常同意（上界外兜底）", () => {
    expect(scoreLabel(8)).toBe("非常同意");
  });

  it("6 → 比较同意", () => {
    expect(scoreLabel(6)).toBe("比较同意");
  });

  it("5 → 有点同意", () => {
    expect(scoreLabel(5)).toBe("有点同意");
  });

  it("4 → 中立 / 不确定", () => {
    expect(scoreLabel(4)).toBe("中立 / 不确定");
  });

  it("3 → 有点不同意", () => {
    expect(scoreLabel(3)).toBe("有点不同意");
  });

  it("2 → 比较不同意", () => {
    expect(scoreLabel(2)).toBe("比较不同意");
  });

  it("1 → 非常不同意（下边界）", () => {
    expect(scoreLabel(1)).toBe("非常不同意");
  });

  it("0 / -3 → 非常不同意（下界外兜底）", () => {
    expect(scoreLabel(0)).toBe("非常不同意");
    expect(scoreLabel(-3)).toBe("非常不同意");
  });

  it("NaN → 非常不同意（防御非数值）", () => {
    expect(scoreLabel(Number.NaN)).toBe("非常不同意");
  });
});
