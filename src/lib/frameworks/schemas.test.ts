import { describe, expect, it } from "vitest";
import { normalizeFrameworkResult } from "./schemas";

describe("normalizeFrameworkResult", () => {
it("normalizes a 3C response into its required sections", () => {
  const result = normalizeFrameworkResult("3c", {
    title: "Example company 3C analysis",
    executiveSummary: "A concise, evidence-based summary.",
    sections: [
      { id: "customer", analysis: "Customer needs are clear.", evidence: ["Source A"] },
      { id: "company", analysis: "The company has a useful capability." },
      { id: "competitors", analysis: "Competitors focus on price." },
    ],
    recommendations: ["Validate the target segment."],
  });

  expect(result?.sections.map((section) => section.id)).toEqual([
    "customer",
    "company",
    "competitors",
  ]);
  expect(result?.sections[0].title).toBe("顧客・市場 (Customer)");
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
    sections: [
      { id: "segmentation", analysis: "a".repeat(5000), evidence: [" e1 ", " e1 ", 3] },
      { id: "unknown", analysis: "must not appear" },
    ],
  });

  expect(result?.title.length).toBe(160);
  expect(result?.sections.length).toBe(1);
  expect(result?.sections[0].analysis.length).toBe(3000);
  expect(result?.sections[0].evidence).toEqual(["e1"]);
});
});
