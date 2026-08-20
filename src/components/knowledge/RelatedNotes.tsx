"use client";

import Link from "next/link";
import { useState } from "react";
import { getProduct, getSystemCategory } from "@/data";
import { useNotes } from "@/lib/notes/NotesProvider";
import { noteTitleOrFallback, notePreview, type Note, type NoteLink } from "@/lib/notes/types";
import { formatDate } from "@/lib/format";

/**
 * Knowledge ←→ Notes の接続点。
 *
 * ここでメモを書けること（別ページへ飛ばされないこと）が、このアプリの
 * 「学んだ直後に書き留める」動線の本体。
 */
export function RelatedNotes({
  notes,
  link,
  targetLabel,
}: {
  notes: Note[];
  /** 新規メモに付ける紐付け */
  link: NoteLink;
  /** 「〇〇についてメモを追加」の〇〇 */
  targetLabel: string;
}) {
  const { status, createNote } = useNotes();

  if (status === "unconfigured") {
    return (
      <p className="text-[14px] leading-6 text-[var(--color-ink-muted)]">
        Supabase が未設定のため、メモ機能は無効です。
        <code className="mx-1 rounded-[3px] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[13px]">
          .env.local
        </code>
        を設定してください。
      </p>
    );
  }

  if (status === "signed-out") {
    return (
      <p className="text-[14px] leading-6 text-[var(--color-ink-muted)]">
        <Link href="/login" className="text-[var(--color-focus)] underline underline-offset-2">
          ログイン
        </Link>
        すると、{targetLabel} に紐づけて自分のメモを残せます。
      </p>
    );
  }

  return (
    <div>
      {notes.length === 0 ? (
        <p className="mb-4 text-[14px] leading-6 text-[var(--color-ink-muted)]">
          {targetLabel} に紐づくメモはまだありません。
        </p>
      ) : (
        <ul className="mb-4 divide-y divide-[var(--color-line-faint)] border-y border-[var(--color-line-faint)]">
          {notes.map((note) => (
            <li key={note.id}>
              <Link
                href={`/notes?note=${note.id}`}
                className="group block py-3 transition-colors duration-150 hover:bg-[var(--color-surface-sunken)]"
              >
                <div className="flex items-baseline justify-between gap-4">
                  <span className="truncate text-[14px] font-medium text-[var(--color-ink)] group-hover:text-[var(--area-accent)]">
                    {note.is_pinned && (
                      <span className="mr-1.5 text-[var(--color-ink-muted)]" title="ピン留め">
                        ▪
                      </span>
                    )}
                    {noteTitleOrFallback(note)}
                  </span>
                  <span className="tabular shrink-0 text-[12px] text-[var(--color-ink-muted)]">
                    {formatDate(note.updated_at)}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-[var(--color-ink-muted)]">
                  {notePreview(note)}
                </p>
                <NoteAssociation note={note} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <QuickCompose
        targetLabel={targetLabel}
        onCreate={async (draft) => {
          await createNote({ ...link, ...draft });
        }}
      />
    </div>
  );
}

function NoteAssociation({ note }: { note: Note }) {
  const system = getSystemCategory(note.system_category);
  const product = getProduct(note.product_key);
  const labels = [product?.name, system?.shortName].filter(Boolean) as string[];
  if (labels.length === 0) return null;
  return (
    <p className="mt-1.5 text-[12px] text-[var(--color-ink-muted)]">{labels.join(" · ")}</p>
  );
}

function QuickCompose({
  targetLabel,
  onCreate,
}: {
  targetLabel: string;
  onCreate: (draft: { title: string; content: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="cursor-pointer text-[14px] font-medium text-[var(--area-accent)] underline-offset-4 hover:underline"
      >
        ＋ {targetLabel} についてメモを追加
      </button>
    );
  }

  const submit = async () => {
    if (busy) return;
    if (!title.trim() && !content.trim()) {
      setOpen(false);
      return;
    }
    setBusy(true);
    await onCreate({ title: title.trim(), content: content.trim() });
    setBusy(false);
    setTitle("");
    setContent("");
    setOpen(false);
  };

  return (
    <div className="rounded-[6px] border border-[var(--color-line-strong)] bg-white p-3">
      <label className="label-caps mb-1.5 block" htmlFor="quick-note-title">
        タイトル
      </label>
      <input
        id="quick-note-title"
        autoFocus
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder={`${targetLabel} について`}
        className="mb-3 h-11 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-3 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
      />
      <label className="label-caps mb-1.5 block" htmlFor="quick-note-body">
        本文
      </label>
      <textarea
        id="quick-note-body"
        value={content}
        onChange={(event) => setContent(event.target.value)}
        rows={4}
        placeholder="学んだこと、疑問、案件での使われ方など"
        className="mb-3 w-full resize-y rounded-[4px] border border-[var(--color-line)] bg-white px-3 py-2 text-[15px] leading-7 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="h-11 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-4 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "保存中…" : "保存"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 cursor-pointer px-2 text-[14px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}
