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
      strategicThesis: "顧客ニーズと自社の提供価値を結び、選ばれる理由を明確にする。",
      sections: sections.map((id) => ({
        id,
        keyInsight: "この論点で最も重要な示唆です。",
        analysis: "根拠を踏まえた分析です。仮説と事実を混同せず、意思決定に使える解釈を示します。",
        evidence: ["ソースから確認した事実"],
        implications: ["次に取るべき行動への示唆"],
        openQuestions: ["追加で確認すべき論点"],
      })),
      priorityActions: [{ priority: "high", action: "最優先の実行事項", whyNow: "今取り組む理由", successSignal: "検証できる成功指標" }],
      limitations: ["制約"],
    };

    expect(isValidAnalysisResult(framework, result)).toBe(true);
  });

  it("rejects an AI response with unexpected fields", () => {
    expect(
      isValidAnalysisResult("swot", {
        title: "x",
        executiveSummary: "x",
        strategicThesis: "x",
        sections: [
          { id: "strengths", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
          { id: "weaknesses", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
          { id: "opportunities", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
          { id: "threats", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
        ],
        priorityActions: [],
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
        strategicThesis: "x",
        sections: [
          { id: "customer", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [], hidden: "not allowed" },
          { id: "company", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
          { id: "competitors", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
        ],
        priorityActions: [],
        limitations: [],
      }),
    ).toBe(false);
  });

  it("accepts a complete result when the model returns valid sections in a different order", () => {
    expect(
      isValidAnalysisResult("3c", {
        title: "x",
        executiveSummary: "x",
        strategicThesis: "x",
        sections: [
          { id: "company", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
          { id: "competitors", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
          { id: "customer", keyInsight: "x", analysis: "x", evidence: [], implications: [], openQuestions: [] },
        ],
        priorityActions: [],
        limitations: [],
      }),
    ).toBe(true);
  });

  it("rejects a result without decision-ready section fields", () => {
    expect(
      isValidAnalysisResult("3c", {
        title: "x",
        executiveSummary: "x",
        strategicThesis: "x",
        sections: [
          { id: "customer", analysis: "x", evidence: [] },
          { id: "company", analysis: "x", evidence: [] },
          { id: "competitors", analysis: "x", evidence: [] },
        ],
        priorityActions: [],
        limitations: [],
      }),
    ).toBe(false);
  });
});
