import type { FrameworkAnalysis, FrameworkAnalysisProject } from "./types";
import { sortFrameworkAnalyses } from "./types";

/** Analyses linked to a project, newest generated result first. */
export function analysesForProject(
  analyses: FrameworkAnalysis[],
  links: FrameworkAnalysisProject[],
  projectId: string,
): FrameworkAnalysis[] {
  const analysisIds = new Set(
    links.filter((link) => link.project_id === projectId).map((link) => link.framework_analysis_id),
  );
  return sortFrameworkAnalyses(analyses.filter((analysis) => analysisIds.has(analysis.id)));
}

export function projectIdsForAnalysis(
  links: FrameworkAnalysisProject[],
  analysisId: string,
): string[] {
  return links
    .filter((link) => link.framework_analysis_id === analysisId)
    .map((link) => link.project_id);
}
