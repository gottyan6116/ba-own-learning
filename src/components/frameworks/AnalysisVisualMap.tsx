import { FRAMEWORK_LABEL, type FrameworkAnalysisResult } from "@/lib/frameworks/types";

/** A renderer-owned diagram: model text cannot control layout or links. */
export function AnalysisVisualMap({ result, compact = false }: { result: FrameworkAnalysisResult; compact?: boolean }) {
  if (!result.strategicThesis) return null;

  return (
    <figure className="mt-6 rounded-[6px] border border-[var(--color-line-strong)] bg-[var(--color-surface-sunken)] p-4 sm:p-5">
      <figcaption className="label-caps">図解：{FRAMEWORK_LABEL[result.framework]}の戦略マップ</figcaption>
      <div className="mt-3 rounded-[5px] border-l-4 border-[var(--color-zenith)] bg-white px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.08em] text-[var(--color-ink-muted)]">戦略仮説</p>
        <p className="mt-1 text-[14px] font-medium leading-6 text-[var(--color-ink)]">{result.strategicThesis}</p>
      </div>
      <div className="mt-4 flex flex-wrap items-stretch gap-2" aria-label="分析論点の関係図">
        {result.sections.map((section, index) => (
          <div key={section.id} className="flex min-w-[180px] flex-1 items-center gap-2">
            <article className="min-w-0 flex-1 rounded-[5px] border border-[var(--color-line)] bg-white px-3 py-2.5">
              <p className="text-[12px] font-semibold text-[var(--color-ink)]">{section.title}</p>
              <p className="mt-1 text-[12px] leading-5 text-[var(--color-ink-secondary)]">{section.keyInsight ?? section.analysis}</p>
              {!compact && section.implications?.[0] && <p className="mt-2 border-t border-[var(--color-line-faint)] pt-2 text-[11px] leading-5 text-[var(--color-ink-muted)]">示唆：{section.implications[0]}</p>}
            </article>
            {index < result.sections.length - 1 && <span aria-hidden="true" className="hidden text-[18px] text-[var(--color-ink-muted)] xl:inline">→</span>}
          </div>
        ))}
      </div>
    </figure>
  );
}
