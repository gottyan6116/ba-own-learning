"use client";

import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
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
