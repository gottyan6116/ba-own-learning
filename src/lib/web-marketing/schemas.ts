import type { WebMarketingAction, WebMarketingIssue, WebMarketingPriority, WebMarketingResult } from "./types";

const MAX_TEXT = 2_000;
const MAX_ITEM = 500;

function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function text(value: unknown, max = MAX_ITEM): string {
  return typeof value === "string" ? value.trim().slice(0, max) : "";
}

function priority(value: unknown): WebMarketingPriority | null {
  return value === "high" || value === "medium" || value === "low" ? value : null;
}

function strings(value: unknown, limit = 8): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.map((item) => text(item)).filter(Boolean))].slice(0, limit);
}

function issues(value: unknown): WebMarketingIssue[] {
  if (!Array.isArray(value)) return [];
  const result: WebMarketingIssue[] = [];
  for (const valueItem of value) {
    const item = record(valueItem);
    const severity = priority(item?.severity);
    const normalized = item && severity ? { severity, title: text(item.title), evidence: text(item.evidence), impact: text(item.impact) } : null;
    if (!normalized || !normalized.title || !normalized.evidence || !normalized.impact) continue;
    result.push(normalized);
    if (result.length === 8) break;
  }
  return result;
}

function actions(value: unknown): WebMarketingAction[] {
  if (!Array.isArray(value)) return [];
  const result: WebMarketingAction[] = [];
  for (const valueItem of value) {
    const item = record(valueItem);
    const itemPriority = priority(item?.priority);
    const normalized = item && itemPriority ? { priority: itemPriority, action: text(item.action), whyNow: text(item.whyNow), successSignal: text(item.successSignal) } : null;
    if (!normalized || !normalized.action || !normalized.whyNow || !normalized.successSignal) continue;
    result.push(normalized);
    if (result.length === 5) break;
  }
  return result;
}

/** Validates all AI-derived fields before UI rendering or persistence. */
export function normalizeWebMarketingResult(value: unknown): WebMarketingResult | null {
  const payload = record(value);
  if (!payload) return null;
  const title = text(payload.title);
  const executiveSummary = text(payload.executiveSummary, MAX_TEXT);
  const normalizedIssues = issues(payload.issues);
  const normalizedActions = actions(payload.priorityActions);
  if (!title || !executiveSummary || normalizedIssues.length === 0 || normalizedActions.length === 0) return null;
  return {
    version: 1,
    title,
    executiveSummary,
    currentState: strings(payload.currentState),
    issues: normalizedIssues,
    insights: strings(payload.insights),
    priorityActions: normalizedActions,
    kpis: strings(payload.kpis),
    openQuestions: strings(payload.openQuestions),
  };
}
