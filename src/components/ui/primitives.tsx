import type { ReactNode } from "react";
import { getBusinessArea } from "@/data";

/** Business Area の id から `area-marketing` などのクラス名を作る */
export function areaClass(areaId: string | null | undefined): string {
  return areaId && getBusinessArea(areaId) ? `area-${areaId}` : "area-none";
}

/** モーダル本文のセクション。見出しは小さく、罫線で区切る。 */
export function Section({
  title,
  aside,
  children,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="border-t border-[var(--color-line)] px-6 py-5 first:border-t-0 sm:px-8">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h3 className="label-caps">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  );
}

/** 関連概念などの語を並べる。クリックできるものだけ button にする。 */
export function Chip({
  children,
  onClick,
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  title?: string;
}) {
  const base =
    "inline-flex items-center rounded-[3px] border px-2 py-1 text-[13px] leading-none";
  if (!onClick) {
    return (
      <span className={`${base} border-[var(--color-line)] bg-[var(--color-surface-sunken)] text-[var(--color-ink-secondary)]`}>
        {children}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`${base} cursor-pointer border-[var(--color-line-strong)] bg-white text-[var(--color-ink)] transition-colors duration-150 hover:border-[var(--color-zenith)] hover:text-[var(--color-zenith)]`}
    >
      {children}
      <span aria-hidden="true" className="ml-1.5 text-[var(--color-ink-muted)]">
        ›
      </span>
    </button>
  );
}

/** 業務領域の識別ラベル。色は「識別できる程度」に留める。 */
export function AreaBadge({ areaId, className = "" }: { areaId: string | null; className?: string }) {
  const area = getBusinessArea(areaId);
  if (!area) return null;
  return (
    <span
      className={`${areaClass(area.id)} inline-flex items-center text-[12px] font-semibold tracking-wide text-[var(--area-accent)] ${className}`}
    >
      {area.name}
    </span>
  );
}

/** 箇条書き。中黒やアイコンを使わず、細い罫線で区切る。 */
export function TermList({ items, columns = 2 }: { items: string[]; columns?: 1 | 2 }) {
  return (
    <ul
      className={`grid gap-x-8 gap-y-0 ${columns === 2 ? "sm:grid-cols-2" : ""}`}
    >
      {items.map((item) => (
        <li
          key={item}
          className="border-b border-[var(--color-line-faint)] py-2 text-[14px] leading-6 text-[var(--color-ink-secondary)] last:border-b-0"
        >
          {item}
        </li>
      ))}
    </ul>
  );
}
