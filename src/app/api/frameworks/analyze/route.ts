import { NextResponse, type NextRequest } from "next/server";
import { normalizeFrameworkResult } from "@/lib/frameworks/schemas";
import { parseFrameworkAnalysisRequest } from "@/lib/frameworks/request";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const GATEWAY_TIMEOUT_MS = 295_000;

function fail(code: string, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return fail("unconfigured", "Supabase が設定されていません。", 503);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return fail("unauthorized", "ログインが必要です。", 401);

  let input;
  try {
    input = parseFrameworkAnalysisRequest(await request.json());
  } catch (error) {
    return fail("invalid_input", error instanceof Error ? error.message : "入力を確認してください。", 400);
  }

  const gatewayUrl = process.env.ANALYSIS_GATEWAY_URL;
  const gatewayToken = process.env.ANALYSIS_GATEWAY_TOKEN;
  if (!gatewayUrl || !gatewayToken) {
    return fail("gateway_not_configured", "分析AIの接続設定が未完了です。", 503);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GATEWAY_TIMEOUT_MS);
  try {
    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${gatewayToken}`,
      },
      body: JSON.stringify(input),
      cache: "no-store",
      signal: controller.signal,
    });
    const payload = (await response.json().catch(() => null)) as {
      analysis?: unknown;
      source?: { url?: string; fetchedAt?: string };
      model?: string;
      error?: { code?: string; message?: string };
    } | null;
    if (!response.ok || !payload?.analysis) {
      const code = payload?.error?.code ?? "gateway_unavailable";
      const message =
        response.status === 429
          ? "AIの利用上限に達しました。しばらくしてからお試しください。"
          : response.status === 422
            ? "URLから分析に必要な情報を取得できませんでした。補足メモを追加して再試行してください。"
            : "分析の生成に失敗しました。URLと接続設定を確認して再試行してください。";
      console.error(`[frameworks/analyze] gateway failure: ${code}`);
      return fail(code, message, response.status >= 400 && response.status < 600 ? response.status : 502);
    }

    const result = normalizeFrameworkResult(input.framework, payload.analysis);
    if (!result) {
      console.error("[frameworks/analyze] gateway returned invalid normalized payload");
      return fail("invalid_ai_output", "AIの結果を安全に読み取れませんでした。再試行してください。", 502);
    }
    return NextResponse.json({
      result,
      source: {
        url: payload.source?.url ?? input.sourceUrl,
        fetchedAt: payload.source?.fetchedAt ?? new Date().toISOString(),
      },
      model: payload.model ?? null,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return fail("gateway_timeout", "分析AIの応答がタイムアウトしました。再試行してください。", 504);
    }
    console.error("[frameworks/analyze] gateway request failed");
    return fail("gateway_unavailable", "分析AIに接続できませんでした。再試行してください。", 502);
  } finally {
    clearTimeout(timeout);
  }
}
