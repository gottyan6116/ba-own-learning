import type { VisualizationData } from "@/lib/learning/types";
import { FlowVisualization } from "./FlowVisualization";
import { ComparisonVisualization } from "./ComparisonVisualization";
import { SummaryVisualization } from "./SummaryVisualization";

/**
 * 可視化の唯一の入口。
 *
 * AI が返すのは検証済みのデータだけで、HTML でも CSS でもない。
 * どう描くかは常にここから下の React が決める。
 * 型を増やすときは、この switch と types.ts の union に足す。
 */
export function VisualizationRenderer({ data }: { data: VisualizationData | null }) {
  if (!data) {
    return (
      <p className="text-[14px] leading-6 text-[var(--color-ink-muted)]">
        この Learning には表示できる構造データがありません。
      </p>
    );
  }

  switch (data.type) {
    case "flow":
      return <FlowVisualization data={data} />;
    case "comparison":
      return <ComparisonVisualization data={data} />;
    case "summary":
      return <SummaryVisualization data={data} />;
  }
}
