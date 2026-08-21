"use client";

import { useCurrentProject } from "@/lib/projects/useCurrentProject";
import { ProjectOverview } from "@/components/projects/detail/ProjectOverview";

export default function ProjectOverviewPage() {
  const project = useCurrentProject();
  if (!project) return null;
  return <ProjectOverview project={project} />;
}
