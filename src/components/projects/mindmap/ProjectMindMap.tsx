"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
  type Viewport,
} from "@xyflow/react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Project } from "@/lib/projects/types";
import { createInitialMindMap, readMindMap } from "@/lib/mindmaps/types";
import { mindMapFromText } from "@/lib/mindmaps/text";
import { createChildInMindMap, normalizeMindMapTree } from "@/lib/mindmaps/tree";
import { pushMindMapHistory, undoMindMapHistory, type MindMapSnapshot } from "@/lib/mindmaps/history";

type MapNode = Node<{ label: string }>;
type MindMapNodeActions = { rename: (id: string, label: string) => void; addChild: (id: string) => void };
const MindMapNodeActionsContext = createContext<MindMapNodeActions | null>(null);

function LogicTreeNode({ id, data, selected }: { id: string; data: { label: string }; selected?: boolean }) {
  const actions = useContext(MindMapNodeActionsContext);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  useEffect(() => { if (!editing) setDraft(data.label); }, [data.label, editing]);
  const commit = () => {
    const next = draft.trim();
    if (next) actions?.rename(id, next);
    else setDraft(data.label);
    setEditing(false);
  };
  return (
    <div onDoubleClick={(event) => { event.stopPropagation(); setEditing(true); }} className={`group relative min-w-[160px] rounded-lg border-2 bg-white px-5 py-3 text-center text-[14px] font-medium shadow-sm ${selected ? "border-[var(--color-zenith)] ring-4 ring-blue-100" : "border-slate-300"}`}>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-white !bg-[var(--color-zenith)]" />
      {editing ? <input autoFocus value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={commit} onPointerDown={(event) => event.stopPropagation()} onDoubleClick={(event) => event.stopPropagation()} onKeyDown={(event) => { event.stopPropagation(); if (event.key === "Enter") event.currentTarget.blur(); if (event.key === "Escape") { setDraft(data.label); setEditing(false); } }} className="nodrag w-full border-0 bg-transparent p-0 text-center text-[14px] font-medium outline-none" /> : data.label}
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-white !bg-[var(--color-zenith)]" />
      <button type="button" title="子ノードを追加" onPointerDown={(event) => event.stopPropagation()} onClick={(event) => { event.stopPropagation(); actions?.addChild(id); }} className="nodrag absolute -right-8 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full border border-blue-200 bg-white text-[18px] leading-none text-[var(--color-zenith)] opacity-0 shadow-sm transition group-hover:opacity-100 hover:bg-blue-50 focus:opacity-100">＋</button>
    </div>
  );
}

