"use client";

import { ProjectAnalysesTab } from "@/components/projects/detail/ProjectAnalysesTab";
import { useCurrentProject } from "@/lib/projects/useCurrentProject";

export default function ProjectAnalysesPage() {
  const project = useCurrentProject();
  return project ? <ProjectAnalysesTab project={project} /> : null;
}
