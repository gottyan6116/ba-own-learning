import type { MindMapData, MindMapEdge, MindMapNode } from "./types";

/** Converts indented text into a portable tree without trusting external markup. */
export function mindMapFromText(text: string, rootLabel: string): MindMapData {
  const lines = text.split(/\r?\n/).map((line) => ({ depth: Math.floor((line.match(/^\s*/)?.[0].length ?? 0) / 2), label: line.trim().replace(/^[-*•]\s*/, "") })).filter((line) => line.label).slice(0, 80);
  const nodes: MindMapNode[] = [{ id: "root", position: { x: 0, y: 0 }, data: { label: rootLabel || "マインドマップ" } }];
  const edges: MindMapEdge[] = []; const parents = ["root"];
  lines.forEach((line, index) => { const id = `text-${index}`; const parent = parents[Math.min(line.depth, parents.length - 1)] ?? "root"; nodes.push({ id, position: { x: (line.depth + 1) * 240, y: index * 90 }, data: { label: line.label } }); edges.push({ id: `edge-${parent}-${id}`, source: parent, target: id }); parents[line.depth + 1] = id; parents.length = line.depth + 2; });
  return { nodes, edges, viewport: { x: 0, y: 0, zoom: 1 } };
}
