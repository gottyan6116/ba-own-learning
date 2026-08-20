"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useRef } from "react";
import { getAreaForSystem, getAreasForProduct } from "@/data";
import { useKnowledgeView } from "@/lib/knowledge/KnowledgeViewProvider";
import { areaClass } from "@/components/ui/primitives";
import { SystemDetail } from "./SystemDetail";
import { ProductDetail } from "./ProductDetail";

/**
 * Knowledge Map の詳細は、常にこの1枚のモーダルの中で切り替わる。
 * ページ遷移させないのは、「地図のどこを見ているか」を失わせないため。
 *
 * ESC / focus trap / aria / スクロールロックは Radix Dialog に任せる
 * （自前実装よりアクセシビリティの取りこぼしが少ない）。
 */
export function KnowledgeModal() {
  const { current, isOpen, close, stack } = useKnowledgeView();
  const scrollRef = useRef<HTMLDivElement>(null);

  // 中身を差し替えたら本文は先頭から読ませる
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [stack.length, current?.id]);

  const areaId = current
    ? current.type === "system"
      ? (getAreaForSystem(current.id)?.id ?? null)
      : (getAreasForProduct(current.id)[0]?.id ?? null)
    : null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && close()}>
      <Dialog.Portal>
        <Dialog.Overlay className="modal-overlay fixed inset-0 z-40 bg-[rgb(22_25_31_/_0.32)]" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center sm:p-6"
          style={{ pointerEvents: "none" }}
        >
          <div
            className={`modal-panel ${areaClass(areaId)} pointer-events-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-[1040px] flex-col overflow-hidden rounded-[10px] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-modal)] sm:max-h-[86dvh]`}
          >
            {/* accent rule — どの業務領域の話かを一目で示す */}
            <div aria-hidden="true" className="h-[3px] shrink-0 bg-[var(--area-accent)]" />

            <div className="relative min-h-0 flex-1 overflow-y-auto scroll-area" ref={scrollRef}>
              <Dialog.Close
                aria-label="閉じる"
                className="absolute right-3 top-3 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-[4px] text-[var(--color-ink-muted)] transition-colors duration-150 hover:bg-[var(--color-surface-sunken)] hover:text-[var(--color-ink)]"
              >
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                  <path
                    d="M1.5 1.5L13.5 13.5M13.5 1.5L1.5 13.5"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                  />
                </svg>
              </Dialog.Close>

              {current?.type === "system" && <SystemDetail systemId={current.id} />}
              {current?.type === "product" && <ProductDetail productId={current.id} />}
            </div>

            <footer className="flex shrink-0 items-center justify-between border-t border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-6 py-2.5 text-[12px] text-[var(--color-ink-muted)] sm:px-8">
              <span>
                <kbd className="rounded-[3px] border border-[var(--color-line-strong)] bg-white px-1.5 py-0.5 font-sans text-[11px]">
                  Esc
                </kbd>
                <span className="ml-2">で閉じる</span>
              </span>
              <span>Business Knowledge System</span>
            </footer>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
