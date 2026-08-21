/**
 * AI プロバイダの設定。server 専用。
 *
 * ここは「どのモデルを、どの制限で叩くか」だけを持つ。
 * 通信は cloudflare.ts、プロンプトは prompts.ts が担当する。
 */

/**
 * Cloudflare Workers AI のモデル。
 *
 * 選定理由（2026-08 時点で Models API を実際に叩いて確認済み）:
 * - MoE（30B 総パラメータ / 3B アクティブ）なので推論コストが低い
 * - 日本語の要点抽出とラベル付けの品質が、同枠の llama-3.3-70b より良かった
 * - json_schema の response_format に対応し、2〜5秒で構造化 JSON を返す
 *
 * 変更するときは必ず Models API で存在を確認すること（ID を推測しない）:
 *   GET /accounts/{id}/ai/models/search?task=Text%20Generation
 */
export const AI_MODEL = "@cf/qwen/qwen3-30b-a3b-fp8";

/**
 * 構造化出力の生成に十分で、暴走は防げる上限。
 *
 * 2000 だと不足する。実測では、コンパクトな JSON を返すときは 600〜750
 * トークンで収まるが、モデルが整形済み（インデントと改行つき）の JSON を
 * 返す回があり、そのときは空白だけで大量に消費して途中で切れる。
 * 切れた JSON は復元できず生成そのものが失敗するため、余裕を持たせる。
 */
export const AI_MAX_TOKENS = 4000;

/** 分類・抽出タスクなので低め。creative writing ではない。 */
export const AI_TEMPERATURE = 0.1;

/** Cloudflare 呼び出しのタイムアウト（ミリ秒） */
export const AI_TIMEOUT_MS = 45_000;

/**
 * 入力の上限。コスト暴走と、モデルのコンテキスト溢れの両方を防ぐ。
 * client 側にも同じ値を出したいので、ここは server/client 双方から
 * import できるプレーンな定数にしてある（秘密情報は入れない）。
 */
export const LEARNING_INPUT_MAX_LENGTH = 12_000;

/** 短すぎる入力は AI に投げない（意味のある構造化ができない） */
export const LEARNING_INPUT_MIN_LENGTH = 10;
