"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useNotes } from "@/lib/notes/NotesProvider";

const NAV = [
  { href: "/", label: "Knowledge Map" },
  { href: "/notes", label: "Notes" },
];

export function AppHeader() {
  const pathname = usePathname();
  const { status, user, signOut, notes } = useNotes();

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="shrink-0 text-[14px] font-bold tracking-tight text-[var(--color-ink)]">
          Business Knowledge
          <span className="ml-1.5 hidden font-normal text-[var(--color-ink-muted)] sm:inline">
            System
          </span>
        </Link>

        <nav aria-label="メイン" className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex h-14 items-center px-3 text-[13px] font-medium transition-colors duration-150 ${
                  active
                    ? "text-[var(--color-ink)]"
                    : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
                }`}
              >
                {item.label}
                {item.href === "/notes" && notes.length > 0 && (
                  <span className="tabular ml-1.5 text-[11px] text-[var(--color-ink-muted)]">
                    {notes.length}
                  </span>
                )}
                {active && (
                  <span
                    aria-hidden="true"
                    className="absolute inset-x-3 bottom-0 h-[2px] bg-[var(--color-ink)]"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-1 items-center justify-end gap-3">
          <GlobalSearch />

          {status === "ready" && user ? (
            <div className="flex items-center gap-2">
              <span
                className="hidden max-w-[16ch] truncate text-[12px] text-[var(--color-ink-muted)] md:block"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="h-9 cursor-pointer rounded-[4px] border border-[var(--color-line)] px-2.5 text-[12px] text-[var(--color-ink-secondary)] transition-colors duration-150 hover:border-[var(--color-line-strong)]"
              >
                ログアウト
              </button>
            </div>
          ) : status === "unconfigured" ? (
            <span className="text-[12px] text-[var(--color-ink-muted)]">Supabase 未設定</span>
          ) : status === "loading" ? (
            <span className="text-[12px] text-[var(--color-ink-muted)]">…</span>
          ) : (
            <Link
              href="/login"
              className="flex h-9 items-center rounded-[4px] border border-[var(--color-line-strong)] px-3 text-[12px] font-medium text-[var(--color-ink)] transition-colors duration-150 hover:bg-white"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
