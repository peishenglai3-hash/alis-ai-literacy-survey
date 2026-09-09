// 访谈草稿持久化（v3.11 事故 1 修复核心）。
//
// 问题：刷新/卡顿即丢全部访谈内容。根因：保存仅阶段切换时触发 + 失败暂存用
// sessionStorage（关标签/杀后台即丢）+ 无后端回填路径。
//
// 方案：localStorage 草稿（跨会话、跨标签存活），每次保存先同步写本机（"最后已知
// 状态"），成功 POST 后清除；挂载时读取恢复。读写全 try/catch 静默降级——
// 隐私模式/QuotaExceeded 一律不崩表单。

const DRAFT_PREFIX = "al:interview:draft:v1:";

export interface DraftPayload {
  v: 1;
  savedAt: string; // ISO
  session_id: string;
  style_result: unknown;
  feedback_choice: string | null;
  reflection_text: string;
  records: unknown[];
  current_stage: number;
  completed_stages: number[];
  responses?: Record<string, number> | null;
}

export function draftKey(sessionId: string): string {
  return `${DRAFT_PREFIX}${sessionId}`;
}

export function isDraftKey(key: string): boolean {
  return key.startsWith(DRAFT_PREFIX);
}

/** 读取草稿；无/损坏/存储禁用 → null（绝不抛错）。 */
export function readDraft(sessionId: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(draftKey(sessionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftPayload>;
    if (parsed.v !== 1 || typeof parsed.session_id !== "string") return null;
    if (!Array.isArray(parsed.records)) return null;
    return parsed as DraftPayload;
  } catch {
    return null;
  }
}

/** 写入草稿（同步，先于一切网络请求）。存储不可用 → 静默。 */
export function writeDraft(payload: DraftPayload): void {
  try {
    localStorage.setItem(draftKey(payload.session_id), JSON.stringify(payload));
  } catch {
    /* 隐私模式/超限——静默降级，不打断访谈 */
  }
}

/** 清除草稿（成功 POST 后/用户丢弃后）。 */
export function clearDraft(sessionId: string): void {
  try {
    localStorage.removeItem(draftKey(sessionId));
  } catch {
    /* 静默 */
  }
}

/** 列出全部草稿键（localStorage）。 */
export function listDraftKeys(): string[] {
  try {
    const keys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && isDraftKey(k)) keys.push(k);
    }
    return keys;
  } catch {
    return [];
  }
}

/** 读取任意草稿键（flushAllDrafts 用）。 */
export function readDraftByKey(key: string): DraftPayload | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DraftPayload>;
    if (parsed.v !== 1 || typeof parsed.session_id !== "string") return null;
    if (!Array.isArray(parsed.records)) return null;
    return parsed as DraftPayload;
  } catch {
    return null;
  }
}

/** 按 savedAt 升序遍历全部草稿并逐一上传；成功清除、脏键删除。 */
export async function flushAllDrafts(
  saveFn: (p: DraftPayload) => Promise<unknown>,
): Promise<{ flushed: number; deleted: number }> {
  const keys = listDraftKeys();
  let flushed = 0;
  let deleted = 0;
  // 按 savedAt 升序（旧先传，天然串行防乱序）
  const drafts = keys
    .map((k) => ({ k, d: readDraftByKey(k) }))
    .filter((x): x is { k: string; d: DraftPayload } => x.d !== null)
    .sort((a, b) => (a.d.savedAt < b.d.savedAt ? -1 : 1));
  for (const { k, d } of drafts) {
    try {
      await saveFn(d);
      try {
        localStorage.removeItem(k);
        flushed++;
      } catch {
        /* 清除失败不影响下次重试 */
      }
    } catch {
      // 仍离线/409 → 保留草稿，下次 online 再试
    }
  }
  // 清理不可解析的脏键（防垃圾无限重试）
  for (const k of keys) {
    if (!drafts.some((x) => x.k === k)) {
      try {
        localStorage.removeItem(k);
        deleted++;
      } catch {
        /* 静默 */
      }
    }
  }
  return { flushed, deleted };
}
