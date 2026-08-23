import { describe, expect, it } from "vitest";
import { resolveAnalysisGatewayUrl } from "./gateway-url";

describe("resolveAnalysisGatewayUrl", () => {
  it("rejects an encrypted-looking value rather than masking it as a timeout", () => {
    expect(resolveAnalysisGatewayUrl("eyJ2IjoidjIiLCJjIjoiLi4uIn0=")).toBeNull();
  });

  it("accepts a public HTTPS Worker endpoint", () => {
    expect(resolveAnalysisGatewayUrl("https://gateway.example.workers.dev")).toBe("https://gateway.example.workers.dev/");
  });
});
