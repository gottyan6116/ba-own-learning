"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { SaveStatus } from "@/lib/notes/types";
import { sortProjects, type Project, type ProjectDraft, type ProjectsStatus } from "./types";

/**
 * Notes と対になる、実案件の状態管理。
 * 構造は NotesProvider と揃えている（同じ形の Provider が2つあるほうが、
 * 読む側にとって「もう知っているパターン」になる）。
 */
interface ProjectsContextValue {
  status: ProjectsStatus;
  projects: Project[];
  saveStatus: SaveStatus;
  errorMessage: string | null;
  createProject: (draft: ProjectDraft) => Promise<Project | null>;
  updateProject: (id: string, patch: ProjectDraft) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  toggleArchive: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

type FetchStatus = "idle" | "loading" | "ready" | "error";

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { status: authStatus, user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const fetchProjects = useCallback(async () => {
    if (!supabase || !user) {
      setProjects([]);
      return;
    }
    setFetchStatus("loading");
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("is_archived", { ascending: true })
      .order("updated_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setFetchStatus("error");
      return;
    }
    setProjects(sortProjects(data ?? []));
    setFetchStatus("ready");
  }, [supabase, user]);

  useEffect(() => {
    if (authStatus !== "signed-in") {
      setProjects([]);
      setFetchStatus("idle");
      return;
    }
    void fetchProjects();
  }, [authStatus, fetchProjects]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const createProject = useCallback<ProjectsContextValue["createProject"]>(
    async (draft) => {
      if (!supabase || !user) return null;
      setSaveStatus("saving");
      const { data, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          name: draft.name ?? "",
          client: draft.client ?? null,
          status: draft.status ?? "planning",
          summary: draft.summary ?? "",
          business_area: draft.business_area ?? null,
          system_categories: draft.system_categories ?? [],
          product_keys: draft.product_keys ?? [],
          start_date: draft.start_date ?? null,
          due_date: draft.due_date ?? null,
          is_archived: draft.is_archived ?? false,
        })
        .select()
        .single();

      if (error || !data) {
        setSaveStatus("error");
        setErrorMessage(error?.message ?? "プロジェクトを作成できませんでした");
        return null;
      }
      setProjects((prev) => sortProjects([data, ...prev]));
      markSaved();
      return data;
    },
    [supabase, user, markSaved],
  );

  const updateProject = useCallback<ProjectsContextValue["updateProject"]>(
    async (id, patch) => {
      const now = new Date().toISOString();
      setProjects((prev) =>
        prev.map((project) =>
          project.id === id ? { ...project, ...patch, updated_at: now } : project,
        ),
      );

      if (!supabase || !user) return;
      setSaveStatus("saving");
      const { data, error } = await supabase
        .from("projects")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        setSaveStatus("error");
        setErrorMessage(error.message);
        return;
      }
      if (data) {
        setProjects((prev) =>
          prev.map((project) => (project.id === id ? { ...project, ...data } : project)),
        );
      }
      markSaved();
    },
    [supabase, user, markSaved],
  );

  const deleteProject = useCallback<ProjectsContextValue["deleteProject"]>(
    async (id) => {
      const snapshot = projects;
      setProjects((prev) => prev.filter((project) => project.id !== id));
      if (!supabase || !user) return;
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) {
        setProjects(snapshot);
        setSaveStatus("error");
        setErrorMessage(error.message);
      }
    },
    [supabase, user, projects],
  );

  const toggleArchive = useCallback<ProjectsContextValue["toggleArchive"]>(
    async (id) => {
      const target = projects.find((project) => project.id === id);
      if (!target) return;
      await updateProject(id, { is_archived: !target.is_archived });
      setProjects((prev) => sortProjects(prev));
    },
    [projects, updateProject],
  );

  const refresh = useCallback(async () => {
    await fetchProjects();
  }, [fetchProjects]);

  const status: ProjectsStatus = !isSupabaseConfigured
    ? "unconfigured"
    : authStatus === "loading"
      ? "loading"
      : authStatus === "signed-out"
        ? "signed-out"
        : fetchStatus === "error"
          ? "error"
          : fetchStatus === "ready"
            ? "ready"
            : "loading";

  const value = useMemo<ProjectsContextValue>(
    () => ({
      status,
      projects,
      saveStatus,
      errorMessage,
      createProject,
      updateProject,
      deleteProject,
      toggleArchive,
      refresh,
    }),
    [
      status,
      projects,
      saveStatus,
      errorMessage,
      createProject,
      updateProject,
      deleteProject,
      toggleArchive,
      refresh,
    ],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjects must be used inside <ProjectsProvider>");
  return context;
}
