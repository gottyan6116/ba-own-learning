"use client";

import { useCurrentProject } from "@/lib/projects/useCurrentProject";
import { ProjectLearningTab } from "@/components/projects/detail/ProjectLearningTab";

export default function ProjectLearningPage() {
  const project = useCurrentProject();
  if (!project) return null;
  return <ProjectLearningTab project={project} />;
}
