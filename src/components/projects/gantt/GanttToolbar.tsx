"use client";

import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import { PROJECT_TASK_STATUS_LABEL } from "@/lib/project-tasks/types";
import { TaskCreateButton } from "../tasks/TaskCreateButton";
import type { GanttZoom } from "./ganttLayout";

export function GanttToolbar({
  zoom,
  onZoomChange,
  onTaskCreated,
}: {
  zoom: GanttZoom;
  onZoomChange: (zoom: GanttZoom) => void;
  onTaskCreated: (taskId: string) => void;
}) {
  const { saveStatus } = useProjectTasks();

  return (
    <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] bg-white px-4 py-2 sm:px-6 lg:px-8">
      <div
        role="group"
        aria-label="ズーム"
        className="flex items-center gap-1 rounded-[4px] border border-[var(--color-line)] p-0.5"
      >
        {(["standard", "compact"] satisfies GanttZoom[]).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => onZoomChange(value)}
            aria-pressed={zoom === value}
            className={`h-7 cursor-pointer rounded-[3px] px-2.5 text-[12px] transition-colors duration-150 ${
              zoom === value
                ? "bg-[var(--color-surface-selected)] font-medium text-[var(--color-zenith)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
            }`}
          >
            {value === "standard" ? "標準" : "コンパクト"}
          </button>
        ))}
      </div>

      <div className="hidden items-center gap-2 text-[11px] text-[var(--color-ink-muted)] xl:flex" aria-label="ステータスの凡例">
        {([
          ["todo", "bg-[var(--color-line-strong)]"],
          ["in_progress", "bg-[var(--color-zenith)]"],
          ["blocked", "bg-[var(--color-danger)]"],
          ["done", "bg-[var(--color-ink-muted)]"],
        ] as const).map(([statusKey, colorClass]) => (
          <span key={statusKey} className="flex items-center gap-1">
            <span aria-hidden="true" className={`h-2 w-2 rounded-full ${colorClass}`} />
            {PROJECT_TASK_STATUS_LABEL[statusKey]}
          </span>
        ))}
        <span>（カスタム色はタスク設定を優先）</span>
      </div>

      <p className="hidden text-[12px] text-[var(--color-ink-muted)] md:block">
        タスクの日程と同期中。バーをクリックして編集、ドラッグ／端の操作で日程を変更できます。
      </p>

      <div className="flex items-center gap-3">
        <SaveIndicator status={saveStatus} />
        <TaskCreateButton onCreated={onTaskCreated} />
      </div>
    </div>
  );
}

function SaveIndicator({ status }: { status: "idle" | "saving" | "saved" | "error" }) {
  if (status === "saving") {
    return <span className="text-[12px] text-[var(--color-ink-muted)]">保存中…</span>;
  }
  if (status === "saved") {
    return <span className="text-[12px] text-[var(--color-ink-muted)]">保存済み</span>;
  }
  if (status === "error") {
    return (
      <span role="alert" className="text-[12px] text-[var(--color-danger)]">
        保存できませんでした
      </span>
    );
  }
  return null;
}
