"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  Background,
  Controls,
  MiniMap,
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

type MapNode = Node<{ label: string }>;

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
      const graph = data
        ? readMindMap(data.nodes, data.edges, data.viewport, project.name)
        : createInitialMindMap(project.name);
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
      setViewport(graph.viewport);
      setReady(true);
    };
    void load();
    return () => { active = false; };
  }, [project.id, project.name, supabase, user]);

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
    setNodes((current) => applyNodeChanges(changes, current));
  }, []);
  const onEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
    setEdges((current) => applyEdgeChanges(changes, current));
  }, []);
  const onConnect = useCallback((connection: Connection) => {
    setEdges((current) => addEdge({ ...connection, type: "smoothstep" }, current));
  }, []);
  const addNode = () => {
    const id = crypto.randomUUID();
    setNodes((current) => [
      ...current,
      { id, position: { x: 180 + (current.length % 3) * 150, y: 100 + current.length * 55 }, data: { label: "新しい項目" } },
    ]);
    setSelectedNodeId(id);
  };
  const selectedNode = nodes.find((node) => node.id === selectedNodeId) ?? null;
  const updateSelectedLabel = (label: string) => {
    if (!selectedNodeId) return;
    setNodes((current) => current.map((node) => node.id === selectedNodeId ? { ...node, data: { ...node.data, label } } : node));
  };
  const generateFromText = () => {
    const generated = mindMapFromText(sourceText, project.name || "プロジェクト");
    setNodes(generated.nodes as MapNode[]); setEdges(generated.edges as Edge[]); setViewport(generated.viewport); setSelectedNodeId("root"); setShowTextGenerator(false);
  };
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
        <div><h2 className="text-[16px] font-semibold text-[var(--color-ink)]">マインドマップ</h2><p className="mt-0.5 text-[12px] text-[var(--color-ink-muted)]">ノードをつなぎ、ドラッグして考えを整理します。</p></div>
        <div className="flex gap-2"><button type="button" onClick={() => setShowTextGenerator((value) => !value)} className="h-9 cursor-pointer rounded-[4px] border px-3 text-[13px]">文章から生成</button><button type="button" onClick={exportMarkdown} className="h-9 cursor-pointer rounded-[4px] border px-3 text-[13px]">Markdown出力</button><button type="button" onClick={addNode} className="h-9 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-3 text-[13px] font-medium text-white">＋ ノード</button></div>
      </div>
      {showTextGenerator && <div className="border-b bg-[var(--color-surface-sunken)] px-5 py-3"><textarea className="field min-h-24 py-2" value={sourceText} onChange={(event) => setSourceText(event.target.value)} placeholder="見出しと字下げで入力（例：市場 ↵  顧客）" /><button className="mt-2 rounded bg-[var(--color-zenith)] px-3 py-2 text-[12px] text-white" onClick={generateFromText}>この文章からマップを作成</button></div>}
      <div className="flex min-h-0 flex-1">
        <div className="min-h-0 min-w-0 flex-1">
          <ReactFlow
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
          >
            <Background gap={18} size={1} color="var(--color-line-faint)" />
            <Controls showInteractive={false} />
            <MiniMap pannable zoomable nodeColor="var(--color-zenith)" />
          </ReactFlow>
        </div>
        <aside className="hidden w-[260px] shrink-0 border-l border-[var(--color-line)] bg-white p-4 lg:block">
          <h3 className="label-caps">選択中のノード</h3>
          {selectedNode ? <label className="mt-3 block"><span className="mb-1.5 block text-[13px] text-[var(--color-ink-secondary)]">名称</span><input value={selectedNode.data.label} onChange={(event) => updateSelectedLabel(event.target.value)} className="field" /></label> : <p className="mt-3 text-[13px] leading-6 text-[var(--color-ink-muted)]">ノードを選択すると名称を編集できます。</p>}
        </aside>
      </div>
    </div>
  );
}
