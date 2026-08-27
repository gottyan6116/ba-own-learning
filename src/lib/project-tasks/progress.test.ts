import { describe, expect, it } from "vitest";
import {
  normalizeTaskDraftForStatus,
  reorderTasksForBoard,
  summarizeTaskProgress,
  type ProjectTask,
} from "./types";

const task = (
  id: string,
  status: ProjectTask["status"],
  progress: number,
): ProjectTask => ({
  id,
  user_id: "user",
  project_id: "project",
  title: id,
  description: null,
  status,
  start_date: null,
  end_date: null,
  progress,
  bar_color: null,
  sort_order: 0,
  created_at: "2026-08-27T00:00:00.000Z",
  updated_at: "2026-08-27T00:00:00.000Z",
});

describe("summarizeTaskProgress", () => {
  it("uses the completed-task fraction for the overview percentage", () => {
    const summary = summarizeTaskProgress([
      task("done-1", "done", 100),
      task("done-2", "done", 100),
      task("done-3", "done", 100),
      task("done-4", "done", 100),
      task("open-1", "in_progress", 25),
      task("open-2", "todo", 0),
      task("open-3", "blocked", 0),
    ]);

    expect(summary.done).toBe(4);
    expect(summary.total).toBe(7);
    expect(summary.completionPercent).toBe(57);
  });
});

describe("task completion progress synchronization", () => {
  it("sets progress to 100 when a manual status update marks a task done", () => {
    expect(normalizeTaskDraftForStatus({ status: "done", progress: 50 })).toEqual({
      status: "done",
      progress: 100,
    });
  });

  it("keeps progress unchanged when a completed task returns to another status", () => {
    expect(normalizeTaskDraftForStatus({ status: "in_progress", progress: 100 })).toEqual({
      status: "in_progress",
      progress: 100,
    });
  });

  it("sets progress to 100 when drag and drop moves a task into Done", () => {
    const result = reorderTasksForBoard([task("a", "in_progress", 50)], "a", "done", 0);

    expect(result[0]).toMatchObject({ status: "done", progress: 100 });
  });
});
