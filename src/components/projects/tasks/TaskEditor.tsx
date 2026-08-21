"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useState } from "react";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import {
  PROJECT_TASK_STATUSES,
  PROJECT_TASK_STATUS_LABEL,
  type ProjectTask,
  type ProjectTaskStatus,
} from "@/lib/project-tasks/types";

/**
 * Task の詳細編集。Gantt 上のバーをクリックしたときも、Tasks View の行を
 * クリックしたときも、同じこのダイアログを開く（データも UI も一本化する）。
 *
 * ダイアログの中は「その場で都度保存」ではなく、Save で確定する
 * 明示的なフォーム（inline autosave の debounce をモーダルへ持ち込むと
 * 閉じるタイミングと保存タイミングがずれて事故りやすいため）。
 */
export function TaskEditor({
  task,
  open,
  onOpenChange,
}: {
  task: ProjectTask | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { updateTask, deleteTask, saveStatus } = useProjectTasks();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<ProjectTaskStatus>("todo");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [progress, setProgress] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [dateError, setDateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // 閉じるときに task が先に null になっても、Radix の閉じるアニメーション中は
  // 直前の内容を出し続ける（でないと exit animation の途中でフォームが
  // 消え、モーダルが瞬間的に空になったように見える）。
  const [displayTask, setDisplayTask] = useState<ProjectTask | null>(task);

  useEffect(() => {
    if (!task) return;
    setDisplayTask(task);
    setTitle(task.title);
    setDescription(task.description ?? "");
    setStatus(task.status);
    setStartDate(task.start_date ?? "");
    setEndDate(task.end_date ?? "");
    setProgress(task.progress);
    setConfirmDelete(false);
    setDateError(null);
  }, [task]);

  if (!displayTask) return null;

  const handleSave = async () => {
    if (startDate && endDate && endDate < startDate) {
      setDateError("終了日は開始日以降にしてください");
      return;
    }
    setDateError(null);
    setBusy(true);
    const result = await updateTask(displayTask.id, {
      title: title.trim(),
      description: description.trim() || null,
      status,
      start_date: startDate || null,
      end_date: endDate || null,
      progress,
    });
    setBusy(false);
    if (result) onOpenChange(false);
  };

  const handleDelete = async () => {
    setBusy(true);
    await deleteTask(displayTask.id);
    setBusy(false);
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-40 bg-[rgb(22_25_31_/_0.32)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
          style={{ pointerEvents: "none" }}
        >
          <div className="modal-panel pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[560px] flex-col overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-modal)] sm:max-h-[86dvh]">
            <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-3">
              <Dialog.Title className="text-[15px] font-semibold text-[var(--color-ink)]">
                タスクを編集
              </Dialog.Title>
              <Dialog.Close
                aria-label="閉じる"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-[4px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
              >
                <CloseIcon />
              </Dialog.Close>
            </div>

            <div className="scroll-area min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <Field label="タイトル">
                <input
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="タスク名"
                  className="h-10 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-3 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
                />
              </Field>

              <Field label="説明">
                <textarea
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  rows={3}
                  placeholder="任意"
                  className="w-full resize-y rounded-[4px] border border-[var(--color-line)] bg-white px-3 py-2 text-[14px] leading-6 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="ステータス">
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as ProjectTaskStatus)}
                    className="h-10 w-full cursor-pointer rounded-[4px] border border-[var(--color-line)] bg-white px-2.5 text-[13px] text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)]"
                  >
                    {PROJECT_TASK_STATUSES.map((value) => (
                      <option key={value} value={value}>
                        {PROJECT_TASK_STATUS_LABEL[value]}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field label="進捗">
                  <div className="flex h-10 items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={5}
                      value={progress}
                      onChange={(event) => setProgress(Number(event.target.value))}
                      aria-label="進捗（%）"
                      className="min-w-0 flex-1 accent-[var(--color-zenith)]"
                    />
                    <span className="tabular w-10 shrink-0 text-right text-[13px] text-[var(--color-ink-secondary)]">
                      {progress}%
                    </span>
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="開始日">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(event) => {
                      setStartDate(event.target.value);
                      setDateError(null);
                    }}
                    className="h-10 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-2 text-[13px] text-[var(--color-ink-secondary)]"
                  />
                </Field>
                <Field label="終了日">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(event) => {
                      setEndDate(event.target.value);
                      setDateError(null);
                    }}
                    className="h-10 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-2 text-[13px] text-[var(--color-ink-secondary)]"
                  />
                </Field>
              </div>
              {dateError && (
                <p role="alert" className="mt-2 text-[12px] text-[var(--color-danger)]">
                  {dateError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--color-line)] bg-white px-5 py-3">
              <div>
                {confirmDelete ? (
                  <span className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => void handleDelete()}
                      disabled={busy}
                      className="h-9 cursor-pointer rounded-[4px] bg-[var(--color-danger)] px-2.5 text-[12px] font-medium text-white disabled:opacity-50"
                    >
                      削除する
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-9 cursor-pointer px-2 text-[12px] text-[var(--color-ink-muted)]"
                    >
                      やめる
                    </button>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(true)}
                    className="h-9 cursor-pointer rounded-[4px] px-2.5 text-[12px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-danger)]"
                  >
                    削除
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3">
                {saveStatus === "error" && (
                  <span className="text-[12px] text-[var(--color-danger)]">
                    保存できませんでした
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={busy}
                  aria-busy={busy}
                  className="h-9 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-4 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {busy ? "保存中…" : "保存"}
                </button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="mb-3 block">
      <span className="label-caps mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function CloseIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 15 15" fill="none" aria-hidden="true">
      <path
        d="M1.5 1.5L13.5 13.5M13.5 1.5L1.5 13.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
