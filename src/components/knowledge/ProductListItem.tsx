"use client";

import { getCompany, type Product } from "@/data";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";
import { BrandLogo } from "@/components/ui/BrandLogo";

export function ProductListItem({ product }: { product: Product }) {
  const { openProduct } = useKnowledgeView();
  const company = getCompany(product.companyId);

  return (
    <button
      type="button"
      onClick={() => openProduct(product.id)}
      aria-haspopup="dialog"
      className="group flex w-full cursor-pointer items-center gap-2 rounded-[4px] py-1.5 pr-1 pl-2 text-left transition-colors duration-150 hover:bg-[var(--area-tint)]"
    >
      <BrandLogo companyId={product.companyId} size={14} />
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium leading-4 text-[var(--color-ink)] transition-colors duration-150 group-hover:text-[var(--area-accent)]">
          {product.name}
        </span>
        <span className="block truncate text-[11px] leading-4 text-[var(--color-ink-muted)]">
          {company?.name}
        </span>
      </span>
    </button>
  );
}
