import { describe, expect, it } from "vitest";
import { normalizeInitiatives } from "./schemas";

describe("normalizeInitiatives", () => {
  it("accepts only complete prioritized initiatives", () => {
    const initiatives = normalizeInitiatives([
      { priority: "high", title: "Clarify the primary conversion", summary: "Give visitors a single next action.", rationale: "The linked analysis identifies an unclear CTA.", successMetric: "CTA click-through rate", sourceAnalysisIds: ["a1"] },
      { priority: "urgent", title: "Invalid", summary: "x", rationale: "x", successMetric: "x", sourceAnalysisIds: [] },
    ]);

    expect(initiatives).toHaveLength(1);
    expect(initiatives[0].priority).toBe("high");
  });
});
