"use client";

import { useNotes } from "@/lib/notes/NotesProvider";
import { notesForProject } from "@/lib/notes/relations";
import { RelatedNotes } from "@/components/knowledge/RelatedNotes";
import { projectNameOrFallback, type Project } from "@/lib/projects/types";

/**
 * 新しい Notes DB は作らない。既存 NotesProvider をそのままフィルタして使う
 * （Knowledge Modal の「関連メモ」と同じ RelatedNotes を再利用）。
 */
export function ProjectNotesTab({ project }: { project: Project }) {
  const { notes } = useNotes();
  const related = notesForProject(notes, project.id);

  return (
    <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8">
        <h2 className="mb-4 text-[16px] font-semibold text-[var(--color-ink)]">
          Notes{" "}
          <span className="tabular ml-1 text-[13px] font-normal text-[var(--color-ink-muted)]">
            {related.length} 件
          </span>
        </h2>
        <RelatedNotes
          notes={related}
          link={{ project_id: project.id, business_area: project.business_area }}
          targetLabel={projectNameOrFallback(project)}
        />
      </div>
    </div>
  );
}
