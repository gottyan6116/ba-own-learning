"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { businessAreas } from "@/data";
import { useNotes } from "@/lib/notes/NotesProvider";
import { sortNotes, type Note } from "@/lib/notes/types";
import { NotesSidebar, type NotebookFilter } from "./NotesSidebar";
import { NotesList } from "./NotesList";
import { NotesEditor } from "./NotesEditor";

/**
 * Desktop は 3ペイン（Notebook / List / Editor）。
 * md 未満では1ペインずつ出す（3ペインを縮小すると全部が読めなくなるため）。
 */
export function NotesWorkspace() {
  const { status, notes, createNote } = useNotes();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("note");

  const [filter, setFilter] = useState<NotebookFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = useMemo(() => filterNotes(notes, filter, query), [notes, filter, query]);

  // URL で指定されたメモ（モーダルの関連メモから飛んできたとき）を開く
  useEffect(() => {
    if (!requestedId) return;
    if (!notes.some((note) => note.id === requestedId)) return;
    setSelectedId(requestedId);
    setFilter("all");
  }, [requestedId, notes]);

  // 選択中のメモが消えた / まだ選んでいないときは、先頭を開く
  useEffect(() => {
    if (selectedId && notes.some((note) => note.id === selectedId)) return;
    setSelectedId(visible[0]?.id ?? null);
  }, [visible, notes, selectedId]);

  const selected = notes.find((note) => note.id === selectedId) ?? null;

  const handleCreate = async () => {
    const areaFromFilter = businessAreas.find((area) => area.id === filter)?.id ?? null;
    const created = await createNote({
      title: "",
      content: "",
      business_area: areaFromFilter,
    });
    if (created) {
      setSelectedId(created.id);
      if (requestedId) router.replace("/notes");
    }
  };

  if (status === "unconfigured") {
    return (
      <Message title="Supabase が未設定です">
        <code className="rounded-[3px] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[13px]">
          .env.local
        </code>{" "}
        に <code className="text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
        <code className="text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        を設定すると、メモの保存が有効になります。README の Supabase setup を参照してください。
      </Message>
    );
  }

  if (status === "signed-out") {
    return (
      <Message title="Notes を使うにはログインが必要です">
        メモは個人データなので、Supabase の Row Level Security
        で本人だけが読み書きできるようにしています。
        <Link
          href="/login"
          className="ml-1 text-[var(--color-focus)] underline underline-offset-2"
        >
          ログインする
        </Link>
      </Message>
    );
  }

  if (status === "loading") {
    return <Message title="読み込み中…">メモを取得しています。</Message>;
  }

  if (status === "error") {
    return (
      <Message title="メモを取得できませんでした">
        Supabase の接続設定と、notes テーブルの作成・RLS の設定を確認してください。
      </Message>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Mobile: ノートブックは横スクロールのフィルタ行にする */}
      <div className="scroll-area flex gap-1 overflow-x-auto border-b border-[var(--color-line)] px-3 py-2 md:hidden">
        {(
          [
            ["all", "All"],
            ["pinned", "ピン留め"],
            ...businessAreas.map((area) => [area.id, area.name] as const),
            ["uncategorized", "未分類"],
          ] as Array<readonly [string, string]>
        ).map(([value, label]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`h-9 shrink-0 cursor-pointer rounded-[4px] border px-3 text-[13px] ${
              filter === value
                ? "border-[var(--color-ink)] bg-[var(--color-ink)] text-white"
                : "border-[var(--color-line)] bg-white text-[var(--color-ink-secondary)]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(180px,220px)_minmax(260px,340px)_1fr]">
        <div className="hidden min-h-0 md:block">
          <NotesSidebar notes={notes} active={filter} onSelect={setFilter} />
        </div>

        <div className={`min-h-0 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
          <NotesList
            notes={visible}
            selectedId={selectedId}
            query={query}
            onQueryChange={setQuery}
            onSelect={setSelectedId}
            onCreate={() => void handleCreate()}
          />
        </div>

        <div className={`min-h-0 ${selected ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
          {selected ? (
            <>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="cursor-pointer border-b border-[var(--color-line)] bg-white px-4 py-2 text-left text-[13px] text-[var(--color-ink-muted)] md:hidden"
              >
                ← 一覧に戻る
              </button>
              <NotesEditor key={selected.id} note={selected} />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-white px-6 py-10">
              <div className="max-w-[38ch] text-center">
                <p className="text-[15px] font-medium text-[var(--color-ink)]">
                  メモを選ぶか、新しく作成します
                </p>
                <p className="mt-2 text-[13px] leading-6 text-[var(--color-ink-muted)]">
                  Knowledge Map でカテゴリや製品を開くと、その場で紐づけたメモを追加できます。
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function filterNotes(notes: Note[], filter: NotebookFilter, query: string): Note[] {
  const needle = query.trim().toLowerCase();
  const filtered = notes.filter((note) => {
    if (filter === "pinned" && !note.is_pinned) return false;
    if (filter === "uncategorized" && note.business_area) return false;
    if (filter !== "all" && filter !== "pinned" && filter !== "uncategorized") {
      if (note.business_area !== filter) return false;
    }
    if (!needle) return true;
    return (
      note.title.toLowerCase().includes(needle) || note.content.toLowerCase().includes(needle)
    );
  });
  return sortNotes(filtered);
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-16 sm:px-6">
      <h1 className="text-[20px] font-bold text-[var(--color-ink)]">{title}</h1>
      <p className="mt-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">{children}</p>
    </div>
  );
}
