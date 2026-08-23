import { NextResponse, type NextRequest } from "next/server";
import { normalizeWebMarketingResult } from "@/lib/web-marketing/schemas";
import { resolveAnalysisGatewayUrl } from "@/lib/analysis/gateway-url";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 300;
const TIMEOUT_MS = 295_000;

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  const user = supabase ? (await supabase.auth.getUser()).data.user : null;
  if (!user) return NextResponse.json({ error: { message: "ログインが必要です。" } }, { status: 401 });
  const body = await request.json().catch(() => null) as { sourceUrl?: unknown; notes?: unknown } | null;
  if (!body || typeof body.sourceUrl !== "string" || !body.sourceUrl.startsWith("https://") || body.sourceUrl.length > 2048 || (body.notes !== undefined && (typeof body.notes !== "string" || body.notes.length > 6000))) return NextResponse.json({ error: { message: "公開HTTPS URLとメモを確認してください。" } }, { status: 400 });
  const gatewayUrl = resolveAnalysisGatewayUrl(process.env.ANALYSIS_GATEWAY_URL);
  const gatewayToken = process.env.ANALYSIS_GATEWAY_TOKEN;
  if (!gatewayUrl || !gatewayToken) return NextResponse.json({ error: { message: "分析AIの接続設定が未完了または不正です。" } }, { status: 503 });
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(gatewayUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${gatewayToken}` }, body: JSON.stringify({ analysisType: "web_marketing", sourceUrl: body.sourceUrl, notes: body.notes }), cache: "no-store", signal: controller.signal });
    const payload = await response.json().catch(() => null) as { analysis?: unknown; source?: { url?: string; fetchedAt?: string }; model?: string; error?: { code?: string; message?: string } } | null;
    const result = normalizeWebMarketingResult(payload?.analysis);
    if (!response.ok) {
      const isUnusableAiResponse = payload?.error?.code === "AI_RESPONSE_UNUSABLE";
      return NextResponse.json({ error: { message: isUnusableAiResponse ? "AIの出力を整形できませんでした。内容を補足して再試行してください。" : payload?.error?.message ?? "ウェブマーケ分析の生成に失敗しました。" } }, { status: response.status || 502 });
    }
    if (!result) {
      console.error("[web-marketing/analyze] Gateway returned a response that failed app validation.");
      return NextResponse.json({ error: { message: "AIの結果に必要な課題または施策が含まれていません。再試行してください。" } }, { status: 502 });
    }
    return NextResponse.json({ result, source: { url: payload?.source?.url ?? body.sourceUrl, fetchedAt: payload?.source?.fetchedAt ?? new Date().toISOString() }, model: payload?.model ?? null });
  } catch (error) { return NextResponse.json({ error: { message: error instanceof Error && error.name === "AbortError" ? "分析AIへの接続がタイムアウトしました。" : "分析AIに接続できませんでした。接続設定を確認してください。" } }, { status: error instanceof Error && error.name === "AbortError" ? 504 : 502 }); } finally { clearTimeout(timer); }
}
