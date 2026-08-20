import { Suspense } from "react";
import type { Metadata } from "next";
import { NotesWorkspace } from "@/components/notes/NotesWorkspace";

export const metadata: Metadata = {
  title: "Notes",
  description: "Knowledge Map に紐づく個人の学習メモ。",
};

export default function NotesPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">読み込み中…</div>
      }
    >
      <NotesWorkspace />
    </Suspense>
  );
}
