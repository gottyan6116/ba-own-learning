import { BRAND_MARKS, PRODUCT_MARKS } from "@/data/brandLogos.generated";
import { getCompany } from "@/data";

/**
 * ベンダー識別子。装飾アイコンではない。
 *
 * 公式マークがあるベンダーはブランドカラーのまま、無いベンダーはブランドカラーの
 * モノグラムで描く。どちらも同じ寸法の白タイルに載せるので、一覧で視線が揃う。
 * 本物の SVG を `public/logos/<companyId>.svg` に置けばそちらが使われる。
 */
export function BrandLogo({
  companyId,
  productId,
  size = 18,
  className = "",
}: {
  companyId: string;
  /** 製品ロゴを置いている場合はそちらを優先する */
  productId?: string;
  size?: number;
  className?: string;
}) {
  const company = getCompany(companyId);
  const mark = (productId ? PRODUCT_MARKS[productId] : undefined) ?? BRAND_MARKS[companyId];
  const glyph = size - 4;

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center overflow-hidden rounded-[4px] border border-[var(--color-line)] bg-white ${className}`}
      style={{ width: size + 10, height: size + 10 }}
      aria-hidden="true"
      title={company?.name}
    >
      {mark?.kind === "file" ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={mark.src} alt="" width={glyph} height={glyph} style={{ objectFit: "contain" }} />
      ) : mark?.kind === "path" ? (
        <svg viewBox="0 0 24 24" width={glyph} height={glyph} fill={mark.hex} role="presentation">
          <path d={mark.path} />
        </svg>
      ) : mark?.kind === "tiles" ? (
        <svg viewBox={mark.viewBox} width={glyph} height={glyph} role="presentation">
          {mark.tiles.map((tile) => (
            <rect
              key={`${tile.x}-${tile.y}`}
              x={tile.x}
              y={tile.y}
              width={tile.w}
              height={tile.h}
              fill={tile.fill}
            />
          ))}
        </svg>
      ) : (
        <span
          className="font-bold leading-none"
          style={{
            color: company?.brandColor ?? "var(--color-ink-secondary)",
            fontSize: Math.max(9, Math.round(size * 0.54)),
          }}
        >
          {company?.monogram ?? companyId.slice(0, 2)}
        </span>
      )}
    </span>
  );
}
