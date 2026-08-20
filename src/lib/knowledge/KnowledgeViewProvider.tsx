"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Knowledge Map の詳細表示は「ページ遷移しない」ことが要件。
 *
 * 開いている対象をスタックで持つことで、MA → Marketo → （戻る）→ MA を
 * 同一モーダル内で表現する。Nested Modal は作らない：地図のどこにいるかの
 * 認知を壊さないため、モーダルは常に1枚。
 */
export type KnowledgeView =
  | { type: "system"; id: string }
  | { type: "product"; id: string };

interface KnowledgeViewContextValue {
  stack: KnowledgeView[];
  current: KnowledgeView | null;
  isOpen: boolean;
  openSystem: (id: string) => void;
  openProduct: (id: string) => void;
  /** 同じモーダル内で中身を差し替える（履歴を積む） */
  pushProduct: (id: string) => void;
  pushSystem: (id: string) => void;
  back: () => void;
  close: () => void;
}

const KnowledgeViewContext = createContext<KnowledgeViewContextValue | null>(null);

export function KnowledgeViewProvider({ children }: { children: ReactNode }) {
  const [stack, setStack] = useState<KnowledgeView[]>([]);

  const openSystem = useCallback((id: string) => setStack([{ type: "system", id }]), []);
  const openProduct = useCallback((id: string) => setStack([{ type: "product", id }]), []);
  const pushProduct = useCallback(
    (id: string) => setStack((prev) => [...prev, { type: "product", id }]),
    [],
  );
  const pushSystem = useCallback(
    (id: string) => setStack((prev) => [...prev, { type: "system", id }]),
    [],
  );
  const back = useCallback(() => setStack((prev) => (prev.length > 1 ? prev.slice(0, -1) : prev)), []);
  const close = useCallback(() => setStack([]), []);

  const value = useMemo<KnowledgeViewContextValue>(
    () => ({
      stack,
      current: stack.length > 0 ? stack[stack.length - 1] : null,
      isOpen: stack.length > 0,
      openSystem,
      openProduct,
      pushProduct,
      pushSystem,
      back,
      close,
    }),
    [stack, openSystem, openProduct, pushProduct, pushSystem, back, close],
  );

  return <KnowledgeViewContext.Provider value={value}>{children}</KnowledgeViewContext.Provider>;
}

export function useKnowledgeView(): KnowledgeViewContextValue {
  const context = useContext(KnowledgeViewContext);
  if (!context) throw new Error("useKnowledgeView must be used inside <KnowledgeViewProvider>");
  return context;
}
