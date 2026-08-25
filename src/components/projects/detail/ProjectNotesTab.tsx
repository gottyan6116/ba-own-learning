"use client";

import { useEffect, useState } from "react";
import { useNotes } from "@/lib/notes/NotesProvider";
import { notesForProject } from "@/lib/notes/relations";
import { projectNameOrFallback, type Project } from "@/lib/projects/types";
import { NotesEditor } from "@/components/notes/NotesEditor";
import { NotesList } from "@/components/notes/NotesList";

/**
 * プロジェクトを OneNote のノートブックとして扱う。
 * プロジェクト固有ページの一覧と、既存 NotesEditor の単一キャンバスを
 * 同じ画面に置く。新しい保存先は作らず、既存の project_id 関連だけを使う。
 */
export function ProjectNotesTab({ project }: { project: Project }) {
  const { notes, createNote } = useNotes();
  const related = notesForProject(notes, project.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (selectedId && related.some((note) => note.id === selectedId)) return;
    setSelectedId(related[0]?.id ?? null);
  }, [related, selectedId]);

  const selected = related.find((note) => note.id === selectedId) ?? null;

  const createPage = async () => {
    const created = await createNote({
      title: "",
      content: "",
      project_id: project.id,
      business_area: project.business_area,
    });
    if (created) setSelectedId(created.id);
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 bg-white">
      <div className={`min-h-0 min-w-0 w-full sm:w-[340px] sm:shrink-0 ${selected ? "hidden sm:flex sm:flex-col" : "flex flex-col"}`}>
        <div className="border-b border-[var(--color-line)] px-4 py-3">
          <p className="label-caps">ノートブック</p>
          <h2 className="mt-1 truncate text-[15px] font-semibold text-[var(--color-ink)]">
            {projectNameOrFallback(project)}
          </h2>
        </div>
        <NotesList
          notes={related}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={setSelectedId}
          onCreate={() => void createPage()}
        />
      </div>

      <div className={`min-h-0 min-w-0 flex-1 border-l border-[var(--color-line)] ${selected ? "flex flex-col" : "hidden sm:flex sm:flex-col"}`}>
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="cursor-pointer border-b border-[var(--color-line)] px-4 py-2 text-left text-[13px] text-[var(--color-ink-muted)] sm:hidden"
            >
              ← ページ一覧に戻る
            </button>
            <NotesEditor key={selected.id} note={selected} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center px-6 text-center">
            <div>
              <p className="text-[15px] font-medium text-[var(--color-ink)]">
                ページを選ぶか、新しく作成します
              </p>
              <p className="mt-2 text-[13px] text-[var(--color-ink-muted)]">
                この案件の打合せ・タスクごとのメモを、すぐに書き始められます。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
