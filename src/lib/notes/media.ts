export const NOTE_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

const SUPPORTED_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

export type NoteImageValidation = { ok: true } | { ok: false; message: string };

export function validateNoteImage(file: File): NoteImageValidation {
  if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, message: "画像ファイル（PNG / JPEG / WebP / GIF）を選択してください。" };
  }
  if (file.size > NOTE_IMAGE_MAX_BYTES) {
    return { ok: false, message: "画像は10MB以下にしてください。" };
  }
  return { ok: true };
}

export function noteImagePath(userId: string, noteId: string, extension: string, id: string) {
  return `${userId}/${noteId}/${id}.${extension}`;
}

export function insertAtSelection(content: string, start: number, end: number, insertion: string) {
  return {
    content: `${content.slice(0, start)}${insertion}${content.slice(end)}`,
    cursor: start + insertion.length,
  };
}

export function noteImageMarkdown(alt: string, path: string) {
  return `![${alt.replace(/[\[\]]/g, "")}](${path})\n`;
}

export function extensionForImage(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  return file.type.split("/")[1] ?? "png";
}
