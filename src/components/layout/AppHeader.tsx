"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useNotes } from "@/lib/notes/NotesProvider";

const NAV = [
  { href: "/", label: "Knowledge Map" },
  { href: "/notes", label: "Notes" },
];

/**
 * 幅が足りない端末では、ナビを2段目に落とす。
 * ラベルを削ったり折り返したりして読めなくするより、行を増やすほうがよい。
 */
export function AppHeader() {
  const pathname = usePathname();
  const { status, user, signOut, notes } = useNotes();

  const navLinks = NAV.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={`relative flex h-11 items-center whitespace-nowrap px-3 text-[13px] font-medium transition-colors duration-150 sm:h-14 ${
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
  });

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-[var(--color-paper)]/95 backdrop-blur-[2px]">
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="shrink-0 whitespace-nowrap text-[14px] font-bold tracking-tight text-[var(--color-ink)]"
        >
          Business Knowledge
          <span className="ml-1.5 hidden font-normal text-[var(--color-ink-muted)] lg:inline">
            System
          </span>
        </Link>

        <nav aria-label="メイン" className="hidden items-center gap-1 sm:flex">
          {navLinks}
        </nav>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2 sm:gap-3">
          <GlobalSearch />

          {status === "ready" && user ? (
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="hidden max-w-[18ch] truncate text-[12px] text-[var(--color-ink-muted)] lg:block"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <button
                type="button"
                onClick={() => void signOut()}
                className="h-9 shrink-0 cursor-pointer whitespace-nowrap rounded-[4px] border border-[var(--color-line)] px-2.5 text-[12px] text-[var(--color-ink-secondary)] transition-colors duration-150 hover:border-[var(--color-line-strong)]"
              >
                ログアウト
              </button>
            </div>
          ) : status === "unconfigured" ? (
            <span className="hidden whitespace-nowrap text-[12px] text-[var(--color-ink-muted)] md:block">
              Supabase 未設定
            </span>
          ) : status === "loading" ? (
            <span className="text-[12px] text-[var(--color-ink-muted)]">…</span>
          ) : (
            <Link
              href="/login"
              className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-[4px] border border-[var(--color-line-strong)] px-3 text-[12px] font-medium text-[var(--color-ink)] transition-colors duration-150 hover:bg-white"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>

      {/* 幅の足りない端末では、ナビだけ2段目に置く */}
      <nav
        aria-label="メイン（狭い画面）"
        className="flex items-center gap-1 border-t border-[var(--color-line-faint)] px-2 sm:hidden"
      >
        {navLinks}
      </nav>
    </header>
  );
}
