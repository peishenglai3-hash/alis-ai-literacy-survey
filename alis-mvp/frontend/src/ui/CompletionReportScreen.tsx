// 访谈完成报告页（v3.9 — 单页全量展示 + window.print() 导出 PDF）。
// 替代 pdfmake 方案：把风格分析 + Q1-Q15 作答 + 访谈记录 + 思维气泡 + 反馈
// 全部渲染到一个 React 页面，点击"打印 PDF"→ 浏览器原生 window.print() → 另存为 PDF。
//
// 设计决策：
//   - 零额外依赖（不加载 pdfmake / html2canvas / jsPDF）
//   - 所见即所得——屏幕上看到的即 PDF 内容
//   - 中文由浏览器原生渲染（PingFang SC / Microsoft YaHei / Noto Sans SC 系统字体栈）
//   - @media print CSS 控制打印样式（隐藏工具栏、强制展开折叠区、控制分页）
//   - 保留 interviewPDF.ts / styleResultPDF.ts（标记 deprecated，不删除）

import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getTypeCharacteristics } from "../data/typeCharacteristics";
import { StyleComparisonBarChart } from "./StyleComparisonBarChart";
import { STAGE_NAMES, STAGE_EMOJIS } from "../content/stageQuestions";
import type { InterviewSession, InterviewRecord } from "./InterviewScreen";
import type { ThoughtBubble } from "./ThoughtBubblePanel";
import type { FeedbackChoice } from "./StyleResultScreen";
import { scoreLabel } from "../utils/scoreLabel";
import "./CompletionReportScreen.css";

function feedbackLabel(fb: FeedbackChoice): string {
  if (fb === "very-matching") return "非常符合";
  if (fb === "partially-matching") return "部分符合";
  if (fb === "not-matching") return "不太符合";
  return "未反馈";
}

/** 按阶段分组访谈记录 */
function groupRecordsByStage(records: InterviewRecord[]): Map<number, InterviewRecord[]> {
  const map = new Map<number, InterviewRecord[]>();
  for (const r of records) {
    const list = map.get(r.stageId) ?? [];
    list.push(r);
    map.set(r.stageId, list);
  }
  return map;
}

export interface CompletionReportScreenProps {
  styleResult: StyleProfileV3;
  responses: Record<string, number>;
  questionTexts: Record<string, string>;
  session: InterviewSession;
  bubbles: ThoughtBubble[];
  feedbackChoice: FeedbackChoice;
  reflectionText: string;
  facilitatorId: string;
  sessionId: string;
  onRestart: () => void;
}

