import { describe, expect, it } from "vitest";
import { fingerprintGatewayToken } from "./gateway-health";

describe("fingerprintGatewayToken", () => {
  it("creates a stable non-secret fingerprint for runtime diagnostics", () => {
    expect(fingerprintGatewayToken("shared-token")).toBe("fad34a6f3026");
  });
});
