"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  projectNameOrFallback,
  type Project,
  type ProjectStatus,
} from "@/lib/projects/types";
import { areaClass } from "@/components/ui/primitives";
import { getBusinessArea } from "@/data";

export type StatusFilter = "all" | ProjectStatus | "archived";

const FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "すべて" },
  ...PROJECT_STATUSES.map((status) => ({ value: status, label: PROJECT_STATUS_LABEL[status] })),
  { value: "archived", label: "アーカイブ" },
];

/**
 * /projects は一覧専用ページ。Project Detail は /projects/[id] の実 route へ
 * 分離したので、行はここでは選択状態を持たず、素直に Link で遷移する。
 */
export function ProjectsList({
  projects,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onCreate,
}: {
  projects: Project[];
  query: string;
  onQueryChange: (value: string) => void;
  filter: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="mx-auto flex w-full max-w-[840px] min-h-0 flex-1 flex-col px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h1 className="tracking-display text-[22px] font-bold leading-tight text-[var(--color-ink)]">
            プロジェクト
          </h1>
          <button
            type="button"
            onClick={onCreate}
            className="h-9 shrink-0 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)]"
          >
            新規
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-[var(--color-line)] pb-3">
          <label htmlFor="projects-filter" className="sr-only">
            プロジェクトを絞り込む
          </label>
          <input
            id="projects-filter"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="このリストを絞り込む"
            className="h-9 min-w-0 flex-1 rounded-[4px] border border-[var(--color-line)] bg-white px-2.5 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />
        </div>

        <div
          role="tablist"
          aria-label="ステータス"
          className="scroll-area flex gap-1 overflow-x-auto border-b border-[var(--color-line)] py-2"
        >
          {FILTERS.map((item) => (
            <button
              key={item.value}
              type="button"
              role="tab"
              aria-selected={filter === item.value}
              onClick={() => onFilterChange(item.value)}
              className={`h-7 shrink-0 cursor-pointer whitespace-nowrap rounded-[4px] px-2.5 text-[12px] transition-colors duration-150 ${
                filter === item.value
                  ? "bg-[var(--color-surface-selected)] font-medium text-[var(--color-zenith)]"
                  : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="py-6">
            <p className="text-[14px] leading-7 text-[var(--color-ink-secondary)]">
              プロジェクトがありません。
            </p>
            <p className="mt-1 text-[13px] leading-6 text-[var(--color-ink-muted)]">
              「新規」から案件を登録するか、Knowledge Map
              のカテゴリ・製品を開いて使用製品を確認しながら追加できます。
            </p>
          </div>
        ) : (
          <ul className="scroll-area min-h-0 flex-1 overflow-y-auto">
            {projects.map((project) => {
              const area = getBusinessArea(project.business_area);
              return (
                <li key={project.id}>
                  <Link
                    href={`/projects/${project.id}`}
                    className={`${areaClass(project.business_area)} block cursor-pointer border-b border-[var(--color-line-faint)] py-3 transition-colors duration-150 hover:bg-[var(--color-surface-sunken)]`}
                  >
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-ink)]">
                        {projectNameOrFallback(project)}
                      </span>
                      <span className="tabular shrink-0 text-[11px] text-[var(--color-ink-muted)]">
                        {formatDate(project.updated_at)}
                      </span>
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-[12px] text-[var(--color-ink-muted)]">
                        {project.client || "クライアント未設定"}
                      </span>
                      <span className="flex shrink-0 items-center gap-1.5 text-[11px]">
                        {area && <span className="label-area">{area.labelEn}</span>}
                        <span
                          className={
                            project.is_archived
                              ? "text-[var(--color-ink-muted)]"
                              : "text-[var(--color-ink-secondary)]"
                          }
                        >
                          {PROJECT_STATUS_LABEL[project.status]}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
