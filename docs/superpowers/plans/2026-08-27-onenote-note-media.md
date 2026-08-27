# OneNote Note Media Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a OneNote-like note page with inline title editing, no focus line, and private screenshot paste/drop uploads.

**Architecture:** Pure helpers validate image files, make a user-scoped path, and insert Markdown image tokens at the caret. `NotesEditor` owns the inline title and upload interaction; `NotesProvider` uploads to a private Storage bucket. A SQL migration creates the bucket and owner-folder RLS policies.

**Tech Stack:** Next.js 15, React 19, TypeScript, Vitest, Supabase JS and Supabase Storage.

**Spec:** `docs/superpowers/specs/2026-08-25-onenote-media-design.md`

## Global Constraints

- Use the private `note-images` bucket with a 10 MB file limit and only PNG, JPEG, WebP, and GIF types.
- Store images at `{user_id}/{note_id}/{uuid}.{extension}` and never expose a public bucket URL.
- Preserve existing notes table data and text autosave behavior.
- Keep the Notes page usable on desktop and mobile without adding a rich-text dependency.

---

### Task 1: Note media helpers

**Files:**
- Create: `src/lib/notes/media.ts`
- Create: `src/lib/notes/media.test.ts`

**Interfaces:**
- Produces `validateNoteImage(file)`, `noteImagePath(userId, noteId, extension, id)`, and `insertAtSelection(content, start, end, insertion)` for the provider and editor.

- [ ] **Step 1: Write failing helper tests**

```ts
expect(validateNoteImage(new File(["x"], "clip.png", { type: "image/png" }))).toEqual({ ok: true });
expect(validateNoteImage(new File(["x"], "clip.pdf", { type: "application/pdf" }))).toEqual({ ok: false, message: "画像ファイル（PNG / JPEG / WebP / GIF）を選択してください。" });
expect(insertAtSelection("abef", 2, 2, "cd")).toEqual({ content: "abcdef", cursor: 4 });
```

- [ ] **Step 2: Run the focused test and verify it fails because the helpers do not exist**

Run: `npm test -- src/lib/notes/media.test.ts`

- [ ] **Step 3: Implement only the helper API above**

```ts
export const NOTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export function noteImagePath(userId: string, noteId: string, extension: string, id: string) {
  return `${userId}/${noteId}/${id}.${extension}`;
}
```

- [ ] **Step 4: Run the focused test and verify it passes**

Run: `npm test -- src/lib/notes/media.test.ts`

### Task 2: Private storage and provider upload API

**Files:**
- Create: `supabase/migrations/20260827000000_create_note_images_storage.sql`
- Modify: `src/lib/notes/NotesProvider.tsx`

**Interfaces:**
- Consumes `validateNoteImage` and `noteImagePath` from Task 1.
- Produces `uploadNoteImage(noteId: string, file: File): Promise<{ path: string; alt: string }>` in `NotesContextValue`.

- [ ] **Step 1: Add a failing provider-adjacent test for helper validation**

```ts
expect(validateNoteImage(new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", { type: "image/png" }))).toEqual({ ok: false, message: "画像は10MB以下にしてください。" });
```

- [ ] **Step 2: Run the focused helper test and verify it fails**

Run: `npm test -- src/lib/notes/media.test.ts`

- [ ] **Step 3: Add the migration and provider method**

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('note-images', 'note-images', false, 10485760, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
```

Use `storage.foldername(name)[1] = (select auth.uid()::text)` in `SELECT`, `INSERT`, and `DELETE` policies restricted to `note-images`.

- [ ] **Step 4: Run the focused test and apply the migration to the connected Supabase project**

Run: `npm test -- src/lib/notes/media.test.ts`

### Task 3: OneNote-style editor interaction

**Files:**
- Modify: `src/components/notes/NotesEditor.tsx`
- Modify: `src/app/globals.css`

**Interfaces:**
- Consumes `uploadNoteImage` and `insertAtSelection`.
- Produces title double-click editing and image paste/drop feedback in the editor UI.

- [ ] **Step 1: Add a failing helper test for image Markdown insertion**

```ts
expect(insertAtSelection("beforeafter", 6, 6, "![shot](user/note/shot.png)\n")).toEqual({ content: "before![shot](user/note/shot.png)\nafter", cursor: 34 });
```

- [ ] **Step 2: Run the focused test and verify it fails when the expected insertion contract is not met**

Run: `npm test -- src/lib/notes/media.test.ts`

- [ ] **Step 3: Implement the editor UI**

Replace the large top toolbar with a compact metadata row, place the title as the first editor item, and make it an input only after `onDoubleClick`. Add `onPaste`, `onDragOver`, `onDragLeave`, and `onDrop` to the text area. Remove `.editor-field:focus-visible` inset box-shadow and use `outline: none; box-shadow: none;`.

- [ ] **Step 4: Run all tests and build**

Run: `npm test`

Run: `npm run build`

### Task 4: Verify and release

**Files:**
- Modify: none

- [ ] **Step 1: Confirm the Storage bucket and policies through SQL**

```sql
select id, public, file_size_limit, allowed_mime_types from storage.buckets where id = 'note-images';
```

- [ ] **Step 2: Review the working tree and commit**

Run: `git diff --check`

Run: `git add src/lib/notes/media.ts src/lib/notes/media.test.ts src/lib/notes/NotesProvider.tsx src/components/notes/NotesEditor.tsx src/app/globals.css supabase/migrations/20260827000000_create_note_images_storage.sql docs/superpowers && git commit -m "feat: add OneNote-style note media"`

- [ ] **Step 3: Push the branch and deploy to Vercel production**

Run: `git push origin codex/onenote-notes-gantt-colors`

Run: `npx vercel --prod --yes`
