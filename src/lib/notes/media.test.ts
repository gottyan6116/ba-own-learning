import { describe, expect, it } from "vitest";
import { insertAtSelection, validateNoteImage } from "./media";

describe("note media helpers", () => {
  it("accepts supported screenshots", () => {
    const file = new File(["x"], "clip.png", { type: "image/png" });
    expect(validateNoteImage(file)).toEqual({ ok: true });
  });

  it("rejects non-image files", () => {
    const file = new File(["x"], "clip.pdf", { type: "application/pdf" });
    expect(validateNoteImage(file)).toEqual({
      ok: false,
      message: "画像ファイル（PNG / JPEG / WebP / GIF）を選択してください。",
    });
  });

  it("rejects images larger than 10 MB", () => {
    const file = new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.png", { type: "image/png" });
    expect(validateNoteImage(file)).toEqual({ ok: false, message: "画像は10MB以下にしてください。" });
  });

  it("inserts media text at the current selection", () => {
    expect(insertAtSelection("beforeafter", 6, 6, "![shot](user/note/shot.png)\n")).toEqual({
      content: "before![shot](user/note/shot.png)\nafter",
      cursor: 34,
    });
  });
});
