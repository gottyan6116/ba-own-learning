import React from "react";
import type { VisualizationData } from "@/lib/learning/types";
import { ComparisonVisualization } from "./ComparisonVisualization";
import { FlowVisualization } from "./FlowVisualization";
import { SummaryVisualization } from "./SummaryVisualization";

/** 保存済み／生成直後の Learning 可視化を型ごとの表示器へ振り分ける。 */
export function VisualizationRenderer({ data }: { data: VisualizationData | null }) {
  if (!data) return null;
  if (data.type === "flow") return <FlowVisualization data={data} />;
  if (data.type === "comparison") return <ComparisonVisualization data={data} />;
  return <SummaryVisualization data={data} />;
}
