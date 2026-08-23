import { NextResponse, type NextRequest } from "next/server";
import { resolveAnalysisGatewayUrl } from "@/lib/analysis/gateway-url";
import { fingerprintGatewayToken } from "@/lib/analysis/gateway-health";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Authenticated operational probe. It performs only an invalid-input request,
 * so it never retrieves a page or invokes AI generation.
 */
export async function GET(request: NextRequest) {
  const probeToken = process.env.ANALYSIS_PROBE_TOKEN;
  if (!probeToken || request.headers.get("x-analysis-probe-token") !== probeToken) {
    return new NextResponse(null, { status: 404 });
  }

  const gatewayUrl = resolveAnalysisGatewayUrl(process.env.ANALYSIS_GATEWAY_URL);
  const gatewayToken = process.env.ANALYSIS_GATEWAY_TOKEN;
  if (!gatewayUrl || !gatewayToken) {
    return NextResponse.json({ configured: false, workerStatus: null });
  }

  try {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: "{}",
      cache: "no-store",
    });
    return NextResponse.json({
      configured: true,
      workerStatus: response.status,
      runtimeTokenFingerprint: fingerprintGatewayToken(gatewayToken),
    });
  } catch {
    return NextResponse.json({
      configured: true,
      workerStatus: null,
      runtimeTokenFingerprint: fingerprintGatewayToken(gatewayToken),
    }, { status: 502 });
  }
}
