import { createHash } from "node:crypto";

/** A short, non-reversible value for comparing credentials in private diagnostics. */
export function fingerprintGatewayToken(token: string): string {
  return createHash("sha256").update(token).digest("hex").slice(0, 12);
}
