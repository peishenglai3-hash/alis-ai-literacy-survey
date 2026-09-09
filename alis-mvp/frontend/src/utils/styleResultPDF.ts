// 风格结果 PDF 导出工具（v3.8，pdfmake 实现，替代 html2pdf.js）。
// v3.7 用 html2pdf.js（html2canvas 光栅化）：中文不可选、CSS Grid/渐变/CSS变量不兼容、
// <details> 折叠内容丢失、avoid-all 分页偏移等 9 个问题。
// v3.8 改用 pdfmake 直接绘制矢量文本：中文可选/可搜索、原生布局、自动分页。
// 中文字体 vendoring（SimHei），与 interviewPDF.ts 共用同一注册逻辑。

import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getTypeCharacteristics } from "../data/typeCharacteristics";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { getSimHeiFontBase64 } from "./fontCache";

// 中文字体 URL（Vite 资源导入）
import simHeiUrl from "../assets/fonts/SimHei.ttf?url";

export async function exportStyleResultAsPDF(
  styleResult: StyleProfileV3,
  filename: string,
): Promise<void> {
  const pdfMake = (await import("pdfmake/build/pdfmake")).default;

  // v3.8 修复：共享字体缓存，避免每次导出重复 fetch 9.7MB。
  // v3.10 修复：addFontContainer + VFS 方式（data URL 字符串在 pdfmake 0.3.11 必失败）。
  const fontBase64 = await getSimHeiFontBase64(simHeiUrl);
  pdfMake.addFontContainer({
    vfs: { "SimHei.ttf": fontBase64 },
    fonts: {},
  });
  pdfMake.fonts = {
    SimHei: {
      normal: "SimHei.ttf",
      bold: "SimHei.ttf",
      italics: "SimHei.ttf",
      bolditalics: "SimHei.ttf",
    },
  };

  const doc = buildDocDefinition(styleResult);
  pdfMake.createPdf(doc).download(filename);
}

function buildDocDefinition(styleResult: StyleProfileV3): TDocumentDefinitions {
  const typeDef = styleResult.typeDef;
  const tc = getTypeCharacteristics(styleResult.typeCode);

  const dimRows = styleResult.dimensions.map((dim) => [
    dim.dimId,
    dim.position,
    `${dim.polarity > 0 ? "正向" : "反向"} (${dim.polarity})`,
    dim.positionLabel ?? "",
  ]);

  // push 方式构建（spread 会丢失上下文类型导致 margin 元组退化为 number[]）
  const content: TDocumentDefinitions["content"] = [];

  content.push({ text: "你的 AI 协作风格", style: "muted-label", alignment: "center" });
  content.push({ text: `你是 ${typeDef?.fullName ?? styleResult.typeCode}`, style: "type-name", alignment: "center" });

  // 双标签
  if (tc) {
    content.push({
      ul: [
        typeDef?.animalName ? `${typeDef.animalName}：${tc.animalDescription}` : "",
        typeDef?.memeName ? `${typeDef.memeName}：${tc.memeDescription}` : "",
      ].filter(Boolean),
    });
  }

  // 分隔线
  content.push({ canvas: [{ type: "line", x1: 40, y1: 0, x2: 475, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" }], margin: [0, 10, 0, 10] });

  // 3维对比表
  content.push({ text: "三维度位置", style: "h2" });
  content.push({
    table: { headerRows: 1, widths: ["auto", "auto", "auto", "*"], body: [
      ["维度", "位置", "极性", "标签"],
      ...dimRows,
    ]},
    margin: [0, 4, 0, 10],
  });

  // 特点
  if (tc) {
    content.push({ text: "你的特点", style: "h2" });
    content.push({ ul: tc.characteristics.map((c: string) => `✓ ${c}`), margin: [0, 4, 0, 8] });
    content.push({ text: `无优劣说明：${tc.valueNote}`, style: "muted" });
  }

  // 理论说明
  content.push({ text: "本研究说明", style: "h2" });
  content.push({
    text: styleResult.valueStatement?.theoryInnovation ?? "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从\"能力高低\"转向\"风格差异\"，从\"规范达标\"转向\"认知多元\"。每种协作风格都是个体与AI互动的独特模式，值得理解和尊重。",
    style: "muted",
    fontSize: 9,
    lineHeight: 1.6,
  });

  return {
    content,
    styles: {
      "muted-label": { fontSize: 10, color: "#6b7280", margin: [0, 0, 0, 2] },
      "type-name": { fontSize: 20, bold: true, color: "#7c3aed", margin: [0, 0, 0, 8] },
      h2: { fontSize: 12, bold: true, color: "#4f46e5", margin: [0, 10, 0, 4] },
      muted: { color: "#6b7280", fontSize: 9 },
    },
    defaultStyle: {
      font: "SimHei",
      fontSize: 10,
      lineHeight: 1.5,
    },
    pageMargins: [40, 40, 40, 40],
    pageSize: "A4",
    footer: (currentPage: number, pageCount: number) => ({
      text: `ALIS 风格报告 · 第 ${currentPage} / ${pageCount} 页`,
      alignment: "center",
      fontSize: 7,
      color: "#9ca3af",
      margin: [0, 8, 0, 0],
    }),
  };
}
