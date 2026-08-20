"use client";

import Link from "next/link";
import { PROJECT_STATUS_LABEL, projectNameOrFallback, type Project } from "@/lib/projects/types";

/**
 * Knowledge ←→ Projects の接続点。読み取り専用。
 *
 * プロジェクトの新規作成はここでは行わない。案件は名前・クライアント・期日など
 * 属性が多く、モーダル内で作るとその場しのぎの空プロジェクトが増えやすい。
 * 作成は /projects 側にまとめ、ここは「この案件がこれを使っている」という
 * 事実を見せて、詳細へ飛べるだけにする。
 */
export function RelatedProjects({
  projects,
  emptyLabel,
}: {
  projects: Project[];
  emptyLabel: string;
}) {
  if (projects.length === 0) {
    return <p className="text-[14px] leading-6 text-[var(--color-ink-muted)]">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-[var(--color-line-faint)] border-y border-[var(--color-line-faint)]">
      {projects.map((project) => (
        <li key={project.id}>
          <Link
            href={`/projects?project=${project.id}`}
            className="group flex items-baseline justify-between gap-4 py-2.5 transition-colors duration-150 hover:bg-[var(--color-surface-sunken)]"
          >
            <span className="min-w-0 flex-1 truncate">
              <span className="text-[14px] font-medium text-[var(--color-ink)] group-hover:text-[var(--color-zenith)]">
                {projectNameOrFallback(project)}
              </span>
              {project.client && (
                <span className="ml-2 text-[12px] text-[var(--color-ink-muted)]">
                  {project.client}
                </span>
              )}
            </span>
            <span className="shrink-0 text-[12px] text-[var(--color-ink-muted)]">
              {PROJECT_STATUS_LABEL[project.status]}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
