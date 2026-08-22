"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useNotes } from "@/lib/notes/NotesProvider";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { useLearning } from "@/lib/learning/LearningProvider";

const NAV = [
  { href: "/", label: "Knowledge Map" },
  { href: "/projects", label: "プロジェクト" },
  { href: "/frameworks", label: "フレームワーク" },
  { href: "/notes", label: "Notes" },
  { href: "/learning", label: "Learning" },
];

/**
 * 幅が足りない端末では、ナビを2段目に落とす。
 * ラベルを削ったり折り返したりして読めなくするより、行を増やすほうがよい。
 *
 * 認証状態は AuthProvider から直接読む。Notes / Projects の件数バッジは
 * それぞれの Provider から読む（データの持ち主が違うため）。
 */
export function AppHeader() {
  const pathname = usePathname();
  const { status, user, signOut } = useAuth();
  const { notes } = useNotes();
  const { projects } = useProjects();
  const { pages: learningPages } = useLearning();

  const countFor = (href: string) => {
    if (href === "/notes") return notes.length;
    if (href === "/projects") return projects.length;
    if (href === "/learning") return learningPages.length;
    return 0;
  };

  const navLinks = NAV.map((item) => {
    const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
    const count = countFor(item.href);
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
        {count > 0 && (
          <span className="tabular ml-1.5 text-[11px] text-[var(--color-ink-muted)]">
            {count}
          </span>
        )}
        {active && (
          <span
            aria-hidden="true"
            className="absolute inset-x-3 bottom-0 h-[2px] bg-[var(--color-zenith)]"
          />
        )}
      </Link>
    );
  });

  return (
    <header className="sticky top-0 z-30 border-b border-[var(--color-line)] bg-white/92 backdrop-blur-[6px]">
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

          {status === "signed-in" && user ? (
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
              className="flex h-9 shrink-0 items-center whitespace-nowrap rounded-[4px] border border-[var(--color-line-strong)] px-3 text-[12px] font-medium text-[var(--color-ink)] transition-colors duration-150 hover:bg-[var(--color-surface-sunken)]"
            >
              ログイン
            </Link>
          )}
        </div>
      </div>

      {/* 幅の足りない端末では、ナビだけ2段目に置く。
          項目が増えると 375px では収まらないので横スクロールさせる
          （html/body が overflow-x: clip なので、ここで持たないと
          はみ出した項目に触れなくなる）。 */}
      <nav
        aria-label="メイン（狭い画面）"
        className="scroll-area flex items-center gap-1 overflow-x-auto border-t border-[var(--color-line-faint)] px-2 sm:hidden"
      >
        {navLinks}
      </nav>
    </header>
  );
}
