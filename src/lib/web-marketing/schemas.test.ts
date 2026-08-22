import { describe, expect, it } from "vitest";
import { normalizeWebMarketingResult } from "./schemas";

describe("normalizeWebMarketingResult", () => {
  it("keeps a decision-ready website analysis and drops unknown fields", () => {
    const result = normalizeWebMarketingResult({
      title: "Example site analysis",
      executiveSummary: "The site presents a clear core offer but does not establish a next conversion step.",
      currentState: ["The home page describes the offer."],
      issues: [{ severity: "high", title: "CTA is unclear", evidence: "The page does not show a primary action.", impact: "Visitors may leave without taking action." }],
      insights: ["Clarifying the first action can reduce decision friction."],
      priorityActions: [{ priority: "high", action: "Place one primary CTA above the fold.", whyNow: "It addresses the key conversion gap.", successSignal: "CTA click-through rate increases." }],
      kpis: ["CTA click-through rate"],
      openQuestions: ["Which acquisition channel brings the highest-intent visitors?"],
      injected: "ignore",
    });

    expect(result?.issues[0].severity).toBe("high");
    expect(result?.priorityActions[0].action).toContain("CTA");
  });
});
