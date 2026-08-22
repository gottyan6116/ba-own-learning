import { describe, expect, it } from "vitest";
import { normalizeMindMapTree } from "./tree";

describe("normalizeMindMapTree", () => {
  it("connects existing orphan nodes to the root and lays out a readable hierarchy", () => {
    const graph = normalizeMindMapTree(
      [
        { id: "root", position: { x: 0, y: 0 }, data: { label: "Project" } },
        { id: "market", position: { x: 99, y: 99 }, data: { label: "Market" } },
        { id: "customer", position: { x: 99, y: 99 }, data: { label: "Customer" } },
      ],
      [{ id: "market-customer", source: "market", target: "customer" }],
    );

    expect(graph.edges).toEqual(expect.arrayContaining([
      expect.objectContaining({ source: "root", target: "market" }),
      expect.objectContaining({ source: "market", target: "customer" }),
    ]));
    expect(graph.nodes.find((node) => node.id === "customer")?.position.x).toBeGreaterThan(
      graph.nodes.find((node) => node.id === "market")!.position.x,
    );
  });
});
