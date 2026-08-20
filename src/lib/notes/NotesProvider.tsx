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
import type { User } from "@supabase/supabase-js";
import { sortNotes, type Note, type NoteDraft, type NotesStatus, type SaveStatus } from "./types";

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
const FAKE_USER = { id: "qa-user", email: "qa@example.com" } as unknown as User;

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");

  const createNote = useCallback<NotesContextValue["createNote"]>(async (draft) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: crypto.randomUUID(),
      user_id: FAKE_USER.id,
      title: draft.title ?? "",
      content: draft.content ?? "",
      business_area: draft.business_area ?? null,
      system_category: draft.system_category ?? null,
      product_key: draft.product_key ?? null,
      project_id: draft.project_id ?? null,
      is_pinned: draft.is_pinned ?? false,
      created_at: now,
      updated_at: now,
    };
    setNotes((prev) => sortNotes([note, ...prev]));
    setSaveStatus("saved");
    return note;
  }, []);

  const updateNote = useCallback<NotesContextValue["updateNote"]>(async (id, patch) => {
    const now = new Date().toISOString();
    setSaveStatus("saving");
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...patch, updated_at: now } : note)),
    );
    setSaveStatus("saved");
  }, []);

  const deleteNote = useCallback<NotesContextValue["deleteNote"]>(async (id) => {
    setNotes((prev) => prev.filter((note) => note.id !== id));
  }, []);

  const togglePin = useCallback<NotesContextValue["togglePin"]>(
    async (id) => {
      setNotes((prev) =>
        sortNotes(
          prev.map((note) => (note.id === id ? { ...note, is_pinned: !note.is_pinned } : note)),
        ),
      );
    },
    [],
  );

  const refresh = useCallback(async () => {}, []);
  const signOut = useCallback(async () => {}, []);

  const value = useMemo<NotesContextValue>(
    () => ({
      status: "ready" as NotesStatus,
      user: FAKE_USER,
      notes,
      saveStatus,
      errorMessage: null,
      createNote,
      updateNote,
      deleteNote,
      togglePin,
      refresh,
      signOut,
    }),
    [notes, saveStatus, createNote, updateNote, deleteNote, togglePin, refresh, signOut],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

export function useNotes(): NotesContextValue {
  const context = useContext(NotesContext);
  if (!context) throw new Error("useNotes must be used inside <NotesProvider>");
  return context;
}
