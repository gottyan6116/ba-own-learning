"use client";

import { useRef, useState } from "react";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import {
  addDays,
  differenceInDays,
  formatISODate,
  formatShortDate,
  parseDate,
} from "@/lib/project-tasks/dateUtils";
import {
  PROJECT_TASK_STATUS_LABEL,
  taskTitleOrFallback,
  type ProjectTask,
} from "@/lib/project-tasks/types";
import { ROW_HEIGHT } from "./ganttLayout";

type DragMode = "move" | "resize-start" | "resize-end";

/** ここより小さいピクセル移動は「クリック」として扱う（drag と click を区別する）。 */
const CLICK_THRESHOLD_PX = 4;

const STATUS_BAR_CLASS: Record<ProjectTask["status"], string> = {
  todo: "bg-[var(--color-line-strong)]",
  in_progress: "bg-[var(--color-zenith)]",
  blocked: "bg-[var(--color-danger)]",
  done: "bg-[var(--color-ink-muted)]",
};

interface DragState {
  mode: DragMode;
  startX: number;
  pixelMoved: boolean;
  originStart: Date;
  originEnd: Date;
}

/**
 * Gantt 上でドラッグ・リサイズできるタスクバー。
 *
 * Pointer Events + setPointerCapture のみで実装する（ライブラリ不使用）。
 * pointermove のたびに Supabase へは書かない — ローカルの draft 位置だけを
 * 更新し、pointerup の瞬間に1回だけ updateTask を呼ぶ。
 */
export function GanttTaskBar({
  task,
  dayWidth,
  rangeStart,
  onOpenEditor,
}: {
  task: ProjectTask;
  dayWidth: number;
  rangeStart: Date;
  onOpenEditor: (taskId: string) => void;
}) {
  const { updateTask } = useProjectTasks();
  const [draft, setDraft] = useState<{ start: Date; end: Date } | null>(null);
  const drag = useRef<DragState | null>(null);

  const taskStart = parseDate(task.start_date);
  const taskEnd = parseDate(task.end_date);
  if (!taskStart || !taskEnd) return null;

  const displayStart = draft?.start ?? taskStart;
  const displayEnd = draft?.end ?? taskEnd;
  const left = differenceInDays(displayStart, rangeStart) * dayWidth;
  const durationDays = differenceInDays(displayEnd, displayStart) + 1;
  const width = Math.max(durationDays * dayWidth, dayWidth);

  const beginDrag = (event: React.PointerEvent<HTMLDivElement>, mode: DragMode) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.stopPropagation();
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // キャプチャに失敗しても、ポインタが要素上にある限り move/up は届く。
      // ここで中断せず、ドラッグの追跡は続ける。
    }
    drag.current = {
      mode,
      startX: event.clientX,
      pixelMoved: false,
      originStart: taskStart,
      originEnd: taskEnd,
    };
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    if (!state) return;
    const deltaX = event.clientX - state.startX;
    if (Math.abs(deltaX) > CLICK_THRESHOLD_PX) state.pixelMoved = true;
    const deltaDays = Math.round(deltaX / dayWidth);

    if (state.mode === "move") {
      setDraft({ start: addDays(state.originStart, deltaDays), end: addDays(state.originEnd, deltaDays) });
      return;
    }
    if (state.mode === "resize-start") {
      let newStart = addDays(state.originStart, deltaDays);
      if (newStart.getTime() > state.originEnd.getTime()) newStart = state.originEnd;
      setDraft({ start: newStart, end: state.originEnd });
      return;
    }
    let newEnd = addDays(state.originEnd, deltaDays);
    if (newEnd.getTime() < state.originStart.getTime()) newEnd = state.originStart;
    setDraft({ start: state.originStart, end: newEnd });
  };

  const onPointerUp = async () => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;

    if (!state.pixelMoved) {
      setDraft(null);
      onOpenEditor(task.id);
      return;
    }

    const finalStart = draft?.start ?? state.originStart;
    const finalEnd = draft?.end ?? state.originEnd;
    if (
      finalStart.getTime() === state.originStart.getTime() &&
      finalEnd.getTime() === state.originEnd.getTime()
    ) {
      setDraft(null);
      return;
    }

    await updateTask(task.id, {
      start_date: formatISODate(finalStart),
      end_date: formatISODate(finalEnd),
    });
    setDraft(null);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`${taskTitleOrFallback(task)}（${PROJECT_TASK_STATUS_LABEL[task.status]}）`}
      onPointerDown={(event) => beginDrag(event, "move")}
      onPointerMove={onPointerMove}
      onPointerUp={() => void onPointerUp()}
      onPointerCancel={() => setDraft(null)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpenEditor(task.id);
        }
      }}
      style={{ left, width, height: ROW_HEIGHT - 16, top: 8, touchAction: "none" }}
      className={`group absolute cursor-grab select-none rounded-[4px] ${STATUS_BAR_CLASS[task.status]} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]`}
    >
      <div className="flex h-full items-center overflow-hidden px-2">
        <span className="truncate text-[12px] font-medium text-white">
          {taskTitleOrFallback(task)}
        </span>
      </div>

      {draft && (
        <div className="tabular pointer-events-none absolute -top-6 left-0 whitespace-nowrap rounded-[3px] bg-[var(--color-ink)] px-1.5 py-0.5 text-[11px] text-white">
          {formatShortDate(formatISODate(displayStart))} → {formatShortDate(formatISODate(displayEnd))}
        </div>
      )}

      <div
        onPointerDown={(event) => beginDrag(event, "resize-start")}
        style={{ touchAction: "none" }}
        className="absolute inset-y-0 left-0 flex w-3 cursor-ew-resize items-center justify-center opacity-40 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <div className="h-4 w-[3px] rounded-full bg-white/80" />
      </div>
      <div
        onPointerDown={(event) => beginDrag(event, "resize-end")}
        style={{ touchAction: "none" }}
        className="absolute inset-y-0 right-0 flex w-3 cursor-ew-resize items-center justify-center opacity-40 group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <div className="h-4 w-[3px] rounded-full bg-white/80" />
      </div>
    </div>
  );
}
