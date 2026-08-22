/**
 * Supabase のスキーマ型。
 * supabase/migrations/*.sql と手で揃える（MVP ではコード生成しない）。
 * テーブルを増やしたら、ここと migration の両方を更新すること。
 *
 * 形は `supabase gen types typescript` が出す構造に合わせている
 * （postgrest-js の型推論がこの形を前提にしているため）。
 */

export type NoteRow = {
  id: string;
  user_id: string;
  title: string;
  content: string;
  business_area: string | null;
  system_category: string | null;
  product_key: string | null;
  /** 紐づく案件。src/lib/supabase/types.ts の ProjectRow を参照。任意。 */
  project_id: string | null;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export type NoteInsert = Omit<NoteRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type NoteUpdate = Partial<Omit<NoteRow, "id" | "user_id" | "created_at">>;

/** planning=検討中 / active=進行中 / on_hold=保留 / done=完了 */
export type ProjectStatus = "planning" | "active" | "on_hold" | "done";

export type ProjectRow = {
  id: string;
  user_id: string;
  name: string;
  client: string | null;
  status: ProjectStatus;
  summary: string;
  business_area: string | null;
  /** src/data/systems.ts の id の配列 */
  system_categories: string[];
  /** src/data/products.ts の id の配列 */
  product_keys: string[];
  start_date: string | null;
  due_date: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectInsert = Omit<ProjectRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectUpdate = Partial<Omit<ProjectRow, "id" | "user_id" | "created_at">>;

/**
 * AI が生成した学習ページ。
 *
 * visualization_data / key_points / related_concepts は jsonb。
 * DB 側は形を強制しないので、読み出し側（lib/learning/types.ts）で必ず絞る。
 * schema_version は、あとで可視化スキーマを変えたときに
 * 古い行を判別するためのもの。
 */
export type LearningPageRow = {
  id: string;
  user_id: string;
  title: string;
  /** AI 変換前の原文。再生成と解釈ミスの確認に必須なので必ず保存する。 */
  source_text: string;
  summary: string;
  visualization_type: string;
  visualization_data: unknown;
  key_points: unknown;
  related_concepts: unknown;
  business_area: string | null;
  system_category: string | null;
  product_key: string | null;
  project_id: string | null;
  source_note_id: string | null;
  schema_version: number;
  created_at: string;
  updated_at: string;
};

export type LearningPageInsert = Omit<
  LearningPageRow,
  "id" | "created_at" | "updated_at" | "schema_version"
> & {
  id?: string;
  schema_version?: number;
  created_at?: string;
  updated_at?: string;
};

export type LearningPageUpdate = Partial<
  Omit<LearningPageRow, "id" | "user_id" | "created_at">
>;

/** todo=未着手 / in_progress=進行中 / blocked=ブロック / done=完了 */
export type ProjectTaskStatus = "todo" | "in_progress" | "blocked" | "done";

export type ProjectTaskRow = {
  id: string;
  user_id: string;
  project_id: string;
  title: string;
  description: string | null;
  status: ProjectTaskStatus;
  start_date: string | null;
  end_date: string | null;
  progress: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type ProjectTaskInsert = Omit<ProjectTaskRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectTaskUpdate = Partial<
  Omit<ProjectTaskRow, "id" | "user_id" | "project_id" | "created_at">
>;

/** 3c=3C / five_forces=ファイブフォース / swot=SWOT / pestel=PESTEL / stp=STP */
export type FrameworkType = "3c" | "five_forces" | "swot" | "pestel" | "stp";

export type FrameworkAnalysisRow = {
  id: string;
  user_id: string;
  company_name: string;
  source_url: string;
  source_notes: string;
  /** URL取得時のタイトル・本文要約・取得上の注意など。jsonb のため読み出し側で検証する。 */
  source_metadata: unknown;
  framework_type: FrameworkType;
  /** AI出力。src/lib/frameworks/schemas.ts で検証してから表示する。 */
  result_data: unknown;
  model: string | null;
  source_fetched_at: string | null;
  generated_at: string;
  regenerated_from_id: string | null;
  created_at: string;
  updated_at: string;
};

export type FrameworkAnalysisInsert = Omit<
  FrameworkAnalysisRow,
  "id" | "created_at" | "updated_at"
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type FrameworkAnalysisUpdate = Partial<
  Omit<FrameworkAnalysisRow, "id" | "user_id" | "created_at">
>;

/** A many-to-many link: one saved analysis can be shown in multiple projects. */
export type FrameworkAnalysisProjectRow = {
  framework_analysis_id: string;
  project_id: string;
  created_at: string;
};

export type FrameworkAnalysisProjectInsert = Omit<FrameworkAnalysisProjectRow, "created_at"> & {
  created_at?: string;
};

export type FrameworkAnalysisProjectUpdate = never;

/** One persisted React Flow graph per project. JSON is validated by its UI boundary. */
export type ProjectMindMapRow = {
  id: string;
  user_id: string;
  project_id: string;
  nodes: unknown;
  edges: unknown;
  viewport: unknown;
  created_at: string;
  updated_at: string;
};

export type ProjectMindMapInsert = Omit<ProjectMindMapRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type ProjectMindMapUpdate = Partial<
  Omit<ProjectMindMapRow, "id" | "user_id" | "project_id" | "created_at">
>;

export type WebMarketingAnalysisRow = {
  id: string; user_id: string; source_url: string; source_notes: string; source_metadata: unknown; result_data: unknown;
  model: string | null; source_fetched_at: string | null; generated_at: string; regenerated_from_id: string | null; created_at: string; updated_at: string;
};
export type WebMarketingAnalysisInsert = Omit<WebMarketingAnalysisRow, "id" | "created_at" | "updated_at" | "generated_at" | "regenerated_from_id"> & { id?: string; created_at?: string; updated_at?: string; generated_at?: string; regenerated_from_id?: string | null };
export type WebMarketingAnalysisUpdate = Partial<Omit<WebMarketingAnalysisRow, "id" | "user_id" | "created_at">>;
export type WebMarketingAnalysisProjectRow = { web_marketing_analysis_id: string; project_id: string; created_at: string };
export type WebMarketingAnalysisProjectInsert = Omit<WebMarketingAnalysisProjectRow, "created_at"> & { created_at?: string };
export type ProjectInitiativeRow = { id: string; user_id: string; project_id: string; batch_id: string | null; priority: "high" | "medium" | "low"; title: string; summary: string; rationale: string; success_metric: string; source_analysis_ids: unknown; sort_order: number; created_at: string; updated_at: string };
export type ProjectInitiativeInsert = Omit<ProjectInitiativeRow, "id" | "created_at" | "updated_at" | "batch_id" | "sort_order"> & { id?: string; created_at?: string; updated_at?: string; batch_id?: string | null; sort_order?: number };
export type ProjectInitiativeUpdate = Partial<Omit<ProjectInitiativeRow, "id" | "user_id" | "project_id" | "created_at">>;

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "12";
  };
  public: {
    Tables: {
      notes: {
        Row: NoteRow;
        Insert: NoteInsert;
        Update: NoteUpdate;
        Relationships: [];
      };
      projects: {
        Row: ProjectRow;
        Insert: ProjectInsert;
        Update: ProjectUpdate;
        Relationships: [];
      };
      learning_pages: {
        Row: LearningPageRow;
        Insert: LearningPageInsert;
        Update: LearningPageUpdate;
        Relationships: [];
      };
      project_tasks: {
        Row: ProjectTaskRow;
        Insert: ProjectTaskInsert;
        Update: ProjectTaskUpdate;
        Relationships: [];
      };
      framework_analyses: {
        Row: FrameworkAnalysisRow;
        Insert: FrameworkAnalysisInsert;
        Update: FrameworkAnalysisUpdate;
        Relationships: [];
      };
      framework_analysis_projects: {
        Row: FrameworkAnalysisProjectRow;
        Insert: FrameworkAnalysisProjectInsert;
        Update: FrameworkAnalysisProjectUpdate;
        Relationships: [];
      };
      project_mind_maps: {
        Row: ProjectMindMapRow;
        Insert: ProjectMindMapInsert;
        Update: ProjectMindMapUpdate;
        Relationships: [];
      };
      web_marketing_analyses: { Row: WebMarketingAnalysisRow; Insert: WebMarketingAnalysisInsert; Update: WebMarketingAnalysisUpdate; Relationships: []; };
      web_marketing_analysis_projects: { Row: WebMarketingAnalysisProjectRow; Insert: WebMarketingAnalysisProjectInsert; Update: never; Relationships: []; };
      project_initiatives: { Row: ProjectInitiativeRow; Insert: ProjectInitiativeInsert; Update: ProjectInitiativeUpdate; Relationships: []; };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
