import { describe, expect, it } from "vitest";
import { resolveGanttBarClass } from "./types";

describe("resolveGanttBarClass", () => {
  it("uses the current status color when a task has no chosen color", () => {
    expect(resolveGanttBarClass(null, "todo")).toBe("bg-[var(--color-line-strong)]");
  });

  it("uses the chosen color instead of the status color", () => {
    expect(resolveGanttBarClass("purple", "done")).toBe("bg-violet-600");
  });
});
