"use client";

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
 * 左ペイン。検索・ステータス絞り込み・一覧・新規作成。
 * Notes の NotesList と同じ骨格（検索行 + 一覧）に、ステータスの
 * フィルタ行を足しただけ。案件は業務領域より「進行中かどうか」で
 * 探すことのほうが多いので、ここでは領域別のサイドバーは置かない。
 */
export function ProjectsList({
  projects,
  selectedId,
  query,
  onQueryChange,
  filter,
  onFilterChange,
  onSelect,
  onCreate,
}: {
  projects: Project[];
  selectedId: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  filter: StatusFilter;
  onFilterChange: (value: StatusFilter) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[var(--color-line)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-3 py-2">
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
        <button
          type="button"
          onClick={onCreate}
          className="h-9 shrink-0 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)]"
        >
          新規
        </button>
      </div>

      <div
        role="tablist"
        aria-label="ステータス"
        className="scroll-area flex gap-1 overflow-x-auto border-b border-[var(--color-line)] px-2 py-1.5"
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
        <div className="px-4 py-6">
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
            const selected = project.id === selectedId;
            return (
              <li key={project.id}>
                <button
                  type="button"
                  onClick={() => onSelect(project.id)}
                  aria-current={selected ? "true" : undefined}
                  className={`${areaClass(project.business_area)} w-full cursor-pointer border-b border-[var(--color-line-faint)] px-3 py-3 text-left transition-colors duration-150 ${
                    selected
                      ? "bg-[var(--color-surface-selected)]"
                      : "hover:bg-[var(--color-surface-sunken)]"
                  }`}
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
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
