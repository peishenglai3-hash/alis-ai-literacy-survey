// 数据导出工具（v3.4 Feature 4）。
// 来源：C:\Users\35636\Downloads\726反馈2.1\产品整体反思_从模块化到空间化_v3.3设计升级.md 第八章 8.1 回顾模式
//
// 设计：客户端生成可下载的研究数据文件。三种格式：
// - JSON：完整结构化数据（给研究者编程分析）
// - CSV：UTF-8 BOM + 分 section（给 Excel 分析）
// - DOC：HTML 包裹的 .doc（给 Word 打开，格式友好）
//
// 零外部依赖，全部使用浏览器 Blob API。

import type { InterviewSession, InterviewRecord } from "../ui/InterviewScreen";
import type { ThoughtBubble } from "../ui/ThoughtBubblePanel";
import type { StyleProfileV3 } from "../domain/styleClassifier";
import type { FeedbackChoice } from "../ui/StyleResultScreen";

// ============================================================================
// 类型定义
// ============================================================================

export type ExportFormat = "json" | "csv" | "doc" | "pdf";

export interface ExportData {
  session: InterviewSession;
  styleResult: StyleProfileV3;
  responses: Record<string, number>;
  bubbles: ThoughtBubble[];
  feedbackChoice: FeedbackChoice;
  reflectionText: string;
  metadata: ExportMetadata;
}

export interface ExportMetadata {
  exportedAt: string;
  version: string;
  facilitatorId: string;
  sessionId: string;
}

// ============================================================================
// 通用下载
// ============================================================================

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ============================================================================
// JSON 导出
// ============================================================================

export function exportAsJSON(data: ExportData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  downloadBlob(blob, `alis_interview_${data.metadata.sessionId}.json`);
}

// ============================================================================
// CSV 导出
// ============================================================================

