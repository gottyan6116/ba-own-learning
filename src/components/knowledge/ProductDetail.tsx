"use client";

import * as Dialog from "@radix-ui/react-dialog";
import {
  getAreasForProduct,
  getCompany,
  getProduct,
  getSystemCategory,
  getSystemsForProduct,
  resolveRelated,
} from "@/data";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";
import { useNotes } from "@/lib/notes/NotesProvider";
import { notesForProduct } from "@/lib/notes/relations";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { projectsForProduct } from "@/lib/projects/relations";
import { useLearning } from "@/lib/learning/LearningProvider";
import { learningForProduct } from "@/lib/learning/relations";
import { BrandLogo } from "@/components/ui/BrandLogo";
import { Chip, Section, TermList } from "@/components/ui/primitives";
import { RelatedNotes } from "./RelatedNotes";
import { RelatedProjects } from "./RelatedProjects";
import { RelatedLearning } from "./RelatedLearning";
import { ModalHeader } from "./ModalHeader";

export function ProductDetail({ productId }: { productId: string }) {
  const product = getProduct(productId);
  const { pushProduct, pushSystem, back, stack } = useKnowledgeView();
  const { notes } = useNotes();
  const { status: projectsStatus, projects } = useProjects();
  const { status: learningStatus, pages: learningPages } = useLearning();

  if (!product) {
    return (
      <div className="p-8">
        <Dialog.Title className="text-[20px] font-semibold">見つかりませんでした</Dialog.Title>
        <Dialog.Description className="mt-2 text-[14px] text-[var(--color-ink-muted)]">
          製品 id: {productId}
        </Dialog.Description>
      </div>
    );
  }

  const company = getCompany(product.companyId);
  const systems = getSystemsForProduct(product.id);
  const areas = getAreasForProduct(product.id);
  const primaryArea = areas[0]?.id ?? null;
  const related = notesForProduct(notes, product.id);
  const relatedProjects = projectsForProduct(projects, product.id);
  const relatedLearning = learningForProduct(learningPages, product.id);

  const previous = stack.length > 1 ? stack[stack.length - 2] : null;
  const previousLabel = previous
    ? previous.type === "system"
      ? getSystemCategory(previous.id)?.shortName
      : getProduct(previous.id)?.name
    : undefined;

  return (
    <>
      <ModalHeader
        kind="Product"
        areaId={primaryArea}
        title={product.name}
        description={product.what}
        meta={company?.nameJa ? `${company.name}（${company.nameJa}）` : company?.name}
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
          <dl className="grid gap-x-6 gap-y-1 text-[14px] leading-7 sm:grid-cols-[8rem_1fr]">
            <dt className="text-[var(--color-ink-muted)]">Company</dt>
            <dd className="flex items-center gap-2 text-[var(--color-ink-secondary)]">
              <BrandLogo companyId={product.companyId} productId={product.id} size={14} />
              {company?.name ?? product.companyId}
            </dd>

            <dt className="text-[var(--color-ink-muted)]">Category</dt>
            <dd className="flex flex-wrap gap-2">
              {systems.map((system) => (
                <Chip key={system.id} onClick={() => pushSystem(system.id)} title={system.name}>
                  {system.shortName}
                </Chip>
              ))}
            </dd>

            <dt className="text-[var(--color-ink-muted)]">Business Area</dt>
            <dd className="text-[var(--color-ink-secondary)]">
              {areas.map((area) => area.name).join(" / ")}
            </dd>
          </dl>

          {product.note && (
            <p className="mt-4 max-w-[70ch] border-l border-[var(--color-line-strong)] pl-4 text-[14px] leading-7 text-[var(--color-ink-secondary)]">
              {product.note}
            </p>
          )}
        </Section>

        <Section
          title="Key Functions"
          aside={
            <span className="tabular text-[12px] text-[var(--color-ink-muted)]">
              {product.functions.length}
            </span>
          }
        >
          <TermList items={product.functions} />
        </Section>

        <Section title="Related">
          <div className="flex flex-wrap gap-2">
            {product.related.map((token) => {
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

        {projectsStatus === "ready" && (
          <Section
            title="Related Projects"
            aside={
              <span className="tabular text-[12px] text-[var(--color-ink-muted)]">
                {relatedProjects.length} 件
              </span>
            }
          >
            <RelatedProjects
              projects={relatedProjects}
              emptyLabel={`${product.name} を使っているプロジェクトはまだありません。`}
            />
          </Section>
        )}

        {learningStatus === "ready" && (
          <Section
            title="Related Learning"
            aside={
              <span className="tabular text-[12px] text-[var(--color-ink-muted)]">
                {relatedLearning.length} 件
              </span>
            }
          >
            <RelatedLearning
              pages={relatedLearning}
              emptyLabel={`${product.name} に紐づく Learning はまだありません。`}
            />
          </Section>
        )}

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
              business_area: primaryArea,
              system_category: systems[0]?.id ?? null,
              product_key: product.id,
            }}
            targetLabel={product.name}
          />
        </Section>
      </div>
    </>
  );
}
