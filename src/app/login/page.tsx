"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/env";

type Mode = "sign-in" | "sign-up";
type Status = "idle" | "busy" | "check-email" | "error";

/**
 * Email + Password でのログイン。
 *
 * このアプリは1人（CEO本人）で使う前提なので、メールを毎回開く必要がある
 * マジックリンクより、通常のパスワードログインのほうが日々の摩擦が小さい。
 * アカウント作成は初回だけの操作として、同じ画面に切替タブで用意する。
 *
 * Supabase 側で「Confirm email」が有効な場合、新規登録直後は
 * メール内リンクのクリックが1回だけ必要（signIn 自体は毎回パスワードのみ）。
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    setStatus("busy");
    setMessage("");

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setStatus("error");
        setMessage(error.message);
        return;
      }
      router.push("/notes");
      router.refresh();
      return;
    }

    // sign-up
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    if (error) {
      setStatus("error");
      setMessage(error.message);
      return;
    }
    if (data.session) {
      // 「Confirm email」が無効な場合、登録と同時にログイン済みになる
      router.push("/notes");
      router.refresh();
      return;
    }
    // 「Confirm email」が有効な場合は、確認メールのリンクを踏むまで待つ
    setStatus("check-email");
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
      ) : status === "check-email" ? (
        <div className="mt-8 rounded-[6px] border border-[var(--color-line-strong)] bg-white p-4">
          <p className="text-[15px] font-medium text-[var(--color-ink)]">確認メールを送信しました</p>
          <p className="mt-2 text-[14px] leading-7 text-[var(--color-ink-secondary)]">
            {email} 宛のメールにあるリンクを開くと、アカウントが有効になります。
            以後はこのパスワードでログインできます。
          </p>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setMode("sign-in");
            }}
            className="mt-3 cursor-pointer text-[13px] text-[var(--color-focus)] underline underline-offset-2"
          >
            ログイン画面に戻る
          </button>
        </div>
      ) : (
        <>
          <div
            role="tablist"
            aria-label="ログイン方法"
            className="mt-8 flex gap-1 border-b border-[var(--color-line)]"
          >
            <ModeTab active={mode === "sign-in"} onClick={() => setMode("sign-in")}>
              ログイン
            </ModeTab>
            <ModeTab active={mode === "sign-up"} onClick={() => setMode("sign-up")}>
              アカウント作成
            </ModeTab>
          </div>

          <form onSubmit={submit} className="mt-6">
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

            <label htmlFor="password" className="label-caps mt-4 mb-1.5 block">
              パスワード
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                minLength={6}
                autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={mode === "sign-up" ? "6文字以上" : "••••••••"}
                className="h-11 w-full rounded-[4px] border border-[var(--color-line-strong)] bg-white px-3 pr-16 text-[15px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-0 cursor-pointer px-3 text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
              >
                {showPassword ? "隠す" : "表示"}
              </button>
            </div>

            {status === "error" && (
              <p
                role="alert"
                className="mt-3 rounded-[4px] border border-[var(--color-danger)] bg-[var(--color-danger-tint)] px-3 py-2 text-[13px] leading-6 text-[var(--color-danger)]"
              >
                {mode === "sign-in" ? "ログインできませんでした" : "登録できませんでした"}: {message}
              </p>
            )}

            <button
              type="submit"
              disabled={status === "busy"}
              className="mt-4 h-11 w-full cursor-pointer rounded-[4px] bg-[var(--color-zenith)] text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {status === "busy"
                ? mode === "sign-in"
                  ? "ログイン中…"
                  : "作成中…"
                : mode === "sign-in"
                  ? "ログイン"
                  : "アカウントを作成"}
            </button>

            <p className="mt-3 text-[12px] leading-6 text-[var(--color-ink-muted)]">
              {mode === "sign-in"
                ? "初めての場合は「アカウント作成」からどうぞ。"
                : "作成後、このメールアドレスとパスワードでログインします。"}
            </p>
          </form>
        </>
      )}

      <p className="mt-10 border-t border-[var(--color-line)] pt-4 text-[13px]">
        <Link href="/" className="text-[var(--color-focus)] underline underline-offset-2">
          Knowledge Map に戻る
        </Link>
      </p>
    </div>
  );
}

function ModeTab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative -mb-px flex h-10 cursor-pointer items-center px-3 text-[13px] font-medium transition-colors duration-150 ${
        active
          ? "text-[var(--color-ink)]"
          : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
      }`}
    >
      {children}
      {active && (
        <span
          aria-hidden="true"
          className="absolute inset-x-0 bottom-0 h-[2px] bg-[var(--color-zenith)]"
        />
      )}
    </button>
  );
}
