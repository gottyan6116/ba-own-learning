import { notFound } from "next/navigation";
import { MemoryDashboard } from "@/components/memory/MemoryDashboard";

export default function MemoryPage() {
  // 管理APIの認証情報を設定するまで本番環境では公開しない。
  if (process.env.NODE_ENV === "production") notFound();
  return <MemoryDashboard />;
}