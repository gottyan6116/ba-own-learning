"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnalysisVisualMap } from "@/components/frameworks/AnalysisVisualMap";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useFrameworkAnalyses } from "@/lib/frameworks/FrameworkAnalysesProvider";
import { analysesForProject } from "@/lib/frameworks/relations";
import { readFrameworkResult } from "@/lib/frameworks/schemas";
import { FRAMEWORK_LABEL } from "@/lib/frameworks/types";
import type { Project } from "@/lib/projects/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProjectInitiativeRow } from "@/lib/supabase/types";

export function ProjectAnalysesTab({ project }: { project: Project }) {
  const { status, analyses, links, deleteAnalysis, setLinkedProjects } = useFrameworkAnalyses();
  const related = analysesForProject(analyses, links, project.id);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = related.find((analysis) => analysis.id === selectedId) ?? related[0] ?? null;
  const { user } = useAuth();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [initiatives, setInitiatives] = useState<ProjectInitiativeRow[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!supabase || !user) return;
    void supabase.from("project_initiatives").select("*").eq("project_id", project.id).order("sort_order")
      .then(({ data }) => setInitiatives(data ?? []));
  }, [project.id, supabase, user]);

  const generateInitiatives = async () => {
    if (!supabase || !user) return;
    setBusy(true);
    const proposed = related.flatMap((analysis) => readFrameworkResult(analysis)?.priorityActions?.map((item, index) => ({
      user_id: user.id, project_id: project.id, priority: item.priority, title: item.action,
      summary: item.whyNow, rationale: item.whyNow, success_metric: item.successSignal,
      source_analysis_ids: [analysis.id], sort_order: initiatives.length + index,
    })) ?? []).slice(0, 10);
    if (proposed.length) {
      const { data } = await supabase.from("project_initiatives").insert(proposed).select();
      if (data) setInitiatives((current) => [...current, ...data]);
    }
    setBusy(false);
  };

  const removeFromProject = async () => {
    if (!selected) return;
    await setLinkedProjects(selected.id, links
      .filter((link) => link.framework_analysis_id === selected.id && link.project_id !== project.id)
      .map((link) => link.project_id));
    setSelectedId(null);
  };

  const removeAnalysis = async () => {
    if (!selected || !window.confirm("この分析を完全に削除します。ほかのプロジェクトとの紐づけも失われます。")) return;
    await deleteAnalysis(selected.id);
    setSelectedId(null);
  };

  const addTask = async (initiative: ProjectInitiativeRow) => {
    if (!supabase || !user) return;
    await supabase.from("project_tasks").insert({
      user_id: user.id, project_id: project.id, title: initiative.title,
      description: `${initiative.summary}\n成功指標：${initiative.success_metric}`,
      status: "todo", start_date: null, end_date: null, progress: 0, sort_order: 9999,
    });
  };

  if (status === "loading") return <Message>分析を読み込んでいます。</Message>;
  if (status !== "ready") return <Message>分析を表示するにはログインとSupabase設定が必要です。</Message>;

  const result = selected ? readFrameworkResult(selected) : null;
  return (
    <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[1040px] px-5 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">分析 <span className="tabular ml-1 text-[13px] font-normal text-[var(--color-ink-muted)]">{related.length}件</span></h2>
          <Link href="/frameworks" className="text-[13px] text-[var(--color-zenith)] underline underline-offset-2">分析を追加</Link>
        </div>

        <section className="mt-4 rounded border p-4">
          <div className="flex items-center justify-between gap-3"><h3 className="font-semibold">打ち手・施策案</h3><button disabled={busy || related.length === 0} onClick={() => void generateInitiatives()} className="rounded bg-[var(--color-zenith)] px-3 py-2 text-[12px] text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "考案中…" : "施策を考案"}</button></div>
          {initiatives.map((item) => <div key={item.id} className="mt-3 border-t pt-3"><b>{item.title}</b><p className="mt-1 text-[13px] text-[var(--color-ink-secondary)]">{item.summary}</p><p className="mt-1 text-[12px]">成功指標：{item.success_metric}</p><button onClick={() => void addTask(item)} className="mt-2 text-[12px] text-[var(--color-zenith)] underline">タスクに追加</button></div>)}
        </section>

        {related.length === 0 ? <p className="mt-6 text-[14px] leading-7 text-[var(--color-ink-muted)]">紐づいた分析はありません。フレームワーク分析画面で分析を作成し、このプロジェクトを選択してください。</p> : <div className="mt-5 grid gap-5 lg:grid-cols-[270px_minmax(0,1fr)]">
          <nav aria-label="紐づいた分析" className="space-y-2">
            {related.map((analysis) => {
              const item = readFrameworkResult(analysis);
              const active = analysis.id === selected?.id;
              return <button key={analysis.id} type="button" onClick={() => setSelectedId(analysis.id)} className={`w-full rounded-lg border p-3 text-left transition ${active ? "border-[var(--color-zenith)] bg-blue-50" : "border-[var(--color-line)] hover:border-blue-300"}`}><p className="label-caps">{FRAMEWORK_LABEL[analysis.framework_type]}</p><p className="mt-1 text-[14px] font-semibold text-[var(--color-ink)]">{item?.title ?? analysis.company_name}</p><p className="mt-1 line-clamp-2 text-[12px] leading-5 text-[var(--color-ink-muted)]">{item?.executiveSummary}</p></button>;
            })}
          </nav>
          {selected && result && <article className="min-w-0 rounded-lg border border-[var(--color-line)] p-5">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-caps">{FRAMEWORK_LABEL[selected.framework_type]}</p><h3 className="mt-1 text-[20px] font-semibold text-[var(--color-ink)]">{result.title}</h3><a href={selected.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] text-[var(--color-zenith)] underline">根拠URLを開く</a></div><div className="flex flex-wrap gap-2"><Link href="/frameworks" className="rounded border px-3 py-2 text-[12px]">フレームワーク分析で確認・再生成</Link><button type="button" onClick={() => void removeFromProject()} className="rounded border px-3 py-2 text-[12px]">このプロジェクトから外す</button><button type="button" onClick={() => void removeAnalysis()} className="rounded border border-red-200 px-3 py-2 text-[12px] text-red-700">分析を削除</button></div></div>
            <p className="mt-5 text-[14px] leading-7">{result.executiveSummary}</p>
            <AnalysisVisualMap result={result} compact />
            <div className="mt-6 space-y-5">{result.sections.map((section) => <section key={section.id} className="border-t border-[var(--color-line)] pt-4"><h4 className="font-semibold">{section.title}</h4><p className="mt-2 text-[14px] leading-7 text-[var(--color-ink-secondary)]">{section.analysis}</p>{section.keyInsight && <p className="mt-2 rounded bg-blue-50 px-3 py-2 text-[13px]"><b>示唆：</b>{section.keyInsight}</p>}{section.evidence.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-[12px] leading-5 text-[var(--color-ink-muted)]">{section.evidence.map((evidence) => <li key={evidence}>{evidence}</li>)}</ul>}</section>)}</div>
          </article>}
        </div>}
      </div>
    </div>
  );
}

function Message({ children }: { children: ReactNode }) { return <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">{children}</div>; }
