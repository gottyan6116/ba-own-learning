import type { MindMapEdge, MindMapNode } from "./types";

type TreeGraph = { nodes: MindMapNode[]; edges: MindMapEdge[] };

function createsCycle(source: string, target: string, edges: MindMapEdge[]) {
  const children = new Map<string, string[]>();
  for (const edge of edges) children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  const visit = (id: string, seen = new Set<string>()): boolean => {
    if (id === source) return true;
    if (seen.has(id)) return false;
    seen.add(id);
    return (children.get(id) ?? []).some((child) => visit(child, seen));
  };
  return visit(target);
}

/**
 * Makes persisted maps behave as a logic tree. Old loose nodes are retained,
 * but become root children so users never reopen an unintelligible canvas.
 */
export function normalizeMindMapTree(inputNodes: MindMapNode[], inputEdges: MindMapEdge[]): TreeGraph {
  const nodes = inputNodes.map((node) => ({ ...node, type: "logic", position: { ...node.position }, data: { ...node.data } }));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const rootId = nodeIds.has("root") ? "root" : nodes[0]?.id;
  if (!rootId) return { nodes: [], edges: [] };

  const targets = new Set<string>();
  const edges: MindMapEdge[] = [];
  for (const edge of inputEdges) {
    if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target) || edge.source === edge.target || targets.has(edge.target)) continue;
    if (createsCycle(edge.source, edge.target, edges)) continue;
    targets.add(edge.target);
    edges.push({ ...edge, type: "smoothstep", style: { stroke: "#2f6fab", strokeWidth: 2 } });
  }

  for (const node of nodes) {
    if (node.id === rootId || targets.has(node.id)) continue;
    edges.push({
      id: `edge-${rootId}-${node.id}`,
      source: rootId,
      target: node.id,
      type: "smoothstep",
      style: { stroke: "#2f6fab", strokeWidth: 2 },
    });
    targets.add(node.id);
  }

  const children = new Map<string, string[]>();
  for (const edge of edges) children.set(edge.source, [...(children.get(edge.source) ?? []), edge.target]);
  const byId = new Map(nodes.map((node) => [node.id, node]));
  let row = 0;
  const place = (id: string, depth: number, seen = new Set<string>()): number => {
    if (seen.has(id)) return row * 112;
    seen.add(id);
    const childIds = children.get(id) ?? [];
    const childRows = childIds.map((childId) => place(childId, depth + 1, seen));
    const y = childRows.length ? childRows.reduce((sum, value) => sum + value, 0) / childRows.length : row++ * 112;
    const node = byId.get(id);
    if (node) node.position = { x: depth * 270, y };
    return y;
  };
  place(rootId, 0);

  return { nodes, edges };
}

export function createChildInMindMap(
  inputNodes: MindMapNode[],
  inputEdges: MindMapEdge[],
  parentId: string,
  label = "新しい項目",
): TreeGraph & { childId: string } {
  const graph = normalizeMindMapTree(inputNodes, inputEdges);
  const childId = crypto.randomUUID();
  const nodes = [...graph.nodes, { id: childId, type: "logic", position: { x: 0, y: 0 }, data: { label } }];
  const edges = [...graph.edges, {
    id: `edge-${parentId}-${childId}`,
    source: parentId,
    target: childId,
    type: "smoothstep",
    style: { stroke: "#2f6fab", strokeWidth: 2 },
  }];
  return { ...normalizeMindMapTree(nodes, edges), childId };
}
