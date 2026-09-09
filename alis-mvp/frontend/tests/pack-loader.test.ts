import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";
import { parsePack } from "../src/content/pack-loader";

// 真源同一份：前端解析后端 question_pack_v2.1.yaml（防内容↔逻辑漂移）。
const yamlPath = fileURLToPath(
  new URL("../../backend/content/question_pack_v2.1.yaml", import.meta.url),
);
const raw = readFileSync(yamlPath, "utf-8");

describe("parsePack（前端解析后端 YAML 真源）", () => {
  it("加载 15 题 / 7 维", () => {
    const pack = parsePack(raw);
    expect(pack.items.length).toBe(15);
    expect(pack.dimensions.length).toBe(7);
  });

  it("携带 profile_disclaimer 伦理文案", () => {
    const pack = parsePack(raw) as unknown as { profile_disclaimer: { short_zh: string } };
    expect(pack.profile_disclaimer.short_zh).toContain("相对位置");
  });

  it("每题都含 probe_tree.high/low 骨架", () => {
    const pack = parsePack(raw);
    for (const it of pack.items) {
      expect(typeof it.probe_tree.high).toBe("string");
      expect(typeof it.probe_tree.low).toBe("string");
    }
  });

  it("维度归属校正后 D6 恰含 Q12+Q13（无单题维度）", () => {
    const pack = parsePack(raw);
    const d6 = pack.items.filter((i) => i.dimension === "D6").map((i) => i.id);
    expect(d6.sort()).toEqual(["Q12", "Q13"]);
  });

  it("点3：评分锚点为 6 点去中点（1..6），每点全标注 + 校准参照卡", () => {
    const pack = parsePack(raw);
    expect(pack.likert.min).toBe(1);
    expect(pack.likert.max).toBe(6);
    expect(pack.likert.labels_zh?.[1]).toBe("非常不同意");
    expect(pack.likert.labels_zh?.[6]).toBe("非常同意");
    expect(pack.likert.labels_zh?.[4]).toContain("同意"); // 去中点：4 已是弱肯定
    expect(pack.likert.reference_card_zh?.[1]).toBeTruthy();
  });

  it("点4：type_code 段存在且 4 轴，落在 D4/D2/D5/D7", () => {
    const pack = parsePack(raw);
    expect(pack.type_code?.enabled).toBe(true);
    expect(pack.type_code?.axes).toHaveLength(4);
    expect(pack.type_code?.axes.map((a) => a.dimension)).toEqual(["D4", "D2", "D5", "D7"]);
  });
});
