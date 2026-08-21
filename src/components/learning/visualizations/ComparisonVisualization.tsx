import type { ComparisonVisualizationData } from "@/lib/learning/types";

/**
 * 概念・製品の比較表。
 *
 * Knowledge Map と同じ「罫線で組んだ表」。面を塗らず、
 * 行頭列だけウェイトを上げて視線の起点を作る。
 * 幅が足りないときは表だけを横スクロールさせ、ページ自体は動かさない。
 */
export function ComparisonVisualization({ data }: { data: ComparisonVisualizationData }) {
  const { columns, rows } = data;

  return (
    <div className="scroll-area scroll-shadow-x -mx-1 overflow-x-auto px-1">
      <table className="w-full min-w-[36rem] border-collapse text-left">
        <thead>
          <tr className="border-t-2 border-b border-[var(--color-rule)]">
            <th scope="col" className="label-caps py-2 pr-4 align-bottom">
              項目
            </th>
            {columns.map((column) => (
              <th
                key={column.id}
                scope="col"
                className="py-2 pr-4 align-bottom text-[13px] font-semibold text-[var(--color-ink)]"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-[var(--color-line-faint)] align-top">
              <th
                scope="row"
                className="py-3 pr-4 text-[14px] font-semibold text-[var(--color-ink)]"
              >
                {row.label}
              </th>
              {columns.map((column) => (
                <td
                  key={column.id}
                  className="py-3 pr-4 text-[13px] leading-6 text-[var(--color-ink-secondary)]"
                >
                  {row.values[column.id] ?? (
                    <span aria-label="記載なし" className="text-[var(--color-line-strong)]">
                      —
                    </span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
