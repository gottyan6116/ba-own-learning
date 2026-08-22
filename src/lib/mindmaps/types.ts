export interface MindMapNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: { label: string };
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  [key: string]: unknown;
}

export interface MindMapViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  viewport: MindMapViewport;
}

export function createInitialMindMap(projectName: string): MindMapData {
  return {
    nodes: [{ id: "root", type: "default", position: { x: 0, y: 0 }, data: { label: projectName || "プロジェクト" } }],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function readNodes(value: unknown): MindMapNode[] | null {
  if (!Array.isArray(value)) return null;
  const nodes: MindMapNode[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || !isRecord(item.position) || !isRecord(item.data)) continue;
    if (typeof item.position.x !== "number" || typeof item.position.y !== "number" || typeof item.data.label !== "string") continue;
    nodes.push({
      id: item.id,
      ...(typeof item.type === "string" ? { type: item.type } : {}),
      position: { x: item.position.x, y: item.position.y },
      data: { label: item.data.label },
    });
  }
  return nodes.length > 0 ? nodes : null;
}

function readEdges(value: unknown): MindMapEdge[] | null {
  if (!Array.isArray(value)) return null;
  const edges: MindMapEdge[] = [];
  for (const item of value) {
    if (!isRecord(item) || typeof item.id !== "string" || typeof item.source !== "string" || typeof item.target !== "string") continue;
    edges.push({ ...item, id: item.id, source: item.source, target: item.target });
  }
  return edges;
}

function readViewport(value: unknown): MindMapViewport | null {
  if (!isRecord(value) || typeof value.x !== "number" || typeof value.y !== "number" || typeof value.zoom !== "number") return null;
  return { x: value.x, y: value.y, zoom: value.zoom };
}

/** DBのjsonbをグラフ画面へ渡す前に、描画に必要な最小形だけに絞る。 */
export function readMindMap(nodes: unknown, edges: unknown, viewport: unknown, projectName: string): MindMapData {
  const safeNodes = readNodes(nodes);
  if (!safeNodes) return createInitialMindMap(projectName);
  return {
    nodes: safeNodes,
    edges: readEdges(edges) ?? [],
    viewport: readViewport(viewport) ?? { x: 0, y: 0, zoom: 1 },
  };
}
