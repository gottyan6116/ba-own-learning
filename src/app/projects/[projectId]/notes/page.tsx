"use client";

import { useCurrentProject } from "@/lib/projects/useCurrentProject";
import { ProjectNotesTab } from "@/components/projects/detail/ProjectNotesTab";

export default function ProjectNotesPage() {
  const project = useCurrentProject();
  if (!project) return null;
  return <ProjectNotesTab project={project} />;
}
