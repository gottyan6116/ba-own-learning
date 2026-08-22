import { describe, expect, it } from "vitest";
import { groupTasksForBoard, reorderTasksForBoard, type ProjectTask } from "./types";

const task = (id: string, status: ProjectTask["status"], sortOrder: number): ProjectTask => ({
  id,
  user_id: "user",
  project_id: "project",
  title: id,
  description: null,
  status,
  start_date: null,
  end_date: null,
  progress: 0,
  sort_order: sortOrder,
  created_at: "2026-08-22T00:00:00.000Z",
  updated_at: "2026-08-22T00:00:00.000Z",
});

describe("reorderTasksForBoard", () => {
  it("moves a card to a new column and assigns contiguous sort orders", () => {
    const result = reorderTasksForBoard(
      [task("a", "todo", 0), task("b", "todo", 1), task("c", "in_progress", 0)],
      "b",
      "in_progress",
      0,
    );

    expect(result.map((item) => [item.id, item.status, item.sort_order])).toEqual([
      ["a", "todo", 0],
      ["b", "in_progress", 0],
      ["c", "in_progress", 1],
    ]);
  });
});

describe("groupTasksForBoard", () => {
  it("groups tasks by board column and keeps each column sorted by sort_order", () => {
    const grouped = groupTasksForBoard([
      task("in-progress-last", "in_progress", 4),
      task("todo-last", "todo", 9),
      task("todo-first", "todo", 2),
      task("done", "done", 0),
    ]);

    expect(grouped.todo.map((item) => item.id)).toEqual(["todo-first", "todo-last"]);
    expect(grouped.in_progress.map((item) => item.id)).toEqual(["in-progress-last"]);
    expect(grouped.blocked).toEqual([]);
    expect(grouped.done.map((item) => item.id)).toEqual(["done"]);
  });
});
