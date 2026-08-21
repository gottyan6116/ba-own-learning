import { Suspense } from "react";
import type { Metadata } from "next";
import { LearningWorkspace } from "@/components/learning/LearningWorkspace";

export const metadata: Metadata = {
  title: "Learning",
  description: "自由文の学習メモを AI が構造化し、復習しやすい形で保存する。",
};

export default function LearningPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">読み込み中…</div>
      }
    >
      <LearningWorkspace />
    </Suspense>
  );
}
