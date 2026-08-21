"use client";

import { useState } from "react";
import { getBusinessArea, getProduct, getSystemCategory } from "@/data";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";
import type { LearningClassification, VisualizationData } from "@/lib/learning/types";
import { Chip } from "@/components/ui/primitives";
import { VisualizationRenderer } from "./visualizations/VisualizationRenderer";

/**
 * Preview と Detail で共通の本文。
 *
 * 「保存前のプレビュー」と「保存後の詳細」で見え方が変わると、
 * 保存してよいか判断できない。両方でこのコンポーネントを使い、
 * 同じ見た目を保証する。
 */
export function LearningBody({
  summary,
  visualization,
  keyPoints,
  relatedConcepts,
  classification,
  sourceText,
}: {
  summary: string;
  visualization: VisualizationData | null;
  keyPoints: string[];
  relatedConcepts: string[];
  classification: LearningClassification;
  sourceText: string;
}) {
  const { openSystem, openProduct } = useKnowledgeView();
  const [showSource, setShowSource] = useState(false);

  const area = getBusinessArea(classification.businessArea);
  const system = getSystemCategory(classification.systemCategory);
  const product = getProduct(classification.productKey);
  const hasClassification = Boolean(area || system || product);

  return (
    <div className="space-y-7">
      {summary && (
        <p className="max-w-[46rem] text-[15px] leading-7 text-[var(--color-ink-secondary)]">
          {summary}
        </p>
      )}

      <section>
        <VisualizationRenderer data={visualization} />
      </section>

      {keyPoints.length > 0 && (
        <section>
          <h3 className="label-caps border-b border-[var(--color-line)] pb-1.5">要点</h3>
          <ul className="mt-2 max-w-[46rem]">
            {keyPoints.map((point, index) => (
              <li
                key={`${point}-${index}`}
                className="flex gap-3 border-b border-[var(--color-line-faint)] py-2 last:border-b-0"
              >
                <span
                  aria-hidden="true"
                  className="tabular w-4 shrink-0 text-[12px] font-semibold text-[var(--color-ink-muted)]"
                >
                  {index + 1}
                </span>
                <span className="text-[14px] leading-6 text-[var(--color-ink-secondary)]">
                  {point}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {relatedConcepts.length > 0 && (
        <section>
          <h3 className="label-caps border-b border-[var(--color-line)] pb-1.5">関連概念</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {relatedConcepts.map((concept) => (
              <Chip key={concept}>{concept}</Chip>
            ))}
          </div>
        </section>
      )}

      {hasClassification && (
        <section>
          <h3 className="label-caps border-b border-[var(--color-line)] pb-1.5">
            Knowledge Map
          </h3>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {area && (
              <span className="text-[13px] text-[var(--color-ink-secondary)]">{area.name}</span>
            )}
            {system && (
              <Chip onClick={() => openSystem(system.id)} title={system.name}>
                {system.shortName}
              </Chip>
            )}
            {product && (
              <Chip onClick={() => openProduct(product.id)}>{product.name}</Chip>
            )}
          </div>
        </section>
      )}

      {sourceText && (
        <section className="border-t border-[var(--color-line)] pt-4">
          <button
            type="button"
            onClick={() => setShowSource((prev) => !prev)}
            aria-expanded={showSource}
            className="cursor-pointer text-[13px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
          >
            {showSource ? "元のメモを隠す" : "元のメモを表示"}
          </button>
          {showSource && (
            <p className="mt-3 max-w-[46rem] whitespace-pre-wrap border-l border-[var(--color-line-strong)] pl-4 text-[13px] leading-7 text-[var(--color-ink-secondary)]">
              {sourceText}
            </p>
          )}
        </section>
      )}
    </div>
  );
}
