import { AI_MAX_TOKENS, AI_MODEL, AI_TEMPERATURE, AI_TIMEOUT_MS } from "./config";

/**
 * Cloudflare Workers AI との通信だけを担う層。
 *
 * ここから上（学習ドメイン）は Cloudflare を知らない。将来 provider を
 * 変えるときに触るのはこのファイルだけで済むようにしてある。
 *
 * このファイルは server からしか import してはいけない。
 * CLOUDFLARE_API_TOKEN は NEXT_PUBLIC_ が付いていないので Next.js が
 * client バンドルへ含めないが、事故を早期に検出するため実行時にも弾く。
 * （`server-only` パッケージを足す代わりのゼロ依存ガード）
 */
if (typeof window !== "undefined") {
  throw new Error("lib/ai/cloudflare.ts must never be imported from the browser");
}

export type AiFailureReason =
  /** 環境変数が入っていない */
  | "not_configured"
  /** 401/403。トークンが無効か権限不足 */
  | "unauthorized"
  /** 429。レート制限・クォータ超過 */
  | "rate_limited"
  /** タイムアウト */
  | "timeout"
  /** ネットワーク到達不能 */
  | "network"
  /** Cloudflare が 5xx を返した、または success:false */
  | "upstream";

export class AiError extends Error {
  readonly reason: AiFailureReason;

  constructor(reason: AiFailureReason, message: string) {
    super(message);
    this.name = "AiError";
    this.reason = reason;
  }
}

function readEnv(): { accountId: string; apiToken: string } | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  if (!accountId || !apiToken) return null;
  return { accountId, apiToken };
}

export function isAiConfigured(): boolean {
  return readEnv() !== null;
}

export interface ChatMessage {
  role: "system" | "user";
  content: string;
}

/**
 * JSON Schema で制約した chat completion を1回だけ実行し、
 * モデルが返した「生の文字列 or オブジェクト」を返す。
 *
 * ここでは JSON の意味的な検証はしない（それは呼び出し側の責務）。
 * このレイヤの責任は「Cloudflare と話して、結果を素直に返すこと」だけ。
 */
export async function runStructuredCompletion(
  messages: ChatMessage[],
  jsonSchema: Record<string, unknown>,
): Promise<unknown> {
  const env = readEnv();
  if (!env) {
    throw new AiError("not_configured", "Cloudflare credentials are not configured");
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${env.accountId}/ai/run/${AI_MODEL}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages,
          response_format: { type: "json_schema", json_schema: jsonSchema },
          max_tokens: AI_MAX_TOKENS,
          temperature: AI_TEMPERATURE,
        }),
        signal: controller.signal,
        cache: "no-store",
      },
    );
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiError("timeout", "Cloudflare request timed out");
    }
    throw new AiError("network", "Could not reach Cloudflare");
  } finally {
    clearTimeout(timer);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AiError("unauthorized", "Cloudflare rejected the credentials");
  }
  if (response.status === 429) {
    throw new AiError("rate_limited", "Cloudflare rate limit reached");
  }

  // 失敗時にレスポンス本文をそのまま外へ出さない。
  // Cloudflare のエラーにアカウント情報が含まれることがあるため、
  // ここでは status だけを持ち出す。
  if (!response.ok) {
    throw new AiError("upstream", `Cloudflare returned HTTP ${response.status}`);
  }

  let payload: { success?: boolean; result?: { response?: unknown } };
  try {
    payload = (await response.json()) as typeof payload;
  } catch {
    throw new AiError("upstream", "Cloudflare returned a non-JSON body");
  }

  if (!payload.success) {
    throw new AiError("upstream", "Cloudflare reported the request as unsuccessful");
  }

  return payload.result?.response;
}
