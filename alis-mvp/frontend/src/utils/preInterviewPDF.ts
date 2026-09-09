// 访谈前作答对照表 PDF 导出（v3.10，pdfmake 实现）。
// 用途：受访者完成 15 题作答、拿到类型结果后、正式进入访谈之前，由促进者在准备页
// 导出一份对照表（原题 + 作答 + 类型状况），访谈时受访者自行对照。
//
// 设计决策（v3.10 工程流敲定）：
//   - 复用现有 pdfmake 管线（零新依赖）：懒加载 + SimHei 字体 vendoring（fontCache 单例）
//   - buildPreInterviewDocDefinition 导出为纯函数——docDefinition 是纯数据结构，可直接断言测试
//   - typeCode 必须用 styleResult.typeCode 源（与受访者在 StyleResultScreen 所见一致），
//     防详细模式未来误接 deriveTypeCode 造成口径漂移
//   - scoreLabel 使用 utils/scoreLabel.ts 唯一真源（v3.10 收敛，消除复制漂移）
//   - 15 题作答数据仅存在于前端内存（后端 /interview/save 不落 responses）——
//     对照表是"当场导出"的前端快照，访谈结束后无法由后端重建（UI 已有提醒文案）

import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getTypeCharacteristics } from "../data/typeCharacteristics";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { getSimHeiFontBase64 } from "./fontCache";
import { scoreLabel } from "./scoreLabel";

// 中文字体 URL（Vite 资源导入：开发为 /src/assets/... 路径，构建为带 hash 的产物 URL）
import simHeiUrl from "../assets/fonts/SimHei.ttf?url";

export interface PreInterviewPDFInput {
  styleResult: StyleProfileV3;          // 与 StyleResultScreen 同源，零漂移
  responses: Record<string, number>;    // key="Q1".."Q15"，与 questionTexts key 对齐
  questionTexts: Record<string, string>; // 与 FullLikertScreen 屏幕题干同源（item.stem_zh）
  sessionId: string;
}

