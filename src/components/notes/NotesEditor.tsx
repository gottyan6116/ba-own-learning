"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  businessAreas,
  getSystemsByArea,
  products as allProducts,
  systemCategories,
  getSystemCategory,
  getProduct,
  getProductsForSystem,
} from "@/data";
import { useNotes } from "@/lib/notes/NotesProvider";
import { insertAtSelection, noteImageMarkdown } from "@/lib/notes/media";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { noteTitleOrFallback, type Note } from "@/lib/notes/types";
import { useProjects } from "@/lib/projects/ProjectsProvider";
import { projectNameOrFallback } from "@/lib/projects/types";
import { formatDateTime } from "@/lib/format";
import { areaClass } from "@/components/ui/primitives";

const AUTOSAVE_DELAY = 700;

/**
 * 本文の編集。
 *
 * 自動保存は debounce。保存のたびに一覧やモーダルを作り直さないよう、
 * 入力中の値はこのコンポーネントのローカル state を正とし、
 * 保存が終わってもここへ書き戻さない（カーソルが飛ぶため）。
 */
export function NotesEditor({ note }: { note: Note }) {
  const { updateNote, deleteNote, togglePin, uploadNoteImage, saveStatus } = useNotes();

  const [content, setContent] = useState(note.content);
  const [title, setTitle] = useState(note.title);
  const [editingTitle, setEditingTitle] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDraggingImage, setIsDraggingImage] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const titleRef = useRef<HTMLInputElement | null>(null);

  // 選択中のメモが変わったときだけ、ローカルの入力値を差し替える
  useEffect(() => {
    setContent(note.content);
    setTitle(note.title);
    setEditingTitle(false);
    setUploadError(null);
    setConfirmDelete(false);
    dirty.current = false;
    if (timer.current) clearTimeout(timer.current);
  }, [note.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // アンマウント時・切替時に未保存分を流し込む
  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const scheduleSave = (nextContent: string) => {
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dirty.current = false;
      void updateNote(note.id, { content: nextContent });
    }, AUTOSAVE_DELAY);
  };

  const flush = () => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    dirty.current = false;
    void updateNote(note.id, { content });
  };

  const saveTitle = () => {
    const nextTitle = title.trim();
    setTitle(nextTitle);
    setEditingTitle(false);
    if (nextTitle !== note.title) void updateNote(note.id, { title: nextTitle });
  };

  const beginTitleEdit = () => {
    if (!title.trim()) setTitle(noteTitleOrFallback(note));
    setEditingTitle(true);
    requestAnimationFrame(() => titleRef.current?.focus());
  };

  const insertImage = async (file: File) => {
    setUploadError(null);
    try {
      const image = await uploadNoteImage(note.id, file);
      const target = bodyRef.current;
      const start = target?.selectionStart ?? content.length;
      const end = target?.selectionEnd ?? content.length;
      const result = insertAtSelection(content, start, end, noteImageMarkdown(image.alt, image.path));
      setContent(result.content);
      scheduleSave(result.content);
      requestAnimationFrame(() => {
        target?.focus();
        target?.setSelectionRange(result.cursor, result.cursor);
      });
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "画像を保存できませんでした。");
    }
  };

  const area = note.business_area;
  const systemsForSelect = area ? getSystemsByArea(area) : systemCategories;
  const productsForSelect = note.system_category
    ? getProductsForSystem(note.system_category)
    : allProducts;

  return (
    <div className={`${areaClass(area)} flex min-h-0 flex-1 flex-col bg-white`}>
      <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-2 sm:px-8">
        <div className="min-w-0 flex-1">
          {editingTitle ? (
            <input
              ref={titleRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={saveTitle}
              onKeyDown={(event) => {
                if (event.key === "Enter") saveTitle();
                if (event.key === "Escape") {
                  setTitle(note.title);
                  setEditingTitle(false);
                }
              }}
              placeholder={noteTitleOrFallback(note)}
              aria-label="ノートのタイトル"
              className="w-full border-0 bg-transparent py-1 text-[21px] font-bold text-[var(--color-ink)] outline-none"
            />
          ) : (
            <button
              type="button"
              onDoubleClick={beginTitleEdit}
              onClick={() => undefined}
              title="ダブルクリックでタイトルを編集"
              className="block max-w-full cursor-text truncate py-1 text-left text-[21px] font-bold text-[var(--color-ink)]"
            >
              {title || noteTitleOrFallback(note)}
            </button>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button type="button" onClick={() => void togglePin(note.id)} aria-pressed={note.is_pinned} className="h-8 cursor-pointer px-2 text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-zenith)]">{note.is_pinned ? "ピン留め中" : "ピン留め"}</button>
          <button type="button" onClick={() => { if (window.confirm("このメモを削除しますか？")) void deleteNote(note.id); }} className="h-8 cursor-pointer px-2 text-[12px] text-[var(--color-ink-muted)] hover:text-[var(--color-danger)]">削除</button>
        </div>
      </div>
      <div className="scroll-area scrollbar-hidden min-h-0 flex-1 overflow-y-auto">
        <div className="w-full px-5 py-6 sm:px-8">

          <details className="mt-3 border-y border-[var(--color-line-faint)] py-2">
            <summary className="cursor-pointer text-[12px] text-[var(--color-ink-muted)]">
              整理する（業務領域・案件など）
            </summary>
            <AssociationBar note={note} systems={systemsForSelect} products={productsForSelect} />
          </details>

          <label htmlFor="note-body" className="sr-only">
            ノート本文
          </label>
          <textarea
            ref={bodyRef}
            id="note-body"
            autoFocus
            value={content}
            onPaste={(event) => {
              const image = Array.from(event.clipboardData.files).find((file) => file.type.startsWith("image/"));
              if (!image) return;
              event.preventDefault();
              void insertImage(image);
            }}
            onDragOver={(event) => {
              if (!Array.from(event.dataTransfer.types).includes("Files")) return;
              event.preventDefault();
              setIsDraggingImage(true);
            }}
            onDragLeave={() => setIsDraggingImage(false)}
            onDrop={(event) => {
              setIsDraggingImage(false);
              const image = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
              if (!image) return;
              event.preventDefault();
              void insertImage(image);
            }}
            onChange={(event) => {
              setContent(event.target.value);
              scheduleSave(event.target.value);
            }}
            onBlur={flush}
            placeholder="ここから書き始める…&#10;&#10;最初の行がページ名として一覧に表示されます。"
            rows={20}
            className="editor-field scrollbar-hidden mt-5 min-h-[50dvh] w-full resize-none overflow-y-auto bg-transparent text-[16px] leading-8 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)]"
          />
        </div>
      </div>
    </div>
  );
}

function AssociationBar({
  note,
  systems,
  products,
}: {
  note: Note;
  systems: ReturnType<typeof getSystemsByArea>;
  products: typeof allProducts;
}) {
  const { updateNote } = useNotes();
  const { projects } = useProjects();

  const setArea = (value: string) => {
    void updateNote(note.id, {
      business_area: value || null,
      // 領域を変えたら、その配下でないカテゴリ・製品は外す
      system_category: null,
      product_key: null,
    });
  };

  const setSystem = (value: string) => {
    const system = getSystemCategory(value);
    void updateNote(note.id, {
      system_category: value || null,
      business_area: system?.businessArea ?? note.business_area,
      product_key: null,
    });
  };

  const setProduct = (value: string) => {
    const product = getProduct(value);
    const firstSystem = product
      ? systemCategories.find((system) => system.products.includes(product.id))
      : undefined;
    void updateNote(note.id, {
      product_key: value || null,
      system_category: note.system_category ?? firstSystem?.id ?? null,
      business_area: note.business_area ?? firstSystem?.businessArea ?? null,
    });
  };

  const setProject = (value: string) => {
    const project = projects.find((item) => item.id === value);
    void updateNote(note.id, {
      project_id: value || null,
      // プロジェクトに業務領域が設定済みで、メモ側が未分類なら引き継ぐ
      business_area: note.business_area ?? project?.business_area ?? null,
    });
  };

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-y border-[var(--color-line-faint)] py-3">
      <Select label="業務領域" value={note.business_area ?? ""} onChange={setArea}>
        <option value="">未分類</option>
        {businessAreas.map((area) => (
          <option key={area.id} value={area.id}>
            {area.name}
          </option>
        ))}
      </Select>

      <Select label="システム" value={note.system_category ?? ""} onChange={setSystem}>
        <option value="">未設定</option>
        {systems.map((system) => (
          <option key={system.id} value={system.id}>
            {system.shortName} — {system.nameJa}
          </option>
        ))}
      </Select>

      <Select label="製品" value={note.product_key ?? ""} onChange={setProduct}>
        <option value="">未設定</option>
        {products.map((product) => (
          <option key={product.id} value={product.id}>
            {product.name}
          </option>
        ))}
      </Select>

      <Select label="プロジェクト" value={note.project_id ?? ""} onChange={setProject}>
        <option value="">未設定</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {projectNameOrFallback(project)}
            {project.is_archived ? "（アーカイブ）" : ""}
          </option>
        ))}
      </Select>

      {note.project_id && (
        <Link
          href={`/projects/${note.project_id}`}
          className="text-[13px] text-[var(--color-zenith)] underline-offset-2 hover:underline"
        >
          プロジェクトを開く →
        </Link>
      )}
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  const id = `assoc-${label}`;
  return (
    <span className="flex items-center gap-1.5">
      <label htmlFor={id} className="label-caps">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-9 max-w-[15rem] cursor-pointer truncate rounded-[4px] border border-[var(--color-line)] bg-white px-2 text-[13px] text-[var(--color-ink-secondary)] hover:border-[var(--color-line-strong)]"
      >
        {children}
      </select>
    </span>
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
