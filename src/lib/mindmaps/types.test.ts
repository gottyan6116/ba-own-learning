import { describe, expect, it } from "vitest";
import { createInitialMindMap, readMindMap } from "./types";

describe("readMindMap", () => {
  it("keeps valid persisted nodes and edges while using a safe viewport", () => {
    expect(
      readMindMap(
        [{ id: "root", type: "default", position: { x: 10, y: 20 }, data: { label: "中心" } }],
        [{ id: "e1", source: "root", target: "root" }],
        { x: 5, y: 8, zoom: 1.2 },
        "Fallback",
      ),
    ).toEqual({
      nodes: [{ id: "root", type: "default", position: { x: 10, y: 20 }, data: { label: "中心" } }],
      edges: [{ id: "e1", source: "root", target: "root" }],
      viewport: { x: 5, y: 8, zoom: 1.2 },
    });
  });

  it("creates a centered root node when persisted graph data is invalid", () => {
    expect(readMindMap(null, null, null, "案件A")).toEqual(createInitialMindMap("案件A"));
  });
});
