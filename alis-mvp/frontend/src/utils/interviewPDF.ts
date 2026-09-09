// 完整访谈 PDF 导出（v3.8，pdfmake 实现）。
// 取代 v3.7 的 html2pdf.js 方案——pdfmake 原生绘制矢量文本（可选/可搜索）、原生表格、自动分页。
// 设计：懒加载 pdfmake（仅点击导出时才拉取，不影响首屏）；中文字体 vendoring（SimHei，见注册）。
// 题干由调用方传入（questionTexts），工具函数保持纯净——不直接 import 题库。

import type { InterviewSession, InterviewRecord } from "../ui/InterviewScreen";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import type { ThoughtBubble } from "../ui/ThoughtBubblePanel";
import type { FeedbackChoice } from "../ui/StyleResultScreen";
import { getTypeCharacteristics } from "../data/typeCharacteristics";
import type { TDocumentDefinitions } from "pdfmake/interfaces";
import { getSimHeiFontBase64 } from "./fontCache";
import { scoreLabel } from "./scoreLabel";

export interface ExportMetadata {
  exportedAt: string;
  version: string;
  facilitatorId: string;
  sessionId: string;
}

export interface InterviewPDFInput {
  session: InterviewSession;
  styleResult: StyleProfileV3;
  responses: Record<string, number>;
  questionTexts: Record<string, string>; // { "Q1": "我通常能够判断...", ... }
  bubbles: ThoughtBubble[];
  feedbackChoice: FeedbackChoice;
  reflectionText: string;
  metadata: ExportMetadata;
}

// 中文字体 URL（Vite 资源导入：开发为 /src/assets/... 路径，构建为带 hash 的产物 URL）
import simHeiUrl from "../assets/fonts/SimHei.ttf?url";

function feedbackLabel(fb: FeedbackChoice): string {
  if (fb === "very-matching") return "非常符合";
  if (fb === "partially-matching") return "部分符合";
  if (fb === "not-matching") return "不太符合";
  return "未反馈";
}

// ---- 字体注册（vendoring，去 pdfmake-chinese 依赖）----
// v3.8 修复：共享字体缓存（fontCache.ts），避免每次导出重复 fetch 9.7MB。
// v3.10 修复：addFontContainer + VFS 方式（data URL 字符串在 pdfmake 0.3.11 必失败）。
async function registerChineseFont() {
  return getSimHeiFontBase64(simHeiUrl);
}

export async function exportInterviewPDF(input: InterviewPDFInput): Promise<void> {
  try {
    // 懒加载 pdfmake（仅导出时拉取）
    const pdfMake = (await import("pdfmake/build/pdfmake")).default;
    const fontBase64 = await registerChineseFont();
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
    const doc = buildDocDefinition(input);
    const fname = `ALIS_访谈报告_${input.metadata.sessionId}_${new Date().toISOString().slice(0, 10)}.pdf`;
    pdfMake.createPdf(doc).download(fname);
  } catch (e) {
    console.error("PDF 导出失败", e);
    const msg = e instanceof Error ? e.message : String(e);
    alert(`PDF 生成失败：${msg}\n\n请重试。如持续失败请联系管理员。`);
  }
}

