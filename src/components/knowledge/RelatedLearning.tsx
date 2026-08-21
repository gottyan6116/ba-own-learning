"use client";

import Link from "next/link";
import { formatDate } from "@/lib/format";
import {
  VISUALIZATION_LABEL,
  learningTitleOrFallback,
  type LearningPage,
  type VisualizationType,
} from "@/lib/learning/types";

/**
 * Knowledge ←→ Learning の接続点。読み取り専用。
 *
 * 生成はここではやらない。AI 呼び出しは意思を持って行う操作なので、
 * モーダルの中に紛れ込ませず /learning に集約している。
 */
export function RelatedLearning({
  pages,
  emptyLabel,
}: {
  pages: LearningPage[];
  emptyLabel: string;
}) {
  if (pages.length === 0) {
    return <p className="text-[14px] leading-6 text-[var(--color-ink-muted)]">{emptyLabel}</p>;
  }

  return (
    <ul className="divide-y divide-[var(--color-line-faint)] border-y border-[var(--color-line-faint)]">
      {pages.map((page) => (
        <li key={page.id}>
          <Link
            href={`/learning?page=${page.id}`}
            className="group block py-3 transition-colors duration-150 hover:bg-[var(--color-surface-sunken)]"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="truncate text-[14px] font-medium text-[var(--color-ink)] group-hover:text-[var(--color-zenith)]">
                {learningTitleOrFallback(page)}
              </span>
              <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-muted)]">
                {formatDate(page.updated_at)}
              </span>
            </div>
            {page.summary && (
              <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--color-ink-muted)]">
                {page.summary}
              </p>
            )}
            <p className="mt-1.5 text-[12px] text-[var(--color-ink-muted)]">
              {VISUALIZATION_LABEL[page.visualization_type as VisualizationType] ??
                page.visualization_type}
            </p>
          </Link>
        </li>
      ))}
    </ul>
  );
}
