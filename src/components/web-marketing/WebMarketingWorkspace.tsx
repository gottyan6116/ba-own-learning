"use client";

import { useEffect, useMemo, useState } from "react";
import { WebMarketingVisualOverview } from "@/components/web-marketing/WebMarketingVisualOverview";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { WebMarketingAnalysisRow } from "@/lib/supabase/types";
import { normalizeWebMarketingResult } from "@/lib/web-marketing/schemas";

export function WebMarketingWorkspace() {
  const { user } = useAuth();
  const { projects } = useProjects();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [rows, setRows] = useState<WebMarketingAnalysisRow[]>([]);
  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<WebMarketingAnalysisRow | null>(null);

  useEffect(() => {
    if (!supabase || !user) return;
    void supabase.from("web_marketing_analyses").select("*").order("generated_at", { ascending: false })
      .then(({ data }) => { const next = data ?? []; setRows(next); setSelected(next[0] ?? null); });
  }, [supabase, user]);

  const generate = async () => {
    setBusy(true); setError(null);
    try {
      const response = await fetch("/api/web-marketing/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sourceUrl: url, notes }) });
      const payload = await response.json().catch(() => null);
      if (!response.ok || !payload?.result) throw new Error(payload?.error?.message ?? "ウェブマーケ分析の生成に失敗しました。");
      if (!supabase || !user) throw new Error("ログインが必要です。");
      const { data, error: saveError } = await supabase.from("web_marketing_analyses").insert({
        user_id: user.id, source_url: payload.source.url, source_notes: notes, source_metadata: payload.source,
        result_data: payload.result, model: payload.model, source_fetched_at: payload.source.fetchedAt,
      }).select().single();
      if (saveError || !data) throw new Error(saveError?.message ?? "分析結果を保存できませんでした。");
      setRows((current) => [data, ...current]); setSelected(data);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "生成に失敗しました。"); }
    finally { setBusy(false); }
  };

  const result = selected ? normalizeWebMarketingResult(selected.result_data) : null;
  return (
    <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto grid max-w-[1240px] gap-8 px-5 py-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside><h1 className="text-[20px] font-bold">ウェブマーケ分析</h1><p className="mt-2 text-[13px] leading-6 text-[var(--color-ink-muted)]">URLを根拠に、現状・課題・示唆・打ち手を可視化します。</p><div className="mt-5 space-y-1">{rows.map((row) => <button key={row.id} onClick={() => setSelected(row)} className={`block w-full rounded px-3 py-2 text-left text-[13px] ${selected?.id === row.id ? "bg-[var(--color-surface-selected)] text-[var(--color-zenith)]" : "hover:bg-[var(--color-surface-sunken)]"}`}>{row.source_url}</button>)}</div></aside>
        <main className="min-w-0"><section className="border-b border-[var(--color-line)] pb-6"><h2 className="text-[16px] font-semibold">新しいサイト分析</h2><input className="field mt-4" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" /><textarea className="field mt-3 min-h-24 py-2" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="事業目標・確認したい顧客・競合など（任意）" /><button disabled={busy} onClick={() => void generate()} className="mt-3 h-10 rounded bg-[var(--color-zenith)] px-4 text-[13px] text-white disabled:opacity-50">{busy ? "分析中…" : "ウェブマーケ分析を生成"}</button>{error && <p role="alert" className="mt-2 text-[13px] text-[var(--color-danger)]">{error}</p>}</section>
          {result && selected && <article className="mt-7"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="label-caps">ウェブマーケ診断</p><h2 className="mt-1 text-[22px] font-bold">{result.title}</h2><a href={selected.source_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-[12px] text-[var(--color-zenith)] underline">分析したURLを開く</a></div></div><p className="mt-4 rounded-lg border-l-4 border-[var(--color-zenith)] bg-blue-50 px-4 py-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">{result.executiveSummary}</p><WebMarketingVisualOverview result={result} /><section className="mt-8 border-t border-[var(--color-line)] pt-4"><h3 className="font-semibold">プロジェクトに追加</h3><p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">分析結果を関連プロジェクトから参照できます。</p>{projects.map((project) => <label key={project.id} className="mt-2 flex items-center gap-2 text-[13px]"><input type="checkbox" onChange={async (event) => { if (!supabase) return; if (event.target.checked) await supabase.from("web_marketing_analysis_projects").upsert({ web_marketing_analysis_id: selected.id, project_id: project.id }); else await supabase.from("web_marketing_analysis_projects").delete().eq("web_marketing_analysis_id", selected.id).eq("project_id", project.id); }} />{project.name}</label>)}</section></article>}
        </main>
      </div>
    </div>
  );
}
