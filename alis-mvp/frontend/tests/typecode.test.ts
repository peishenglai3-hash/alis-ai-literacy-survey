import { describe, it, expect } from "vitest";
import { deriveTypeCode } from "../src/domain/typecode";
import type { DimensionProfile } from "../src/types";
import type { TypeCodeConfig } from "../src/domain/pack";
import { loadRealPack } from "./helpers";

// 造一条剖面维度（percentile 相对位置 + CI）。
function prof(
  dimensionId: string,
  percentile: number,
  ciLow: number | null,
  ciHigh: number | null,
): DimensionProfile {
  return {
    dimensionId,
    mean: 0,
    percentile,
    ciLow,
    ciHigh,
    normed: false,
    normSource: "test",
    ciEstimable: ciLow !== null && ciHigh !== null,
  };
}

const CFG: TypeCodeConfig = {
  enabled: true,
  cut_percentile: 50,
  axes: [
    { id: "a1", dimension: "D4", name_zh: "判断轴", high: { letter: "C", label_zh: "审辨" }, low: { letter: "T", label_zh: "采信" } },
    { id: "a2", dimension: "D2", name_zh: "驾驭轴", high: { letter: "M", label_zh: "驾驭" }, low: { letter: "E", label_zh: "试探" } },
  ],
};

describe("deriveTypeCode — 字母码派生（确定性、非硬类型、含未分化位）", () => {
  it("高极：相对位置≥切点且 CI 全在切点上方 → 大写高极字母、分化", () => {
    const tc = deriveTypeCode([prof("D4", 80, 70, 90), prof("D2", 82, 74, 92)], CFG)!;
    expect(tc.axes[0]!.letter).toBe("C");
    expect(tc.axes[0]!.side).toBe("high");
    expect(tc.axes[0]!.differentiated).toBe(true);
    expect(tc.code).toBe("C-M");
    expect(tc.nDifferentiated).toBe(2);
  });

  it("低极：相对位置<切点且 CI 全在切点下方 → 大写低极字母、分化", () => {
    const tc = deriveTypeCode([prof("D4", 20, 10, 35), prof("D2", 15, 5, 30)], CFG)!;
    expect(tc.axes[0]!.letter).toBe("T"); // D4 low
    expect(tc.axes[1]!.letter).toBe("E"); // D2 low
    expect(tc.code).toBe("T-E");
  });

  it("未分化：CI 跨越切点 → 小写字母、differentiated=false（如实表达均衡）", () => {
    // D4 相对位置 55（偏高极），但 CI [40,70] 跨越 50 → 未分化，小写 'c'
    const tc = deriveTypeCode([prof("D4", 55, 40, 70), prof("D2", 90, 80, 99)], CFG)!;
    expect(tc.axes[0]!.differentiated).toBe(false);
    expect(tc.axes[0]!.letter).toBe("c"); // 小写
    expect(tc.axes[1]!.letter).toBe("M");
    expect(tc.code).toBe("c-M");
    expect(tc.nDifferentiated).toBe(1);
  });

  it("切点归高极：percentile 恰等于切点 → 走高极", () => {
    const tc = deriveTypeCode([prof("D4", 50, 55, 60), prof("D2", 50, 55, 60)], CFG)!;
    expect(tc.axes[0]!.side).toBe("high");
    expect(tc.axes[0]!.letter).toBe("C");
  });

  it("切点可配置：cut=60 时 percentile 55 判为低极", () => {
    const cfg60: TypeCodeConfig = { ...CFG, cut_percentile: 60 };
    const tc = deriveTypeCode([prof("D4", 55, 52, 58), prof("D2", 70, 65, 80)], cfg60)!;
    expect(tc.axes[0]!.side).toBe("low");
    expect(tc.axes[0]!.letter).toBe("T");
  });

  it("CI 不可估（无区间证据）→ 退回点估计判分化（大写）", () => {
    const tc = deriveTypeCode([prof("D4", 70, null, null), prof("D2", 30, null, null)], CFG)!;
    expect(tc.axes[0]!.differentiated).toBe(true);
    expect(tc.axes[0]!.letter).toBe("C");
    expect(tc.axes[1]!.letter).toBe("E");
  });

  it("配置未启用 / 缺失 / 空轴 → 返回 null（调用方不渲染）", () => {
    expect(deriveTypeCode([prof("D4", 80, 70, 90)], undefined)).toBeNull();
    expect(deriveTypeCode([prof("D4", 80, 70, 90)], { ...CFG, enabled: false })).toBeNull();
    expect(deriveTypeCode([prof("D4", 80, 70, 90)], { enabled: true, axes: [] })).toBeNull();
  });

  it("轴引用了剖面里没有的维度 → 跳过该轴，不崩", () => {
    const cfg3: TypeCodeConfig = {
      ...CFG,
      axes: [...CFG.axes, { id: "a3", dimension: "D_NOPE", high: { letter: "X", label_zh: "x" }, low: { letter: "Y", label_zh: "y" } }],
    };
    const tc = deriveTypeCode([prof("D4", 80, 70, 90), prof("D2", 80, 70, 90)], cfg3)!;
    expect(tc.nAxes).toBe(2); // 第三轴被跳过
    expect(tc.code).toBe("C-M");
  });

  it("完全确定性：同 profile + 同配置 → 深度相等", () => {
    const p = [prof("D4", 55, 40, 70), prof("D2", 90, 80, 99)];
    expect(deriveTypeCode(p, CFG)).toEqual(deriveTypeCode(p, CFG));
  });
});

describe("deriveTypeCode — 对齐出厂 Question Pack 的 type_code 段（防内容漂移）", () => {
  it("出厂配置 = 4 轴（16 型），落在 D4/D2/D5/D7，代号 4 字母 3 连字符", () => {
    const pack = loadRealPack();
    const profile: DimensionProfile[] = ["D1", "D2", "D3", "D4", "D5", "D6", "D7"].map((d, i) =>
      prof(d, 60 + i, 40 + i, 80 + i),
    );
    const tc = deriveTypeCode(profile, pack.type_code)!;
    expect(tc).not.toBeNull();
    expect(tc.nAxes).toBe(4);
    expect(tc.axes.map((a) => a.dimensionId)).toEqual(["D4", "D2", "D5", "D7"]);
    expect(tc.code.split("-")).toHaveLength(4);
  });
});
