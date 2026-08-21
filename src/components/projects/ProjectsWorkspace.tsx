"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { sortProjects, type Project } from "@/lib/projects/types";
import { ProjectsList, type StatusFilter } from "./ProjectsList";
import { ProjectDetail } from "./ProjectDetail";

/**
 * Desktop は 2ペイン（List / Detail）。md 未満では1ペインずつ出す。
 * Notes の NotesWorkspace と同じ骨格 — ?project=id での深いリンク、
 * 選択が消えたら先頭を開く、モバイルは「一覧に戻る」で切り替える。
 */
export function ProjectsWorkspace() {
  const { status, projects, createProject } = useProjects();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("project");

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // モバイルで「← 一覧に戻る」を押した直後だけ true。
  // これが無いと、下の自動選択 effect が selectedId=null を「未選択」と
  // 誤解して即座に先頭のプロジェクトを選び直し、戻るボタンが効かなくなる。
  const clearedByUser = useRef(false);

  const visible = useMemo(() => filterProjects(projects, filter, query), [projects, filter, query]);

  useEffect(() => {
    if (!requestedId) return;
    if (!projects.some((project) => project.id === requestedId)) return;
    clearedByUser.current = false;
    setSelectedId(requestedId);
    setFilter("all");
  }, [requestedId, projects]);

  // ただし「戻る」で意図的に外した直後は割り込まない。
  useEffect(() => {
    if (selectedId && projects.some((project) => project.id === selectedId)) return;
    if (clearedByUser.current) return;
    setSelectedId(visible[0]?.id ?? null);
  }, [visible, projects, selectedId]);

  const selected = projects.find((project) => project.id === selectedId) ?? null;

  const selectProject = (id: string | null) => {
    clearedByUser.current = id === null;
    setSelectedId(id);
  };

  const handleCreate = async () => {
    const created = await createProject({ name: "" });
    if (created) {
      selectProject(created.id);
      if (requestedId) router.replace("/projects");
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
        を設定すると、プロジェクトの保存が有効になります。README の Supabase setup を参照してください。
      </Message>
    );
  }

  if (status === "signed-out") {
    return (
      <Message title="プロジェクトを使うにはログインが必要です">
        案件データは個人情報なので、Supabase の Row Level Security
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
    return <Message title="読み込み中…">プロジェクトを取得しています。</Message>;
  }

  if (status === "error") {
    return (
      <Message title="プロジェクトを取得できませんでした">
        Supabase の接続設定と、projects テーブルの作成・RLS の設定を確認してください。
      </Message>
    );
  }

  return (
    <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(280px,360px)_1fr]">
      <div className={`min-h-0 min-w-0 ${selected ? "hidden md:flex md:flex-col" : "flex flex-col"}`}>
        <ProjectsList
          projects={visible}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          filter={filter}
          onFilterChange={setFilter}
          onSelect={selectProject}
          onCreate={() => void handleCreate()}
        />
      </div>

      <div className={`min-h-0 min-w-0 ${selected ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
        {selected ? (
          <>
            <button
              type="button"
              onClick={() => selectProject(null)}
              className="cursor-pointer border-b border-[var(--color-line)] bg-white px-4 py-2 text-left text-[13px] text-[var(--color-ink-muted)] md:hidden"
            >
              ← 一覧に戻る
            </button>
            <ProjectDetail key={selected.id} project={selected} />
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center bg-white px-6 py-10">
            <div className="max-w-[38ch] text-center">
              <p className="text-[15px] font-medium text-[var(--color-ink)]">
                プロジェクトを選ぶか、新しく作成します
              </p>
              <p className="mt-2 text-[13px] leading-6 text-[var(--color-ink-muted)]">
                クライアント名・使用システム・進捗を記録し、関連メモをその場に紐づけられます。
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function filterProjects(projects: Project[], filter: StatusFilter, query: string): Project[] {
  const needle = query.trim().toLowerCase();
  const filtered = projects.filter((project) => {
    if (filter === "archived" && !project.is_archived) return false;
    if (filter !== "all" && filter !== "archived") {
      if (project.is_archived) return false;
      if (project.status !== filter) return false;
    } else if (filter === "all" && project.is_archived) {
      // 「すべて」はアーカイブ以外。過去案件で埋もれるのを避ける。
      return false;
    }
    if (!needle) return true;
    return (
      project.name.toLowerCase().includes(needle) ||
      (project.client ?? "").toLowerCase().includes(needle) ||
      project.summary.toLowerCase().includes(needle)
    );
  });
  return sortProjects(filtered);
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-16 sm:px-6">
      <h1 className="text-[20px] font-bold text-[var(--color-ink)]">{title}</h1>
      <p className="mt-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">{children}</p>
    </div>
  );
}
