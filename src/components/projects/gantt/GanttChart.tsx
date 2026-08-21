"use client";

import { useMemo, useState } from "react";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import { isScheduled, sortTasks, taskTitleOrFallback } from "@/lib/project-tasks/types";
import {
  addDays,
  differenceInDays,
  maxDate,
  minDate,
  parseDate,
  todayISO,
} from "@/lib/project-tasks/dateUtils";
import type { Project } from "@/lib/projects/types";
import { GanttHeader } from "./GanttHeader";
import { GanttTaskRow } from "./GanttTaskRow";
import { GanttToolbar } from "./GanttToolbar";
import { TaskEditor } from "../tasks/TaskEditor";
import { LEFT_COL_CLASS, ROW_HEIGHT, ZOOM_DAY_WIDTH, type GanttZoom } from "./ganttLayout";

const START_PADDING_DAYS = 7;
const END_PADDING_DAYS = 14;

/**
 * Tasks View と同じ project_tasks を、タイムラインとして見せる。
 * Gantt 専用データは持たない — ここでも useProjectTasks() をそのまま読む。
 */
export function GanttChart({ project }: { project: Project }) {
  const { status, tasks, errorMessage } = useProjectTasks();
  const [zoom, setZoom] = useState<GanttZoom>("standard");
  const [openTaskId, setOpenTaskId] = useState<string | null>(null);

  const dayWidth = ZOOM_DAY_WIDTH[zoom];
  const sorted = sortTasks(tasks);
  const scheduled = sorted.filter(isScheduled);
  const unscheduled = sorted.filter((task) => !isScheduled(task));
  const openTask = sorted.find((task) => task.id === openTaskId) ?? null;

  const { days, rangeStart, todayIndex } = useMemo(() => {
    const today = parseDate(todayISO())!;
    const projectStart = parseDate(project.start_date);
    const projectEnd = parseDate(project.due_date);
    const starts = scheduled.map((task) => parseDate(task.start_date));
    const ends = scheduled.map((task) => parseDate(task.end_date));

    const earliest = minDate(projectStart, today, ...starts) ?? today;
    const latest = maxDate(projectEnd, today, ...ends) ?? today;

    const start = addDays(earliest, -START_PADDING_DAYS);
    const end = addDays(latest, END_PADDING_DAYS);
    const totalDays = differenceInDays(end, start) + 1;

    const list: Date[] = [];
    for (let i = 0; i < totalDays; i += 1) list.push(addDays(start, i));

    const todayOffset = differenceInDays(today, start);
    return {
      days: list,
      rangeStart: start,
      todayIndex: todayOffset >= 0 && todayOffset < totalDays ? todayOffset : null,
    };
    // scheduled は sorted の派生で毎レンダー新配列になるため、依存は元の tasks にする
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, project.start_date, project.due_date]);

  if (status === "loading") {
    return (
      <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">読み込み中…</div>
    );
  }
  if (status === "error") {
    return (
      <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">
        タスクを取得できませんでした。{errorMessage && `（${errorMessage}）`}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <GanttToolbar zoom={zoom} onZoomChange={setZoom} onTaskCreated={setOpenTaskId} />

      {sorted.length === 0 ? (
        <div className="px-6 py-10 text-center">
          <p className="text-[14px] leading-7 text-[var(--color-ink-secondary)]">
            まだタスクがありません。
          </p>
          <p className="mx-auto mt-1 max-w-[36ch] text-[13px] leading-6 text-[var(--color-ink-muted)]">
            最初のタスクを追加すると、ガントチャート上でスケジュールを管理できます。
          </p>
        </div>
      ) : (
        <>
          {unscheduled.length > 0 && (
            <div className="border-b border-[var(--color-line-faint)] bg-white px-4 py-2 sm:px-6 lg:px-8">
              <p className="label-caps mb-1.5">未スケジュール</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1">
                {unscheduled.map((task) => (
                  <li key={task.id}>
                    <button
                      type="button"
                      onClick={() => setOpenTaskId(task.id)}
                      className="cursor-pointer text-[13px] text-[var(--color-ink-secondary)] underline-offset-2 hover:text-[var(--color-zenith)] hover:underline"
                    >
                      {taskTitleOrFallback(task)} — 日程を設定
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="scroll-area scroll-shadow-x min-h-0 min-w-0 flex-1 overflow-auto">
            <GanttHeader days={days} dayWidth={dayWidth} todayIndex={todayIndex} />
            {scheduled.length === 0 ? (
              <div className="flex items-center" style={{ height: ROW_HEIGHT }}>
                <div className={`${LEFT_COL_CLASS} sticky left-0 shrink-0`} />
                <p className="px-3 text-[13px] text-[var(--color-ink-muted)]">
                  スケジュール済みのタスクはありません。
                </p>
              </div>
            ) : (
              scheduled.map((task) => (
                <GanttTaskRow
                  key={task.id}
                  task={task}
                  days={days}
                  dayWidth={dayWidth}
                  rangeStart={rangeStart}
                  todayIndex={todayIndex}
                  onOpenEditor={setOpenTaskId}
                />
              ))
            )}
          </div>
        </>
      )}

      <TaskEditor
        task={openTask}
        open={openTask !== null}
        onOpenChange={(open) => !open && setOpenTaskId(null)}
      />
    </div>
  );
}
