import type { ProjectRow, ProjectStatus } from "@/lib/supabase/types";

export type Project = ProjectRow;
export type { ProjectStatus };

export const PROJECT_STATUSES: ProjectStatus[] = ["planning", "active", "on_hold", "done"];

export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  planning: "検討中",
  active: "進行中",
  on_hold: "保留",
  done: "完了",
};

export interface ProjectDraft {
  name?: string;
  client?: string | null;
  status?: ProjectStatus;
  summary?: string;
  business_area?: string | null;
  system_categories?: string[];
  product_keys?: string[];
  start_date?: string | null;
  due_date?: string | null;
  is_archived?: boolean;
}

export type ProjectsStatus =
  /** Supabase の環境変数が入っていない */
  | "unconfigured"
  /** セッション確認中 / 取得中 */
  | "loading"
  /** 未ログイン */
  | "signed-out"
  | "ready"
  | "error";

export function projectNameOrFallback(project: Project): string {
  const name = project.name.trim();
  return name || "無題のプロジェクト";
}

/** 進行中のものを優先し、その中では更新の新しい順。アーカイブは最後にまとめる。 */
export function sortProjects(projects: Project[]): Project[] {
  return [...projects].sort((a, b) => {
    if (a.is_archived !== b.is_archived) return a.is_archived ? 1 : -1;
    return b.updated_at.localeCompare(a.updated_at);
  });
}
