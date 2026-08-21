"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { sortProjects, type Project } from "@/lib/projects/types";
import { ProjectsList, type StatusFilter } from "./ProjectsList";

/**
 * /projects は一覧専用。Project Detail は /projects/[id] の実 route に
 * 分離した（概要・タスク・ガント・Notes・Learning の real route タブを
 * 持たせるため、React state だけの fake tab では作れない）。
 */
export function ProjectsWorkspace() {
  const { status, projects, createProject } = useProjects();
  const router = useRouter();
  const searchParams = useSearchParams();
  const legacyProjectId = searchParams.get("project");

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  const visible = useMemo(() => filterProjects(projects, filter, query), [projects, filter, query]);

  // 旧: /projects?project=id （インライン選択）から遷移してきた古いリンク・
  // ブックマークを、新しい実 route へ救済する。
  useEffect(() => {
    if (legacyProjectId) router.replace(`/projects/${legacyProjectId}`);
  }, [legacyProjectId, router]);

  const handleCreate = async () => {
    const created = await createProject({ name: "" });
    if (created) router.push(`/projects/${created.id}`);
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

  if (legacyProjectId) {
    return <Message title="読み込み中…">プロジェクトを開いています。</Message>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ProjectsList
        projects={visible}
        query={query}
        onQueryChange={setQuery}
        filter={filter}
        onFilterChange={setFilter}
        onCreate={() => void handleCreate()}
      />
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
