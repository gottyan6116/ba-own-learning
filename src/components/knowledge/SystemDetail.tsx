"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  getAreaForSystem,
  getCompany,
  getProduct,
  getProductsForSystem,
  getSystemCategory,
  resolveRelated,
} from "@/data";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";
import { useNotes } from "@/lib/notes/NotesProvider";
import { notesForSystem } from "@/lib/notes/relations";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Chip, Section, TermList } from "@/components/ui/primitives";
import { RelatedNotes } from "./RelatedNotes";
import { ModalHeader } from "./ModalHeader";

export function SystemDetail({ systemId }: { systemId: string }) {
  const system = getSystemCategory(systemId);
  const { pushProduct, pushSystem, back, stack } = useKnowledgeView();
  const { notes } = useNotes();

  if (!system) {
    return (
      <div className="p-8">
        <Dialog.Title className="text-[20px] font-semibold">見つかりませんでした</Dialog.Title>
        <Dialog.Description className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
          カテゴリ id: {systemId}
        </Dialog.Description>
      </div>
    );
  }

  const area = getAreaForSystem(system.id);
  const products = getProductsForSystem(system.id);
  const related = notesForSystem(notes, system.id);

  const previous = stack.length > 1 ? stack[stack.length - 2] : null;
  const previousLabel = previous
    ? previous.type === "system"
      ? getSystemCategory(previous.id)?.shortName
      : getProduct(previous.id)?.name
    : undefined;

  return (
    <>
      <ModalHeader
        kind="System Category"
        areaId={system.businessArea}
        title={system.shortName}
        titleSuffix={system.name}
        description={system.description}
        meta={system.nameJa}
        breadcrumb={
          previousLabel ? (
            <button
              type="button"
              onClick={back}
              className="mb-3 -ml-1 cursor-pointer rounded-[3px] px-1 py-0.5 text-[13px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:text-[var(--color-ink)]"
            >
              ← {previousLabel} に戻る
            </button>
          ) : undefined
        }
      />

      <div className="panel-swap">
        <Section title="Overview">
          {area && (
            <dl className="mb-3 grid gap-x-6 gap-y-1 text-[14px] leading-7 sm:grid-cols-[8rem_1fr]">
              <dt className="text-[var(--color-ink-muted)]">Business Area</dt>
              <dd className="text-[var(--color-ink-secondary)]">{area.name}</dd>
              <dt className="text-[var(--color-ink-muted)]">この領域の問い</dt>
              <dd className="text-[var(--color-ink-secondary)]">{area.coreQuestion}</dd>
            </dl>
          )}
          {system.distinction && (
            <p className="max-w-[70ch] border-l-2 border-[var(--area-accent)] pl-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">
              {system.distinction}
            </p>
          )}
        </Section>

        <Section title="Key Functions" aside={<span className="tabular text-[12px] text-[var(--color-ink-muted)]">{system.functions.length}</span>}>
          <TermList items={system.functions} />
        </Section>

        <Section
          title="Representative Products"
          aside={<span className="tabular text-[12px] text-[var(--color-ink-muted)]">{products.length}</span>}
        >
          {products.length === 0 ? (
            <p className="text-[14px] text-[var(--color-ink-muted)]">未登録です。</p>
          ) : (
            <ul className="divide-y divide-[var(--color-line-faint)] border-y border-[var(--color-line-faint)]">
              {products.map((product) => {
                const company = getCompany(product.companyId);
                return (
                  <li key={product.id}>
                    <button
                      type="button"
                      onClick={() => pushProduct(product.id)}
                      className="group flex w-full cursor-pointer items-start gap-3 py-3 text-left transition-colors duration-150 hover:bg-[var(--color-surface-sunken)]"
                    >
                      <BrandLogo companyId={product.companyId} productId={product.id} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline gap-2">
                          <span className="text-[15px] font-medium text-[var(--color-ink)] group-hover:text-[var(--area-accent)]">
                            {product.name}
                          </span>
                          <span className="text-[13px] text-[var(--color-ink-muted)]">
                            {company?.name}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-[13px] leading-5 text-[var(--color-ink-muted)]">
                          {product.what}
                        </span>
                      </span>
                      <span
                        aria-hidden="true"
                        className="mt-1 shrink-0 text-[var(--color-ink-muted)] group-hover:text-[var(--area-accent)]"
                      >
                        ›
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Related Concepts">
          <div className="flex flex-wrap gap-2">
            {system.relatedConcepts.map((token) => {
              const resolved = resolveRelated(token);
              if (resolved.kind === "system") {
                return (
                  <Chip
                    key={token}
                    onClick={() => pushSystem(resolved.system.id)}
                    title={resolved.system.name}
                  >
                    {resolved.system.shortName}
                  </Chip>
                );
              }
              if (resolved.kind === "product") {
                return (
                  <Chip key={token} onClick={() => pushProduct(resolved.product.id)}>
                    {resolved.product.name}
                  </Chip>
                );
              }
              return <Chip key={token}>{resolved.label}</Chip>;
            })}
          </div>
        </Section>

        <Section
          title="My Notes"
          aside={
            <span className="tabular text-[12px] text-[var(--color-ink-muted)]">
              関連メモ {related.length} 件
            </span>
          }
        >
          <RelatedNotes
            notes={related}
            link={{
              business_area: area?.id ?? null,
              system_category: system.id,
              product_key: null,
            }}
            targetLabel={system.shortName}
          />
        </Section>
      </div>
    </>
  );
}
