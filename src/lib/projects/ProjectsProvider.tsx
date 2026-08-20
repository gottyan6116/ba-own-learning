"use client";

/* TEMPORARY IN-MEMORY MOCK — QA ONLY. Reverted after verification. */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { SaveStatus } from "@/lib/notes/types";
import { sortProjects, type Project, type ProjectDraft, type ProjectsStatus } from "./types";

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

const SEED: Project[] = [
  {
    id: "seed-1",
    user_id: "qa-user",
    name: "E-no 通販サイトリニューアル",
    client: "株式会社E-no",
    status: "active",
    summary: "沖縄の通販事業者向けに、kintone連携のEC基盤を構築する案件。",
    business_area: "delivery",
    system_categories: ["lowcode", "workflow"],
    product_keys: ["kintone"],
    start_date: "2026-06-01",
    due_date: "2026-09-30",
    is_archived: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const [projects, setProjects] = useState<Project[]>(SEED);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const createProject = useCallback<ProjectsContextValue["createProject"]>(async (draft) => {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      user_id: "qa-user",
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
      created_at: now,
      updated_at: now,
    };
    setProjects((prev) => sortProjects([project, ...prev]));
    setSaveStatus("saved");
    return project;
  }, []);

  const updateProject = useCallback<ProjectsContextValue["updateProject"]>(async (id, patch) => {
    const now = new Date().toISOString();
    setSaveStatus("saving");
    setProjects((prev) =>
      prev.map((project) =>
        project.id === id ? { ...project, ...patch, updated_at: now } : project,
      ),
    );
    setSaveStatus("saved");
  }, []);

  const deleteProject = useCallback<ProjectsContextValue["deleteProject"]>(async (id) => {
    setProjects((prev) => prev.filter((project) => project.id !== id));
  }, []);

  const toggleArchive = useCallback<ProjectsContextValue["toggleArchive"]>(
    async (id) => {
      setProjects((prev) =>
        sortProjects(
          prev.map((project) =>
            project.id === id ? { ...project, is_archived: !project.is_archived } : project,
          ),
        ),
      );
    },
    [],
  );

  const refresh = useCallback(async () => {}, []);

  const value = useMemo<ProjectsContextValue>(
    () => ({
      status: "ready" as ProjectsStatus,
      projects,
      saveStatus,
      errorMessage: null,
      createProject,
      updateProject,
      deleteProject,
      toggleArchive,
      refresh,
    }),
    [projects, saveStatus, createProject, updateProject, deleteProject, toggleArchive, refresh],
  );

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

export function useProjects(): ProjectsContextValue {
  const context = useContext(ProjectsContext);
  if (!context) throw new Error("useProjects must be used inside <ProjectsProvider>");
  return context;
}
