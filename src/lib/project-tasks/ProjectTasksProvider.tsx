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
import type { SaveStatus } from "@/lib/notes/types";
import {
  reorderTasksForBoard,
  sortTasks,
  type ProjectTask,
  type ProjectTaskDraft,
  type ProjectTaskStatus,
} from "./types";

/**
 * project_tasks は Project 単位で読む。Notes / Projects / Learning と違い、
 * 全 Project のタスクをアプリ起動時に常時 fetch する理由がない
 * （Project Detail を開いたときだけ、その Project のぶんだけ読めばよい）。
 * そのため root layout ではなく `/projects/[projectId]/layout.tsx` に
 * ローカルに mount する Provider にしている。
 *
 * Tasks View と Gantt View は同じ tasks 配列を読み書きするだけの
 * 別ビューであり、データを分けない。
 */
interface ProjectTasksContextValue {
  status: "loading" | "ready" | "error";
  tasks: ProjectTask[];
  saveStatus: SaveStatus;
  errorMessage: string | null;
  createTask: (draft: ProjectTaskDraft) => Promise<ProjectTask | null>;
  /** 成功時は確定した行、失敗時は null（呼び出し側は元の値へ戻せる）。 */
  updateTask: (id: string, patch: ProjectTaskDraft) => Promise<ProjectTask | null>;
  moveTask: (
    id: string,
    destinationStatus: ProjectTaskStatus,
    destinationIndex: number,
  ) => Promise<boolean>;
  deleteTask: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const ProjectTasksContext = createContext<ProjectTasksContextValue | null>(null);

type FetchStatus = "loading" | "ready" | "error";

export function ProjectTasksProvider({
  projectId,
  children,
}: {
  projectId: string;
  children: ReactNode;
}) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { user } = useAuth();

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [fetchStatus, setFetchStatus] = useState<FetchStatus>("loading");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const fetchTasks = useCallback(async () => {
    if (!supabase || !user) {
      setTasks([]);
      return;
    }
    setFetchStatus("loading");
    const { data, error } = await supabase
      .from("project_tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("sort_order", { ascending: true });

    if (error) {
      setErrorMessage(error.message);
      setFetchStatus("error");
      return;
    }
    setTasks(sortTasks(data ?? []));
    setFetchStatus("ready");
  }, [supabase, user, projectId]);

  useEffect(() => {
    void fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const createTask = useCallback<ProjectTasksContextValue["createTask"]>(
    async (draft) => {
      if (!supabase || !user) return null;
      setSaveStatus("saving");

      const nextSortOrder =
        draft.sort_order ?? tasks.reduce((max, t) => Math.max(max, t.sort_order), -1) + 1;

      const { data, error } = await supabase
        .from("project_tasks")
        .insert({
          user_id: user.id,
          project_id: projectId,
          title: draft.title ?? "",
          description: draft.description ?? null,
          status: draft.status ?? "todo",
          start_date: draft.start_date ?? null,
          end_date: draft.end_date ?? null,
          progress: draft.progress ?? 0,
          sort_order: nextSortOrder,
        })
        .select()
        .single();

      if (error || !data) {
        setSaveStatus("error");
        setErrorMessage(error?.message ?? "タスクを作成できませんでした");
        return null;
      }

      setTasks((prev) => sortTasks([...prev, data]));
      markSaved();
      return data;
    },
    [supabase, user, projectId, tasks, markSaved],
  );

  const updateTask = useCallback<ProjectTasksContextValue["updateTask"]>(
    async (id, patch) => {
      const snapshot = tasks;
      const now = new Date().toISOString();
      setTasks((prev) =>
        sortTasks(prev.map((task) => (task.id === id ? { ...task, ...patch, updated_at: now } : task))),
      );

      if (!supabase || !user) return null;
      setSaveStatus("saving");
      const { data, error } = await supabase
        .from("project_tasks")
        .update(patch)
        .eq("id", id)
        .select()
        .single();

      if (error || !data) {
        // Gantt のドラッグ／リサイズは「失敗したら元の日付へ戻す」ことが必須要件。
        // Tasks View の編集でも、見た目だけ変わって実は保存されていない状態を
        // 残さないほうが安全なので、update は一律ロールバックする。
        setTasks(snapshot);
        setSaveStatus("error");
        setErrorMessage(error?.message ?? "保存できませんでした");
        return null;
      }
      setTasks((prev) => sortTasks(prev.map((task) => (task.id === id ? data : task))));
      markSaved();
      return data;
    },
    [supabase, user, tasks, markSaved],
  );

  const moveTask = useCallback<ProjectTasksContextValue["moveTask"]>(
    async (id, destinationStatus, destinationIndex) => {
      const snapshot = tasks;
      const next = reorderTasksForBoard(tasks, id, destinationStatus, destinationIndex);
      if (next === tasks) return false;

      const changed = next.filter((task) => {
        const previous = snapshot.find((item) => item.id === task.id);
        return previous && (previous.status !== task.status || previous.sort_order !== task.sort_order);
      });
      if (changed.length === 0) return true;

      setTasks(next);
      if (!supabase || !user) return false;
      setSaveStatus("saving");

      const results = await Promise.all(
        changed.map((task) =>
          supabase
            .from("project_tasks")
            .update({ status: task.status, sort_order: task.sort_order })
            .eq("id", task.id),
        ),
      );
      const failure = results.find((result) => result.error);
      if (failure?.error) {
        // 複数行更新は途中まで成功しうる。見た目を勝手に残さず、DBの最新値へ同期する。
        setTasks(snapshot);
        setSaveStatus("error");
        setErrorMessage(failure.error.message);
        void fetchTasks();
        return false;
      }
      markSaved();
      return true;
    },
    [supabase, user, tasks, fetchTasks, markSaved],
  );

  const deleteTask = useCallback<ProjectTasksContextValue["deleteTask"]>(
    async (id) => {
      const snapshot = tasks;
      setTasks((prev) => prev.filter((task) => task.id !== id));
      if (!supabase || !user) return;
      const { error } = await supabase.from("project_tasks").delete().eq("id", id);
      if (error) {
        setTasks(snapshot);
        setSaveStatus("error");
        setErrorMessage(error.message);
      }
    },
    [supabase, user, tasks],
  );

  const refresh = useCallback(async () => {
    await fetchTasks();
  }, [fetchTasks]);

  const value = useMemo<ProjectTasksContextValue>(
    () => ({
      status: fetchStatus,
      tasks,
      saveStatus,
      errorMessage,
      createTask,
      updateTask,
      moveTask,
      deleteTask,
      refresh,
    }),
    [
      fetchStatus,
      tasks,
      saveStatus,
      errorMessage,
      createTask,
      updateTask,
      moveTask,
      deleteTask,
      refresh,
    ],
  );

  return <ProjectTasksContext.Provider value={value}>{children}</ProjectTasksContext.Provider>;
}

export function useProjectTasks(): ProjectTasksContextValue {
  const context = useContext(ProjectTasksContext);
  if (!context) throw new Error("useProjectTasks must be used inside <ProjectTasksProvider>");
  return context;
}
