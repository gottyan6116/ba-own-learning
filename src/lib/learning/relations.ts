import { getSystemCategory } from "@/data";
import type { LearningPage } from "./types";
import { sortLearningPages } from "./types";

/**
 * Knowledge Map / Projects と Learning Pages を突き合わせる。
 * lib/notes/relations.ts と同じ考え方で揃えている。
 */

/**
 * System Category に紐づく Learning。
 * カテゴリ直下に加えて、配下の製品に紐づいたものも拾う
 * （MA を復習するときに Marketo の学習が出てこないのは不便なため）。
 */
export function learningForSystem(pages: LearningPage[], systemId: string): LearningPage[] {
  const system = getSystemCategory(systemId);
  const productIds = new Set(system?.products ?? []);
  return sortLearningPages(
    pages.filter(
      (page) =>
        page.system_category === systemId ||
        (page.product_key != null && productIds.has(page.product_key)),
    ),
  );
}

export function learningForProduct(pages: LearningPage[], productId: string): LearningPage[] {
  return sortLearningPages(pages.filter((page) => page.product_key === productId));
}

export function learningForProject(pages: LearningPage[], projectId: string): LearningPage[] {
  return sortLearningPages(pages.filter((page) => page.project_id === projectId));
}
