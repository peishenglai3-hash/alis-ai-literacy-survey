// 7 点制 Likert 分数 → 中文锚点词（全项目唯一真源，v3.10 收敛）。
// 背景：interviewPDF.ts / CompletionReportScreen.tsx / InterviewScreen.tsx 曾各有一份
// 逐字相同的私有副本，复制漂移会导致同一会话内不同 PDF 口径不一（数据完整性风险）。
// 本模块为唯一出口，三处共用。行为契约：>=7→非常同意；6/5/4/3/2 各档；<2（含 0、负数、NaN）→非常不同意。
export function scoreLabel(score: number): string {
  if (score >= 7) return "非常同意";
  if (score >= 6) return "比较同意";
  if (score >= 5) return "有点同意";
  if (score >= 4) return "中立 / 不确定";
  if (score >= 3) return "有点不同意";
  if (score >= 2) return "比较不同意";
  return "非常不同意";
}
