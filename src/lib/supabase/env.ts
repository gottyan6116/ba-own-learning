/**
 * Supabase の接続情報はすべて環境変数から読む。
 * リポジトリにキーを書かない（公開リポジトリになっても問題ない構成）。
 *
 * NEXT_PUBLIC_ の2つはブラウザに露出してよい値（RLS で保護される）。
 * service_role キーはこのアプリでは一切使わない。
 */

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * 未設定でもビルドと Knowledge Map の閲覧は通るようにしている。
 * 落ちるのは Notes（保存・認証）だけ。
 */
export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined") return window.location.origin;
  return "http://localhost:3000";
}
