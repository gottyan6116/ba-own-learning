"use client";

import type { SystemCategory } from "@/data";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";

/**
 * マップ上の1行。押すとページ遷移せずモーダルが開く。
 * 略称と日本語名を2行で見せることで、略語を覚えていなくても地図が読める。
 */
export function SystemCategoryButton({
  system,
  noteCount,
}: {
  system: SystemCategory;
  noteCount: number;
}) {
  const { openSystem } = useKnowledgeView();

  return (
    <button
      type="button"
      onClick={() => openSystem(system.id)}
      aria-haspopup="dialog"
      className="group flex w-full cursor-pointer items-start justify-between gap-2 border-b border-[var(--color-line-faint)] py-2.5 pr-1 pl-2 text-left transition-colors duration-150 hover:bg-[var(--area-tint)]"
    >
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold leading-5 text-[var(--color-ink)] transition-colors duration-150 group-hover:text-[var(--area-accent)]">
          {system.shortName}
        </span>
        <span className="mt-0.5 block text-[12px] leading-[1.4] text-[var(--color-ink-muted)]">
          {system.nameJa}
        </span>
      </span>
      {noteCount > 0 && (
        <span
          className="tabular mt-0.5 shrink-0 rounded-[3px] bg-[var(--area-tint)] px-1.5 py-0.5 text-[11px] font-medium text-[var(--area-accent)] group-hover:bg-white"
          title={`関連メモ ${noteCount} 件`}
        >
          {noteCount}
        </span>
      )}
    </button>
  );
}
