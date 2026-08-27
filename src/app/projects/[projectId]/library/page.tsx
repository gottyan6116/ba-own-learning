"use client";

import { ProjectLibraryTab } from "@/components/projects/detail/ProjectLibraryTab";
import { useCurrentProject } from "@/lib/projects/useCurrentProject";

export default function ProjectLibraryPage() {
  const project = useCurrentProject();
  if (!project) return null;
  return <ProjectLibraryTab project={project} />;
}