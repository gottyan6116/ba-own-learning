"use client";

import { useMemo, useState } from "react";
import { useFrameworkAnalyses } from "@/lib/frameworks/FrameworkAnalysesProvider";
import { readFrameworkResult } from "@/lib/frameworks/schemas";
import {
  FRAMEWORK_LABEL,
  FRAMEWORK_TYPES,
  type FrameworkAnalysis,
  type FrameworkAnalysisResult,
  type FrameworkType,
} from "@/lib/frameworks/types";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { AnalysisVisualMap } from "./AnalysisVisualMap";

export function FrameworkWorkspace() {
  const { status, analyses, links, createAnalysis, setLinkedProjects, errorMessage } = useFrameworkAnalyses();
  const { projects } = useProjects();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [framework, setFramework] = useState<FrameworkType>("3c");
  const [regeneratedFromId, setRegeneratedFromId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const selected = analyses.find((analysis) => analysis.id === selectedId) ?? analyses[0] ?? null;
  const selectedResult = selected ? readFrameworkResult(selected) : null;
  const linkedProjectIds = useMemo(
    () => (selected ? links.filter((link) => link.framework_analysis_id === selected.id).map((link) => link.project_id) : []),
    [links, selected],
  );

  const generate = async () => {
    setBusy(true);
    setFormError(null);
    try {
      const response = await fetch("/api/frameworks/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName, sourceUrl, notes, framework }),
      });
      const payload = (await response.json()) as {
        result?: FrameworkAnalysisResult;
        source?: { url: string; fetchedAt: string };
        model?: string | null;
        error?: { message?: string };
      };
      if (!response.ok || !payload.result || !payload.source) {
        setFormError(payload.error?.message ?? "分析を生成できませんでした。");
        return;
      }
      const created = await createAnalysis({
        companyName,
        sourceUrl: payload.source.url,
        sourceNotes: notes,
        sourceMetadata: { url: payload.source.url, fetchedAt: payload.source.fetchedAt },
        sourceFetchedAt: payload.source.fetchedAt,
        model: payload.model,
        frameworkType: framework,
        result: payload.result,
        regeneratedFromId,
      });
      if (!created) {
        setFormError("分析結果を保存できませんでした。");
        return;
      }
      setSelectedId(created.id);
    } catch {
      setFormError("通信に失敗しました。接続を確認して再試行してください。");
    } finally {
      setBusy(false);
    }
  };

  if (status === "loading") return <Message>分析を読み込んでいます。</Message>;
  if (status === "signed-out") return <Message>フレームワーク分析を使うにはログインが必要です。</Message>;
  if (status === "unconfigured") return <Message>Supabaseの設定後に分析を保存できます。</Message>;
  if (status === "error") return <Message>分析を取得できませんでした。{errorMessage && `（${errorMessage}）`}</Message>;

  return (
    <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto grid w-full max-w-[1280px] gap-8 px-5 py-6 lg:grid-cols-[330px_minmax(0,1fr)] lg:px-8">
        <aside className="border-r-0 border-[var(--color-line)] lg:border-r lg:pr-6">
          <h1 className="text-[20px] font-bold text-[var(--color-ink)]">フレームワーク</h1>
          <p className="mt-2 text-[13px] leading-6 text-[var(--color-ink-secondary)]">
            公開URLと補足情報を根拠に、会社を構造化して分析します。
          </p>
          <div className="mt-5 space-y-1 border-t border-[var(--color-line)] pt-3">
            {analyses.length === 0 ? (
              <p className="py-3 text-[13px] text-[var(--color-ink-muted)]">保存済みの分析はありません。</p>
            ) : (
              analyses.map((analysis) => (
                <button
                  key={analysis.id}
                  type="button"
                  onClick={() => setSelectedId(analysis.id)}
                  className={`block w-full rounded-[4px] px-3 py-2.5 text-left transition-colors ${
                    selected?.id === analysis.id
                      ? "bg-[var(--color-surface-selected)]"
                      : "hover:bg-[var(--color-surface-sunken)]"
                  }`}
                >
                  <span className="block truncate text-[13px] font-medium text-[var(--color-ink)]">{analysis.company_name}</span>
                  <span className="mt-0.5 block text-[11px] text-[var(--color-ink-muted)]">
                    {FRAMEWORK_LABEL[analysis.framework_type]} ・ {new Date(analysis.generated_at).toLocaleDateString("ja-JP")}
                  </span>
                </button>
              ))
            )}
          </div>
        </aside>

        <div className="min-w-0 space-y-8">
          <section className="border-b border-[var(--color-line)] pb-7">
            <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">新しい分析を作成</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="フレームワーク">
                <select value={framework} onChange={(event) => { setFramework(event.target.value as FrameworkType); setRegeneratedFromId(null); }} className="field">
                  {FRAMEWORK_TYPES.map((type) => <option key={type} value={type}>{FRAMEWORK_LABEL[type]}</option>)}
                </select>
              </Field>
              <Field label="会社名">
                <input value={companyName} onChange={(event) => { setCompanyName(event.target.value); setRegeneratedFromId(null); }} placeholder="例：株式会社サンプル" className="field" />
              </Field>
              <Field label="公開HTTPS URL" wide>
                <input value={sourceUrl} onChange={(event) => { setSourceUrl(event.target.value); setRegeneratedFromId(null); }} placeholder="https://example.com" inputMode="url" className="field" />
              </Field>
              <Field label="補足メモ（任意）" wide>
                <textarea value={notes} onChange={(event) => { setNotes(event.target.value); setRegeneratedFromId(null); }} rows={4} placeholder="確認したい顧客層、競合、案件の背景など" className="field min-h-24 py-2" />
              </Field>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" disabled={busy} onClick={() => void generate()} className="h-10 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-4 text-[13px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
                {busy ? "分析を生成中…" : regeneratedFromId ? "追加入力で再生成" : "分析を生成"}
              </button>
              {selected && <button type="button" disabled={busy} onClick={() => { setCompanyName(selected.company_name); setSourceUrl(selected.source_url); setNotes(selected.source_notes); setFramework(selected.framework_type); setRegeneratedFromId(selected.id); }} className="h-10 cursor-pointer rounded-[4px] border border-[var(--color-line-strong)] px-3 text-[13px] text-[var(--color-ink-secondary)] disabled:opacity-50">選択した分析を再生成</button>}
              <p className="text-[12px] text-[var(--color-ink-muted)]">結果は新しいバージョンとして保存されます。</p>
            </div>
            {formError && <p role="alert" className="mt-3 text-[13px] text-[var(--color-danger)]">{formError}</p>}
          </section>

          {selected && selectedResult ? (
            <AnalysisResult
              analysis={selected}
              result={selectedResult}
              projects={projects}
              linkedProjectIds={linkedProjectIds}
              onProjectsChange={(ids) => void setLinkedProjects(selected.id, ids)}
            />
          ) : (
            <p className="text-[14px] text-[var(--color-ink-muted)]">作成した分析結果はここに表示されます。</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AnalysisResult({ analysis, result, projects, linkedProjectIds, onProjectsChange }: {
  analysis: FrameworkAnalysis;
  result: FrameworkAnalysisResult;
  projects: Array<{ id: string; name: string }>;
  linkedProjectIds: string[];
  onProjectsChange: (ids: string[]) => void;
}) {
  return <section>
    <div className="flex flex-wrap items-baseline justify-between gap-3 border-b-2 border-[var(--color-rule)] pb-3">
      <div><p className="label-caps">{FRAMEWORK_LABEL[analysis.framework_type]}</p><h2 className="mt-1 text-[22px] font-bold text-[var(--color-ink)]">{result.title}</h2></div>
      <a href={analysis.source_url} target="_blank" rel="noreferrer" className="text-[12px] text-[var(--color-zenith)] underline underline-offset-2">根拠URLを開く</a>
    </div>
    <p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">取得日時：{analysis.source_fetched_at ? new Date(analysis.source_fetched_at).toLocaleString("ja-JP") : "記録なし"}</p>
    <p className="mt-4 max-w-[60rem] text-[15px] leading-7 text-[var(--color-ink-secondary)]">{result.executiveSummary}</p>
    <AnalysisVisualMap result={result} />
    <div className="mt-6 space-y-5">
      {result.sections.map((section) => <section key={section.id} className="border-b border-[var(--color-line-faint)] pb-5"><h3 className="text-[15px] font-semibold text-[var(--color-ink)]">{section.title}</h3>{section.keyInsight && <p className="mt-2 border-l-2 border-[var(--color-zenith)] pl-3 text-[14px] font-medium leading-6 text-[var(--color-ink)]">結論：{section.keyInsight}</p>}<p className="mt-3 whitespace-pre-wrap text-[14px] leading-7 text-[var(--color-ink-secondary)]">{section.analysis}</p>{section.evidence.length > 0 && <EvidenceList title="確認できた事実" items={section.evidence} />}{section.implications?.length ? <EvidenceList title="戦略的示唆" items={section.implications} emphasis /> : null}{section.openQuestions?.length ? <EvidenceList title="追加で確認する点" items={section.openQuestions} /> : null}</section>)}
    </div>
    {result.priorityActions?.length ? <PriorityActions actions={result.priorityActions} /> : result.recommendations.length ? <EvidenceList title="推奨アクション" items={result.recommendations} emphasis /> : null}
    <ProjectLinks projects={projects} linkedIds={linkedProjectIds} onChange={onProjectsChange} />
    {result.limitations.length > 0 && <p className="mt-5 text-[12px] leading-6 text-[var(--color-ink-muted)]">注意：{result.limitations.join(" / ")}</p>}
  </section>;
}

function EvidenceList({ title, items, emphasis = false }: { title: string; items: string[]; emphasis?: boolean }) { return <div className="mt-3"><h4 className="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-ink-muted)]">{title}</h4><ul className={`mt-1.5 list-disc space-y-1 pl-5 text-[12px] leading-6 ${emphasis ? "text-[var(--color-ink-secondary)]" : "text-[var(--color-ink-muted)]"}`}>{items.map((item) => <li key={item}>{item}</li>)}</ul></div>; }

function PriorityActions({ actions }: { actions: NonNullable<FrameworkAnalysisResult["priorityActions"]> }) { const labels = { high: "最優先", medium: "次点", low: "低" } as const; return <section className="mt-6 rounded-[5px] border border-[var(--color-line)] p-4"><h3 className="text-[14px] font-semibold text-[var(--color-ink)]">優先アクション</h3><ol className="mt-3 space-y-4">{actions.map((item, index) => <li key={`${item.priority}-${item.action}`} className="border-l-2 border-[var(--color-zenith)] pl-3"><p className="text-[13px] font-medium text-[var(--color-ink)]"><span className="mr-2 text-[11px] text-[var(--color-zenith)]">{index + 1}. {labels[item.priority]}</span>{item.action}</p><p className="mt-1 text-[12px] leading-6 text-[var(--color-ink-secondary)]">なぜ今：{item.whyNow}</p><p className="text-[12px] leading-6 text-[var(--color-ink-muted)]">成功指標：{item.successSignal}</p></li>)}</ol></section>; }

function ProjectLinks({ projects, linkedIds, onChange }: { projects: Array<{ id: string; name: string }>; linkedIds: string[]; onChange: (ids: string[]) => void }) {
  return <section className="mt-7 border-t border-[var(--color-line)] pt-4"><h3 className="text-[14px] font-semibold text-[var(--color-ink)]">プロジェクトに追加</h3><p className="mt-1 text-[12px] text-[var(--color-ink-muted)]">表示したい案件を複数選択できます。</p><div className="mt-3 grid gap-2 sm:grid-cols-2">{projects.map((project) => { const checked = linkedIds.includes(project.id); return <label key={project.id} className="flex cursor-pointer items-center gap-2 rounded-[4px] border border-[var(--color-line)] px-3 py-2 text-[13px] text-[var(--color-ink-secondary)]"><input type="checkbox" checked={checked} onChange={() => onChange(checked ? linkedIds.filter((id) => id !== project.id) : [...linkedIds, project.id])} />{project.name || "無題のプロジェクト"}</label>; })}</div>{projects.length === 0 && <p className="mt-3 text-[13px] text-[var(--color-ink-muted)]">先にプロジェクトを作成してください。</p>}</section>;
}

function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <label className={wide ? "sm:col-span-2" : ""}><span className="label-caps mb-1.5 block">{label}</span>{children}</label>; }
function Message({ children }: { children: React.ReactNode }) { return <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">{children}</div>; }