export function CompletionReportScreen({
  styleResult,
  responses,
  questionTexts,
  session,
  bubbles,
  feedbackChoice,
  reflectionText,
  facilitatorId,
  sessionId,
  onRestart,
}: CompletionReportScreenProps) {
  const typeDef = styleResult.typeDef;
  const tc = getTypeCharacteristics(styleResult.typeCode);
  const now = new Date();
  const exportedAt = now.toLocaleString("zh-CN");
  const exportedAtISO = now.toISOString().slice(0, 10);

  const recordsByStage = groupRecordsByStage(session.records);
  const allStages = [1, 2, 3, 4, 5];
  const answeredCount = Object.values(responses).filter((v) => v !== undefined && v !== null).length;

  // Likert 作答表行
  const likertRows = Object.entries(questionTexts).length > 0
    ? Object.entries(questionTexts).map(([qId, text]) => {
        const score = responses[qId];
        const answer = score !== undefined ? `${score} 分 · ${scoreLabel(score)}` : "未回答";
        return { qId, text, answer, score };
      })
    : Array.from({ length: 15 }, (_, i) => {
        const qId = `Q${i + 1}`;
        const score = responses[qId];
        const answer = score !== undefined ? `${score} 分 · ${scoreLabel(score)}` : "未回答";
        return { qId, text: `（Q${i + 1} 题干）`, answer, score };
      });

  // 维度表行
  const dimRows = styleResult.dimensions.map((dim) => ({
    dimId: dim.dimId,
    position: dim.position,
    polarity: `${dim.polarity > 0 ? "正向" : "反向"} (${dim.polarity})`,
    label: dim.positionLabel ?? "",
  }));

  // 下载 JSON
  const handleDownloadJSON = () => {
    const data = {
      metadata: {
        exportedAt: exportedAtISO,
        version: "v3.9",
        facilitatorId,
        sessionId,
      },
      styleResult: {
        typeCode: styleResult.typeCode,
        typeName: typeDef?.fullName,
        dimensions: styleResult.dimensions.map((d) => ({
          dimId: d.dimId,
          polarity: d.polarity,
          position: d.position,
          positionLabel: d.positionLabel,
          scores: d.scores,
        })),
      },
      responses,
      feedback: {
        choice: feedbackChoice,
        label: feedbackLabel(feedbackChoice),
        reflection: reflectionText,
      },
      interviewRecords: session.records,
      bubbles: bubbles.map((b) => ({
        content: b.content,
        status: b.status,
        mode: b.mode,
        createdAt: b.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ALIS_访谈数据_${sessionId}_${exportedAtISO}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // 打印 PDF
  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="completion-report">
      {/* ======== 工具栏（打印时隐藏） ======== */}
      <div className="cr-toolbar no-print">
        <div className="cr-toolbar-left">
          <h2 className="cr-toolbar-title">📋 访谈完成报告</h2>
          <span className="cr-toolbar-meta">
            会话 {sessionId.slice(0, 8)}… · {answeredCount}/15 题 · {session.records.length} 条记录
          </span>
        </div>
        <div className="cr-toolbar-actions">
          <button className="primary" onClick={handlePrintPDF}>
            🖨️ 打印 PDF
          </button>
          <button className="secondary" onClick={handleDownloadJSON}>
            📥 下载 JSON
          </button>
          <button className="ghost" onClick={onRestart}>
            🔄 新访谈
          </button>
        </div>
      </div>

      {/* ======== 报告正文 ======== */}
      <div className="cr-body">

        {/* ---- 1. 封面 ---- */}
        <header className="cr-cover">
          <p className="cr-cover-label">ALIS 访谈报告</p>
          <h1 className="cr-cover-title">
            你是 <span className="cr-type-code">{styleResult.typeCode}</span> — {typeDef?.fullName ?? "未知"}
          </h1>
          <div className="cr-cover-meta">
            <span>会话 ID：{sessionId}</span>
            <span>访谈者：{facilitatorId}</span>
            <span>导出时间：{exportedAt}</span>
            <span>访谈开始：{new Date(session.startedAt).toLocaleString("zh-CN")}</span>
            <span>完成阶段：{session.completedStages.length} / 5 · 记录：{session.records.length} 条</span>
          </div>
          <hr className="cr-divider" />
        </header>

        {/* ---- 2. 风格分析 ---- */}
        <section className="cr-section">
          <h2 className="cr-h2">一、风格分析</h2>

          {/* 双标签 */}
          {tc && (
            <div className="cr-dual-labels">
              <p>• {typeDef?.animalName}：{tc.animalDescription}</p>
              <p>• {typeDef?.memeName}：{tc.memeDescription}</p>
            </div>
          )}

          {/* 3 维对比条形图 */}
          <div className="cr-chart-wrap">
            <StyleComparisonBarChart styleProfile={styleResult} />
          </div>

          {/* 维度位置表 */}
          <table className="cr-table cr-table--compact">
            <thead>
              <tr>
                <th>维度</th>
                <th>位置</th>
                <th>极性</th>
                <th>标签</th>
              </tr>
            </thead>
            <tbody>
              {dimRows.map((d) => (
                <tr key={d.dimId}>
                  <td className="cr-mono">{d.dimId}</td>
                  <td>{d.position}</td>
                  <td>{d.polarity}</td>
                  <td>{d.label}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ---- 3. 特点 + 无优劣说明 ---- */}
        <section className="cr-section">
          <h2 className="cr-h2">二、你的特点</h2>
          {tc ? (
            <ul className="cr-checklist">
              {tc.characteristics.map((c, i) => (
                <li key={i}>✓ {c}</li>
              ))}
            </ul>
          ) : (
            <ul className="cr-checklist">
              {(typeDef?.characteristics ?? []).map((c: string, i: number) => (
                <li key={i}>✓ {c}</li>
              ))}
            </ul>
          )}
          <p className="cr-value-note">
            ⚠️ 无优劣说明：{tc?.valueNote ?? ""}
          </p>
        </section>

        {/* ---- 4. Q1-Q15 Likert 作答 ---- */}
        <section className="cr-section">
          <h2 className="cr-h2">三、15 题 Likert 作答</h2>
          <table className="cr-table cr-table--likert">
            <thead>
              <tr>
                <th className="cr-col-q">题号</th>
                <th className="cr-col-stem">题干</th>
                <th className="cr-col-answer">受访者作答</th>
              </tr>
            </thead>
            <tbody>
              {likertRows.map((row) => (
                <tr key={row.qId}>
                  <td className="cr-mono cr-col-q">{row.qId}</td>
                  <td className="cr-col-stem">{row.text}</td>
                  <td className="cr-col-answer">{row.answer}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* ---- 5. 访谈记录 ---- */}
        <section className="cr-section">
          <h2 className="cr-h2">四、访谈记录（共 {session.records.length} 条）</h2>
          {session.records.length === 0 ? (
            <p className="cr-muted">无访谈记录。</p>
          ) : (
            allStages.map((stageId) => {
              const records = recordsByStage.get(stageId) ?? [];
              if (records.length === 0) return null;
              return (
                <div key={stageId} className="cr-stage-block">
                  <h3 className="cr-stage-heading">
                    {STAGE_EMOJIS[stageId] ?? "📋"} 阶段 {stageId}：{STAGE_NAMES[stageId] ?? `阶段${stageId}`}
                    <span className="cr-stage-count">（{records.length} 条）</span>
                  </h3>
                  <table className="cr-table cr-table--records">
                    <thead>
                      <tr>
                        <th className="cr-col-stage">阶段</th>
                        <th className="cr-col-qid">题号</th>
                        <th className="cr-col-prompt">追问/引导语</th>
                        <th className="cr-col-reply">受访者回复</th>
                        <th className="cr-col-time">时间</th>
                      </tr>
                    </thead>
                    <tbody>
                      {records.map((r, i) => (
                        <tr key={i}>
                          <td className="cr-col-stage">{r.stageId}</td>
                          <td className="cr-mono cr-col-qid">{r.questionId ?? "-"}</td>
                          <td className="cr-col-prompt">{r.interviewerNote || "-"}</td>
                          <td className="cr-col-reply">{r.respondentReply || "-"}</td>
                          <td className="cr-mono cr-col-time">{new Date(r.timestamp).toLocaleTimeString("zh-CN")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })
          )}
        </section>

        {/* ---- 6. 思维气泡 ---- */}
        <section className="cr-section">
          <h2 className="cr-h2">五、思维气泡（共 {bubbles.length} 个）</h2>
          {bubbles.length === 0 ? (
            <p className="cr-muted">无思维气泡。</p>
          ) : (
            <table className="cr-table cr-table--bubbles">
              <thead>
                <tr>
                  <th className="cr-col-bstatus">状态</th>
                  <th className="cr-col-bmode">模式</th>
                  <th className="cr-col-bcontent">内容</th>
                  <th className="cr-col-btime">时间</th>
                </tr>
              </thead>
              <tbody>
                {bubbles.map((b) => (
                  <tr key={b.id}>
                    <td className="cr-col-bstatus">{b.status === "pending" ? "💭 待处理" : "✅ 已处理"}</td>
                    <td className="cr-col-bmode">{b.mode === "deep-listen" ? "深度倾听" : "快速记录"}</td>
                    <td className="cr-col-bcontent">{b.content}</td>
                    <td className="cr-mono cr-col-btime">{new Date(b.createdAt).toLocaleTimeString("zh-CN")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        {/* ---- 7. 受访者反馈 ---- */}
        <section className="cr-section">
          <h2 className="cr-h2">六、受访者反馈</h2>
          <p>
            <strong>符合度选择：</strong>{feedbackLabel(feedbackChoice)}
          </p>
          <p>
            <strong>反思文字：</strong>{reflectionText || "无"}
          </p>
        </section>

        {/* ---- 8. 理论说明 ---- */}
        <section className="cr-section">
          <details className="cr-details" open>
            <summary className="cr-summary">七、本研究说明</summary>
            <p className="cr-theory-text">
              {styleResult.valueStatement?.theoryInnovation ??
                "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从\"能力高低\"转向\"风格差异\"，从\"规范达标\"转向\"认知多元\"。每种协作风格都是个体与AI互动的独特模式，值得理解和尊重。"}
            </p>
          </details>
        </section>

        {/* ---- 9. 结束 ---- */}
        <footer className="cr-footer">
          <p className="cr-footer-text">— 报告结束 —</p>
          <p className="cr-footer-meta">
            ALIS 自动生成 · {exportedAt} · v3.9
          </p>
        </footer>

      </div>

      {/* ======== 打印提示（仅工具栏可见时显示） ======== */}
      <div className="cr-print-hint no-print">
        <p>
          💡 <strong>打印提示：</strong>点击"打印 PDF"后，在浏览器打印对话框中选择
          "<strong>另存为 PDF</strong>"即可下载。建议勾选"背景图形"以获得最佳效果。
        </p>
      </div>
    </div>
  );
}
