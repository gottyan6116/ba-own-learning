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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
