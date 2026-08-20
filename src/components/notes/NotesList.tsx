"use client";

import { getProduct, getSystemCategory } from "@/data";
import { formatDateTime } from "@/lib/format";
import { noteTitleOrFallback, notePreview, type Note } from "@/lib/notes/types";
import { areaClass } from "@/components/ui/primitives";

/**
 * 中央ペイン。タイトル・プレビュー・更新日時に加えて、
 * どの System / Product に紐づいているかを出す（復習時の手がかりになる）。
 */
export function NotesList({
  notes,
  selectedId,
  query,
  onQueryChange,
  onSelect,
  onCreate,
}: {
  notes: Note[];
  selectedId: string | null;
  query: string;
  onQueryChange: (value: string) => void;
  onSelect: (id: string) => void;
  onCreate: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col border-r border-[var(--color-line)] bg-white">
      <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-3 py-2">
        <label htmlFor="notes-filter" className="sr-only">
          メモを絞り込む
        </label>
        <input
          id="notes-filter"
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

      {notes.length === 0 ? (
        <div className="px-4 py-6">
          <p className="text-[14px] leading-7 text-[var(--color-ink-secondary)]">
            メモがありません。
          </p>
          <p className="mt-1 text-[13px] leading-6 text-[var(--color-ink-muted)]">
            「新規」から書き始めるか、Knowledge Map
            のカテゴリ・製品を開いてその場でメモを追加できます。
          </p>
        </div>
      ) : (
        <ul className="scroll-area min-h-0 flex-1 overflow-y-auto">
          {notes.map((note) => {
            const system = getSystemCategory(note.system_category);
            const product = getProduct(note.product_key);
            const tags = [product?.name, system?.shortName].filter(Boolean) as string[];
            const selected = note.id === selectedId;
            return (
              <li key={note.id}>
                <button
                  type="button"
                  onClick={() => onSelect(note.id)}
                  aria-current={selected ? "true" : undefined}
                  className={`${areaClass(note.business_area)} w-full cursor-pointer border-b border-[var(--color-line-faint)] px-3 py-3 text-left transition-colors duration-150 ${
                    selected ? "bg-[var(--area-tint)]" : "hover:bg-[var(--color-surface-sunken)]"
                  }`}
                >
                  <span className="flex items-baseline gap-2">
                    {note.is_pinned && (
                      <span
                        aria-hidden="true"
                        className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--area-accent)]"
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate text-[14px] font-medium text-[var(--color-ink)]">
                      {noteTitleOrFallback(note)}
                    </span>
                  </span>
                  <span className="mt-1 block line-clamp-2 text-[12px] leading-5 text-[var(--color-ink-muted)]">
                    {notePreview(note)}
                  </span>
                  <span className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] text-[var(--area-accent)]">
                      {tags.join(" · ")}
                    </span>
                    <span className="tabular shrink-0 text-[11px] text-[var(--color-ink-muted)]">
                      {formatDateTime(note.updated_at)}
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
