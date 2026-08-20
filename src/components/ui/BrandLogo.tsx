import { BRAND_MARKS } from "@/data/brandLogos.generated";
import { getCompany } from "@/data";

/**
 * ベンダー識別子。装飾アイコンではない。
 *
 * すべてモノクロ・同一サイズのタイルに揃える。Simple Icons に無いベンダーが
 * 半分近くあるため、ロゴとモノグラムが混在しても視覚言語が壊れないように、
 * 色を落として「同じ種類の印」に見せている。
 */
export function BrandLogo({
  companyId,
  size = 18,
  className = "",
}: {
  companyId: string;
  size?: number;
  className?: string;
}) {
  const company = getCompany(companyId);
  const mark = BRAND_MARKS[companyId];
  const label = company?.name ?? companyId;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-[3px] border border-[var(--color-line)] bg-white text-[var(--color-ink-secondary)] ${className}`}
      style={{ width: size + 10, height: size + 10 }}
      aria-hidden="true"
    >
      {mark ? (
        <svg
          role="presentation"
          viewBox="0 0 24 24"
          width={size - 3}
          height={size - 3}
          fill="currentColor"
        >
          <path d={mark.path} />
        </svg>
      ) : (
        <span
          className="font-semibold leading-none"
          style={{ fontSize: Math.max(9, Math.round(size * 0.52)) }}
        >
          {company?.monogram ?? label.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
