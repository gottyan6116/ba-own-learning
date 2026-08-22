"use client";

import Link from "next/link";
import { useFrameworkAnalyses } from "@/lib/frameworks/FrameworkAnalysesProvider";
import { analysesForProject } from "@/lib/frameworks/relations";
import { readFrameworkResult } from "@/lib/frameworks/schemas";
import { FRAMEWORK_LABEL } from "@/lib/frameworks/types";
import type { Project } from "@/lib/projects/types";
import { AnalysisVisualMap } from "@/components/frameworks/AnalysisVisualMap";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { ProjectInitiativeRow } from "@/lib/supabase/types";

export function ProjectAnalysesTab({ project }: { project: Project }) {
  const { status, analyses, links } = useFrameworkAnalyses();
  const related = analysesForProject(analyses, links, project.id);
  const { user } = useAuth(); const supabase = useMemo(() => getSupabaseBrowserClient(), []); const [initiatives, setInitiatives] = useState<ProjectInitiativeRow[]>([]); const [busy, setBusy] = useState(false);
  useEffect(() => { if (!supabase || !user) return; void supabase.from("project_initiatives").select("*").eq("project_id", project.id).order("sort_order").then(({ data }) => setInitiatives(data ?? [])); }, [project.id, supabase, user]);
  const generateInitiatives = async () => { if (!supabase || !user) return; setBusy(true); const proposed = related.flatMap((analysis) => readFrameworkResult(analysis)?.priorityActions?.map((item, index) => ({ user_id: user.id, project_id: project.id, priority: item.priority, title: item.action, summary: item.whyNow, rationale: item.whyNow, success_metric: item.successSignal, source_analysis_ids: [analysis.id], sort_order: initiatives.length + index })) ?? []).slice(0, 10); if (proposed.length) { const { data } = await supabase.from("project_initiatives").insert(proposed).select(); if (data) setInitiatives((current) => [...current, ...data]); } setBusy(false); };
  const addTask = async (initiative: ProjectInitiativeRow) => { if (!supabase || !user) return; await supabase.from("project_tasks").insert({ user_id: user.id, project_id: project.id, title: initiative.title, description: `${initiative.summary}\n成功指標：${initiative.success_metric}`, status: "todo", start_date: null, end_date: null, progress: 0, sort_order: 9999 }); };

  if (status === "loading") return <Message>分析を読み込んでいます。</Message>;
  if (status !== "ready") return <Message>分析を表示するにはログインとSupabase設定が必要です。</Message>;
  return <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white"><div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8"><div className="flex items-center justify-between gap-3"><h2 className="text-[16px] font-semibold text-[var(--color-ink)]">分析 <span className="tabular ml-1 text-[13px] font-normal text-[var(--color-ink-muted)]">{related.length}件</span></h2><Link href="/frameworks" className="text-[13px] text-[var(--color-zenith)] underline underline-offset-2">分析を追加</Link></div><section className="mt-4 rounded border p-4"><div className="flex justify-between"><h3 className="font-semibold">打ち手・施策案</h3><button disabled={busy} onClick={() => void generateInitiatives()} className="rounded bg-[var(--color-zenith)] px-3 py-2 text-[12px] text-white">{busy ? "考案中…" : "施策を考案"}</button></div>{initiatives.map((item) => <div key={item.id} className="mt-3 border-t pt-3"><b>{item.title}</b><p className="text-[13px]">{item.summary}</p><p className="text-[12px]">成功指標：{item.success_metric}</p><button onClick={() => void addTask(item)} className="mt-2 text-[12px] text-[var(--color-zenith)] underline">タスクに追加</button></div>)}</section>{related.length === 0 ? <p className="mt-6 text-[14px] leading-7 text-[var(--color-ink-muted)]">紐づいた分析はありません。フレームワーク画面で分析を作成し、このプロジェクトを選択してください。</p> : <div className="mt-5 space-y-8">{related.map((analysis) => { const result = readFrameworkResult(analysis); return <article key={analysis.id} className="border-b border-[var(--color-line)] pb-7"><p className="label-caps">{FRAMEWORK_LABEL[analysis.framework_type]}</p><h3 className="mt-1 text-[19px] font-semibold text-[var(--color-ink)]">{result?.title ?? analysis.company_name}</h3>{result && <><p className="mt-3 text-[14px] leading-7">{result.executiveSummary}</p><AnalysisVisualMap result={result} compact /></>} </article>; })}</div>}</div></div>;
}

function Message({ children }: { children: React.ReactNode }) { return <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">{children}</div>; }
