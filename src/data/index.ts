import { businessAreas, businessAreaMap, type BusinessArea, type BusinessAreaId } from "./businessAreas";
import { systemCategories, systemCategoryMap, type SystemCategory } from "./systems";
import { products, productMap, type Product } from "./products";
import { companies, type Company } from "./companies";

export * from "./businessAreas";
export * from "./systems";
export * from "./products";
export * from "./companies";

/** product id -> それが属する System Category（複数あり得る） */
const productToSystems = new Map<string, SystemCategory[]>();
for (const system of systemCategories) {
  for (const productId of system.products) {
    const list = productToSystems.get(productId) ?? [];
    list.push(system);
    productToSystems.set(productId, list);
  }
}

export function getSystemsForProduct(productId: string): SystemCategory[] {
  return productToSystems.get(productId) ?? [];
}

/** その製品が登場する Business Area（重複除去・マップ上の並び順） */
export function getAreasForProduct(productId: string): BusinessArea[] {
  const areaIds = new Set(getSystemsForProduct(productId).map((system) => system.businessArea));
  return businessAreas.filter((area) => areaIds.has(area.id));
}

/**
 * Business Area ごとの Representative Solutions。
 * 同じ製品が複数カテゴリに出てくる場合は、その領域の中で1回だけ表示する。
 */
export function getProductsByArea(areaId: BusinessAreaId): Product[] {
  const seen = new Set<string>();
  const result: Product[] = [];
  for (const system of systemCategories) {
    if (system.businessArea !== areaId) continue;
    for (const productId of system.products) {
      if (seen.has(productId)) continue;
      const product = productMap[productId];
      if (!product) continue;
      seen.add(productId);
      result.push(product);
    }
  }
  return result;
}

export function getProductsForSystem(systemId: string): Product[] {
  const system = systemCategoryMap[systemId];
  if (!system) return [];
  return system.products.map((id) => productMap[id]).filter(Boolean);
}

/** Modal ヘッダー等で「経営・事業企画 / BI」のようなパンくずを出すため */
export function getAreaForSystem(systemId: string): BusinessArea | undefined {
  const system = systemCategoryMap[systemId];
  return system ? businessAreaMap[system.businessArea] : undefined;
}

/**
 * `relatedConcepts` / `related` の要素は system id のこともあれば、
 * ただの用語のこともある。クリック可能かどうかをここで判定する。
 */
export function resolveRelated(token: string):
  | { kind: "system"; system: SystemCategory }
  | { kind: "product"; product: Product }
  | { kind: "term"; label: string } {
  const system = systemCategoryMap[token];
  if (system) return { kind: "system", system };
  const product = productMap[token];
  if (product) return { kind: "product", product };
  return { kind: "term", label: token };
}

export const knowledge = {
  businessAreas,
  systemCategories,
  products,
  companies,
};

export type { BusinessArea, BusinessAreaId, SystemCategory, Product, Company };
