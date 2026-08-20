import { Suspense } from "react";
import type { Metadata } from "next";
import { ProjectsWorkspace } from "@/components/projects/ProjectsWorkspace";

export const metadata: Metadata = {
  title: "プロジェクト",
  description: "実案件の進行管理。使用システム・製品・関連メモを紐づけて記録する。",
};

export default function ProjectsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">読み込み中…</div>
      }
    >
      <ProjectsWorkspace />
    </Suspense>
  );
}
