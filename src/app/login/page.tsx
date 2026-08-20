"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { getSiteUrl, isSupabaseConfigured } from "@/lib/supabase/env";

/**
 * Email Magic Link のみ。パスワードを持たない＝漏れるパスワードが無い。
 * Notes は個人データなので、ログインしないと読み書きできない（RLS が本丸）。
 */
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setState("sending");
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${getSiteUrl()}/auth/callback?next=/notes` },
    });

    if (error) {
      setState("error");
      setMessage(error.message);
      return;
    }
    setState("sent");
  };

  return (
    <div className="mx-auto w-full max-w-[440px] px-4 py-16 sm:px-6">
      <p className="label-caps">Sign in</p>
      <h1 className="tracking-display mt-1.5 text-[24px] font-bold leading-tight text-[var(--color-ink)]">
        メモを保存するにはログインします
      </h1>
      <p className="mt-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">
        Knowledge Map は未ログインでも閲覧できます。ログインが必要なのは Notes
        の保存・閲覧だけです。
      </p>

      {!isSupabaseConfigured ? (
        <div className="mt-8 rounded-[6px] border border-[var(--color-line-strong)] bg-white p-4 text-[14px] leading-7 text-[var(--color-ink-secondary)]">
          Supabase の環境変数が設定されていません。
          <code className="mx-1 rounded-[3px] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[13px]">
            .env.local
          </code>
          に <code className="text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
          <code className="text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
          を設定して、開発サーバーを再起動してください。
        </div>
      ) : state === "sent" ? (
        <div className="mt-8 rounded-[6px] border border-[var(--color-line-strong)] bg-white p-4">
          <p className="text-[15px] font-medium text-[var(--color-ink)]">
            ログインリンクを送信しました
          </p>
          <p className="mt-2 text-[14px] leading-7 text-[var(--color-ink-secondary)]">
            {email} 宛のメールにあるリンクを、このブラウザで開いてください。
          </p>
          <button
            type="button"
            onClick={() => setState("idle")}
            className="mt-3 cursor-pointer text-[13px] text-[var(--color-focus)] underline underline-offset-2"
          >
            別のアドレスで送り直す
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8">
          <label htmlFor="email" className="label-caps mb-1.5 block">
            メールアドレス
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            className="h-11 w-full rounded-[4px] border border-[var(--color-line-strong)] bg-white px-3 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />

          {state === "error" && (
            <p
              role="alert"
              className="mt-2 rounded-[4px] border border-[var(--color-danger)] bg-[var(--color-danger-tint)] px-3 py-2 text-[13px] leading-6 text-[var(--color-danger)]"
            >
              送信できませんでした: {message}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "sending"}
            className="mt-4 h-11 w-full cursor-pointer rounded-[4px] bg-[var(--color-zenith)] text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {state === "sending" ? "送信中…" : "ログインリンクを送る"}
          </button>

          <p className="mt-3 text-[12px] leading-6 text-[var(--color-ink-muted)]">
            パスワードは使いません。届いたメールのリンクからログインします。
          </p>
        </form>
      )}

      <p className="mt-10 border-t border-[var(--color-line)] pt-4 text-[13px]">
        <Link href="/" className="text-[var(--color-focus)] underline underline-offset-2">
          Knowledge Map に戻る
        </Link>
      </p>
    </div>
  );
}
