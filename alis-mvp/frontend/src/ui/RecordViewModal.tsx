// 访谈记录查看/编辑弹窗 — v3.6.4。
// 来源：727反馈 3.0 — 保存状态不可见修复。
//
// 功能：
// - 查看当前阶段所有已保存的记录（追问 + 回答 + 时间戳）
// - 支持行内编辑：点击"编辑"切换为编辑模式，修改追问/回答后保存
// - 支持删除单条记录
// - 显示同步状态：当前阶段=本地已保存，历史阶段=已同步后端
// - 空状态引导 + 汇总提示

import { useState } from "react";
import type { InterviewRecord } from "./InterviewScreen";
import "./RecordViewModal.css";

export interface RecordViewModalProps {
  records: InterviewRecord[];
  currentStageId: number;
  onUpdateRecord: (index: number, updated: InterviewRecord) => void;
  onDeleteRecord: (index: number) => void;
  onClose: () => void;
}

/** 格式化时间戳为可读时间 */
function formatTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch {
    return iso;
  }
}

/** 截断文本用于预览 */
function truncate(text: string, max: number = 60): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

export function RecordViewModal({
  records,
  currentStageId,
  onUpdateRecord,
  onDeleteRecord,
  onClose,
}: RecordViewModalProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editNote, setEditNote] = useState("");
  const [editReply, setEditReply] = useState("");

  const stageRecords = records
    .map((r, i) => ({ ...r, _idx: i }))
    .filter((r) => r.stageId === currentStageId);

  function startEdit(idx: number) {
    const r = records[idx];
    if (!r) return;
    setEditingIndex(idx);
    setEditNote(r.interviewerNote);
    setEditReply(r.respondentReply);
  }

  function cancelEdit() {
    setEditingIndex(null);
    setEditNote("");
    setEditReply("");
  }

  function saveEdit() {
    if (editingIndex === null) return;
    const original = records[editingIndex];
    if (!original) return;
    const updated: InterviewRecord = {
      ...original,
      interviewerNote: editNote.trim(),
      respondentReply: editReply.trim(),
      timestamp: new Date().toISOString(), // 编辑时间更新
    };
    onUpdateRecord(editingIndex, updated);
    cancelEdit();
  }

  function getSyncStatus(record: InterviewRecord): { label: string; cls: string } {
    if (record.stageId < currentStageId) {
      return { label: "已同步后端", cls: "synced" };
    }
    return { label: "本地已保存", cls: "local" };
  }

  return (
    <div className="rvm-overlay" onClick={onClose}>
      <div className="rvm-card" onClick={(e) => e.stopPropagation()}>
        {/* 头部 */}
        <div className="rvm-header">
          <h2 className="rvm-title">
            📋 当前阶段访谈记录
            {stageRecords.length > 0 && (
              <span className="rvm-count">{stageRecords.length} 条</span>
            )}
          </h2>
          <button className="rvm-close-btn" onClick={onClose} aria-label="关闭">
            ✕
          </button>
        </div>

        {/* 内容区 */}
        <div className="rvm-body">
          {stageRecords.length === 0 ? (
            <div className="rvm-empty">
              <span className="rvm-empty-icon">📭</span>
              <p>当前阶段还没有保存任何记录。</p>
              <p className="rvm-empty-hint">
                在下方输入追问问题或受访者回答，然后点击"💾 保存记录"。
              </p>
            </div>
          ) : (
            <div className="rvm-list">
              {stageRecords.map((rec) => {
                const isEditing = editingIndex === rec._idx;
                const sync = getSyncStatus(rec);

                return (
                  <div
                    key={`${rec.timestamp}-${rec._idx}`}
                    className={`rvm-item${isEditing ? " editing" : ""}`}
                  >
                    {isEditing ? (
                      /* 编辑模式 */
                      <div className="rvm-edit-form">
                        <div className="rvm-edit-field">
                          <label className="rvm-edit-label">
                            <span className="rvm-edit-icon">🎤</span>
                            追问问题
                          </label>
                          <input
                            type="text"
                            className="rvm-edit-input"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="输入追问问题…"
                          />
                        </div>
                        <div className="rvm-edit-field">
                          <label className="rvm-edit-label">
                            <span className="rvm-edit-icon">💬</span>
                            受访者回答
                          </label>
                          <textarea
                            className="rvm-edit-textarea"
                            value={editReply}
                            onChange={(e) => setEditReply(e.target.value)}
                            placeholder="输入受访者回答…"
                            rows={3}
                          />
                        </div>
                        <div className="rvm-edit-actions">
                          <button className="rvm-btn save" onClick={saveEdit}>
                            ✅ 保存修改
                          </button>
                          <button className="rvm-btn cancel" onClick={cancelEdit}>
                            取消
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* 查看模式 */
                      <>
                        <div className="rvm-item-body">
                          {rec.interviewerNote && (
                            <div className="rvm-field note">
                              <span className="rvm-field-icon">🎤</span>
                              <span className="rvm-field-label">追问：</span>
                              <span className="rvm-field-text">{truncate(rec.interviewerNote)}</span>
                            </div>
                          )}
                          {rec.respondentReply && (
                            <div className="rvm-field reply">
                              <span className="rvm-field-icon">💬</span>
                              <span className="rvm-field-label">回答：</span>
                              <span className="rvm-field-text">{truncate(rec.respondentReply)}</span>
                            </div>
                          )}
                          {!rec.interviewerNote && !rec.respondentReply && (
                            <div className="rvm-field empty-record">（空记录）</div>
                          )}
                        </div>

                        <div className="rvm-item-meta">
                          <span className="rvm-time">🕐 {formatTime(rec.timestamp)}</span>
                          <span className={`rvm-sync-badge ${sync.cls}`}>
                            {sync.cls === "synced" ? "📡" : "💾"} {sync.label}
                          </span>
                        </div>

                        <div className="rvm-item-actions">
                          <button
                            className="rvm-btn small edit"
                            onClick={() => startEdit(rec._idx)}
                          >
                            ✏️ 编辑
                          </button>
                          <button
                            className="rvm-btn small delete"
                            onClick={() => {
                              if (window.confirm("确定要删除这条记录吗？此操作不可恢复。")) {
                                onDeleteRecord(rec._idx);
                                if (editingIndex === rec._idx) cancelEdit();
                              }
                            }}
                          >
                            🗑 删除
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部汇总 */}
        <div className="rvm-footer">
          <span className="rvm-footer-icon">📊</span>
          <span>
            全阶段共 <strong>{records.length}</strong> 条记录 · 访谈结束时自动汇总打包
          </span>
        </div>
      </div>
    </div>
  );
}
