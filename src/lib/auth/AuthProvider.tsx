"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Supabase のセッションを1箇所でだけ購読する。
 *
 * Notes と Projects はどちらも「ログイン中の本人のデータ」を扱う。
 * 認証の監視（getUser / onAuthStateChange）をそれぞれの Provider が
 * 個別に持つと、購読が二重になるだけでなく、片方だけ状態がずれる余地が
 * 生まれる。ここに一本化し、各 Provider はこのフックの user / status を
 * 読むだけにする。
 */
export type AuthStatus =
  /** Supabase の環境変数が入っていない */
  | "unconfigured"
  /** セッション確認中 */
  | "loading"
  /** 未ログイン */
  | "signed-out"
  | "signed-in";

interface AuthContextValue {
  status: AuthStatus;
  user: User | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [status, setStatus] = useState<AuthStatus>(
    isSupabaseConfigured ? "loading" : "unconfigured",
  );
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let active = true;

    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setStatus(data.user ? "signed-in" : "signed-out");
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? "signed-in" : "signed-out");
    });

    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, [supabase]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setStatus("signed-out");
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, signOut }),
    [status, user, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside <AuthProvider>");
  return context;
}
