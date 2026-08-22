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
import type { SaveStatus } from "@/lib/notes/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { FrameworkAnalysisInsert } from "@/lib/supabase/types";
import {
  sortFrameworkAnalyses,
  type FrameworkAnalysesStatus,
  type FrameworkAnalysis,
  type FrameworkAnalysisDraft,
  type FrameworkAnalysisProject,
} from "./types";

interface FrameworkAnalysesContextValue {
  status: FrameworkAnalysesStatus;
  analyses: FrameworkAnalysis[];
  links: FrameworkAnalysisProject[];
  saveStatus: SaveStatus;
  errorMessage: string | null;
  createAnalysis: (draft: FrameworkAnalysisDraft) => Promise<FrameworkAnalysis | null>;
  deleteAnalysis: (id: string) => Promise<void>;
  setLinkedProjects: (analysisId: string, projectIds: string[]) => Promise<void>;
  refresh: () => Promise<void>;
}

const FrameworkAnalysesContext = createContext<FrameworkAnalysesContextValue | null>(null);
type FetchStatus = "idle" | "loading" | "ready" | "error";

function draftToInsert(userId: string, draft: FrameworkAnalysisDraft): FrameworkAnalysisInsert {
  return {
    user_id: userId,
    company_name: draft.companyName.trim(),
    source_url: draft.sourceUrl,
    source_notes: draft.sourceNotes ?? "",
    source_metadata: draft.sourceMetadata ?? {},
    framework_type: draft.frameworkType,
    result_data: draft.result,
    model: draft.model ?? null,
    source_fetched_at: draft.sourceFetchedAt ?? null,
    generated_at: draft.generatedAt ?? new Date().toISOString(),
    regenerated_from_id: draft.regeneratedFromId ?? null,
  };
}

export function FrameworkAnalysesProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { status: authStatus, user } = useAuth();
  const [analyses, setAnalyses] = useState<FrameworkAnalysis[]>([]);
  const [links, setLinks] = useState<FrameworkAnalysisProject[]>([]);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase || !user) {
      setAnalyses([]);
      setLinks([]);
      return;
    }
    setFetchStatus("loading");
    const [analysesResult, linksResult] = await Promise.all([
      supabase.from("framework_analyses").select("*").order("generated_at", { ascending: false }),
      supabase.from("framework_analysis_projects").select("*").order("created_at", { ascending: false }),
    ]);
    if (analysesResult.error || linksResult.error) {
      setErrorMessage(analysesResult.error?.message ?? linksResult.error?.message ?? "分析を取得できませんでした");
      setFetchStatus("error");
      return;
    }
    setAnalyses(sortFrameworkAnalyses(analysesResult.data ?? []));
    setLinks(linksResult.data ?? []);
    setFetchStatus("ready");
  }, [supabase, user]);

  useEffect(() => {
    if (authStatus !== "signed-in") {
      setAnalyses([]);
      setLinks([]);
      setFetchStatus("idle");
      return;
    }
    void refresh();
  }, [authStatus, refresh]);

  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  const createAnalysis = useCallback<FrameworkAnalysesContextValue["createAnalysis"]>(async (draft) => {
    if (!supabase || !user) return null;
    setSaveStatus("saving");
    const { data, error } = await supabase
      .from("framework_analyses")
      .insert(draftToInsert(user.id, draft))
      .select()
      .single();
    if (error || !data) {
      setSaveStatus("error");
      setErrorMessage(error?.message ?? "分析を保存できませんでした");
      return null;
    }
    setAnalyses((current) => sortFrameworkAnalyses([data, ...current]));
    markSaved();
    return data;
  }, [markSaved, supabase, user]);

  const deleteAnalysis = useCallback<FrameworkAnalysesContextValue["deleteAnalysis"]>(async (id) => {
    if (!supabase || !user) return;
    const snapshotAnalyses = analyses;
    const snapshotLinks = links;
    setAnalyses((current) => current.filter((analysis) => analysis.id !== id));
    setLinks((current) => current.filter((link) => link.framework_analysis_id !== id));
    const { error } = await supabase.from("framework_analyses").delete().eq("id", id);
    if (error) {
      setAnalyses(snapshotAnalyses);
      setLinks(snapshotLinks);
      setSaveStatus("error");
      setErrorMessage(error.message);
    }
  }, [analyses, links, supabase, user]);

  const setLinkedProjects = useCallback<FrameworkAnalysesContextValue["setLinkedProjects"]>(async (analysisId, projectIds) => {
    if (!supabase || !user) return;
    const uniqueProjectIds = [...new Set(projectIds)];
    const oldLinks = links.filter((link) => link.framework_analysis_id === analysisId);
    const oldIds = new Set(oldLinks.map((link) => link.project_id));
    const nextIds = new Set(uniqueProjectIds);
    const removedIds = [...oldIds].filter((id) => !nextIds.has(id));
    const addedIds = uniqueProjectIds.filter((id) => !oldIds.has(id));
    if (removedIds.length === 0 && addedIds.length === 0) return;

    const snapshot = links;
    const optimisticAdded = addedIds.map((projectId) => ({
      framework_analysis_id: analysisId,
      project_id: projectId,
      created_at: new Date().toISOString(),
    }));
    setLinks((current) => [
      ...current.filter((link) => link.framework_analysis_id !== analysisId || nextIds.has(link.project_id)),
      ...optimisticAdded,
    ]);
    setSaveStatus("saving");

    const [removeResult, addResult] = await Promise.all([
      removedIds.length > 0
        ? supabase
            .from("framework_analysis_projects")
            .delete()
            .eq("framework_analysis_id", analysisId)
            .in("project_id", removedIds)
        : Promise.resolve({ error: null }),
      addedIds.length > 0
        ? supabase.from("framework_analysis_projects").insert(
            addedIds.map((projectId) => ({ framework_analysis_id: analysisId, project_id: projectId })),
          )
        : Promise.resolve({ error: null }),
    ]);
    if (removeResult.error || addResult.error) {
      setLinks(snapshot);
      setSaveStatus("error");
      setErrorMessage(removeResult.error?.message ?? addResult.error?.message ?? "プロジェクトとの紐づけを更新できませんでした");
      return;
    }
    await refresh();
    markSaved();
  }, [links, markSaved, refresh, supabase, user]);

  const status: FrameworkAnalysesStatus = !isSupabaseConfigured
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

  const value = useMemo<FrameworkAnalysesContextValue>(() => ({
    status, analyses, links, saveStatus, errorMessage, createAnalysis, deleteAnalysis, setLinkedProjects, refresh,
  }), [analyses, createAnalysis, deleteAnalysis, errorMessage, links, refresh, saveStatus, setLinkedProjects, status]);

  return <FrameworkAnalysesContext.Provider value={value}>{children}</FrameworkAnalysesContext.Provider>;
}

export function useFrameworkAnalyses(): FrameworkAnalysesContextValue {
  const context = useContext(FrameworkAnalysesContext);
  if (!context) throw new Error("useFrameworkAnalyses must be used inside FrameworkAnalysesProvider");
  return context;
}
