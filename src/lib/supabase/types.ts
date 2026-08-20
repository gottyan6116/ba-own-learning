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
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}

export type NoteInsert = Omit<NoteRow, "id" | "created_at" | "updated_at"> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type NoteUpdate = Partial<Omit<NoteRow, "id" | "user_id" | "created_at">>;

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
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
