"use client";

import { useEffect, useState } from "react";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { projectNameOrFallback } from "@/lib/projects/types";
import {
  VISUALIZATION_LABEL,
  type LearningAIResult,
  type LearningDraft,
} from "@/lib/learning/types";
import { LearningBody } from "./LearningBody";

/**
 * 保存前の確認。
 *
 * AI 生成の直後に DB へ書かないのは、AI が誤読していたときに
 * ゴミが蓄積するのを防ぐため。ここで人の意思を必ず1回挟む。
 * 編集できるのはタイトルと紐づけ先だけ（MVP では本文エディタは作らない）。
 */
export function LearningPreview({
  result,
  sourceText,
  saving,
  onSave,
  onRegenerate,
  onDiscard,
}: {
  result: LearningAIResult;
  sourceText: string;
  saving: boolean;
  onSave: (draft: LearningDraft) => void;
  onRegenerate: () => void;
  onDiscard: () => void;
}) {
  const { projects } = useProjects();
  const [title, setTitle] = useState(result.title);
  const [projectId, setProjectId] = useState<string>("");

  // 再生成でタイトルが変わったら、編集中の値も追従させる
  useEffect(() => {
    setTitle(result.title);
  }, [result]);

  const save = () => {
    if (saving) return;
    const draft: LearningDraft = {
      title: title.trim() || result.title,
      sourceText,
      summary: result.summary,
      visualizationType: result.visualizationType,
      visualization: result.visualization,
      keyPoints: result.keyPoints,
      relatedConcepts: result.relatedConcepts,
      businessArea: result.classification.businessArea,
      systemCategory: result.classification.systemCategory,
      productKey: result.classification.productKey,
      projectId: projectId || null,
    };
    onSave(draft);
  };

  return (
    <section aria-labelledby="learning-preview-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--color-line)] pb-2">
        <h2 id="learning-preview-heading" className="label-caps">
          プレビュー
        </h2>
        <span className="text-[12px] text-[var(--color-ink-muted)]">
          {VISUALIZATION_LABEL[result.visualizationType]}として整理されました
        </span>
      </div>

      <div className="mt-5">
        <label htmlFor="learning-title" className="label-caps mb-1.5 block">
          タイトル
        </label>
        <input
          id="learning-title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="tracking-display w-full max-w-[46rem] rounded-[4px] border border-[var(--color-line-strong)] bg-white px-3 py-2 text-[20px] font-bold leading-tight text-[var(--color-ink)]"
        />
      </div>

      {projects.length > 0 && (
        <div className="mt-4">
          <label htmlFor="learning-project" className="label-caps mb-1.5 block">
            プロジェクトに紐づける（任意）
          </label>
          <select
            id="learning-project"
            value={projectId}
            onChange={(event) => setProjectId(event.target.value)}
            className="h-9 max-w-[24rem] cursor-pointer truncate rounded-[4px] border border-[var(--color-line)] bg-white px-2 text-[13px] text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)]"
          >
            <option value="">未設定</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {projectNameOrFallback(project)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="mt-6">
        <LearningBody
          summary={result.summary}
          visualization={result.visualization}
          keyPoints={result.keyPoints}
          relatedConcepts={result.relatedConcepts}
          classification={result.classification}
          sourceText={sourceText}
        />
      </div>

      {/* sticky: 生成内容が長い（flowが10ステップ等）と、保存ボタンが
          画面外へ流れて迷子になる。スクロール中も常に手が届く位置に置く。
          content と同じ幅のまま（full-bleed にしない）ので、独立した
          UI パーツに見えず、文書の続きとして自然に見える。 */}
      <div className="sticky bottom-0 z-10 mt-8 flex flex-wrap items-center gap-3 border-t border-[var(--color-line)] bg-[var(--color-surface)] pt-4 pb-1">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="h-10 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-4 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "保存中…" : "保存する"}
        </button>
        <button
          type="button"
          onClick={onRegenerate}
          disabled={saving}
          className="h-10 cursor-pointer rounded-[4px] border border-[var(--color-line-strong)] px-3 text-[13px] text-[var(--color-ink-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-sunken)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          もう一度生成
        </button>
        <button
          type="button"
          onClick={onDiscard}
          disabled={saving}
          className="h-10 cursor-pointer px-2 text-[13px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:text-[var(--color-ink)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          破棄
        </button>
      </div>
    </section>
  );
}
