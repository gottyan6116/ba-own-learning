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
import type { LearningPageUpdate } from "@/lib/supabase/types";
import type { SaveStatus } from "@/lib/notes/types";
import {
  sortLearningPages,
  type LearningDraft,
  type LearningPage,
  type LearningStatus,
} from "./types";

/**
 * Learning Pages の単一ストア。
 *
 * NotesProvider / ProjectsProvider と同じ骨格にしてある。
 * 認証は AuthProvider が source of truth で、ここは
 * 「ログイン中の本人に対して learning_pages をどう読み書きするか」だけを持つ。
 *
 * AI 生成そのものはここに置かない（server の API Route が担当）。
 * この Provider の責務は永続化だけ。
 */
interface LearningContextValue {
  status: LearningStatus;
  pages: LearningPage[];
  saveStatus: SaveStatus;
  errorMessage: string | null;
  createPage: (draft: LearningDraft) => Promise<LearningPage | null>;
  updatePage: (id: string, patch: Partial<LearningDraft>) => Promise<void>;
  deletePage: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const LearningContext = createContext<LearningContextValue | null>(null);

type FetchStatus = "idle" | "loading" | "ready" | "error";

/** ドメインの下書きを DB の列名へ移す。列名の知識をここへ閉じ込める。 */
function draftToRow(draft: Partial<LearningDraft>): LearningPageUpdate {
  const row: LearningPageUpdate = {};
  if (draft.title !== undefined) row.title = draft.title;
  if (draft.sourceText !== undefined) row.source_text = draft.sourceText;
  if (draft.summary !== undefined) row.summary = draft.summary;
  if (draft.visualizationType !== undefined) row.visualization_type = draft.visualizationType;
  if (draft.visualization !== undefined) row.visualization_data = draft.visualization;
  if (draft.keyPoints !== undefined) row.key_points = draft.keyPoints;
  if (draft.relatedConcepts !== undefined) row.related_concepts = draft.relatedConcepts;
  if (draft.businessArea !== undefined) row.business_area = draft.businessArea;
  if (draft.systemCategory !== undefined) row.system_category = draft.systemCategory;
  if (draft.productKey !== undefined) row.product_key = draft.productKey;
  if (draft.projectId !== undefined) row.project_id = draft.projectId;
  return row;
}

export function LearningProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { status: authStatus, user } = useAuth();

  const [pages, setPages] = useState<LearningPage[]>([]);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("idle");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const fetchPages = useCallback(async () => {
    if (!supabase || !user) {
      setPages([]);
      return;
    }
    setFetchStatus("loading");
    const { data, error } = await supabase
      .from("learning_pages")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setFetchStatus("error");
      return;
    }
    setPages(sortLearningPages(data ?? []));
    setFetchStatus("ready");
  }, [supabase, user]);

  useEffect(() => {
    if (authStatus !== "signed-in") {
      setPages([]);
      setFetchStatus("idle");
      return;
    }
    void fetchPages();
  }, [authStatus, fetchPages]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const createPage = useCallback<LearningContextValue["createPage"]>(
    async (draft) => {
      if (!supabase || !user) return null;
      setSaveStatus("saving");

      const { data, error } = await supabase
        .from("learning_pages")
        .insert({
          user_id: user.id,
          title: draft.title,
          source_text: draft.sourceText,
          summary: draft.summary,
          visualization_type: draft.visualizationType,
          visualization_data: draft.visualization,
          key_points: draft.keyPoints,
          related_concepts: draft.relatedConcepts,
          business_area: draft.businessArea,
          system_category: draft.systemCategory,
          product_key: draft.productKey,
          project_id: draft.projectId,
          source_note_id: null,
        })
        .select()
        .single();

      if (error || !data) {
        setSaveStatus("error");
        setErrorMessage(error?.message ?? "Learning ページを保存できませんでした");
        return null;
      }

      setPages((prev) => sortLearningPages([data, ...prev]));
      markSaved();
      return data;
    },
    [supabase, user, markSaved],
  );

  const updatePage = useCallback<LearningContextValue["updatePage"]>(
    async (id, patch) => {
      const row = draftToRow(patch);
      if (Object.keys(row).length === 0) return;

      const now = new Date().toISOString();
      setPages((prev) =>
        prev.map((page) => (page.id === id ? { ...page, ...row, updated_at: now } : page)),
      );

      if (!supabase || !user) return;
      setSaveStatus("saving");
      const { data, error } = await supabase
        .from("learning_pages")
        .update(row)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        setSaveStatus("error");
        setErrorMessage(error.message);
        return;
      }
      if (data) {
        setPages((prev) => prev.map((page) => (page.id === id ? { ...page, ...data } : page)));
      }
      markSaved();
    },
    [supabase, user, markSaved],
  );

  const deletePage = useCallback<LearningContextValue["deletePage"]>(
    async (id) => {
      const snapshot = pages;
      setPages((prev) => prev.filter((page) => page.id !== id));
      if (!supabase || !user) return;
      const { error } = await supabase.from("learning_pages").delete().eq("id", id);
      if (error) {
        setPages(snapshot); // 消えたように見せたまま残さない
        setSaveStatus("error");
        setErrorMessage(error.message);
      }
    },
    [supabase, user, pages],
  );

  const refresh = useCallback(async () => {
    await fetchPages();
  }, [fetchPages]);

  const status: LearningStatus = !isSupabaseConfigured
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

  const value = useMemo<LearningContextValue>(
    () => ({
      status,
      pages,
      saveStatus,
      errorMessage,
      createPage,
      updatePage,
      deletePage,
      refresh,
    }),
    [status, pages, saveStatus, errorMessage, createPage, updatePage, deletePage, refresh],
  );

  return <LearningContext.Provider value={value}>{children}</LearningContext.Provider>;
}

export function useLearning(): LearningContextValue {
  const context = useContext(LearningContext);
  if (!context) throw new Error("useLearning must be used inside <LearningProvider>");
  return context;
}
