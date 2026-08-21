"use client";

import { useLearning } from "@/lib/learning/LearningProvider";
import { learningForProject } from "@/lib/learning/relations";
import { RelatedLearning } from "@/components/knowledge/RelatedLearning";
import type { Project } from "@/lib/projects/types";

/**
 * 新しい Learning DB は作らない。既存 LearningProvider をそのままフィルタする。
 * Learning の新規作成はここではやらない（既存 RelatedLearning と同じ方針 —
 * AI 呼び出しは /learning に集約する）。
 */
export function ProjectLearningTab({ project }: { project: Project }) {
  const { pages } = useLearning();
  const related = learningForProject(pages, project.id);

  return (
    <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8">
        <h2 className="mb-4 text-[16px] font-semibold text-[var(--color-ink)]">
          Learning{" "}
          <span className="tabular ml-1 text-[13px] font-normal text-[var(--color-ink-muted)]">
            {related.length} 件
          </span>
        </h2>
        <RelatedLearning
          pages={related}
          emptyLabel="このプロジェクトに紐づく Learning はまだありません。/learning で作成すると、ここにも表示されます。"
        />
      </div>
    </div>
  );
}
