import Link from "next/link";
import { getBusinessArea } from "@/data";
import { areaClass } from "@/components/ui/primitives";
import { PROJECT_STATUS_LABEL, projectNameOrFallback, type Project } from "@/lib/projects/types";
import { formatDate } from "@/lib/format";

/**
 * どのタブにいても常に見える、読み取り専用の要約バナー。
 * 編集は Overview タブ（既存 ProjectDetail）に集約し、ここでは二重に
 * 編集可能なフィールドを置かない。
 */
export function ProjectDetailHeader({ project }: { project: Project }) {
  const area = getBusinessArea(project.business_area);
  const period = formatPeriod(project.start_date, project.due_date);

  return (
    <div className={`${areaClass(project.business_area)} border-b border-[var(--color-line)] bg-white`}>
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/projects"
          className="text-[12px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
        >
          ← プロジェクト一覧
        </Link>
        <div className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="tracking-display truncate text-[20px] font-bold leading-tight text-[var(--color-ink)]">
            {projectNameOrFallback(project)}
          </h1>
          {area && <span className="label-area shrink-0">{area.name}</span>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[var(--color-ink-secondary)]">
          <span>{project.client || "クライアント未設定"}</span>
          <span aria-hidden="true" className="text-[var(--color-line-strong)]">
            ・
          </span>
          <span
            className={
              project.is_archived ? "text-[var(--color-ink-muted)]" : "text-[var(--color-ink)]"
            }
          >
            {PROJECT_STATUS_LABEL[project.status]}
            {project.is_archived && "（アーカイブ）"}
          </span>
          {period && (
            <>
              <span aria-hidden="true" className="text-[var(--color-line-strong)]">
                ・
              </span>
              <span className="tabular">{period}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatPeriod(start: string | null, due: string | null): string | null {
  if (!start && !due) return null;
  const startLabel = start ? formatDate(`${start}T00:00:00`) : "未定";
  const dueLabel = due ? formatDate(`${due}T00:00:00`) : "未定";
  return `${startLabel} - ${dueLabel}`;
}