export function ProjectMindMap({ project }: { project: Project }) {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const { user } = useAuth();
  const [mapId, setMapId] = useState<string | null>(null);
  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [viewport, setViewport] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [isNewMap, setIsNewMap] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sourceText, setSourceText] = useState("");
  const [showTextGenerator, setShowTextGenerator] = useState(false);
  const saveQueue = useRef(Promise.resolve());
  const graphRef = useRef<{ nodes: MapNode[]; edges: Edge[] }>({ nodes: [], edges: [] });
  const historyRef = useRef<MindMapSnapshot[]>([]);
  const nodeTypes = useMemo(() => ({ logic: LogicTreeNode }), []);

  const recordHistory = useCallback(() => {
    historyRef.current = pushMindMapHistory(historyRef.current, graphRef.current);
  }, []);
  const undo = useCallback(() => {
    const result = undoMindMapHistory(historyRef.current);
    if (!result.snapshot) return;
    historyRef.current = result.history;
    graphRef.current = { nodes: result.snapshot.nodes as MapNode[], edges: result.snapshot.edges as Edge[] };
    setNodes(graphRef.current.nodes);
    setEdges(graphRef.current.edges);
  }, []);

  useEffect(() => {
    if (!supabase || !user) return;
    let active = true;
    setReady(false);
    setError(null);
    const load = async () => {
      const { data, error: selectError } = await supabase
        .from("project_mind_maps")
        .select("*")
        .eq("project_id", project.id)
        .maybeSingle();
      if (!active) return;
      if (selectError) {
        setError(selectError.message);
        return;
      }
      const savedGraph = data
        ? readMindMap(data.nodes, data.edges, data.viewport, project.name)
        : createInitialMindMap(project.name);
      const normalized = normalizeMindMapTree(savedGraph.nodes, savedGraph.edges);
      const graph = { ...savedGraph, ...normalized };
      if (data) {
        setMapId(data.id);
        setIsNewMap(false);
      } else {
        const { data: created, error: insertError } = await supabase
          .from("project_mind_maps")
          .insert({ user_id: user.id, project_id: project.id, ...graph })
          .select()
          .single();
        if (!active) return;
        if (insertError || !created) {
          setError(insertError?.message ?? "マインドマップを作成できませんでした。");
          return;
        }
        setMapId(created.id);
        setIsNewMap(true);
      }
      setNodes(graph.nodes as MapNode[]);
      setEdges(graph.edges as Edge[]);
      graphRef.current = { nodes: graph.nodes as MapNode[], edges: graph.edges as Edge[] };
      historyRef.current = [];
      setViewport(graph.viewport);
      setReady(true);
    };
    void load();
    return () => { active = false; };
  }, [project.id, project.name, supabase, user]);

  useEffect(() => { graphRef.current = { nodes, edges }; }, [edges, nodes]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "z" || event.shiftKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      undo();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [undo]);

  useEffect(() => {
    if (!ready || !mapId || !supabase) return;
    const timer = setTimeout(() => {
      const snapshot = { nodes, edges, viewport };
      // React Flowの短い連続操作で古い保存が後から完了しないよう、書き込みを直列化する。
      saveQueue.current = saveQueue.current
        .catch(() => undefined)
        .then(async () => {
          const { error: saveError } = await supabase
            .from("project_mind_maps")
            .update(snapshot)
            .eq("id", mapId);
          if (saveError) setError(saveError.message);
        });
    }, 550);
    return () => clearTimeout(timer);
  }, [edges, mapId, nodes, ready, supabase, viewport]);

  const onNodesChange = useCallback((changes: NodeChange<MapNode>[]) => {
    const relevant = changes.filter((change) => !(change.type === "remove" && change.id === "root"));
    if (relevant.some((change) => change.type === "remove" || (change.type === "position" && change.dragging === false))) recordHistory();
    const nextNodes = applyNodeChanges(relevant, graphRef.current.nodes);
    const remaining = new Set(nextNodes.map((node) => node.id));
    const nextEdges = graphRef.current.edges.filter((edge) => remaining.has(edge.source) && remaining.has(edge.target));
    graphRef.current = { nodes: nextNodes, edges: nextEdges };
    setNodes(nextNodes); setEdges(nextEdges);
  }, [recordHistory]);
  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    if (changes.some((change) => change.type === "remove")) recordHistory();
    const nextEdges = applyEdgeChanges(changes, graphRef.current.edges);
    graphRef.current = { ...graphRef.current, edges: nextEdges };
    setEdges(nextEdges);
  }, [recordHistory]);
  const onConnect = useCallback((connection: Connection) => {
    if (!connection.source || !connection.target) return;
    recordHistory();
    const next = normalizeMindMapTree(graphRef.current.nodes, addEdge({ ...connection, type: "smoothstep" }, graphRef.current.edges));
    graphRef.current = { nodes: next.nodes as MapNode[], edges: next.edges as Edge[] };
    setNodes(next.nodes as MapNode[]);
    setEdges(next.edges as Edge[]);
  }, [recordHistory]);
  const addChildNode = useCallback((parentId = selectedNodeId ?? "root") => {
    recordHistory();
    const next = createChildInMindMap(graphRef.current.nodes, graphRef.current.edges, parentId);
    graphRef.current = { nodes: next.nodes as MapNode[], edges: next.edges as Edge[] };
    setNodes(next.nodes as MapNode[]);
    setEdges(next.edges as Edge[]);
    setSelectedNodeId(next.childId);
  }, [recordHistory, selectedNodeId]);
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const updateNodeLabel = useCallback((id: string, label: string) => {
    const nextLabel = label.trim();
    if (!nextLabel || graphRef.current.nodes.find((node) => node.id === id)?.data.label === nextLabel) return;
    recordHistory();
    const nextNodes = graphRef.current.nodes.map((node) => node.id === id ? { ...node, data: { ...node.data, label: nextLabel } } : node);
    graphRef.current = { ...graphRef.current, nodes: nextNodes };
    setNodes(nextNodes);
  }, [recordHistory]);
  const updateSelectedLabel = (label: string) => { if (selectedNodeId) updateNodeLabel(selectedNodeId, label); };
  const generateFromText = () => {
    recordHistory();
    const generated = mindMapFromText(sourceText, project.name || "プロジェクト");
    const normalized = normalizeMindMapTree(generated.nodes, generated.edges);
    graphRef.current = { nodes: normalized.nodes as MapNode[], edges: normalized.edges as Edge[] };
    setNodes(normalized.nodes as MapNode[]); setEdges(normalized.edges as Edge[]); setViewport(generated.viewport); setSelectedNodeId("root"); setShowTextGenerator(false);
  };
  const nodeActions = useMemo(() => ({ rename: updateNodeLabel, addChild: addChildNode }), [addChildNode, updateNodeLabel]);
  const exportMarkdown = () => {
    const bySource = new Map(edges.map((edge) => [edge.target, edge.source]));
    const lines = nodes.map((node) => { let depth = 0; let parent = bySource.get(node.id); while (parent) { depth += 1; parent = bySource.get(parent); } return `${"  ".repeat(depth)}- ${node.data.label}`; });
    const blob = new Blob([lines.join("\n")], { type: "text/markdown" }); const href = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = href; link.download = `${project.name || "mindmap"}.md`; link.click(); URL.revokeObjectURL(href);
  };

  if (error) return <div className="px-6 py-10 text-[14px] text-[var(--color-danger)]">マインドマップを取得できませんでした。（{error}）</div>;
  if (!ready) return <div className="px-6 py-10 text-[14px] text-[var(--color-ink-muted)]">マインドマップを読み込んでいます。</div>;

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--color-line)] px-5 py-3 sm:px-6">
        <div><h2 className="text-[16px] font-semibold text-[var(--color-ink)]">マインドマップ</h2><p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">選択した項目から子要素を派生し、ロジックツリーとして整理します。</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setShowTextGenerator((value) => !value)} className="h-9 cursor-pointer rounded-[4px] border px-3 text-[13px]">文章から生成</button><button type="button" onClick={exportMarkdown} className="h-9 cursor-pointer rounded-[4px] border px-3 text-[13px]">Markdown出力</button><button type="button" onClick={() => addChildNode()} className="h-9 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-3 text-[13px] font-medium text-white">＋ 子ノード</button></div>
      </div>
      {showTextGenerator && <div className="border-b bg-[var(--color-surface-sunken)] px-5 py-3"><textarea className="field min-h-24 py-2" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="見出しと字下げで入力（例：市場 ↵  顧客）" /><button className="mt-2 rounded bg-[var(--color-zenith)] px-3 py-2 text-[12px] text-white" onClick={generateFromText}>この文章からマップを作成</button></div>}
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1" tabIndex={0} onKeyDown={(event) => { if ((event.key === "Tab" || event.key === "Enter") && event.target === event.currentTarget) { event.preventDefault(); addChildNode(); } }}>
          <MindMapNodeActionsContext.Provider value={nodeActions}><ReactFlow
            nodes={nodes}
            edges={edges}
            defaultViewport={viewport}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedNodeId(node.id)}
            onMoveEnd={(_, nextViewport) => setViewport(nextViewport)}
            deleteKeyCode={["Backspace", "Delete"]}
            fitView={isNewMap}
            nodeTypes={nodeTypes}
            defaultEdgeOptions={{ type: "smoothstep", style: { stroke: "#2f6fab", strokeWidth: 2 } }}
          >
            <Background gap={18} size={1} color="var(--color-line-faint)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="var(--color-zenith)" />
          </ReactFlow></MindMapNodeActionsContext.Provider>
        </div>
        <aside className="hidden w-[260px] shrink-0 border-l border-[var(--color-line)] bg-white p-4 lg:block">
          <h3 className="label-caps">選択中のノード</h3>
          {selectedNode ? <><label className="mt-3 block"><span className="mb-1.5 block text-[13px] text-[var(--color-ink-secondary)]">名称</span><input value={selectedNode.data.label} onChange={(event) => updateSelectedLabel(event.target.value)} className="field" /></label><button type="button" onClick={() => addChildNode(selectedNode.id)} className="mt-3 w-full rounded-[4px] bg-[var(--color-zenith)] px-3 py-2 text-[13px] font-medium text-white">この項目から派生</button><p className="mt-4 text-[12px] leading-5 text-[var(--color-ink-muted)]">ノードをダブルクリックすると直接編集できます。右端の＋で子要素を追加し、Ctrl/Cmd + Zで直前の操作を戻せます。</p></> : <p className="mt-3 text-[13px] leading-6 text-[var(--color-ink-muted)]">ノードを選択すると名称を編集できます。</p>}
        </aside>
      </div>
    </div>
  );
}
