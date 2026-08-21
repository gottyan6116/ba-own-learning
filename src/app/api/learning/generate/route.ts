import { NextResponse, type NextRequest } from "next/server";
import { AiError, isAiConfigured, runStructuredCompletion } from "@/lib/ai/cloudflare";
import { LEARNING_INPUT_MAX_LENGTH, LEARNING_INPUT_MIN_LENGTH } from "@/lib/ai/config";
import {
  LEARNING_JSON_SCHEMA,
  buildRepairPrompt,
  buildSystemPrompt,
  buildUserPrompt,
} from "@/lib/ai/prompts";
import { normalizeLearningResult } from "@/lib/learning/schemas";
import { getSupabaseServerClient } from "@/lib/supabase/server";

/**
 * 自由文の学習メモを構造化する。
 *
 * Cloudflare はここからしか呼ばない（ブラウザに API トークンを出さない）。
 * 明示的な POST でしか動かないので、ページ表示や入力中に課金は発生しない。
 *
 * 返すのは検証済みの LearningAIResult だけ。保存は別操作（ユーザーが
 * プレビューを見てから決める）なので、この経路では DB を触らない。
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ErrorCode =
  | "unauthorized"
  | "invalid_input"
  | "input_too_long"
  | "ai_not_configured"
  | "ai_unavailable"
  | "ai_invalid_output";

function fail(code: ErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export async function POST(request: NextRequest) {
  // --- 認証: AI 呼び出しはログイン必須 -------------------------------------
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return fail("unauthorized", "Supabase が設定されていません。", 503);
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return fail("unauthorized", "ログインが必要です。", 401);
  }

  // --- 入力検証 ------------------------------------------------------------
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return fail("invalid_input", "リクエストの形式が正しくありません。", 400);
  }

  const text =
    body && typeof body === "object" && "text" in body && typeof body.text === "string"
      ? body.text.trim()
      : "";

  if (text.length < LEARNING_INPUT_MIN_LENGTH) {
    return fail("invalid_input", "もう少し詳しく書いてください。", 400);
  }
  if (text.length > LEARNING_INPUT_MAX_LENGTH) {
    return fail(
      "input_too_long",
      `入力は ${LEARNING_INPUT_MAX_LENGTH.toLocaleString()} 文字までです。`,
      400,
    );
  }

  if (!isAiConfigured()) {
    return fail("ai_not_configured", "AI の接続設定が未完了です。", 503);
  }

  // --- 生成（失敗時は1回だけ修復を試す） -----------------------------------
  const systemPrompt = buildSystemPrompt();

  try {
    const first = await runStructuredCompletion(
      [
        { role: "system", content: systemPrompt },
        { role: "user", content: buildUserPrompt(text) },
      ],
      LEARNING_JSON_SCHEMA,
    );

    let result = normalizeLearningResult(first);

    if (!result) {
      // 構造化できなかったときだけ、もう1回だけ試す。無限リトライはしない。
      const repaired = await runStructuredCompletion(
        [
          { role: "system", content: systemPrompt },
          { role: "user", content: buildRepairPrompt(text) },
        ],
        LEARNING_JSON_SCHEMA,
      );
      result = normalizeLearningResult(repaired);
    }

    if (!result) {
      return fail(
        "ai_invalid_output",
        "AI 結果を構造化できませんでした。もう一度お試しください。",
        502,
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    if (error instanceof AiError) {
      // 上流の詳細（アカウント情報を含みうる）はクライアントへ出さない。
      // 分類だけ返し、原文は server ログにも残さない。
      const message =
        error.reason === "rate_limited"
          ? "AI の利用上限に達しました。しばらくしてからお試しください。"
          : error.reason === "timeout"
            ? "AI の応答がタイムアウトしました。もう一度お試しください。"
            : error.reason === "unauthorized"
              ? "AI の認証設定を確認してください。"
              : error.reason === "not_configured"
                ? "AI の接続設定が未完了です。"
                : "AI サービスに接続できませんでした。";
      const status =
        error.reason === "rate_limited" ? 429 : error.reason === "timeout" ? 504 : 502;
      console.error(`[learning/generate] AI failure: ${error.reason}`);
      return fail(
        error.reason === "not_configured" ? "ai_not_configured" : "ai_unavailable",
        message,
        status,
      );
    }

    console.error("[learning/generate] Unexpected failure");
    return fail("ai_unavailable", "生成に失敗しました。もう一度お試しください。", 500);
  }
}
