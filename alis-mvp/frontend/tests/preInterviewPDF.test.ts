// preInterviewPDF 纯函数测试（v3.10）：buildPreInterviewDocDefinition 行为契约全覆盖。
// 注意：styles 与 footer 是函数/对象内含函数，禁止整体 toEqual 整份 doc——
// 采用检索式断言（find content 元素 / 断言 footer(page,count) 返回值）。
import { describe, expect, it } from "vitest";
import { buildPreInterviewDocDefinition, type PreInterviewPDFInput } from "../src/utils/preInterviewPDF";
import type { StyleProfileV3 } from "../src/domain/styleClassifier";

function makeStyleResult(typeCode: string): StyleProfileV3 {
  return {
    typeCode,
    typeDef: {
      typeCode,
      memeName: "摸鱼大师",
      animalName: "浣熊",
      fullName: "务实探索者",
      dimCombo: "E+T+F",
      coreFeatures: ["主动", "信任", "务实"],
      characteristics: ["主动探索AI的可能性"],
      coreProfile: "一句话画像",
      interviewGuidance: [],
      outputDescription: "",
    },
    dimensions: [
      { dimId: "E-U", polarity: 1.2, confidence: 0.8, position: "E", positionLabel: "探索者", scores: { positive: 6, negative: 2 } },
      { dimId: "T-V", polarity: -0.6, confidence: 0.6, position: "V", positionLabel: "验证者", scores: { positive: 3, negative: 5 } },
    ],
    typeConfidence: 0.85,
    valueStatement: { theoryInnovation: "风格差异而非能力高低" } as StyleProfileV3["valueStatement"],
    reflectionQuestions: [],
  };
}

function makeInput(overrides?: Partial<PreInterviewPDFInput>): PreInterviewPDFInput {
  return {
    styleResult: makeStyleResult("ETF"),
    responses: { Q1: 6, Q2: 5, Q3: 2 },
    questionTexts: { Q1: "我能在日常生活中识别出AI的存在", Q2: "我知道AI能做什么", Q3: "我信任AI的输出结果" },
    sessionId: "test-session-123",
    ...overrides,
  };
}

/** 在 doc.content 中查找第一个匹配的文本/ul/table 元素。 */
function findInContent(doc: ReturnType<typeof buildPreInterviewDocDefinition>, predicate: (c: unknown) => boolean): unknown {
  const content = doc.content as unknown[];
  return content.find(predicate);
}

/** 提取元素中的文本（含 text 字段与 ul 列表项），供检索式断言。 */
function textOf(el: unknown): string {
  if (typeof el !== "object" || el === null) return "";
  const e = el as Record<string, unknown>;
  if (typeof e.text === "string") return e.text;
  if (Array.isArray(e.ul)) return (e.ul as unknown[]).map((i) => String(i)).join("\n");
  return "";
}

