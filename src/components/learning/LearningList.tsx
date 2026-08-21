"use client";

import { getBusinessArea } from "@/data";
import { formatDate } from "@/lib/format";
import {
  VISUALIZATION_LABEL,
  learningTitleOrFallback,
  type LearningPage,
  type VisualizationType,
} from "@/lib/learning/types";
import { areaClass } from "@/components/ui/primitives";

/**
 * 左ペイン。作成済み Learning の一覧と絞り込み。
 * Notes / Projects の一覧と同じ骨格に揃えている。
 */
export function LearningList({
  pages,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onNew,
}: {
  pages: LearningPage[];
  selectedId: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[var(--color-line)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-3 py-2">
        <label htmlFor="learning-filter" className="sr-only">
          Learning を絞り込む
        </label>
        <input
          id="learning-filter"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="このリストを絞り込む"
          className="h-9 min-w-0 flex-1 rounded-[4px] border border-[var(--color-line)] bg-white px-2.5 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
        />
        <button
          type="button"
          onClick={onNew}
          className="h-9 shrink-0 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-3 text-[13px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)]"
        >
          新規
        </button>
      </div>

      {pages.length === 0 ? (
        <div className="px-4 py-6">
          <p className="text-[14px] leading-7 text-[var(--color-ink-secondary)]">
            Learning がありません。
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--color-ink-muted)]">
            「新規」から学んだことを書くと、AI が構造化して保存できます。
          </p>
        </div>
      ) : (
        <ul className="scroll-area min-h-0 flex-1 overflow-y-auto">
          {pages.map((page) => {
            const area = getBusinessArea(page.business_area);
            const selected = page.id === selectedId;
            return (
              <li key={page.id}>
                <button
                  type="button"
                  onClick={() => onSelect(page.id)}
                  aria-current={selected ? "true" : undefined}
                  className={`${areaClass(page.business_area)} w-full cursor-pointer border-b border-[var(--color-line-faint)] px-3 py-3 text-left transition-colors duration-150 ${
                    selected
                      ? "bg-[var(--color-surface-selected)]"
                      : "hover:bg-[var(--color-surface-sunken)]"
                  }`}
                >
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-ink)]">
                      {learningTitleOrFallback(page)}
                    </span>
                    <span className="tabular shrink-0 text-[11px] text-[var(--color-ink-muted)]">
                      {formatDate(page.updated_at)}
                    </span>
                  </span>
                  <span className="mt-1 block line-clamp-2 text-[12px] leading-5 text-[var(--color-ink-muted)]">
                    {page.summary || "要約なし"}
                  </span>
                  <span className="mt-1.5 flex items-center gap-2 text-[11px]">
                    {area && <span className="label-area">{area.labelEn}</span>}
                    <span className="text-[var(--color-ink-muted)]">
                      {VISUALIZATION_LABEL[page.visualization_type as VisualizationType] ??
                        page.visualization_type}
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
