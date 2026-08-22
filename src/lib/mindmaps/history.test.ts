import { describe, expect, it } from "vitest";
import { pushMindMapHistory, undoMindMapHistory } from "./history";

describe("mind map history", () => {
  it("returns the previous graph and removes it from the undo stack", () => {
    const initial = { nodes: [{ id: "root", position: { x: 0, y: 0 }, data: { label: "Root" } }], edges: [] };
    const changed = { nodes: [{ id: "root", position: { x: 0, y: 0 }, data: { label: "Renamed" } }], edges: [] };
    const history = pushMindMapHistory([], initial);

    const result = undoMindMapHistory(history);

    expect(result.snapshot).toEqual(initial);
    expect(result.history).toEqual([]);
    expect(changed.nodes[0].data.label).toBe("Renamed");
  });
});
