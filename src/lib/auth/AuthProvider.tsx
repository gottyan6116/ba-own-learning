"use client";

/* TEMPORARY IN-MEMORY MOCK — QA ONLY. Reverted after verification. */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";

export type AuthStatus = "unconfigured" | "loading" | "signed-out" | "signed-in";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const FAKE_USER = { id: "qa-user", email: "qa@example.com" } as unknown as User;

export function AuthProvider({ children }: { children: ReactNode }) {
  const value = useMemo<AuthContextValue>(
    () => ({ status: "signed-in", user: FAKE_USER, signOut: async () => {} }),
    [],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
