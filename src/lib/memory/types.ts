export type UsageMetric = { service: "Supabase" | "Cloudflare"; metric: string; used: number | null; limit: number | null; unit: string; status: "available" | "unavailable"; reason?: string };
export type UsageDashboard = { updatedAt: string; metrics: UsageMetric[] };

export function usagePercent(metric: UsageMetric) {
  if (metric.used === null || metric.limit === null || metric.limit <= 0) return null;
  return Math.min(100, Math.round((metric.used / metric.limit) * 100));
}
