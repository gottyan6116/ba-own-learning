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
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { sortNotes, type Note, type NoteDraft, type NotesStatus, type SaveStatus } from "./types";

/**
 * ノートは1箇所で持つ。
 *
 * Notes ページと Knowledge Modal の「関連メモ」が同じ配列を見るため、
 * モーダルで書いたメモが Notes 側に即反映される（この双方向性がこの
 * アプリの中心的な価値なので、状態を分けない）。
 *
 * 書き込みはローカル先行（optimistic）。Supabase が失敗したときだけ
 * 保存インジケータをエラーに落とし、ローカルの内容は消さない。
 */
interface NotesContextValue {
  status: NotesStatus;
  user: User | null;
  notes: Note[];
  saveStatus: SaveStatus;
  errorMessage: string | null;
  createNote: (draft: NoteDraft) => Promise<Note | null>;
  updateNote: (id: string, patch: NoteDraft) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const NotesContext = createContext<NotesContextValue | null>(null);

export function NotesProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<NotesStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const markSaved = useCallback(() => {
    setSaveStatus("saved");
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSaveStatus("idle"), 1600);
  }, []);

  const fetchNotes = useCallback(
    async (currentUser: User | null) => {
      if (!supabase || !currentUser) {
        setNotes([]);
        return;
      }
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("is_pinned", { ascending: false })
        .order("updated_at", { ascending: false });

      if (error) {
        setErrorMessage(error.message);
        setStatus("error");
        return;
      }
      setNotes(sortNotes(data ?? []));
      setStatus("ready");
    },
    [supabase],
  );

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      const nextUser = data.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setStatus("signed-out");
        setNotes([]);
        return;
      }
      void fetchNotes(nextUser);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (!nextUser) {
        setStatus("signed-out");
        setNotes([]);
        return;
      }
      setStatus("loading");
      void fetchNotes(nextUser);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [supabase, fetchNotes]);

  useEffect(() => {
    return () => {
      if (savedTimer.current) clearTimeout(savedTimer.current);
    };
  }, []);

  const createNote = useCallback<NotesContextValue["createNote"]>(
    async (draft) => {
      if (!supabase || !user) return null;
      setSaveStatus("saving");
      const { data, error } = await supabase
        .from("notes")
        .insert({
          user_id: user.id,
          title: draft.title ?? "",
          content: draft.content ?? "",
          business_area: draft.business_area ?? null,
          system_category: draft.system_category ?? null,
          product_key: draft.product_key ?? null,
          is_pinned: draft.is_pinned ?? false,
        })
        .select()
        .single();

      if (error || !data) {
        setSaveStatus("error");
        setErrorMessage(error?.message ?? "メモを作成できませんでした");
        return null;
      }
      setNotes((prev) => sortNotes([data, ...prev]));
      markSaved();
      return data;
    },
    [supabase, user, markSaved],
  );

  const updateNote = useCallback<NotesContextValue["updateNote"]>(
    async (id, patch) => {
      // ローカルを先に更新する。入力中のカーソルを奪わないため、
      // updated_at もここで進めておく（サーバー側はトリガーが正）。
      const now = new Date().toISOString();
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...patch, updated_at: now } : note)),
      );

      if (!supabase || !user) return;
      setSaveStatus("saving");
      const { data, error } = await supabase
        .from("notes")
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
        setNotes((prev) => prev.map((note) => (note.id === id ? { ...note, ...data } : note)));
      }
      markSaved();
    },
    [supabase, user, markSaved],
  );

  const deleteNote = useCallback<NotesContextValue["deleteNote"]>(
    async (id) => {
      const snapshot = notes;
      setNotes((prev) => prev.filter((note) => note.id !== id));
      if (!supabase || !user) return;
      const { error } = await supabase.from("notes").delete().eq("id", id);
      if (error) {
        setNotes(snapshot); // 消えたように見せたまま残さない
        setSaveStatus("error");
        setErrorMessage(error.message);
      }
    },
    [supabase, user, notes],
  );

  const togglePin = useCallback<NotesContextValue["togglePin"]>(
    async (id) => {
      const target = notes.find((note) => note.id === id);
      if (!target) return;
      await updateNote(id, { is_pinned: !target.is_pinned });
      setNotes((prev) => sortNotes(prev));
    },
    [notes, updateNote],
  );

  const refresh = useCallback(async () => {
    await fetchNotes(user);
  }, [fetchNotes, user]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setNotes([]);
    setStatus("signed-out");
  }, [supabase]);

  const value = useMemo<NotesContextValue>(
    () => ({
      status,
      user,
      notes,
      saveStatus,
      errorMessage,
      createNote,
      updateNote,
      deleteNote,
      togglePin,
      refresh,
      signOut,
    }),
    [
      status,
      user,
      notes,
      saveStatus,
      errorMessage,
      createNote,
      updateNote,
      deleteNote,
      togglePin,
      refresh,
      signOut,
    ],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotes must be used inside <NotesProvider>");
  return context;
}
