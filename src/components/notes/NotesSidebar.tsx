"use client";

import { businessAreas } from "@/data";
import type { Note } from "@/lib/notes/types";
import { areaClass } from "@/components/ui/primitives";

export type NotebookFilter = "all" | "pinned" | "uncategorized" | (string & {});

/**
 * 左ペイン。OneNote でいうノートブック。
 * 分類軸は Knowledge Map の Business Area と同じにする。別の分類体系を
 * 増やすと、地図とメモが噛み合わなくなるため。
 */
export function NotesSidebar({
  notes,
  active,
  onSelect,
}: {
  notes: Note[];
  active: NotebookFilter;
  onSelect: (filter: NotebookFilter) => void;
}) {
  const countAll = notes.length;
  const countPinned = notes.filter((note) => note.is_pinned).length;
  const countUncategorized = notes.filter((note) => !note.business_area).length;

  return (
    <nav
      aria-label="ノートブック"
      className="scroll-area h-full overflow-y-auto border-r border-[var(--color-line)] px-2 py-3"
    >
      <h2 className="label-caps px-2 pb-2">Notebooks</h2>

      <Item
        label="All Notes"
        count={countAll}
        active={active === "all"}
        onSelect={() => onSelect("all")}
      />
      <Item
        label="ピン留め"
        count={countPinned}
        active={active === "pinned"}
        onSelect={() => onSelect("pinned")}
      />

      <h2 className="label-caps px-2 pt-4 pb-2">Business Area</h2>
      {businessAreas.map((area) => (
        <Item
          key={area.id}
          label={area.name}
          areaId={area.id}
          count={notes.filter((note) => note.business_area === area.id).length}
          active={active === area.id}
          onSelect={() => onSelect(area.id)}
        />
      ))}

      <div className="mt-2 border-t border-[var(--color-line)] pt-2">
        <Item
          label="Uncategorized"
          count={countUncategorized}
          active={active === "uncategorized"}
          onSelect={() => onSelect("uncategorized")}
        />
      </div>
    </nav>
  );
}

function Item({
  label,
  count,
  active,
  areaId,
  onSelect,
}: {
  label: string;
  count: number;
  active: boolean;
  areaId?: string;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={`${areaClass(areaId ?? null)} flex w-full cursor-pointer items-center gap-2 rounded-[4px] px-2 py-1.5 text-left text-[13px] transition-colors duration-150 ${
        active
          ? "bg-[var(--color-surface-selected)] font-medium text-[var(--color-ink)]"
          : "text-[var(--color-ink-secondary)] hover:bg-[var(--color-surface-sunken)]"
      }`}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <span className="tabular shrink-0 text-[11px] text-[var(--color-ink-muted)]">{count}</span>
    </button>
  );
}
