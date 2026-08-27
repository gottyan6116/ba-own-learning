import { describe, expect, it } from "vitest";
import { usagePercent, type UsageMetric } from "./types";

describe("usagePercent", () => {
  it("calculates percentage and leaves unavailable values empty", () => {
    const metric: UsageMetric = { service: "Supabase", metric: "Storage", used: 4, limit: 10, unit: "GB", status: "available" };
    expect(usagePercent(metric)).toBe(40);
    expect(usagePercent({ ...metric, used: null, status: "unavailable" })).toBeNull();
  });
});
