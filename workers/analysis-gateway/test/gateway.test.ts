import { describe, expect, it } from "vitest";

import worker, { isValidAnalysisResult, validateAnalysisInput } from "../src/index";

const token = "test-shared-token";

function request(body: unknown, authorization = `Bearer ${token}`) {
  return new Request("https://gateway.example/analyses", {
    method: "POST",
    headers: { "content-type": "application/json", authorization },
    body: JSON.stringify(body),
  });
}

const validInput = {
  companyName: "Example Inc.",
  sourceUrl: "https://example.com/about",
  framework: "3c",
  notes: "Public company profile",
};

async function expectGatewayError(body: unknown, code: string) {
  const response = await worker.fetch(request(body), { ANALYSIS_GATEWAY_TOKEN: token } as never);
  expect(response.status).toBe(400);
  await expect(response.json()).resolves.toMatchObject({ error: { code } });
}

describe("analysis gateway input validation", () => {
  it("accepts a public HTTPS URL", () => {
    expect(validateAnalysisInput(validInput)).toEqual(validInput);
  });

  it.each([
    "http://example.com",
    "https://localhost/company",
    "https://localhost./company",
    "https://anything.local./company",
    "https://127.0.0.1/company",
    "https://[::1]/company",
    "https://user:pass@example.com/company",
    "https://example.com:8443/company",
  ])("rejects unsafe source URL %s", async (sourceUrl) => {
    await expectGatewayError({ ...validInput, sourceUrl }, "INVALID_SOURCE_URL");
  });

  it("rejects an unsupported framework", async () => {
    await expectGatewayError({ ...validInput, framework: "porter" }, "INVALID_FRAMEWORK");
  });
});

describe("analysis gateway authentication", () => {
  it("returns a deterministic error when the bearer token is missing", async () => {
    const response = await worker.fetch(request(validInput, ""), { ANALYSIS_GATEWAY_TOKEN: token } as never);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: { code: "UNAUTHORIZED", message: "Unauthorized" } });
  });
});

describe("analysis result validation", () => {
  it.each([
    ["3c", ["customer", "company", "competitors"]],
    ["five_forces", ["competitive_rivalry", "new_entrants", "supplier_power", "buyer_power", "substitutes"]],
    ["swot", ["strengths", "weaknesses", "opportunities", "threats"]],
    ["pestel", ["political", "economic", "social", "technological", "environmental", "legal"]],
    ["stp", ["segmentation", "targeting", "positioning"]],
  ] as const)("accepts the complete %s result shape", (framework, sections) => {
    const result = {
      title: "分析タイトル",
      executiveSummary: "要約",
      sections: sections.map((id) => ({ id, analysis: "分析", evidence: ["ソース"] })),
      recommendations: ["推奨事項"],
      limitations: ["制約"],
    };

    expect(isValidAnalysisResult(framework, result)).toBe(true);
  });

  it("rejects an AI response with unexpected fields", () => {
    expect(
      isValidAnalysisResult("swot", {
        title: "x",
        executiveSummary: "x",
        sections: [
          { id: "strengths", analysis: "x", evidence: [] },
          { id: "weaknesses", analysis: "x", evidence: [] },
          { id: "opportunities", analysis: "x", evidence: [] },
          { id: "threats", analysis: "x", evidence: [] },
        ],
        recommendations: [],
        limitations: [],
        injected: "not allowed",
      }),
    ).toBe(false);
  });

  it("rejects an unexpected field inside a framework section", () => {
    expect(
      isValidAnalysisResult("3c", {
        title: "x",
        executiveSummary: "x",
        sections: [
          { id: "customer", analysis: "x", evidence: [], hidden: "not allowed" },
          { id: "company", analysis: "x", evidence: [] },
          { id: "competitors", analysis: "x", evidence: [] },
        ],
        recommendations: [],
        limitations: [],
      }),
    ).toBe(false);
  });

  it("accepts a complete result when the model returns valid sections in a different order", () => {
    expect(
      isValidAnalysisResult("3c", {
        title: "x",
        executiveSummary: "x",
        sections: [
          { id: "company", analysis: "x", evidence: [] },
          { id: "competitors", analysis: "x", evidence: [] },
          { id: "customer", analysis: "x", evidence: [] },
        ],
        recommendations: [],
        limitations: [],
      }),
    ).toBe(true);
  });
});
