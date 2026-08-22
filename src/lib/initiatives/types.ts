export type InitiativePriority = "high" | "medium" | "low";

export interface InitiativeDraft {
  priority: InitiativePriority;
  title: string;
  summary: string;
  rationale: string;
  successMetric: string;
  sourceAnalysisIds: string[];
}
