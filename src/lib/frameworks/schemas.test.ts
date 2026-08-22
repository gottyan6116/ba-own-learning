import { describe, expect, it } from "vitest";
import { normalizeFrameworkResult } from "./schemas";

describe("normalizeFrameworkResult", () => {
it("normalizes a 3C response into its required sections", () => {
  const result = normalizeFrameworkResult("3c", {
    title: "Example company 3C analysis",
    executiveSummary: "A concise, evidence-based summary.",
    strategicThesis: "A focused strategy hypothesis.",
    sections: [
      { id: "customer", keyInsight: "Customer insight.", analysis: "Customer needs are clear.", evidence: ["Source A"], implications: ["Focus the offer."], openQuestions: ["Which segment converts?"] },
      { id: "company", keyInsight: "Company insight.", analysis: "The company has a useful capability.", implications: ["Use the capability."], openQuestions: [] },
      { id: "competitors", keyInsight: "Competitor insight.", analysis: "Competitors focus on price.", implications: ["Avoid price-only competition."], openQuestions: ["Which alternatives matter?"] },
    ],
    priorityActions: [{ priority: "high", action: "Validate the target segment.", whyNow: "It is the core uncertainty.", successSignal: "Conversion by segment." }],
  });

  expect(result?.sections.map((section) => section.id)).toEqual([
    "customer",
    "company",
    "competitors",
  ]);
  expect(result?.sections[0].title).toBe("顧客・市場 (Customer)");
  expect(result?.sections[0].implications).toEqual(["Focus the offer."]);
  expect(result?.priorityActions?.[0].priority).toBe("high");
});

it("rejects a response without a usable framework section", () => {
  const result = normalizeFrameworkResult("swot", {
    title: "Incomplete SWOT",
    executiveSummary: "This response does not contain usable analysis.",
    sections: [{ id: "not-a-swot-section", analysis: "Ignored" }],
  });

  expect(result).toBeNull();
});

it("trims unsafe-sized text and drops unknown section ids", () => {
  const result = normalizeFrameworkResult("stp", {
    title: "x".repeat(300),
    executiveSummary: "summary",
    strategicThesis: "thesis",
    sections: [
      { id: "segmentation", keyInsight: "k".repeat(500), analysis: "a".repeat(5000), evidence: [" e1 ", " e1 ", 3], implications: [" i1 ", " i1 "], openQuestions: [" q1 ", " q1 "] },
      { id: "unknown", analysis: "must not appear" },
    ],
  });

  expect(result?.title.length).toBe(160);
  expect(result?.sections.length).toBe(1);
  expect(result?.sections[0].analysis.length).toBe(3000);
  expect(result?.sections[0].evidence).toEqual(["e1"]);
  expect(result?.sections[0].keyInsight?.length).toBe(300);
  expect(result?.sections[0].implications).toEqual(["i1"]);
  expect(result?.sections[0].openQuestions).toEqual(["q1"]);
});

it("continues to render an earlier saved result without the enhanced fields", () => {
  const result = normalizeFrameworkResult("3c", {
    title: "Earlier analysis",
    executiveSummary: "A saved legacy result.",
    sections: [{ id: "customer", analysis: "Prior analysis.", evidence: ["Source"] }],
    recommendations: ["Prior recommendation."],
  });

  expect(result?.version).toBe(1);
  expect(result?.recommendations).toEqual(["Prior recommendation."]);
  expect(result?.strategicThesis).toBeUndefined();
});
});
