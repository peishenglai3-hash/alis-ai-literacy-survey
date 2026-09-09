// 离线提交队列（点2·PWA）—— 落库失败/断网时把整包 commit 暂存本机 IndexedDB，
// 联网后自动重放。参与者数据不因网络抖动丢失（研究伦理底线：不静默丢数据）。
// ============================================================================
// 设计：
//   · keyPath = session_id：一场会话至多一条待回传（重复 commit 覆盖，天然幂等）。
//   · enqueue：写入待回传。  flush：逐条重放，成功即删、失败保留（不丢数据）。
//   · 仅在"网络不可达"时入队；服务器明确 4xx 拒绝（校验/约束错）不入队，交回 UI 报错。
//   · 纯浏览器 API，无第三方依赖；SSR/测试环境无 indexedDB 时优雅降级（视为不可用）。
// ============================================================================
import type { CommitPayload } from "../api/client";

const DB_NAME = "alis-offline";
const STORE = "pending_commits";
const VERSION = 1;

interface PendingRecord {
  session_id: string;
  payload: CommitPayload;
  queued_at: string;
}

function hasIDB(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "session_id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const store = t.objectStore(STORE);
        const r = fn(store);
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
        t.oncomplete = () => db.close();
      }),
  );
}

/** 暂存一条待回传 commit（同 session 覆盖）。IndexedDB 不可用时安静失败并抛错，交调用方处理。 */
export async function enqueueCommit(payload: CommitPayload): Promise<void> {
  if (!hasIDB()) throw new Error("indexedDB unavailable");
  const rec: PendingRecord = {
    session_id: payload.session_id,
    payload,
    queued_at: new Date().toISOString(),
  };
  await tx("readwrite", (store) => store.put(rec));
}

/** 当前待回传条数（供促进者看板/提示条显示）。IndexedDB 不可用 → 0。 */
export async function pendingCount(): Promise<number> {
  if (!hasIDB()) return 0;
  try {
    return await tx<number>("readonly", (store) => store.count());
  } catch {
    return 0;
  }
}

export interface FlushResult {
  sent: number;
  kept: number;
}

/**
 * 重放全部待回传。send 成功 → 删除该条；send 失败（网络或服务器）→ 保留（不丢数据）。
 * @param send 实际回传函数（通常包 commitSession）；抛错即视为失败、保留该条。
 */
export async function flushCommits(send: (p: CommitPayload) => Promise<void>): Promise<FlushResult> {
  if (!hasIDB()) return { sent: 0, kept: 0 };
  let all: PendingRecord[];
  try {
    all = await tx<PendingRecord[]>("readonly", (store) => store.getAll() as IDBRequest<PendingRecord[]>);
  } catch {
    return { sent: 0, kept: 0 };
  }
  let sent = 0;
  let kept = 0;
  for (const rec of all) {
    try {
      await send(rec.payload);
      await tx("readwrite", (store) => store.delete(rec.session_id));
      sent += 1;
    } catch {
      kept += 1; // 保留待下次重试，绝不丢弃参与者数据
    }
  }
  return { sent, kept };
}
