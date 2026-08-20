import {
  businessAreas,
  companyMap,
  getSystemsForProduct,
  products,
  systemCategories,
} from "@/data";
import type { Note } from "@/lib/notes/types";
import { noteTitleOrFallback } from "@/lib/notes/types";
import type { Project } from "@/lib/projects/types";
import { projectNameOrFallback } from "@/lib/projects/types";

/**
 * Global Search。
 *
 * MVP では全文検索エンジンを入れない。対象は数十件のマスターデータと
 * 個人のメモ・プロジェクトだけなので、素直な部分一致とスコアリングで十分に速い。
 * （データが数千件を超えたら Supabase 側の全文検索へ寄せる）
 */

export type SearchResultKind = "area" | "system" | "product" | "note" | "project";

export interface SearchResult {
  kind: SearchResultKind;
  id: string;
  /** 表示上の主タイトル */
  title: string;
  /** 補助行（会社名、カテゴリ、日付など） */
  subtitle: string;
  /** 所属する Business Area id（色付けとパンくずに使う） */
  areaId: string | null;
  score: number;
}

function normalize(value: string): string {
  return value.toLowerCase().normalize("NFKC");
}

/**
 * 前方一致 > 単語先頭一致 > 部分一致 の順に強くする。
 * "ma" で Marketing Automation が Management より先に出てほしい、といった
 * 直感に合わせるための最小限のスコアリング。
 */
function matchScore(haystack: string, needle: string): number {
  const target = normalize(haystack);
  if (!target) return 0;
  if (target === needle) return 100;
  if (target.startsWith(needle)) return 70;
  const boundary = new RegExp(`(^|[\\s/・（(])${escapeRegExp(needle)}`);
  if (boundary.test(target)) return 50;
  if (target.includes(needle)) return 30;
  return 0;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function best(needle: string, fields: Array<[string, number]>): number {
  let score = 0;
  for (const [text, weight] of fields) {
    const hit = matchScore(text, needle);
    if (hit > 0) score = Math.max(score, hit * weight);
  }
  return score;
}

export function searchKnowledge(
  rawQuery: string,
  notes: Note[] = [],
  projects: Project[] = [],
): SearchResult[] {
  const query = normalize(rawQuery.trim());
  if (query.length === 0) return [];

  const results: SearchResult[] = [];

  for (const area of businessAreas) {
    const score = best(query, [
      [area.name, 1],
      [area.labelEn, 1],
      [area.summary, 0.4],
    ]);
    if (score > 0) {
      results.push({
        kind: "area",
        id: area.id,
        title: area.name,
        subtitle: area.labelEn,
        areaId: area.id,
        score,
      });
    }
  }

  for (const system of systemCategories) {
    const score = best(query, [
      [system.shortName, 1.1],
      [system.name, 1],
      [system.nameJa, 1],
      [system.description, 0.4],
      [system.functions.join(" "), 0.3],
      [system.relatedConcepts.join(" "), 0.3],
    ]);
    if (score > 0) {
      // 領域名は表示側で前置されるので、ここでは重ねない。
      // 略称が重複するカテゴリ（営業CRM / カスタマーCRM）を見分けられるよう
      // タイトルは日本語名にする。
      results.push({
        kind: "system",
        id: system.id,
        title: `${system.shortName} — ${system.nameJa}`,
        subtitle: "System Category",
        areaId: system.businessArea,
        score,
      });
    }
  }

  for (const product of products) {
    const company = companyMap[product.companyId];
    const score = best(query, [
      [product.name, 1.1],
      [company?.name ?? "", 0.9],
      [company?.nameJa ?? "", 0.9],
      [product.what, 0.4],
      [product.functions.join(" "), 0.3],
    ]);
    if (score > 0) {
      const systems = getSystemsForProduct(product.id);
      results.push({
        kind: "product",
        id: product.id,
        title: product.name,
        subtitle: [company?.name, systems[0]?.shortName].filter(Boolean).join(" / "),
        areaId: systems[0]?.businessArea ?? null,
        score,
      });
    }
  }

  for (const note of notes) {
    const score = best(query, [
      [note.title, 1.1],
      [note.content, 0.5],
    ]);
    if (score > 0) {
      results.push({
        kind: "note",
        id: note.id,
        title: noteTitleOrFallback(note),
        subtitle: `メモ / ${new Date(note.updated_at).toLocaleDateString("ja-JP")}`,
        areaId: note.business_area,
        score: score + 5, // 自分の書いたものは少し優先する
      });
    }
  }

  for (const project of projects) {
    const score = best(query, [
      [project.name, 1.1],
      [project.client ?? "", 0.9],
      [project.summary, 0.4],
    ]);
    if (score > 0) {
      results.push({
        kind: "project",
        id: project.id,
        title: projectNameOrFallback(project),
        subtitle: project.client || "プロジェクト",
        areaId: project.business_area,
        score: score + 5, // 自分の案件は少し優先する
      });
    }
  }

  return results.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title)).slice(0, 24);
}