/** 构建对照表 docDefinition（纯函数，无 pdfmake 动态导入、无 fetch，可单测）。 */
export function buildPreInterviewDocDefinition(input: PreInterviewPDFInput): TDocumentDefinitions {
  const { styleResult, responses, questionTexts, sessionId } = input;
  const typeDef = styleResult.typeDef;
  const tc = getTypeCharacteristics(styleResult.typeCode);
  const exportedAt = new Date().toLocaleString("zh-CN");

  // 三维度位置表（表达式与 interviewPDF/styleResultPDF 逐字对齐，三份 PDF 口径一致）
  const dimRows = styleResult.dimensions.map((dim) => [
    dim.dimId,
    dim.position,
    `${dim.polarity > 0 ? "正向" : "反向"} (${dim.polarity})`,
    dim.positionLabel ?? "",
  ]);

  // 15 题作答表：按题号数字排序（防御 questionTexts 插入序乱序）。
  // 注：parseInt("Q1",10)=NaN，须先剥离非数字前缀再解析。
  const likertRows = Object.entries(questionTexts)
    .sort(([a], [b]) => parseInt(a.replace(/\D/g, ""), 10) - parseInt(b.replace(/\D/g, ""), 10))
    .map(([qId, text]) => {
      const score = responses[qId];
      const answer = score !== undefined ? `${score} 分 · ${scoreLabel(score)}` : "未回答";
      return [qId, text || `（${qId} 题干）`, answer];
    });

  // push 方式构建（spread 会丢失上下文类型导致 margin 元组退化为 number[]）
  const content: TDocumentDefinitions["content"] = [];

  // ① 标题区
  content.push({ text: "AI 素养作答对照表", style: "title", alignment: "center" });
  content.push({ text: "访谈前导出 · 供受访者访谈时对照", style: "subtitle", alignment: "center" });
  content.push({ text: `会话 ID：${sessionId} · 导出时间：${exportedAt}`, style: "muted", alignment: "center", margin: [0, 6, 0, 12] });
  content.push({ canvas: [{ type: "line", x1: 40, y1: 0, x2: 475, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" }], margin: [0, 0, 0, 10] });

  // ② 类型状况（tc 缺失时整块跳过——与 styleResultPDF 行为一致，PDF 其余部分正常）
  if (tc) {
    content.push({ text: `你是 ${typeDef?.fullName ?? styleResult.typeCode}`, style: "type-name" });
    content.push({ text: `${styleResult.typeCode} · 置信度 ${Math.round((styleResult.typeConfidence ?? 0) * 100)}%`, style: "muted", margin: [0, 2, 0, 8] });
    content.push({
      ul: [
        typeDef?.animalName ? `${typeDef.animalName}：${tc.animalDescription}` : "",
        typeDef?.memeName ? `${typeDef.memeName}：${tc.memeDescription}` : "",
      ].filter(Boolean),
      margin: [0, 0, 0, 8],
    });
    content.push({ ul: tc.characteristics.map((c: string) => `✓ ${c}`), margin: [0, 0, 0, 6] });
    content.push({ text: `无优劣说明：${tc.valueNote}`, style: "muted" });
    content.push({ canvas: [{ type: "line", x1: 40, y1: 0, x2: 475, y2: 0, lineWidth: 1, lineColor: "#e5e7eb" }], margin: [0, 12, 0, 10] });
  }

  // ③ 三维度位置表（headerRows 即跨页重复表头，pdfmake Table 语义）
  content.push({ text: "三维度位置", style: "h2" });
  content.push({
    table: { headerRows: 1, widths: ["auto", "auto", "auto", "*"], body: [
      ["维度", "位置", "极性", "标签"],
      ...dimRows,
    ]},
    margin: [0, 4, 0, 12],
  });

  // ④ 15 题作答表
  content.push({ text: "15 题作答", style: "h2" });
  content.push({
    table: { headerRows: 1, widths: ["auto", "*", "auto"], body: [
      ["题号", "题干", "你的作答"],
      ...likertRows,
    ]},
    fontSize: 8,
    margin: [0, 4, 0, 12],
  });

  // ⑥ 结束行
  content.push({ text: "— 对照表结束 —", alignment: "center", margin: [0, 8, 0, 0], color: "#9ca3af" });

  return {
    content,
    styles: {
      title: { fontSize: 20, bold: true, color: "#7c3aed", margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 11, color: "#6b7280", margin: [0, 0, 0, 4] },
      "type-name": { fontSize: 16, bold: true, color: "#7c3aed", margin: [0, 0, 0, 2] },
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
    // ⑤ 页脚三项：会话 ID + 导出时间 + 无优劣声明
    footer: (currentPage: number, pageCount: number) => ({
      text: `${sessionId} · 导出于 ${exportedAt} · 分数无优劣 · 第 ${currentPage} / ${pageCount} 页`,
      alignment: "center",
      fontSize: 7,
      color: "#9ca3af",
      margin: [0, 8, 0, 0],
    }),
  };
}

/** 生成并下载对照表 PDF（懒加载 pdfmake + 共享字体缓存 + try/catch alert 兜底）。 */
export async function exportPreInterviewPDF(input: PreInterviewPDFInput): Promise<void> {
  try {
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    // v3.10: addFontContainer + VFS 方式注册（data URL 字符串在 0.3.11 必失败，见 fontCache 注释）
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
    const doc = buildPreInterviewDocDefinition(input);
    const fname = `ALIS_作答对照表_${input.styleResult.typeCode}_${input.sessionId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdfMake.createPdf(doc).download(fname);
  } catch (e) {
    console.error("对照表 PDF 导出失败", e);
    const msg = e instanceof Error ? e.message : String(e);
    alert(`PDF 生成失败：${msg}\n\n请重试。如持续失败请联系管理员。`);
  }
}
