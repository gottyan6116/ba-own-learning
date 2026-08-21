import type { LearningPageRow } from "@/lib/supabase/types";

/**
 * Learning Pages のドメイン型。
 *
 * AI の生レスポンスはここへ来る前に必ず schemas.ts で検証・正規化される。
 * UI はこの型だけを見る（Cloudflare の存在を知らない）。
 */

export type VisualizationType = "flow" | "comparison" | "summary";

export const VISUALIZATION_TYPES: VisualizationType[] = ["flow", "comparison", "summary"];

export const VISUALIZATION_LABEL: Record<VisualizationType, string> = {
  flow: "フロー",
  comparison: "比較",
  summary: "要約",
};

/** 手順・段階・時間順のプロセス */
export interface FlowVisualizationData {
  type: "flow";
  nodes: Array<{
    id: string;
    label: string;
    description?: string;
  }>;
  edges: Array<{
    from: string;
    to: string;
    label?: string;
  }>;
}

/** 複数概念の違い */
export interface ComparisonVisualizationData {
  type: "comparison";
  columns: Array<{
    id: string;
    label: string;
  }>;
  rows: Array<{
    label: string;
    /** キーは columns[].id。検証時に不一致は落とす。 */
    values: Record<string, string>;
  }>;
}

/** それ以外 */
export interface SummaryVisualizationData {
  type: "summary";
  sections: Array<{
    heading: string;
    body: string;
  }>;
}

export type VisualizationData =
  | FlowVisualizationData
  | ComparisonVisualizationData
  | SummaryVisualizationData;

/** Knowledge Map への分類。存在しない ID は検証時に null へ落とす。 */
export interface LearningClassification {
  businessArea: string | null;
  systemCategory: string | null;
  productKey: string | null;
}

/** AI が返し、サーバーで検証・正規化した結果。まだ保存されていない。 */
export interface LearningAIResult {
  version: 1;
  title: string;
  summary: string;
  visualizationType: VisualizationType;
  keyPoints: string[];
  relatedConcepts: string[];
  classification: LearningClassification;
  visualization: VisualizationData;
}

/** Supabase に保存済みの Learning Page */
export type LearningPage = LearningPageRow;

/** 保存時にクライアントから渡す下書き */
export interface LearningDraft {
  title: string;
  sourceText: string;
  summary: string;
  visualizationType: VisualizationType;
  visualization: VisualizationData;
  keyPoints: string[];
  relatedConcepts: string[];
  businessArea: string | null;
  systemCategory: string | null;
  productKey: string | null;
  projectId: string | null;
}

export type LearningStatus =
  /** Supabase の環境変数が入っていない */
  | "unconfigured"
  /** セッション確認中 / 取得中 */
  | "loading"
  /** 未ログイン */
  | "signed-out"
  | "ready"
  | "error";

export function learningTitleOrFallback(page: LearningPage): string {
  const title = page.title.trim();
  return title || "無題の Learning";
}

/** 更新の新しい順 */
export function sortLearningPages(pages: LearningPage[]): LearningPage[] {
  return [...pages].sort((a, b) => b.updated_at.localeCompare(a.updated_at));
}

/**
 * DB の jsonb は unknown で返ってくる。UI へ渡す前にここで型を絞る。
 * 壊れた行があっても一覧全体を落とさないよう、判定できないものは null。
 */
export function readVisualization(page: LearningPage): VisualizationData | null {
  const data = page.visualization_data as VisualizationData | null;
  if (!data || typeof data !== "object") return null;
  if (data.type === "flow" && Array.isArray(data.nodes)) return data;
  if (data.type === "comparison" && Array.isArray(data.columns)) return data;
  if (data.type === "summary" && Array.isArray(data.sections)) return data;
  return null;
}

export function readStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}
