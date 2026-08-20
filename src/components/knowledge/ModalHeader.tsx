"use client";

import * as Dialog from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
import { AreaBadge } from "@/components/ui/primitives";

/**
 * モーダルの上部は、常に「どこの何を見ているか」から始める。
 * Business Area → 種別 → 名称 → 一言説明 の順に読ませる。
 */
export function ModalHeader({
  kind,
  areaId,
  title,
  titleSuffix,
  description,
  meta,
  breadcrumb,
}: {
  kind: string;
  areaId: string | null;
  title: string;
  titleSuffix?: string;
  description: string;
  meta?: ReactNode;
  /** 「← MA に戻る」など、モーダル内の遷移元 */
  breadcrumb?: ReactNode;
}) {
  return (
    <header className="border-b border-[var(--color-line)] px-6 pt-6 pb-5 sm:px-8 sm:pt-7">
      {breadcrumb}
      <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
        <AreaBadge areaId={areaId} />
        <span aria-hidden="true" className="text-[var(--color-line-strong)]">
          /
        </span>
        <span className="label-caps">{kind}</span>
      </div>

      <Dialog.Title className="tracking-display text-[26px] font-bold leading-tight text-[var(--color-ink)] sm:text-[30px]">
        {title}
        {titleSuffix && titleSuffix !== title && (
          <span className="ml-3 align-middle text-[16px] font-normal text-[var(--color-ink-secondary)] sm:text-[18px]">
            {titleSuffix}
          </span>
        )}
      </Dialog.Title>

      {meta && <p className="mt-1 text-[13px] text-[var(--color-ink-muted)]">{meta}</p>}

      <Dialog.Description className="mt-3 max-w-[70ch] text-[15px] leading-7 text-[var(--color-ink-secondary)]">
        {description}
      </Dialog.Description>
    </header>
  );
}
