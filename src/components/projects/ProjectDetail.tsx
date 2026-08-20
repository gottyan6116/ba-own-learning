"use client";

import { useEffect, useRef, useState } from "react";
import { businessAreas, getProductsByArea, getSystemsByArea } from "@/data";
import { useNotes } from "@/lib/notes/NotesProvider";
import { notesForProject } from "@/lib/notes/relations";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import {
  PROJECT_STATUSES,
  PROJECT_STATUS_LABEL,
  projectNameOrFallback,
  type Project,
} from "@/lib/projects/types";
import { formatDateTime } from "@/lib/format";
import { areaClass, ToggleChip } from "@/components/ui/primitives";
import { RelatedNotes } from "@/components/knowledge/RelatedNotes";

const AUTOSAVE_DELAY = 700;

type TextPatch = { name?: string; client?: string; summary?: string };

/**
 * 右ペイン。案件の属性編集 + 使用システム/製品の選択 + 関連メモ。
 *
 * テキスト系（名前・クライアント・概要）は NotesEditor と同じ debounce +
 * blur-flush。選択系（ステータス・領域・日付・システム/製品チップ）は
 * 選ぶ操作そのものが確定なので、都度即保存する。
 */
export function ProjectDetail({ project }: { project: Project }) {
  const { updateProject, deleteProject, toggleArchive, saveStatus } = useProjects();
  const { notes } = useNotes();

  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client ?? "");
  const [summary, setSummary] = useState(project.summary);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef<TextPatch>({});

  useEffect(() => {
    setName(project.name);
    setClient(project.client ?? "");
    setSummary(project.summary);
    setConfirmDelete(false);
    dirty.current = {};
    if (timer.current) clearTimeout(timer.current);
  }, [project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const scheduleSave = (patch: TextPatch) => {
    dirty.current = { ...dirty.current, ...patch };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const pending = dirty.current;
      dirty.current = {};
      void updateProject(project.id, pending);
    }, AUTOSAVE_DELAY);
  };

  const flush = () => {
    if (Object.keys(dirty.current).length === 0) return;
    if (timer.current) clearTimeout(timer.current);
    const pending = dirty.current;
    dirty.current = {};
    void updateProject(project.id, pending);
  };

  const toggleSystem = (systemId: string) => {
    const next = project.system_categories.includes(systemId)
      ? project.system_categories.filter((id) => id !== systemId)
      : [...project.system_categories, systemId];
    void updateProject(project.id, { system_categories: next });
  };

  const toggleProduct = (productId: string) => {
    const next = project.product_keys.includes(productId)
      ? project.product_keys.filter((id) => id !== productId)
      : [...project.product_keys, productId];
    void updateProject(project.id, { product_keys: next });
  };

  const related = notesForProject(notes, project.id);

  return (
    <div className={`${areaClass(project.business_area)} flex min-h-0 flex-1 flex-col bg-white`}>
      <div className="flex items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-2.5">
        <SaveIndicator status={saveStatus} updatedAt={project.updated_at} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => void toggleArchive(project.id)}
            aria-pressed={project.is_archived}
            className={`h-9 cursor-pointer rounded-[4px] px-2.5 text-[12px] transition-colors duration-150 ${
              project.is_archived
                ? "bg-[var(--color-surface-selected)] text-[var(--color-zenith)]"
                : "text-[var(--color-ink-muted)] hover:bg-[var(--color-surface-sunken)]"
            }`}
          >
            {project.is_archived ? "アーカイブ中" : "アーカイブ"}
          </button>

          {confirmDelete ? (
            <span className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => void deleteProject(project.id)}
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
        <div className="mx-auto w-full max-w-[760px] px-5 py-6 sm:px-8">
          <label htmlFor="project-name" className="sr-only">
            プロジェクト名
          </label>
          <input
            id="project-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              scheduleSave({ name: event.target.value });
            }}
            onBlur={flush}
            placeholder="プロジェクト名"
            className="editor-field tracking-display -ml-3 w-full bg-transparent pl-3 text-[24px] font-bold leading-tight text-[var(--color-ink)] placeholder:text-[var(--color-line-strong)]"
          />

          {/* ── 属性行 ─────────────────────────────────────────────── */}
          <div className="mt-4 grid gap-x-4 gap-y-3 border-y border-[var(--color-line-faint)] py-3 sm:grid-cols-2">
            <Field label="クライアント">
              <input
                value={client}
                onChange={(event) => {
                  setClient(event.target.value);
                  scheduleSave({ client: event.target.value });
                }}
                onBlur={flush}
                placeholder="未設定"
                className="h-9 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-2.5 text-[13px] text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
              />
            </Field>

            <Field label="ステータス">
              <select
                value={project.status}
                onChange={(event) =>
                  void updateProject(project.id, {
                    status: event.target.value as Project["status"],
                  })
                }
                className="h-9 w-full cursor-pointer rounded-[4px] border border-[var(--color-line)] bg-white px-2.5 text-[13px] text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)]"
              >
                {PROJECT_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABEL[status]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="業務領域">
              <select
                value={project.business_area ?? ""}
                onChange={(event) =>
                  void updateProject(project.id, { business_area: event.target.value || null })
                }
                className="h-9 w-full cursor-pointer rounded-[4px] border border-[var(--color-line)] bg-white px-2.5 text-[13px] text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)]"
              >
                <option value="">未分類</option>
                {businessAreas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="開始日">
                <input
                  type="date"
                  value={project.start_date ?? ""}
                  onChange={(event) =>
                    void updateProject(project.id, { start_date: event.target.value || null })
                  }
                  className="h-9 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-2 text-[13px] text-[var(--color-ink-secondary)]"
                />
              </Field>
              <Field label="期日">
                <input
                  type="date"
                  value={project.due_date ?? ""}
                  onChange={(event) =>
                    void updateProject(project.id, { due_date: event.target.value || null })
                  }
                  className="h-9 w-full rounded-[4px] border border-[var(--color-line)] bg-white px-2 text-[13px] text-[var(--color-ink-secondary)]"
                />
              </Field>
            </div>
          </div>

          {/* ── 概要 ───────────────────────────────────────────────── */}
          <label htmlFor="project-summary" className="label-caps mt-5 mb-1.5 block">
            概要・目的
          </label>
          <textarea
            id="project-summary"
            value={summary}
            onChange={(event) => {
              setSummary(event.target.value);
              scheduleSave({ summary: event.target.value });
            }}
            onBlur={flush}
            placeholder="背景、ゴール、スコープなど"
            rows={4}
            className="editor-field w-full resize-y rounded-[4px] border border-[var(--color-line)] bg-white px-3 py-2 text-[14px] leading-7 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />

          {/* ── 使用システム ───────────────────────────────────────────
              業務領域は案件全体の主タグであって、使用システムを制約するもの
              ではない（1案件が複数領域のシステムを横断するのは普通のこと）。
              そのためチップは常に全カテゴリを対象にする。 */}
          <p className="label-caps mt-6 mb-2">使用システム</p>
          <div className="space-y-3">
            {businessAreas.map((area) => {
              const systems = getSystemsByArea(area.id);
              if (systems.length === 0) return null;
              return (
                <div key={area.id}>
                  <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                    {area.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {systems.map((system) => (
                      <ToggleChip
                        key={system.id}
                        selected={project.system_categories.includes(system.id)}
                        onClick={() => toggleSystem(system.id)}
                      >
                        {system.shortName}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 使用製品 ───────────────────────────────────────────── */}
          <p className="label-caps mt-6 mb-2">使用製品</p>
          <div className="space-y-3">
            {businessAreas.map((area) => {
              const products = getProductsByArea(area.id);
              if (products.length === 0) return null;
              return (
                <div key={area.id}>
                  <p className="text-[11px] font-medium text-[var(--color-ink-muted)]">
                    {area.name}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {products.map((product) => (
                      <ToggleChip
                        key={product.id}
                        selected={project.product_keys.includes(product.id)}
                        onClick={() => toggleProduct(product.id)}
                      >
                        {product.name}
                      </ToggleChip>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── 関連メモ ───────────────────────────────────────────── */}
          <p className="label-caps mt-6 mb-2">
            関連メモ <span className="tabular ml-1">{related.length} 件</span>
          </p>
          <RelatedNotes
            notes={related}
            link={{ project_id: project.id, business_area: project.business_area ?? null }}
            targetLabel={projectNameOrFallback(project)}
          />
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label-caps mb-1.5 block">{label}</span>
      {children}
    </label>
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
