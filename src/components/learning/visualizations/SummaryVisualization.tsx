import React from "react";
import type { SummaryVisualizationData } from "@/lib/learning/types";

/**
 * 見出し + 本文の要約。
 * カードを並べず、見出しのウェイトと余白だけで階層を作る。
 */
export function SummaryVisualization({ data }: { data: SummaryVisualizationData }) {
  return (
    <div className="max-w-[46rem] space-y-5">
      {data.sections.map((section, index) => (
        <section key={`${section.heading}-${index}`}>
          <h4 className="text-[15px] font-semibold leading-6 text-[var(--color-ink)]">
            {section.heading}
          </h4>
          {section.body && (
            <p className="mt-1 whitespace-pre-wrap text-[14px] leading-7 text-[var(--color-ink-secondary)]">
              {section.body}
            </p>
          )}
        </section>
      ))}
    </div>
  );
}
