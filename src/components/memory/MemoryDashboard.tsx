"use client";
import { useEffect, useState } from "react";
import { usagePercent, type UsageDashboard } from "@/lib/memory/types";

export function MemoryDashboard() {
  const [data, setData] = useState<UsageDashboard | null>(null);
  useEffect(() => { void fetch("/api/memory").then((res) => res.json()).then(setData).catch(() => setData({ updatedAt: new Date().toISOString(), metrics: [] })); }, []);
  return <main className="mx-auto w-full max-w-[1100px] px-5 py-8 sm:px-8"><h1 className="text-[26px] font-bold">メモリ</h1><p className="mt-2 text-[14px] text-[var(--color-ink-muted)]">SupabaseとCloudflareの利用枠・残量を確認します。</p>{!data ? <p className="mt-8 text-[14px]">読み込み中…</p> : <div className="mt-7 grid gap-4 md:grid-cols-2">{data.metrics.map((metric) => { const percent = usagePercent(metric); return <section key={`${metric.service}-${metric.metric}`} className="rounded-[6px] border border-[var(--color-line)] bg-white p-5"><p className="text-[12px] text-[var(--color-ink-muted)]">{metric.service}</p><h2 className="mt-1 text-[17px] font-semibold">{metric.metric}</h2>{percent === null ? <p className="mt-4 text-[13px] text-[var(--color-ink-muted)]">未取得：{metric.reason}</p> : <><p className="mt-4 text-[20px] font-bold">{metric.used} / {metric.limit} {metric.unit}</p><div className="mt-3 h-2 overflow-hidden rounded bg-[var(--color-surface-sunken)]"><div className="h-full bg-[var(--color-zenith)]" style={{ width: `${percent}%` }} /></div><p className="mt-2 text-[12px] text-[var(--color-ink-muted)]">使用率 {percent}% ・残量 {metric.limit! - metric.used!} {metric.unit}</p></>}</section>; })}</div>}<p className="mt-6 text-[12px] text-[var(--color-ink-muted)]">最終更新: {data ? new Date(data.updatedAt).toLocaleString("ja-JP") : "—"}</p></main>;
}
