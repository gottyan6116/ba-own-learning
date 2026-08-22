import { NextResponse, type NextRequest } from "next/server";
import { normalizeWebMarketingResult } from "@/lib/web-marketing/schemas";
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
  const gatewayUrl = process.env.ANALYSIS_GATEWAY_URL;
  const gatewayToken = process.env.ANALYSIS_GATEWAY_TOKEN;
  if (!gatewayUrl || !gatewayToken) return NextResponse.json({ error: { message: "分析AIの接続設定が未完了です。" } }, { status: 503 });
  const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(gatewayUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${gatewayToken}` }, body: JSON.stringify({ analysisType: "web_marketing", sourceUrl: body.sourceUrl, notes: body.notes }), cache: "no-store", signal: controller.signal });
    const payload = await response.json().catch(() => null) as { analysis?: unknown; source?: { url?: string; fetchedAt?: string }; model?: string; error?: { message?: string } } | null;
    const result = normalizeWebMarketingResult(payload?.analysis);
    if (!response.ok || !result) return NextResponse.json({ error: { message: payload?.error?.message ?? "ウェブマーケ分析の生成に失敗しました。" } }, { status: response.status || 502 });
    return NextResponse.json({ result, source: { url: payload?.source?.url ?? body.sourceUrl, fetchedAt: payload?.source?.fetchedAt ?? new Date().toISOString() }, model: payload?.model ?? null });
  } catch { return NextResponse.json({ error: { message: "分析AIへの接続がタイムアウトしました。" } }, { status: 504 }); } finally { clearTimeout(timer); }
}
