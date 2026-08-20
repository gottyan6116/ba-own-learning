"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { searchKnowledge, type SearchResult } from "@/lib/knowledge/search";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";
import { useNotes } from "@/lib/notes/NotesProvider";
import { areaClass } from "@/components/ui/primitives";
import { getBusinessArea } from "@/data";

const KIND_LABEL: Record<SearchResult["kind"], string> = {
  area: "業務領域",
  system: "システム",
  product: "製品",
  note: "メモ",
};

/**
 * Global Search。Business Area / System / Product / Company / Notes を横断する。
 * 検索結果からも「ページ遷移せずモーダルで開く」を保つ。
 */
export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const { notes } = useNotes();
  const { openSystem, openProduct } = useKnowledgeView();
  const router = useRouter();

  const results = useMemo(() => searchKnowledge(query, notes), [query, notes]);

  useEffect(() => setActiveIndex(0), [query]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const select = (result: SearchResult) => {
    setOpen(false);
    setQuery("");
    if (result.kind === "system") return openSystem(result.id);
    if (result.kind === "product") return openProduct(result.id);
    if (result.kind === "note") return router.push(`/notes?note=${result.id}`);
    // 業務領域はマップ上の位置そのものなので、トップへ戻して該当列へ飛ばす
    router.push(`/#area-${result.id}`);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (results.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      select(results[activeIndex]);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="flex h-9 min-w-0 shrink cursor-pointer items-center gap-2 rounded-[4px] border border-[var(--color-line)] bg-white pr-2 pl-2.5 text-[13px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:border-[var(--color-line-strong)] sm:w-52 lg:w-64"
        >
          <SearchIcon />
          <span className="hidden flex-1 text-left sm:block">検索</span>
          <kbd className="hidden rounded-[3px] border border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 font-sans text-[11px] sm:block">
            ⌘K
          </kbd>
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-40 bg-[rgb(22_25_31_/_0.32)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-start justify-center p-4 pt-[12vh]"
          style={{ pointerEvents: "none" }}
        >
          <div className="modal-panel pointer-events-auto flex max-h-[70dvh] w-full max-w-[620px] flex-col overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-white shadow-[var(--shadow-modal)]">
            <Dialog.Title className="sr-only">検索</Dialog.Title>
            <div className="flex items-center gap-2 border-b border-[var(--color-line)] px-4">
              <SearchIcon />
              <input
                autoFocus
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onKeyDown}
                placeholder="MA、Marketo、ERP、自分のメモ…"
                aria-label="検索キーワード"
                className="h-12 w-full bg-transparent text-[15px] text-[var(--color-ink)] outline-none placeholder:text-[var(--color-ink-muted)]"
              />
            </div>

            <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
              {query.trim() === "" ? (
                <p className="px-4 py-6 text-[13px] leading-6 text-[var(--color-ink-muted)]">
                  業務領域・システムカテゴリ・製品・企業名・自分のメモを横断して検索します。
                </p>
              ) : results.length === 0 ? (
                <p className="px-4 py-6 text-[13px] text-[var(--color-ink-muted)]">
                  「{query}」に一致するものはありませんでした。
                </p>
              ) : (
                <ul role="listbox" aria-label="検索結果">
                  {results.map((result, index) => {
                    const area = getBusinessArea(result.areaId);
                    return (
                      <li key={`${result.kind}-${result.id}`}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={index === activeIndex}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => select(result)}
                          className={`${areaClass(result.areaId)} flex w-full cursor-pointer items-center gap-3 border-b border-[var(--color-line-faint)] px-4 py-2.5 text-left ${
                            index === activeIndex ? "bg-[var(--color-surface-selected)]" : "bg-white"
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[14px] font-medium text-[var(--color-ink)]">
                              {result.title}
                            </span>
                            <span className="block truncate text-[12px] text-[var(--color-ink-muted)]">
                              {[area?.name, result.subtitle].filter(Boolean).join(" · ")}
                            </span>
                          </span>
                          <span className="label-caps shrink-0">{KIND_LABEL[result.kind]}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <footer className="flex shrink-0 items-center gap-4 border-t border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-4 py-2 text-[11px] text-[var(--color-ink-muted)]">
              <span>↑↓ 移動</span>
              <span>Enter 開く</span>
              <span>Esc 閉じる</span>
            </footer>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function SearchIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M10 10L13.5 13.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}
