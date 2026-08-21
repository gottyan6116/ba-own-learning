"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * 実 route によるタブ。React state だけで切り替える fake tab にはしない
 * — /projects/xxx/gantt を直接リロードしても Gantt のまま開けるようにする。
 *
 * 375px で到達不能にならないよう横スクロールにする
 * （AppHeader のモバイルナビと同じ考え方）。
 */
export function ProjectDetailTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const base = `/projects/${projectId}`;

  const tabs = [
    { href: base, label: "概要" },
    { href: `${base}/tasks`, label: "タスク" },
    { href: `${base}/gantt`, label: "ガント" },
    { href: `${base}/notes`, label: "Notes" },
    { href: `${base}/learning`, label: "Learning" },
  ];

  return (
    <nav
      aria-label="プロジェクト内タブ"
      className="scroll-area flex items-center gap-1 overflow-x-auto border-b border-[var(--color-line)] bg-white px-2 sm:px-4 lg:px-6"
    >
      {tabs.map((tab) => {
        const active = tab.href === base ? pathname === base : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-11 shrink-0 items-center whitespace-nowrap px-3 text-[13px] font-medium transition-colors duration-150 ${
              active
                ? "text-[var(--color-ink)]"
                : "text-[var(--color-ink-muted)] hover:text-[var(--color-ink)]"
            }`}
          >
            {tab.label}
            {active && (
              <span
                aria-hidden="true"
                className="absolute inset-x-3 bottom-0 h-[2px] bg-[var(--color-zenith)]"
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
