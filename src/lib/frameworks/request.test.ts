import { describe, expect, it } from "vitest";
import { parseFrameworkAnalysisRequest } from "./request";

describe("parseFrameworkAnalysisRequest", () => {
  it("accepts a valid framework analysis request and trims user text", () => {
    expect(
      parseFrameworkAnalysisRequest({
        companyName: " 株式会社サンプル ",
        sourceUrl: "https://example.com/about",
        framework: "swot",
        notes: " 補足メモ ",
      }),
    ).toEqual({
      companyName: "株式会社サンプル",
      sourceUrl: "https://example.com/about",
      framework: "swot",
      notes: "補足メモ",
    });
  });

  it("rejects a non-HTTPS or unsupported request before it reaches the gateway", () => {
    expect(() =>
      parseFrameworkAnalysisRequest({
        companyName: "Sample",
        sourceUrl: "http://example.com",
        framework: "other",
      }),
    ).toThrow("公開HTTPS URL");
  });
});
