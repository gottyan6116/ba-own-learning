import { describe, expect, it } from "vitest";

import { normalizeWebMarketingResult } from "../../../src/lib/web-marketing/schemas";
import { isValidWebMarketingResult } from "../src/index";

const gatewayUrl = process.env.ANALYSIS_GATEWAY_URL;
const gatewayToken = process.env.ANALYSIS_GATEWAY_TOKEN;

describe.runIf(gatewayUrl && gatewayToken)("production web marketing contract", () => {
  it("keeps e-noshop analysis renderable across the Worker and Next.js validators", async () => {
    const response = await fetch(gatewayUrl!, {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${gatewayToken}` },
      body: JSON.stringify({
        analysisType: "web_marketing",
        sourceUrl: "https://e-noshop.com/",
        notes: "事業目標・確認したい顧客・競合など（任意）",
      }),
    });

    expect(response.status).toBe(200);
    const payload = await response.json() as { analysis?: unknown };
    expect(isValidWebMarketingResult(payload.analysis)).toBe(true);

    const result = normalizeWebMarketingResult(payload.analysis);
    expect(result).not.toBeNull();
    expect(result?.issues.length).toBeGreaterThanOrEqual(1);
    expect(result?.priorityActions.length).toBeGreaterThanOrEqual(1);
  }, 295_000);
});
