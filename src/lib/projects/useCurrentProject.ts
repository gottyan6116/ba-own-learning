"use client";

import { useParams } from "next/navigation";
import { useProjects } from "./ProjectsProvider";
import type { Project } from "./types";

/**
 * /projects/[projectId] 配下の各タブページで、対象 Project を1回の記述で
 * 取り出す。layout.tsx が「見つからない場合」を先に弾いているので、
 * ここでは見つかった前提で使ってよい（見つからない一瞬だけ null）。
 */
export function useCurrentProject(): Project | null {
  const params = useParams<{ projectId: string }>();
  const { projects } = useProjects();
  return projects.find((project) => project.id === params.projectId) ?? null;
}
