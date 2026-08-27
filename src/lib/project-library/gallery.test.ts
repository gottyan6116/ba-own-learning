import { describe, expect, it } from "vitest";
import { nextGalleryIndex } from "./gallery";

describe("nextGalleryIndex", () => {
  it("moves to adjacent images without wrapping", () => {
    expect(nextGalleryIndex(1, 1, 3)).toBe(2);
    expect(nextGalleryIndex(1, -1, 3)).toBe(0);
    expect(nextGalleryIndex(0, -1, 3)).toBe(0);
    expect(nextGalleryIndex(2, 1, 3)).toBe(2);
  });
});
