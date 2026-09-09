// persistDraft / sessionStore / interviewRestore 单元测试（v3.11 事故 1 修复）。
// 注意：localStorage 需要 jsdom 环境（文件头声明）。
// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import {
  clearDraft,
  draftKey,
  flushAllDrafts,
  isDraftKey,
  readDraft,
  writeDraft,
  type DraftPayload,
} from "../src/utils/persistDraft";
import {
  clearSession,
  loadSession,
  saveSession,
  saveSimpleResponses,
  loadSimpleResponses,
} from "../src/utils/sessionStore";
import {
  recordsToInterviewSession,
  snapshotToStyleProfile,
  type RecordOutIn,
} from "../src/utils/interviewRestore";

function makeDraft(sessionId: string, nRecords = 2): DraftPayload {
  return {
    v: 1,
    savedAt: "2026-08-02T10:05:00",
    session_id: sessionId,
    style_result: { styleId: "UVR" },
    feedback_choice: null,
    reflection_text: "",
    records: Array.from({ length: nRecords }, (_, i) => ({
      stageId: 1,
      interviewerNote: `追问${i}`,
      respondentReply: `回答${i}`,
      timestamp: "2026-08-02T10:05:00",
    })),
    current_stage: 1,
    completed_stages: [],
  };
}

describe("persistDraft", () => {
  beforeEach(() => localStorage.clear());

  it("writeDraft → readDraft 往返", () => {
    const d = makeDraft("sess-1");
    writeDraft(d);
    const got = readDraft("sess-1");
    expect(got?.session_id).toBe("sess-1");
    expect(got?.records).toHaveLength(2);
  });

  it("clearDraft 删除", () => {
    writeDraft(makeDraft("sess-1"));
    clearDraft("sess-1");
    expect(readDraft("sess-1")).toBeNull();
  });

  it("脏数据 → readDraft null（JSON 损坏/缺字段不崩）", () => {
    localStorage.setItem(draftKey("sess-bad"), "{not json");
    expect(readDraft("sess-bad")).toBeNull();
    localStorage.setItem(draftKey("sess-missing"), JSON.stringify({ v: 1 }));
    expect(readDraft("sess-missing")).toBeNull();
  });

  it("isDraftKey 前缀匹配", () => {
    expect(isDraftKey(draftKey("sess-1"))).toBe(true);
    expect(isDraftKey("alis_interview_xxx")).toBe(false);
    expect(isDraftKey("al:interview:draft:v1:sess-2")).toBe(true);
  });

  it("flushAllDrafts：按 savedAt 升序上传成功并清除", async () => {
    const d1 = makeDraft("sess-a", 1);
    d1.savedAt = "2026-08-02T09:00:00";
    const d2 = makeDraft("sess-b", 2);
    d2.savedAt = "2026-08-02T11:00:00";
    writeDraft(d1);
    writeDraft(d2);
    const order: string[] = [];
    const { flushed, deleted } = await flushAllDrafts(async (p) => {
      order.push(p.session_id);
    });
    expect(flushed).toBe(2);
    expect(deleted).toBe(0);
    expect(order).toEqual(["sess-a", "sess-b"]); // 升序
    expect(readDraft("sess-a")).toBeNull();
    expect(readDraft("sess-b")).toBeNull();
  });

  it("flushAllDrafts：上传失败保留草稿；脏键被删除", async () => {
    writeDraft(makeDraft("sess-keep", 1));
    localStorage.setItem(draftKey("sess-dirty"), "{broken");
    const { flushed, deleted } = await flushAllDrafts(async () => {
      throw new Error("offline");
    });
    expect(flushed).toBe(0);
    expect(deleted).toBe(1); // 脏键删除
    expect(readDraft("sess-keep")).not.toBeNull(); // 合法草稿保留
  });
});

describe("sessionStore", () => {
  beforeEach(() => localStorage.clear());

  it("saveSession → loadSession 往返（TTL 内）", () => {
    saveSession({
      session_id: "sess-1",
      facilitator_id: "f-1",
      condition: "exposed",
      mode: "simple",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    expect(loadSession()?.session_id).toBe("sess-1");
  });

  it("clearSession 清除", () => {
    saveSession({
      session_id: "sess-1",
      facilitator_id: "f-1",
      condition: "control",
      mode: "simple",
      started_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    clearSession();
    expect(loadSession()).toBeNull();
  });

  it("过期会话（TTL 7 天外）→ null 并清除", () => {
    localStorage.setItem(
      "al:session:v1",
      JSON.stringify({
        session_id: "old",
        facilitator_id: "f",
        condition: "exposed",
        mode: "simple",
        started_at: "2026-01-01T00:00:00",
        updated_at: "2026-01-01T00:00:00",
      }),
    );
    expect(loadSession()).toBeNull();
    expect(localStorage.getItem("al:session:v1")).toBeNull();
  });

  it("simple responses 往返", () => {
    saveSimpleResponses("sess-1", { Q1: 6, Q2: 5 });
    expect(loadSimpleResponses("sess-1")).toEqual({ Q1: 6, Q2: 5 });
    expect(loadSimpleResponses("sess-2")).toBeNull();
  });
});

describe("interviewRestore", () => {
  it("snapshotToStyleProfile：有效 typeCode → StyleProfileV3", () => {
    const prof = snapshotToStyleProfile({
      styleId: "UVR",
      confidence: 0.04,
      dimensionScores: { "E-U": -0.3, "T-V": -0.3, "F-R": -0.2 },
      feedbackChoice: null,
      reflectionText: null,
    });
    expect(prof?.typeCode).toBe("UVR");
    expect(prof?.dimensions).toHaveLength(3);
    expect(prof?.typeDef.fullName).toBeTruthy();
  });

  it("snapshotToStyleProfile：unknown/无效 → null", () => {
    expect(snapshotToStyleProfile(null)).toBeNull();
    expect(
      snapshotToStyleProfile({
        styleId: "unknown",
        confidence: 0,
        dimensionScores: {},
        feedbackChoice: null,
        reflectionText: null,
      }),
    ).toBeNull();
    expect(
      snapshotToStyleProfile({
        styleId: "ZZZ",
        confidence: 0,
        dimensionScores: {},
        feedbackChoice: null,
        reflectionText: null,
      }),
    ).toBeNull();
  });

  it("recordsToInterviewSession：推导 currentStage/completedStages", () => {
    const records: RecordOutIn[] = [
      {
        stage_id: 1,
        question_id: "Q1",
        follow_up_id: null,
        contradiction_id: null,
        interviewer_note: "追问",
        respondent_reply: "回答",
        recorded_at: "2026-08-02T10:05:00",
      },
      {
        stage_id: 2,
        question_id: "Q2",
        follow_up_id: "CONTRADICTION_1",
        contradiction_id: "C01",
        interviewer_note: "",
        respondent_reply: "",
        recorded_at: "2026-08-02T10:06:00",
      },
    ];
    const prof = snapshotToStyleProfile({
      styleId: "UVR",
      confidence: 0.04,
      dimensionScores: {},
      feedbackChoice: null,
      reflectionText: null,
    });
    expect(prof).not.toBeNull();
    const session = recordsToInterviewSession(records, prof!, null, []);
    expect(session.records).toHaveLength(2);
    expect(session.currentStage).toBe(2); // max stage_id 推导
    expect(session.completedStages).toEqual([1, 2]);
    // follow_up_id 已存在时直接用（不重新编码）
    expect(session.records[1]?.followUpId).toBe("CONTRADICTION_1");
  });
});
