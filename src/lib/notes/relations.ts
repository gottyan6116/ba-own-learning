import { getSystemCategory } from "@/data";
import type { Note } from "./types";
import { sortNotes } from "./types";

/**
 * System Category に紐づくメモ。
 *
 * そのカテゴリに直接紐づいたメモに加えて、配下の製品に紐づいたメモも拾う。
 * 「MA を復習する」ときに Marketo のメモが出てこないのは不便なため。
 * どちらに紐づいているかは一覧側でタグ表示して区別する。
 */
export function notesForSystem(notes: Note[], systemId: string): Note[] {
  const system = getSystemCategory(systemId);
  const productIds = new Set(system?.products ?? []);
  return sortNotes(
    notes.filter(
      (note) =>
        note.system_category === systemId ||
        (note.product_key != null && productIds.has(note.product_key)),
    ),
  );
}

export function notesForProduct(notes: Note[], productId: string): Note[] {
  return sortNotes(notes.filter((note) => note.product_key === productId));
}

export function notesForArea(notes: Note[], areaId: string): Note[] {
  return sortNotes(notes.filter((note) => note.business_area === areaId));
}

export function notesForProject(notes: Note[], projectId: string): Note[] {
  return sortNotes(notes.filter((note) => note.project_id === projectId));
}

export function countNotesForSystem(notes: Note[], systemId: string): number {
  return notesForSystem(notes, systemId).length;
}
