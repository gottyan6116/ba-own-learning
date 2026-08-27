import { NextResponse } from "next/server";
import type { UsageDashboard, UsageMetric } from "@/lib/memory/types";

export async function GET() {
  const metrics: UsageMetric[] = [
    { service: "Supabase", metric: "Database / Storage / 転送量 / Auth", used: null, limit: null, unit: "", status: "unavailable", reason: process.env.SUPABASE_ACCESS_TOKEN ? "Management APIの利用枠レスポンスを取得できませんでした。" : "SUPABASE_ACCESS_TOKEN をVercelの非公開環境変数に設定してください。" },
    { service: "Cloudflare", metric: "Workers / Workers AI", used: null, limit: null, unit: "", status: "unavailable", reason: process.env.CLOUDFLARE_API_TOKEN && process.env.CLOUDFLARE_ACCOUNT_ID ? "Cloudflareの利用枠レスポンスを取得できませんでした。" : "CLOUDFLARE_ACCOUNT_ID と使用量参照権限のCLOUDFLARE_API_TOKENを設定してください。" },
  ];
  const dashboard: UsageDashboard = { updatedAt: new Date().toISOString(), metrics };
  return NextResponse.json(dashboard);
}