// ---- 构建 doc definition ----
function buildDocDefinition(input: InterviewPDFInput): TDocumentDefinitions {
  const { session, styleResult, responses, questionTexts, bubbles, feedbackChoice, reflectionText, metadata } = input;
  const typeDef = styleResult.typeDef;
  const tc = getTypeCharacteristics(styleResult.typeCode);
  const fb = feedbackLabel(feedbackChoice);

  // 板块 4：Q1-Q15 作答表
  const likertRows = Object.keys(questionTexts).length > 0
    ? Object.entries(questionTexts).map(([qId, text]) => {
        const score = responses[qId];
        const answer = score !== undefined ? `${score} 分 · ${scoreLabel(score)}` : "未回答";
        return [qId, text, answer];
      })
    : Array.from({ length: 15 }, (_, i) => {
        const qId = `Q${i + 1}`;
        const score = responses[qId];
        const answer = score !== undefined ? `${score} 分 · ${scoreLabel(score)}` : "未回答";
        return [qId, `（Q${i + 1} 题干）`, answer];
      });

  // 板块 5：访谈记录表
  const recordRows = session.records.map((r: InterviewRecord) => [
    `阶段 ${r.stageId}`,
    r.questionId ?? "-",
    r.interviewerNote || "-",
    r.respondentReply || "-",
    new Date(r.timestamp).toLocaleTimeString("zh-CN"),
  ]);

  // 板块 6：思维气泡
  const bubbleRows = bubbles.map((b) => [
    b.status === "pending" ? "待处理" : "已处理",
    b.mode === "deep-listen" ? "深度倾听" : "快速记录",
    b.content,
    new Date(b.createdAt).toLocaleTimeString("zh-CN"),
  ]);

  // 板块 2：风格位置表
  const dimRows = styleResult.dimensions.map((dim) => [
    dim.dimId,
    dim.position,
    `${dim.polarity > 0 ? "正向" : "反向"} (${dim.polarity})`,
    dim.positionLabel ?? "",
  ]);

  return {
    content: [
      // 1. 封面
      { text: "ALIS 访谈报告", style: "h1" },
      { text: "AI 素养情境化访谈系统", style: "subtitle" },
      { canvas: [{ type: "line", x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 2, lineColor: "#7c3aed" }] },
      { text: `会话 ID：${metadata.sessionId}`, margin: [0, 8, 0, 0] },
      { text: `访谈者：${metadata.facilitatorId}` },
      { text: `导出时间：${new Date(metadata.exportedAt).toLocaleString("zh-CN")}` },
      { text: `访谈开始：${new Date(session.startedAt).toLocaleString("zh-CN")}` },
      { text: `完成阶段：${session.completedStages.length} / 5 · 记录：${session.records.length} 条` },

      // 2. 风格分析
      { text: "一、风格分析", style: "h2" },
      { text: `你的 AI 协作风格：${styleResult.typeCode} — ${typeDef?.fullName ?? "未知"}`, bold: true },
      ...(tc
        ? [
            {
              ul: [
                tc.animalDescription ? `${typeDef.animalName}：${tc.animalDescription}` : "",
                tc.memeDescription ? `${typeDef.memeName}：${tc.memeDescription}` : "",
              ].filter(Boolean),
            },
          ]
        : []),
      { table: { headerRows: 1, widths: ["auto", "auto", "auto", "*"], body: [
        ["维度", "位置", "极性", "标签"],
        ...dimRows,
      ]}, margin: [0, 6, 0, 6] },

      // 3. 特点 + 无优劣说明
      { text: "二、你的特点", style: "h2" },
      {
        ul: (tc?.characteristics ?? typeDef?.characteristics ?? []).map((c: string) => c),
      },
      { text: `无优劣说明：${tc?.valueNote ?? ""}`, style: "muted", margin: [0, 4, 0, 0] },

      // 4. Q1-Q15 作答
      { text: "三、15 题 Likert 作答", style: "h2" },
      { table: { headerRows: 1, widths: ["auto", "*", "auto"], body: [
        ["题号", "题干", "受访者作答"],
        ...likertRows,
      ]}, fontSize: 8 },

      // 5. 访谈记录
      { text: `四、访谈记录（共 ${session.records.length} 条）`, style: "h2" },
      session.records.length > 0
        ? { table: { headerRows: 1, widths: ["auto", "auto", "*", "*", "auto"], body: [
            ["阶段", "题号", "追问/引导语", "受访者回复", "时间"],
            ...recordRows,
          ]}, fontSize: 8 }
        : { text: "无访谈记录。", style: "muted" },

      // 6. 思维气泡
      { text: `五、思维气泡（共 ${bubbles.length} 个）`, style: "h2" },
      bubbles.length > 0
        ? { table: { headerRows: 1, widths: ["auto", "auto", "*", "auto"], body: [
            ["状态", "模式", "内容", "时间"],
            ...bubbleRows,
          ]}, fontSize: 8 }
        : { text: "无思维气泡。", style: "muted" },

      // 7. 受访者反馈
      { text: "六、受访者反馈", style: "h2" },
      { text: `符合度选择：${fb}` },
      { text: `反思文字：${reflectionText || "无"}` },

      // 8. 理论说明
      { text: "七、本研究说明", style: "h2" },
      { text: styleResult.valueStatement?.theoryInnovation ?? "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从\"能力高低\"转向\"风格差异\"，从\"规范达标\"转向\"认知多元\"。每种协作风格都是个体与AI互动的独特模式，值得理解和尊重。", style: "muted", fontSize: 8 },

      // 9. 结束
      { text: "— 报告结束 —", alignment: "center", margin: [0, 16, 0, 0], color: "#9ca3af" },
    ],
    styles: {
      h1: { fontSize: 22, bold: true, color: "#7c3aed", margin: [0, 0, 0, 4] },
      subtitle: { fontSize: 12, color: "#6b7280", margin: [0, 0, 0, 8] },
      h2: { fontSize: 14, bold: true, color: "#4f46e5", margin: [0, 14, 0, 6], decoration: "underline", decorationColor: "#c4b5fd" },
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
      text: `ALIS 自动生成 · 第 ${currentPage} / ${pageCount} 页 · ${metadata.exportedAt}`,
      alignment: "center",
      fontSize: 7,
      color: "#9ca3af",
      margin: [0, 8, 0, 0],
    }),
  };
}
