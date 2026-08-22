import type { MindMapEdge, MindMapNode } from "./types";

export type MindMapSnapshot = { nodes: MindMapNode[]; edges: MindMapEdge[] };

function copy(snapshot: MindMapSnapshot): MindMapSnapshot {
  return {
    nodes: snapshot.nodes.map((node) => ({ ...node, position: { ...node.position }, data: { ...node.data } })),
    edges: snapshot.edges.map((edge) => ({ ...edge })),
  };
}

/** Keeps a small, immutable stack of graph states for Ctrl/Cmd + Z. */
export function pushMindMapHistory(history: MindMapSnapshot[], snapshot: MindMapSnapshot, limit = 50): MindMapSnapshot[] {
  return [...history, copy(snapshot)].slice(-limit);
}

export function undoMindMapHistory(history: MindMapSnapshot[]): { snapshot: MindMapSnapshot | null; history: MindMapSnapshot[] } {
  if (history.length === 0) return { snapshot: null, history };
  return { snapshot: copy(history[history.length - 1]), history: history.slice(0, -1) };
}
