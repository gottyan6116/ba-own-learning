import type { InitiativeDraft, InitiativePriority } from "./types";

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown): string {
  return typeof value === "string" ? value.trim().slice(0, 500) : "";
}

function priority(value: unknown): InitiativePriority | null {
  return value === "high" || value === "medium" || value === "low" ? value : null;
}

export function normalizeInitiatives(value: unknown): InitiativeDraft[] {
  if (!Array.isArray(value)) return [];
  const result: InitiativeDraft[] = [];
  for (const raw of value) {
    const item = record(raw);
    const itemPriority = priority(item?.priority);
    const normalized = item && itemPriority ? {
      priority: itemPriority,
      title: text(item.title),
      summary: text(item.summary),
      rationale: text(item.rationale),
      successMetric: text(item.successMetric),
      sourceAnalysisIds: Array.isArray(item.sourceAnalysisIds) ? item.sourceAnalysisIds.filter((id): id is string => typeof id === "string").slice(0, 20) : [],
    } : null;
    if (!normalized || !normalized.title || !normalized.summary || !normalized.rationale || !normalized.successMetric) continue;
    result.push(normalized);
    if (result.length === 10) break;
  }
  return result;
}
