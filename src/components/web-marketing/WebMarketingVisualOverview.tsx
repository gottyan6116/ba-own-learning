import React from "react";
import type { WebMarketingPriority, WebMarketingResult } from "@/lib/web-marketing/types";

const PRIORITY_STYLE: Record<WebMarketingPriority, { label: string; badge: string; border: string }> = {
  high: { label: "最優先", badge: "bg-red-100 text-red-700", border: "border-l-red-500" },
  medium: { label: "重要", badge: "bg-amber-100 text-amber-800", border: "border-l-amber-500" },
  low: { label: "次点", badge: "bg-slate-100 text-slate-700", border: "border-l-slate-400" },
};

/** Renderer-owned dashboard. AI supplies only the validated content, never layout. */
export function WebMarketingVisualOverview({ result }: { result: WebMarketingResult }) {
  return (
    <section className="mt-7 space-y-5" aria-label="ウェブマーケ分析の可視化">
      <div className="grid gap-3 md:grid-cols-4">
        <FlowCard step="01" title="現状" items={result.currentState} tone="border-blue-500" />
        <FlowCard step="02" title="課題" items={result.issues.map((issue) => issue.title)} tone="border-red-500" />
        <FlowCard step="03" title="示唆" items={result.insights} tone="border-violet-500" />
        <FlowCard step="04" title="打ち手" items={result.priorityActions.map((action) => action.action)} tone="border-emerald-500" />
      </div>

      <section className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-sunken)] p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2"><h3 className="font-semibold text-[var(--color-ink)]">優先課題 → 実行施策</h3><span className="text-[12px] text-[var(--color-ink-muted)]">影響度の高い順に着手</span></div>
        <div className="mt-4 grid gap-4 xl:grid-cols-2">
          <div className="space-y-3">
            {result.issues.map((issue) => {
              const style = PRIORITY_STYLE[issue.severity];
              return <article key={issue.title} className={`rounded-md border border-[var(--color-line)] border-l-4 ${style.border} bg-white p-3`}><div className="flex items-start justify-between gap-3"><h4 className="font-semibold text-[14px]">{issue.title}</h4><span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${style.badge}`}>{style.label}</span></div><p className="mt-2 text-[12px] leading-5 text-[var(--color-ink-secondary)]"><b>根拠：</b>{issue.evidence}</p><p className="mt-1 text-[12px] leading-5 text-[var(--color-ink-secondary)]"><b>影響：</b>{issue.impact}</p></article>;
            })}
          </div>
          <div className="space-y-3">
            {result.priorityActions.map((action, index) => {
              const style = PRIORITY_STYLE[action.priority];
              return <article key={action.action} className={`rounded-md border border-[var(--color-line)] border-l-4 ${style.border} bg-white p-3`}><div className="flex items-start gap-3"><span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[var(--color-zenith)] text-[12px] font-semibold text-white">{index + 1}</span><div><h4 className="font-semibold text-[14px]">{action.action}</h4><p className="mt-1 text-[12px] leading-5 text-[var(--color-ink-secondary)]">{action.whyNow}</p><p className="mt-2 rounded bg-emerald-50 px-2 py-1 text-[12px] text-emerald-900"><b>成功指標：</b>{action.successSignal}</p></div></div></article>;
            })}
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-lg border border-[var(--color-line)] p-4"><h3 className="font-semibold">測定するKPI</h3><div className="mt-3 flex flex-wrap gap-2">{result.kpis.map((kpi) => <span key={kpi} className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-[12px] font-medium text-blue-900">{kpi}</span>)}</div></section>
        <section className="rounded-lg border border-[var(--color-line)] p-4"><h3 className="font-semibold">追加確認事項</h3><ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--color-ink-secondary)]">{result.openQuestions.map((question) => <li key={question}>• {question}</li>)}</ul></section>
      </div>
    </section>
  );
}

function FlowCard({ step, title, items, tone }: { step: string; title: string; items: string[]; tone: string }) {
  return <article className={`relative rounded-lg border border-[var(--color-line)] border-t-4 ${tone} bg-white p-4`}><span className="text-[11px] font-semibold tracking-[0.1em] text-[var(--color-ink-muted)]">{step}</span><h3 className="mt-1 font-semibold">{title}</h3><ul className="mt-2 space-y-1.5 text-[12px] leading-5 text-[var(--color-ink-secondary)]">{items.slice(0, 3).map((item) => <li key={item}>• {item}</li>)}</ul></article>;
}
