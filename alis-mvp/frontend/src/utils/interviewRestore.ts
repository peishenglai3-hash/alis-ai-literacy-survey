// 后端快照 → 前端状态恢复转换（v3.11 事故 1 修复：刷新后 getInterview 回填）。
//
// 后端 InterviewGetResult 的 style_snapshot 是 {styleId, confidence, dimensionScores,
// feedbackChoice, reflectionText}，前端需要 StyleProfileV3 + InterviewSession。
// 转换函数纯函数化（可单测）；缺字段保守默认，旧数据（NULL）不崩。

import type { StyleProfileV3 } from "../domain/styleClassifier";
import { getTypeDefV3 } from "../content/typeDefinitions";
import type { InterviewSession, InterviewRecord } from "../ui/InterviewScreen";

export interface StyleSnapshotIn {
  styleId: string;
  confidence: number;
  dimensionScores: Record<string, number>;
  feedbackChoice: string | null;
  reflectionText: string | null;
}

/** 后端风格快照 → StyleProfileV3（typeCode 无效时返回 null，调用方走"无类型"降级）。 */
export function snapshotToStyleProfile(snap: StyleSnapshotIn | null): StyleProfileV3 | null {
  if (!snap || !snap.styleId || snap.styleId === "unknown") return null;
  const typeDef = getTypeDefV3(snap.styleId);
  if (!typeDef) return null;
  const dimScores = snap.dimensionScores ?? {};
  return {
    typeCode: snap.styleId,
    typeDef,
    typeConfidence: snap.confidence ?? 0,
    dimensions: Object.entries(dimScores).map(([dimId, polarity]) => ({
      dimId,
      polarity,
      confidence: Math.min(1, Math.abs(polarity) / 4 + 0.5),
      position: polarity > 0 ? "E" : "U",
      positionLabel: polarity > 0 ? "正向" : "反向",
      scores: { positive: 0, negative: 0 },
    })),
    valueStatement: {
      noHierarchy: "每种风格没有优劣之分，只是与AI协作方式不同。",
      theoryInnovation: "本研究基于MAILS、清华等AI素养量表，但进行关键理论转向：从\"能力高低\"转向\"风格差异\"。",
    },
    reflectionQuestions: typeDef.interviewGuidance ?? [],
  };
}

export interface RecordOutIn {
  stage_id: number;
  question_id: string | null;
  follow_up_id: string | null;
  contradiction_id: string | null;
  interviewer_note: string;
  respondent_reply: string;
  recorded_at: string | null;
}

/** 后端记录 → 前端 InterviewRecord（recorded_at → timestamp；contradiction_id 并入 followUpId 前缀）。 */
export function recordToInterviewRecord(r: RecordOutIn): InterviewRecord {
  return {
    stageId: r.stage_id,
    questionId: r.question_id ?? undefined,
    // 后端 contradiction_id 与 follow_up_id 分列；前端单一 followUpId 承载，
    // 矛盾追问用 CONTRADICTION_ 前缀标记（与 save 时的编码对应）
    followUpId:
      r.follow_up_id ??
      (r.contradiction_id ? `CONTRADICTION_${r.contradiction_id}` : undefined),
    interviewerNote: r.interviewer_note ?? "",
    respondentReply: r.respondent_reply ?? "",
    timestamp: r.recorded_at ?? new Date().toISOString(),
  };
}

/** 后端记录列表 → InterviewSession（currentStage 缺省用 max(stage_id)，completedStages 推导）。 */
export function recordsToInterviewSession(
  records: RecordOutIn[],
  styleResult: StyleProfileV3,
  currentStage: number | null,
  completedStages: number[],
): InterviewSession {
  const items = records.map(recordToInterviewRecord);
  const maxStage = items.length > 0 ? Math.max(...items.map((r) => r.stageId)) : 1;
  const done = completedStages.length > 0 ? completedStages : [...new Set(items.map((r) => r.stageId))];
  return {
    styleResult,
    records: items,
    currentStage: currentStage ?? maxStage,
    completedStages: done,
    startedAt: items[0]?.timestamp ?? new Date().toISOString(),
  };
}
