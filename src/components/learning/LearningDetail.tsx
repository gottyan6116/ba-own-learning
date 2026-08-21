"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { formatDateTime } from "@/lib/format";
import { useLearning } from "@/lib/learning/LearningProvider";
import {
  VISUALIZATION_LABEL,
  readStringArray,
  readVisualization,
  type LearningPage,
  type VisualizationType,
} from "@/lib/learning/types";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { projectNameOrFallback } from "@/lib/projects/types";
import { areaClass } from "@/components/ui/primitives";
import { LearningBody } from "./LearningBody";

const AUTOSAVE_DELAY = 700;

/**
 * 保存済み Learning の閲覧。
 *
 * 編集できるのはタイトルだけ。構造化された本文を後から手で書き換えると
 * 「AI の出力」と「人の加筆」が混ざって出所が追えなくなるため、
 * 内容を直したいときは元メモから作り直す運用にしている。
 */
export function LearningDetail({ page }: { page: LearningPage }) {
  const { updatePage, deletePage, saveStatus } = useLearning();
  const { projects } = useProjects();

  const [title, setTitle] = useState(page.title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  useEffect(() => {
    setTitle(page.title);
    setConfirmDelete(false);
    dirty.current = false;
    if (timer.current) clearTimeout(timer.current);
  }, [page.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const scheduleSave = (nextTitle: string) => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dirty.current = false;
      void updatePage(page.id, { title: nextTitle });
    }, AUTOSAVE_DELAY);
  };

  const flush = () => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    void updatePage(page.id, { title });
  };

  const visualization = readVisualization(page);
  const keyPoints = readStringArray(page.key_points);
  const relatedConcepts = readStringArray(page.related_concepts);
  const project = projects.find((item) => item.id === page.project_id);

  return (
    <div className={`${areaClass(page.business_area)} flex min-h-0 flex-1 flex-col bg-white`}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-2.5">
        <SaveIndicator status={saveStatus} updatedAt={page.updated_at} />
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[12px] text-[var(--color-ink-muted)]">
            {VISUALIZATION_LABEL[page.visualization_type as VisualizationType] ??
              page.visualization_type}
          </span>
          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void deletePage(page.id)}
                className="h-9 cursor-pointer rounded-[4px] bg-[var(--color-danger)] px-2.5 text-[12px] font-medium text-white"
              >
                削除する
              </button>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-9 cursor-pointer px-2 text-[12px] text-[var(--color-ink-muted)]"
              >
                やめる
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="h-9 cursor-pointer rounded-[4px] px-2.5 text-[12px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:bg-[var(--color-danger-tint)] hover:text-[var(--color-danger)]"
            >
              削除
            </button>
          )}
        </div>
      </div>

      <div className="scroll-area min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8">
          <label htmlFor="learning-detail-title" className="sr-only">
            タイトル
          </label>
          <input
            id="learning-detail-title"
            value={title}
            onChange={(event) => {
              setTitle(event.target.value);
              scheduleSave(event.target.value);
            }}
            onBlur={flush}
            placeholder="タイトル"
            className="editor-field tracking-display -ml-3 w-full bg-transparent pl-3 text-[24px] font-bold leading-tight text-[var(--color-ink)] placeholder:text-[var(--color-line-strong)]"
          />

          {project && (
            <p className="mt-2 text-[13px]">
              <Link
                href={`/projects?project=${project.id}`}
                className="text-[var(--color-zenith)] underline-offset-2 hover:underline"
              >
                {projectNameOrFallback(project)}
              </Link>
            </p>
          )}

          <div className="mt-6">
            <LearningBody
              summary={page.summary}
              visualization={visualization}
              keyPoints={keyPoints}
              relatedConcepts={relatedConcepts}
              classification={{
                businessArea: page.business_area,
                systemCategory: page.system_category,
                productKey: page.product_key,
              }}
              sourceText={page.source_text}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SaveIndicator({
  status,
  updatedAt,
}: {
  status: "idle" | "saving" | "saved" | "error";
  updatedAt: string;
}) {
  if (status === "saving") {
    return <span className="text-[12px] text-[var(--color-ink-muted)]">保存中…</span>;
  }
  if (status === "saved") {
    return <span className="text-[12px] text-[var(--color-ink-muted)]">保存済み</span>;
  }
  if (status === "error") {
    return <span className="text-[12px] text-[var(--color-danger)]">保存に失敗しました</span>;
  }
  return (
    <span className="tabular text-[12px] text-[var(--color-ink-muted)]">
      最終更新 {formatDateTime(updatedAt)}
    </span>
  );
}
