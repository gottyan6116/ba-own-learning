import { KnowledgeMap } from "@/components/knowledge/KnowledgeMap";
import { businessAreas, products, systemCategories } from "@/data";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-x-8 gap-y-4 border-b border-[var(--color-line-strong)] pb-5">
        <div>
          <p className="label-caps">Business Knowledge Map</p>
          <h1 className="tracking-display mt-1.5 text-[24px] font-bold leading-tight text-[var(--color-ink)] sm:text-[28px]">
            どの業務領域で、どんなシステムが使われ、どの製品があるか
          </h1>
          <p className="mt-2 max-w-[68ch] text-[14px] leading-7 text-[var(--color-ink-secondary)]">
            縦に読むと 業務 → システム → 製品、横に読むと会社の業務の流れになります。
            カテゴリや製品を選ぶと、ページを移動せずにその場で詳細と自分のメモを開きます。
          </p>
        </div>

        <dl className="flex shrink-0 flex-wrap items-end gap-x-6 gap-y-3">
          <Stat label="Business Areas" value={businessAreas.length} />
          <Stat label="System Categories" value={systemCategories.length} />
          <Stat label="Products" value={products.length} />
        </dl>
      </div>

      <KnowledgeMap />

      <p className="mt-10 border-t border-[var(--color-line)] pt-4 text-[12px] leading-6 text-[var(--color-ink-muted)]">
        マスターデータは <code>src/data/</code> の TypeScript ファイルで管理しています。
        カテゴリや製品を増やすときはそこに追記してください（Git で差分が追えます）。
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="label-caps">{label}</dt>
      <dd className="tabular mt-0.5 text-[22px] font-bold leading-none text-[var(--color-ink)]">
        {value}
      </dd>
    </div>
  );
}
