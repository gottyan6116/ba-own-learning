"use client";

import Link from "next/link";
import { useProjectTasks } from "@/lib/project-tasks/ProjectTasksProvider";
import {
  PROJECT_TASK_STATUSES,
  PROJECT_TASK_STATUS_LABEL,
  summarizeTaskProgress,
} from "@/lib/project-tasks/types";
import type { Project } from "@/lib/projects/types";
import { ProjectDetail } from "../ProjectDetail";

/**
 * 5秒で把握できる画面。既存の ProjectDetail（属性編集フォーム）はそのまま
 * 本文として使い、その上に Task 進捗だけを足す。大きな Dashboard 化はしない。
 */
export function ProjectOverview({ project }: { project: Project }) {
  const { status, tasks } = useProjectTasks();
  const summary = summarizeTaskProgress(tasks);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {status === "ready" && summary.total > 0 && (
        <div className="border-b border-[var(--color-line-faint)] bg-white px-5 py-4 sm:px-8">
          <div className="mx-auto flex w-full max-w-[760px] flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <p className="label-caps">タスク進捗</p>
              <Link
                href={`/projects/${project.id}/tasks`}
                className="text-[12px] text-[var(--color-zenith)] underline-offset-2 hover:underline"
              >
                すべて見る →
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <span className="tabular shrink-0 text-[15px] font-semibold text-[var(--color-ink)]">
                {summary.done} / {summary.total} 完了
              </span>
              <div
                role="progressbar"
                aria-valuenow={summary.averageProgress}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label="平均進捗"
                className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--color-line-faint)]"
              >
                <div
                  className="h-full rounded-full bg-[var(--color-zenith)]"
                  style={{ width: `${summary.averageProgress}%` }}
                />
              </div>
              <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-muted)]">
                {summary.averageProgress}%
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-[var(--color-ink-muted)]">
              {PROJECT_TASK_STATUSES.map(
                (statusKey) =>
                  summary.byStatus[statusKey] > 0 && (
                    <span key={statusKey}>
                      {PROJECT_TASK_STATUS_LABEL[statusKey]} {summary.byStatus[statusKey]}
                    </span>
                  ),
              )}
            </div>
          </div>
        </div>
      )}
      <ProjectDetail project={project} />
    </div>
  );
}