describe("buildPreInterviewDocDefinition", () => {
  it("① 标题/副标题/会话 ID/导出时间文本存在", () => {
    const doc = buildPreInterviewDocDefinition(makeInput());
    const allText = (doc.content as unknown[]).map(textOf).join("\n");
    expect(allText).toContain("AI 素养作答对照表");
    expect(allText).toContain("访谈前导出 · 供受访者访谈时对照");
    expect(allText).toContain("test-session-123");
    expect(allText).toContain("导出时间");
  });

  it("② tc 存在 → 类型状况块含 typeCode、置信度、双标签、✓ 特点、valueNote", () => {
    const doc = buildPreInterviewDocDefinition(makeInput());
    const allText = (doc.content as unknown[]).map(textOf).join("\n");
    expect(allText).toContain("你是 务实探索者");
    expect(allText).toContain("ETF · 置信度 85%");
    expect(allText).toContain("浣熊：总是第一时间尝试新AI工具");
    expect(allText).toContain("摸鱼大师：用AI提高摸鱼效率，主打一个实用");
    expect(allText).toContain("✓ 主动探索AI的可能性");
    expect(allText).toContain("无优劣说明：摸鱼人和实干家都合理，只是风格不同");
  });

  it("③ tc 伪造不存在 → 类型状况块整体缺席（content 中查不到置信度）", () => {
    const doc = buildPreInterviewDocDefinition(makeInput({ styleResult: makeStyleResult("ZZZ") }));
    const allText = (doc.content as unknown[]).map(textOf).join("\n");
    expect(allText).not.toContain("置信度");
    expect(allText).not.toContain("无优劣说明");
    // PDF 其余部分仍正常
    expect(allText).toContain("AI 素养作答对照表");
    expect(allText).toContain("15 题作答");
  });

  it("④ 三维度表：表头 4 列 + dimRows 逐字（极性正/反格式、positionLabel fallback）", () => {
    const input = makeInput();
    input.styleResult.dimensions[1]!.positionLabel = ""; // 空标签 fallback
    const doc = buildPreInterviewDocDefinition(input);
    const tableEl = findInContent(doc, (c) => {
      const t = c as { table?: { body?: unknown[] } };
      return !!t.table?.body;
    });
    if (!tableEl) throw new Error("三维度表未找到");
    const firstTable = (tableEl as { table: { body: string[][] } }).table.body;
    expect(firstTable[0]).toEqual(["维度", "位置", "极性", "标签"]);
    expect(firstTable).toContainEqual(["E-U", "E", "正向 (1.2)", "探索者"]);
    expect(firstTable).toContainEqual(["T-V", "V", "反向 (-0.6)", ""]);
  });

  it("⑤ 15 题表：乱序输入按 parseInt 排序；题干 fallback；作答格式；未答显示未回答", () => {
    const input = makeInput({
      questionTexts: { Q10: "我反思与AI的互动", Q2: "我知道AI能做什么", Q1: "我识别AI的存在" },
      responses: { Q1: 7, Q2: 3, Q10: 1 },
    });
    const doc = buildPreInterviewDocDefinition(input);
    const tables = (doc.content as unknown[]).filter((c) => {
      const t = c as { table?: { body?: unknown[] } };
      return !!t.table?.body;
    });
    const likertTable = (tables[1] as { table: { body: string[][] } }).table.body;
    expect(likertTable[0]).toEqual(["题号", "题干", "你的作答"]);
    // 排序：Q1 < Q2 < Q10
    const qids = likertTable.slice(1).map((row) => row[0]);
    expect(qids).toEqual(["Q1", "Q2", "Q10"]);
    expect(likertTable[1]).toEqual(["Q1", "我识别AI的存在", "7 分 · 非常同意"]);
    expect(likertTable[2]).toEqual(["Q2", "我知道AI能做什么", "3 分 · 有点不同意"]);
    expect(likertTable[3]).toEqual(["Q10", "我反思与AI的互动", "1 分 · 非常不同意"]);
    // 未作答 → 未回答
    const doc2 = buildPreInterviewDocDefinition(makeInput({ responses: { Q1: 6 } }));
    const tables2 = (doc2.content as unknown[]).filter((c) => {
      const t = c as { table?: { body?: unknown[] } };
      return !!t.table?.body;
    });
    const likert2 = (tables2[1] as { table: { body: string[][] } }).table.body;
    expect(likert2[1]).toEqual(["Q1", "我能在日常生活中识别出AI的存在", "6 分 · 比较同意"]);
    expect(likert2[2]).toEqual(["Q2", "我知道AI能做什么", "未回答"]);
  });

  it("⑥ 两表 headerRows: 1（pdfmake Table 语义：跨页自动重复表头）", () => {
    const doc = buildPreInterviewDocDefinition(makeInput());
    const tables = (doc.content as unknown[]).filter((c) => {
      const t = c as { table?: { headerRows?: number } };
      return !!t.table;
    });
    expect(tables.length).toBeGreaterThanOrEqual(2);
    for (const t of tables) {
      expect((t as { table: { headerRows: number } }).table.headerRows).toBe(1);
    }
  });

  it("⑦ 结束行存在", () => {
    const doc = buildPreInterviewDocDefinition(makeInput());
    const allText = (doc.content as unknown[]).map(textOf).join("\n");
    expect(allText).toContain("— 对照表结束 —");
  });

  it("⑧ footer 返回三要素：会话 ID + 导出时间 + 无优劣声明 + 页码", () => {
    const doc = buildPreInterviewDocDefinition(makeInput());
    const footer = (doc as { footer?: (page: number, count: number) => { text: string } }).footer;
    expect(footer).toBeTypeOf("function");
    const f = footer?.(2, 4);
    expect(f?.text).toContain("test-session-123");
    expect(f?.text).toContain("无优劣");
    expect(f?.text).toContain("第 2 / 4 页");
  });

  it("⑨ A4 + pageMargins + SimHei defaultStyle", () => {
    const doc = buildPreInterviewDocDefinition(makeInput());
    expect(doc.pageSize).toBe("A4");
    expect(doc.pageMargins).toEqual([40, 40, 40, 40]);
    expect(doc.defaultStyle?.font).toBe("SimHei");
  });
});
