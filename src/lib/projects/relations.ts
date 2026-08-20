import type { Project } from "./types";

/**
 * このシステムカテゴリを使っているプロジェクト。
 * Knowledge Modal 側の「Related Projects」表示に使う。
 */
export function projectsForSystem(projects: Project[], systemId: string): Project[] {
  return projects.filter((project) => project.system_categories.includes(systemId));
}

export function projectsForProduct(projects: Project[], productId: string): Project[] {
  return projects.filter((project) => project.product_keys.includes(productId));
}
