import type { NoteRow } from "@/lib/supabase/types";

export type Note = NoteRow;

/** Knowledge Map / Projects のどこに紐づけるか。すべて任意。 */
export interface NoteLink {
  business_area?: string | null;
  system_category?: string | null;
  product_key?: string | null;
  project_id?: string | null;
}

export interface NoteDraft extends NoteLink {
  title?: string;
  content?: string;
  is_pinned?: boolean;
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export type NotesStatus =
  /** Supabase の環境変数が入っていない */
  | "unconfigured"
  /** セッション確認中 / 取得中 */
  | "loading"
  /** 未ログイン */
  | "signed-out"
  | "ready"
  | "error";

export function noteTitleOrFallback(note: Note): string {
  const title = note.title.trim();
  if (title) return title;
  const firstLine = note.content.trim().split("\n")[0]?.trim();
  if (firstLine) return firstLine.slice(0, 40);
  return "無題のメモ";
}

export function notePreview(note: Note): string {
  const body = note.content.trim().replace(/\s+/g, " ");
  return body ? body.slice(0, 120) : "本文なし";
}

/** ピン留め優先 → 更新日時の新しい順 */
export function sortNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => {
    if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
    return b.updated_at.localeCompare(a.updated_at);
  });
}
