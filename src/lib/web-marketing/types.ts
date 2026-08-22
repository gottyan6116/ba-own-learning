export type WebMarketingPriority = "high" | "medium" | "low";

export interface WebMarketingIssue {
  severity: WebMarketingPriority;
  title: string;
  evidence: string;
  impact: string;
}

export interface WebMarketingAction {
  priority: WebMarketingPriority;
  action: string;
  whyNow: string;
  successSignal: string;
}

export interface WebMarketingResult {
  version: 1;
  title: string;
  executiveSummary: string;
  currentState: string[];
  issues: WebMarketingIssue[];
  insights: string[];
  priorityActions: WebMarketingAction[];
  kpis: string[];
  openQuestions: string[];
}
