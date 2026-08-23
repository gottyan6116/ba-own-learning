import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: vi.fn(async () => ({
    auth: { getUser: async () => ({ data: { user: { id: "production-contract-test" } } }) },
  })),
}));

import { POST } from "./route";

const enabled = Boolean(process.env.ANALYSIS_GATEWAY_URL && process.env.ANALYSIS_GATEWAY_TOKEN);

describe.runIf(enabled)("web marketing API production contract", () => {
  it("returns a renderable e-noshop analysis through the Next.js API route", async () => {
    const response = await POST(new NextRequest("https://ba-own-learning.vercel.app/api/web-marketing/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourceUrl: "https://e-noshop.com/",
        notes: "事業目標・確認したい顧客・競合など（任意）",
      }),
    }));

    expect(response.status).toBe(200);
    const payload = await response.json() as { result?: { issues?: unknown[]; priorityActions?: unknown[] } };
    expect(payload.result?.issues?.length).toBeGreaterThanOrEqual(1);
    expect(payload.result?.priorityActions?.length).toBeGreaterThanOrEqual(1);
  }, 295_000);
});
