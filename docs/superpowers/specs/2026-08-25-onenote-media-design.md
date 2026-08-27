# OneNote-Style Note Editing and Image Paste Design

## Goal

Make an existing note feel like a OneNote page: its title is edited in place, focused text has no decorative vertical line, and screenshots can be pasted or dropped into the page.

## Scope

- A saved note title becomes an inline text input only after double-clicking the title. `Enter` saves, `Escape` restores the previous title, and leaving the input saves a non-empty trimmed value.
- The current `.editor-field:focus-visible` inset blue line is removed so clicking the body changes no visible border or line.
- The note editor accepts image files from clipboard paste and drag-and-drop. It shows a compact drop state while an image drag is over the writing area.
- Images are stored in a private Supabase Storage bucket named `note-images`, at `{user_id}/{note_id}/{uuid}.{extension}`. Storage RLS permits only the object owner to read, insert, update, and delete their own prefix.
- Each successful upload appends a Markdown image line, `![filename](storage-path)`, at the current caret position. Image URLs are resolved to short-lived signed URLs when rendered in the editor, so the source path is never exposed as a public URL.
- Existing note body text remains plain text and requires no data migration. New image lines render as images; other Markdown remains text.

## Architecture

`NoteMedia` is a focused client component responsible for validating images, uploading them to Storage, and returning a Markdown image token. `NotesEditor` owns the text, title, autosave and caret insertion, and renders the note body as an editable textarea plus a preview strip for detected image tokens. The Notes provider gains a single `uploadNoteImage(noteId, file)` function that authenticates the user and returns the private storage path.

The Storage bucket is private and has RLS policies tied to the first path segment (the authenticated user UUID). Images accept `image/png`, `image/jpeg`, `image/webp`, and `image/gif`, with a maximum size of 10 MB per image. Invalid or failed uploads leave the note unchanged and show an inline Japanese error message.

## Components and Data Flow

1. User double-clicks the title in `NotesEditor`; local title state becomes an input. Title saves through the existing `updateNote` provider operation.
2. User pastes or drops an image. `NotesEditor` prevents the browser's default file-navigation behavior and hands the first supported file to `uploadNoteImage`.
3. The provider uploads the file to `note-images` and returns its storage path.
4. `NotesEditor` inserts a Markdown image token at the textarea caret, updates local content, and uses the existing debounced `updateNote` save flow.
5. `NoteImagePreview` scans these tokens, obtains signed URLs from Supabase Storage, and displays them below the text editor. If a signed URL cannot be loaded, only that image shows an error state.

## Error Handling and Constraints

- Do not accept non-image files, images over 10 MB, or unsupported MIME types.
- Disable concurrent upload initiation while one image is uploading; retain the current note content.
- Keep the Storage bucket private; do not use public buckets or public URLs.
- Do not add a rich-text editor dependency or change the `notes` database table schema.
- Do not remove the existing plain-text autosave, association controls, pinning, or deletion behavior.

## Verification

- Unit-test image validation and Markdown token parsing/insertion helpers.
- Build the application with `npm run build`.
- Manually verify title double-click edit, title keyboard behavior, paste/drop insertion, the absence of a focus line, and that image paths are user-scoped.
