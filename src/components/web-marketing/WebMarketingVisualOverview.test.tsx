import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { WebMarketingVisualOverview } from "./WebMarketingVisualOverview";

describe("WebMarketingVisualOverview", () => {
  it("renders the website diagnosis as a current-state-to-action flow", () => {
    const markup = renderToStaticMarkup(<WebMarketingVisualOverview result={{
      version: 1,
      title: "診断", executiveSummary: "要約", currentState: ["現状"],
      issues: [{ severity: "high", title: "CV導線", evidence: "根拠", impact: "影響" }],
      insights: ["示唆"],
      priorityActions: [{ priority: "high", action: "改善施策", whyNow: "理由", successSignal: "CVR" }],
      kpis: ["CVR"], openQuestions: [],
    }} />);

    expect(markup).toContain("現状");
    expect(markup).toContain("CV導線");
    expect(markup).toContain("改善施策");
    expect(markup).toContain("CVR");
  });
});
