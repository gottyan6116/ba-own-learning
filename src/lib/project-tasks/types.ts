import type { ProjectTaskRow, ProjectTaskStatus } from "@/lib/supabase/types";

export type ProjectTask = ProjectTaskRow;
export type { ProjectTaskStatus };

export const PROJECT_TASK_STATUSES: ProjectTaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
];

export const PROJECT_TASK_STATUS_LABEL: Record<ProjectTaskStatus, string> = {
  todo: "未着手",
  in_progress: "進行中",
  blocked: "ブロック",
  done: "完了",
};

export interface ProjectTaskDraft {
  title?: string;
  description?: string | null;
  status?: ProjectTaskStatus;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number;
  sort_order?: number;
}

export function taskTitleOrFallback(task: ProjectTask): string {
  const title = task.title.trim();
  return title || "無題のタスク";
}

export function isScheduled(task: ProjectTask): boolean {
  return task.start_date !== null && task.end_date !== null;
}

/** 開始日 → sort_order の順。未スケジュールは最後にまとめる。 */
export function sortTasks(tasks: ProjectTask[]): ProjectTask[] {
  return [...tasks].sort((a, b) => {
    if (!!a.start_date !== !!b.start_date) return a.start_date ? -1 : 1;
    if (a.start_date && b.start_date && a.start_date !== b.start_date) {
      return a.start_date.localeCompare(b.start_date);
    }
    return a.sort_order - b.sort_order;
  });
}

export interface TaskProgressSummary {
  total: number;
  done: number;
  averageProgress: number;
  byStatus: Record<ProjectTaskStatus, number>;
}

export function summarizeTaskProgress(tasks: ProjectTask[]): TaskProgressSummary {
  const byStatus: Record<ProjectTaskStatus, number> = {
    todo: 0,
    in_progress: 0,
    blocked: 0,
    done: 0,
  };
  let progressSum = 0;
  for (const task of tasks) {
    byStatus[task.status] += 1;
    progressSum += task.progress;
  }
  return {
    total: tasks.length,
    done: byStatus.done,
    averageProgress: tasks.length === 0 ? 0 : Math.round(progressSum / tasks.length),
    byStatus,
  };
}
