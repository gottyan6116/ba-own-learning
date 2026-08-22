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

/** カンバンの列順。DB の status と一対一に対応する。 */
export const PROJECT_TASK_BOARD_COLUMNS = PROJECT_TASK_STATUSES;

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

/**
 * カンバン用の列別タスク。sort_order は列内の並び順として扱う。
 * ガントの開始日順とは用途が異なるため、sortTasks と混ぜない。
 */
export function groupTasksForBoard(
  tasks: ProjectTask[],
): Record<ProjectTaskStatus, ProjectTask[]> {
  const grouped: Record<ProjectTaskStatus, ProjectTask[]> = {
    todo: [],
    in_progress: [],
    blocked: [],
    done: [],
  };
  for (const task of tasks) grouped[task.status].push(task);
  for (const status of PROJECT_TASK_BOARD_COLUMNS) {
    grouped[status].sort((left, right) => left.sort_order - right.sort_order);
  }
  return grouped;
}

/**
 * 移動後のボード状態を純粋に計算する。移動元・移動先の列は 0 始まりの
 * 連番へ振り直すため、DB 保存時にそのまま差分として使える。
 */
export function reorderTasksForBoard(
  tasks: ProjectTask[],
  taskId: string,
  destinationStatus: ProjectTaskStatus,
  destinationIndex: number,
): ProjectTask[] {
  const moving = tasks.find((task) => task.id === taskId);
  if (!moving) return tasks;

  const grouped = groupTasksForBoard(tasks.filter((task) => task.id !== taskId));
  const destination = grouped[destinationStatus];
  const index = Math.max(0, Math.min(destinationIndex, destination.length));
  destination.splice(index, 0, { ...moving, status: destinationStatus });

  const byId = new Map<string, ProjectTask>();
  for (const status of PROJECT_TASK_BOARD_COLUMNS) {
    grouped[status].forEach((task, sortOrder) => {
      byId.set(task.id, { ...task, sort_order: sortOrder });
    });
  }
  return tasks.map((task) => byId.get(task.id) ?? task);
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
