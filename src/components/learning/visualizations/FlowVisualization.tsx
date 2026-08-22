import React from "react";
import type { FlowVisualizationData } from "@/lib/learning/types";

/**
 * 手順・段階のフロー。
 *
 * グラフライブラリは入れない。工程は事実上ほぼ一直線なので、
 * 番号バッジ + 縦の連結線という「鎖」だけで、1〜2秒で順序が
 * 目に入るようにする。本線から外れる edge（差し戻し・分岐）だけを
 * 下に別掲する（本線を絡めると読みにくくなるため）。
 */
export function FlowVisualization({ data }: { data: FlowVisualizationData }) {
  const { nodes, edges } = data;
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  // 直前のノードから次のノードへ進む「本線」の辺かどうか
  const isMainLine = (from: string, to: string) => {
    const fromIndex = nodes.findIndex((node) => node.id === from);
    const toIndex = nodes.findIndex((node) => node.id === to);
    return fromIndex !== -1 && toIndex === fromIndex + 1;
  };

  const branchEdges = edges.filter((edge) => !isMainLine(edge.from, edge.to));
  const mainLabelFor = (fromId: string) =>
    edges.find((edge) => edge.from === fromId && isMainLine(edge.from, edge.to))?.label;

  return (
    <div>
      <ol className="max-w-[46rem]">
        {nodes.map((node, index) => {
          const isLast = index === nodes.length - 1;
          const stepLabel = !isLast ? mainLabelFor(node.id) : undefined;
          return (
            <li key={node.id} className="flex gap-4">
              {/* 番号バッジ + 縦の連結線。この列が「鎖」そのもの。 */}
              <div aria-hidden="true" className="flex w-6 shrink-0 flex-col items-center">
                <span className="tabular flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-line-strong)] text-[11px] font-semibold text-[var(--color-ink-secondary)]">
                  {index + 1}
                </span>
                {!isLast && <span className="mt-1 w-px flex-1 bg-[var(--color-line-strong)]" />}
              </div>

              <div className={`min-w-0 flex-1 ${isLast ? "pb-1" : "pb-6"}`}>
                <p className="pt-0.5 text-[15px] font-semibold leading-6 text-[var(--color-ink)]">
                  {node.label}
                </p>
                {node.description && (
                  <p className="mt-1 text-[13px] leading-6 text-[var(--color-ink-secondary)]">
                    {node.description}
                  </p>
                )}
                {stepLabel && (
                  <p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">→ {stepLabel}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {branchEdges.length > 0 && (
        <div className="mt-2 border-t border-[var(--color-line)] pt-3">
          <h4 className="label-caps mb-2">分岐・差し戻し</h4>
          <ul className="max-w-[46rem] space-y-1.5">
            {branchEdges.map((edge) => {
              const from = nodeById.get(edge.from);
              const to = nodeById.get(edge.to);
              if (!from || !to) return null;
              return (
                <li
                  key={`${edge.from}-${edge.to}`}
                  className="text-[13px] leading-6 text-[var(--color-ink-secondary)]"
                >
                  <span className="font-medium text-[var(--color-ink)]">{from.label}</span>
                  <span aria-hidden="true" className="mx-2 text-[var(--color-ink-muted)]">
                    →
                  </span>
                  <span className="font-medium text-[var(--color-ink)]">{to.label}</span>
                  {edge.label && (
                    <span className="ml-2 text-[var(--color-ink-muted)]">（{edge.label}）</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
