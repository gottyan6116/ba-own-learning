"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { ProjectTasksProvider } from "@/lib/project-tasks/ProjectTasksProvider";
import { ProjectDetailHeader } from "@/components/projects/detail/ProjectDetailHeader";
import { ProjectDetailTabs } from "@/components/projects/detail/ProjectDetailTabs";

/**
 * Project header + タブは、5つのタブすべてで共有する（各ページで
 * 重複して作らない）。ここより下は「その Project 用の project_tasks」を
 * 局所的に持つ ProjectTasksProvider の中に入る — アプリ全体で常時
 * fetch しているわけではない。
 */
export default function ProjectDetailLayout({ children }: { children: React.ReactNode }) {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;
  const { status, projects } = useProjects();

  if (status === "unconfigured") {
    return (
      <Message title="Supabase が未設定です">
        <code className="rounded-[3px] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[13px]">
          .env.local
        </code>{" "}
        を設定すると、プロジェクトの保存が有効になります。
      </Message>
    );
  }

  if (status === "signed-out") {
    return (
      <Message title="プロジェクトを使うにはログインが必要です">
        <Link href="/login" className="text-[var(--color-focus)] underline underline-offset-2">
          ログイン
        </Link>
        してください。
      </Message>
    );
  }

  if (status === "loading") {
    return (
      <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">読み込み中…</div>
    );
  }

  if (status === "error") {
    return (
      <Message title="プロジェクトを取得できませんでした">
        Supabase の接続設定を確認してください。
      </Message>
    );
  }

  const project = projects.find((item) => item.id === projectId);

  if (!project) {
    return (
      <Message title="プロジェクトが見つかりません">
        削除されたか、アクセスできない可能性があります。
        <Link href="/projects" className="ml-1 text-[var(--color-focus)] underline underline-offset-2">
          一覧へ戻る
        </Link>
      </Message>
    );
  }

  return (
    <ProjectTasksProvider projectId={project.id}>
      <div className="flex min-h-0 flex-1 flex-col">
        <ProjectDetailHeader project={project} />
        <ProjectDetailTabs projectId={project.id} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </ProjectTasksProvider>
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-16 sm:px-6">
      <h1 className="text-[20px] font-bold text-[var(--color-ink)]">{title}</h1>
      <p className="mt-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">{children}</p>
    </div>
  );
}
