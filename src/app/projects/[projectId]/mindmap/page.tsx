"use client";

import { ProjectMindMap } from "@/components/projects/mindmap/ProjectMindMap";
import { useCurrentProject } from "@/lib/projects/useCurrentProject";

export default function ProjectMindMapPage() {
  const project = useCurrentProject();
  return project ? <ProjectMindMap project={project} /> : null;
}
