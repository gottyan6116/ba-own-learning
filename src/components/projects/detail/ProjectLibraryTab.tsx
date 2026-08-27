"use client";

import { useEffect, useRef, useState } from "react";
import type { Project } from "@/lib/projects/types";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { extensionForImage, validateNoteImage } from "@/lib/notes/media";

type LibraryImage = { path: string; name: string; url: string };

export function ProjectLibraryTab({ project }: { project: Project }) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [images, setImages] = useState<LibraryImage[]>([]);
  const [selected, setSelected] = useState<LibraryImage | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    const prefix = `${user.id}/${project.id}`;
    const { data, error: listError } = await supabase.storage.from("project-library").list(prefix, { sortBy: { column: "created_at", order: "desc" } });
    if (listError) return setError(listError.message);
    const entries = await Promise.all((data ?? []).filter((item) => item.name !== ".emptyFolderPlaceholder").map(async (item) => {
      const path = `${prefix}/${item.name}`;
      const { data } = await supabase.storage.from("project-library").createSignedUrl(path, 3600);
      return data?.signedUrl ? { path, name: item.name.replace(/^.+?-/, ""), url: data.signedUrl } : null;
    }));
    setImages(entries.filter((item): item is LibraryImage => Boolean(item)));
  };

  useEffect(() => { void load(); }, [project.id, user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const uploadFiles = async (files: FileList | File[]) => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase || !user) return;
    const accepted = Array.from(files).filter((file) => validateNoteImage(file).ok);
    if (!accepted.length) return setError("PNG / JPEG / WebP / GIF（10MB以下）の画像を選択してください。");
    setBusy(true); setError(null);
    for (const file of accepted) {
      const path = `${user.id}/${project.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `image.${extensionForImage(file)}`}`;
      const { error: uploadError } = await supabase.storage.from("project-library").upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) { setError(uploadError.message); break; }
    }
    setBusy(false); await load();
  };

  return <main className="mx-auto w-full max-w-[1500px] px-5 py-6 sm:px-8">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-[22px] font-bold">ライブラリー</h2><p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">スクリーンショット・画像を、この案件専用に保管します。</p></div><button type="button" onClick={() => inputRef.current?.click()} className="h-10 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-4 text-[13px] font-medium text-white">ファイルを選択</button><input ref={inputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" multiple onChange={(event) => { if (event.target.files) void uploadFiles(event.target.files); event.target.value = ""; }} /></div>
    <div onPaste={(event) => { const files = event.clipboardData.files; if (files.length) { event.preventDefault(); void uploadFiles(files); } }} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); void uploadFiles(event.dataTransfer.files); }} tabIndex={0} className={`mt-6 min-h-56 rounded-[6px] border-2 border-dashed p-4 transition-colors ${dragging ? "border-[var(--color-zenith)] bg-[var(--color-surface-selected)]" : "border-[var(--color-line)]"}`}>
      {busy && <p className="mb-3 text-[13px] text-[var(--color-ink-muted)]">アップロード中…</p>}{error && <p role="alert" className="mb-3 text-[13px] text-[var(--color-danger)]">{error}</p>}
      {images.length ? <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">{images.map((image) => <button key={image.path} type="button" onClick={() => setSelected(image)} className="group overflow-hidden rounded-[5px] border border-[var(--color-line)] bg-white text-left"><img src={image.url} alt={image.name} className="aspect-[4/3] w-full object-cover transition-transform group-hover:scale-[1.03]" /><span className="block truncate px-2 py-2 text-[12px] text-[var(--color-ink-secondary)]">{image.name}</span></button>)}</div> : <div className="flex min-h-48 items-center justify-center text-center text-[14px] text-[var(--color-ink-muted)]">ここへ画像をドロップ、Ctrl + Vで貼り付け、または「ファイルを選択」してください。</div>}
    </div>
    {selected && <div role="dialog" aria-modal="true" aria-label="画像を拡大表示" onClick={() => setSelected(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5"><button type="button" onClick={(event) => event.stopPropagation()} className="max-h-full max-w-full cursor-default"><img src={selected.url} alt={selected.name} className="max-h-[88vh] max-w-[92vw] rounded-[5px] object-contain" /><span className="mt-2 block text-left text-[13px] text-white">{selected.name}</span></button></div>}
  </main>;
}
