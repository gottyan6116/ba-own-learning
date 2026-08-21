"use client";

import { useCurrentProject } from "@/lib/projects/useCurrentProject";
import { GanttChart } from "@/components/projects/gantt/GanttChart";

export default function ProjectGanttPage() {
  const project = useCurrentProject();
  if (!project) return null;
  return <GanttChart project={project} />;
}