function escapeCSV(field: string): string {
  if (field.includes(",") || field.includes('"') || field.includes("\n") || field.includes("\r")) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

export function exportAsCSV(data: ExportData): void {
  const sections: string[] = [];

  // Section 1: 元信息
  sections.push("=== ALIS 访谈元信息 ===");
  sections.push(["字段", "值"].join(","));
  sections.push(["导出时间", data.metadata.exportedAt].join(","));
  sections.push(["版本", data.metadata.version].join(","));
  sections.push(["访谈者", data.metadata.facilitatorId].join(","));
  sections.push(["会话ID", data.metadata.sessionId].join(","));
  sections.push(["风格类型", data.styleResult.typeCode].join(","));
  sections.push(["类型全称", data.styleResult.typeDef?.fullName ?? ""].join(","));
  sections.push(["访谈开始", data.session.startedAt].join(","));
  sections.push(["完成阶段数", String(data.session.completedStages.length)].join(","));
  sections.push(["记录总数", String(data.session.records.length)].join(","));
  const fbLabel =
    data.feedbackChoice === "very-matching" ? "非常符合"
    : data.feedbackChoice === "partially-matching" ? "部分符合"
    : data.feedbackChoice === "not-matching" ? "不太符合"
    : "未反馈";
  sections.push(["反馈选项", fbLabel].join(","));
  sections.push(["反馈反思", escapeCSV(data.reflectionText || "无")].join(","));
  sections.push("");

  // Section 2: 15题 Likert 回答
  sections.push("=== 15题 Likert 回答 ===");
  sections.push(["题号", "分数"].join(","));
  for (let i = 1; i <= 15; i++) {
    const qId = `Q${i}`;
    const score = data.responses[qId];
    sections.push([qId, score !== undefined ? String(score) : "未回答"].join(","));
  }
  sections.push("");

  // Section 3: 访谈记录
  sections.push("=== 访谈记录 ===");
  sections.push(["阶段ID", "题号", "追问/引导语", "受访者回复", "时间戳"].join(","));
  for (const r of data.session.records) {
    sections.push([
      String(r.stageId),
      r.questionId ?? "",
      escapeCSV(r.interviewerNote),
      escapeCSV(r.respondentReply),
      r.timestamp,
    ].join(","));
  }
  sections.push("");

  // Section 4: 思维气泡
  sections.push("=== 思维气泡 ===");
  sections.push(["气泡ID", "内容", "状态", "模式", "创建时间", "处理时间"].join(","));
  for (const b of data.bubbles) {
    sections.push([
      b.id,
      escapeCSV(b.content),
      b.status,
      b.mode,
      b.createdAt,
      b.processedAt ?? "",
    ].join(","));
  }
  sections.push("");

  // Section 5: 维度得分
  sections.push("=== 3维度位置 ===");
  sections.push(["维度ID", "位置", "极性方向"].join(","));
  for (const dim of data.styleResult.dimensions) {
    sections.push([
      dim.dimId,
      dim.position,
      dim.polarity > 0 ? "正向" : "反向",
    ].join(","));
  }

  const csv = "\uFEFF" + sections.join("\n"); // BOM for Excel UTF-8
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  downloadBlob(blob, `alis_interview_${data.metadata.sessionId}.csv`);
}

// ============================================================================
// DOC 导出（HTML 包裹的 .doc，Word 可打开）
// ============================================================================

export function exportAsDOC(data: ExportData): void {
  const typeDef = data.styleResult.typeDef;
  const pendingBubbles = data.bubbles.filter((b) => b.status === "pending").length;
  const processedBubbles = data.bubbles.filter((b) => b.status === "processed").length;
  const answeredCount = Object.values(data.responses).filter(
    (v) => v !== undefined && v !== null,
  ).length;

  const recordsHTML = data.session.records
    .map(
      (r) => `
    <tr>
      <td>阶段 ${r.stageId}</td>
      <td>${r.questionId ?? "-"}</td>
      <td>${escapeHTML(r.interviewerNote)}</td>
      <td>${escapeHTML(r.respondentReply)}</td>
      <td>${new Date(r.timestamp).toLocaleTimeString("zh-CN")}</td>
    </tr>`,
    )
    .join("");

  const bubblesHTML = data.bubbles
    .map(
      (b) => `
    <tr>
      <td>${b.status === "pending" ? "待处理" : "已处理"}</td>
      <td>${b.mode === "deep-listen" ? "深度倾听" : "快速记录"}</td>
      <td>${escapeHTML(b.content)}</td>
      <td>${new Date(b.createdAt).toLocaleTimeString("zh-CN")}</td>
    </tr>`,
    )
    .join("");

  const dimensionsHTML = data.styleResult.dimensions
    .map(
      (dim) => `
    <tr>
      <td>${dim.dimId}</td>
      <td>${dim.polarity > 0 ? "正向" : "反向"}</td>
      <td>${dim.position}</td>
    </tr>`,
    )
    .join("");

  const responsesHTML = Array.from({ length: 15 }, (_, i) => {
    const qId = `Q${i + 1}`;
    const score = data.responses[qId];
    return `
    <tr>
      <td>${qId}</td>
      <td>${score !== undefined ? score : "未回答"}</td>
    </tr>`;
  }).join("");

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="generator" content="ALIS v3.4">
<title>ALIS 访谈报告 - ${data.metadata.sessionId}</title>
<style>
  body { font-family: "Microsoft YaHei", "SimSun", sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1f2937; line-height: 1.7; }
  h1 { text-align: center; color: #7c3aed; font-size: 1.5rem; border-bottom: 2px solid #7c3aed; padding-bottom: 12px; }
  h2 { color: #4f46e5; font-size: 1.1rem; margin-top: 32px; border-left: 4px solid #c4b5fd; padding-left: 10px; }
  table { width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 0.85rem; }
  th, td { border: 1px solid #e5e7eb; padding: 8px 10px; text-align: left; }
  th { background: #f5f3ff; font-weight: 600; }
  .meta { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 12px 0; }
  .meta p { margin: 4px 0; font-size: 0.9rem; }
  .signature { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 0.8rem; border-top: 1px solid #e5e7eb; padding-top: 16px; }
</style>
</head>
<body>

<h1>📋 ALIS 访谈报告</h1>

<div class="meta">
  <p><strong>会话ID：</strong>${data.metadata.sessionId}</p>
  <p><strong>访谈者：</strong>${data.metadata.facilitatorId}</p>
  <p><strong>导出时间：</strong>${new Date(data.metadata.exportedAt).toLocaleString("zh-CN")}</p>
  <p><strong>风格类型：</strong>${data.styleResult.typeCode} — ${typeDef?.fullName ?? "未知"}</p>
  <p><strong>访谈开始：</strong>${new Date(data.session.startedAt).toLocaleString("zh-CN")}</p>
  <p><strong>答题覆盖：</strong>${answeredCount} / 15 题 | <strong>完成阶段：</strong>${data.session.completedStages.length} / 5</p>
  <p><strong>访谈记录：</strong>${data.session.records.length} 条 | <strong>思维气泡：</strong>${data.bubbles.length} 个（待处理 ${pendingBubbles} · 已处理 ${processedBubbles}）</p>
  <p><strong>受访者反馈：</strong>${data.feedbackChoice === "very-matching" ? "非常符合" : data.feedbackChoice === "partially-matching" ? "部分符合" : data.feedbackChoice === "not-matching" ? "不太符合" : "未反馈"}${data.reflectionText ? ` —— ${escapeHTML(data.reflectionText)}` : ""}</p>
</div>

<h2>1. 15题 Likert 回答</h2>
<table>
  <tr><th>题号</th><th>分数（1-7）</th></tr>
  ${responsesHTML}
</table>

<h2>2. 三维度位置</h2>
<table>
  <tr><th>维度</th><th>极性</th><th>位置</th></tr>
  ${dimensionsHTML}
</table>

<h2>3. 访谈记录（共 ${data.session.records.length} 条）</h2>
<table>
  <tr><th>阶段</th><th>题号</th><th>追问/引导语</th><th>受访者回复</th><th>时间</th></tr>
  ${recordsHTML || '<tr><td colspan="5" style="text-align:center;color:#9ca3af;">无记录</td></tr>'}
</table>

<h2>4. 思维气泡（共 ${data.bubbles.length} 个）</h2>
<table>
  <tr><th>状态</th><th>模式</th><th>内容</th><th>时间</th></tr>
  ${bubblesHTML || '<tr><td colspan="4" style="text-align:center;color:#9ca3af;">无气泡</td></tr>'}
</table>

<div class="signature">
  <p>本报告由 ALIS（AI 素养情境化访谈系统）v3.4 自动生成。</p>
  <p>导出时间：${new Date(data.metadata.exportedAt).toLocaleString("zh-CN")}</p>
</div>

</body>
</html>`;

  const blob = new Blob([html], {
    type: "application/msword;charset=utf-8",
  });
  downloadBlob(blob, `alis_interview_${data.metadata.sessionId}.doc`);
}

// ============================================================================
// 统一导出入口
// ============================================================================

export function exportData(data: ExportData, format: ExportFormat): void {
  switch (format) {
    case "json":
      exportAsJSON(data);
      break;
    case "csv":
      exportAsCSV(data);
      break;
    case "doc":
      exportAsDOC(data);
      break;
  }
}

// ============================================================================
// 辅助函数
// ============================================================================

function escapeHTML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
