"use client";

import { businessAreas, getProductsByArea, getSystemsByArea } from "@/data";
import { useNotes } from "@/lib/notes/NotesProvider";
import { countNotesForSystem } from "@/lib/notes/relations";
import { areaClass } from "@/components/ui/primitives";
import { SystemCategoryButton } from "./SystemCategoryButton";
import { ProductListItem } from "./ProductListItem";

/**
 * このアプリの本体。
 *
 * 縦に読むと Business Process → System Category → Representative Product、
 * 横に読むと会社の業務の流れ（経営 → マーケ → 営業 → デリバリー →
 * カスタマー → 管理）になるように、1枚の表として構成している。
 *
 * カードを6枚並べるのではなく「1枚のシート＋色の付いた表頭」にしているのは、
 * 列が上から下までつながって見えることが、この地図の読み方そのものだから。
 *
 * Desktop（lg 以上）は6列。それ未満は縮小せず縦に積む。
 * 6列を無理に縮めると略称も日本語名も読めなくなり、地図の意味が消える。
 */
export function KnowledgeMap() {
  const { notes } = useNotes();
  const counts = (systemId: string) => countNotesForSystem(notes, systemId);

  return (
    <div>
      {/* ── Desktop: 6列の表 ──────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="overflow-hidden rounded-[8px] border border-[var(--color-line)] bg-[var(--color-surface)] shadow-[var(--shadow-panel)]">
          <div className="grid grid-cols-6 divide-x divide-[var(--color-line-faint)]">
            {businessAreas.map((area) => (
              <div key={area.id} className={`${areaClass(area.id)} flex flex-col`}>
                <div aria-hidden="true" className="h-[3px] bg-[var(--area-accent)]" />
                <div className="bg-[var(--area-tint)] px-3 pt-3 pb-3.5">
                  <h2 className="text-[15px] font-bold leading-5 text-[var(--color-ink)]">
                    {area.name}
                  </h2>
                  <p className="label-caps mt-0.5">{area.labelEn}</p>
                  <p className="mt-2 min-h-[4rem] text-[12px] leading-5 text-[var(--color-ink-secondary)]">
                    {area.summary}
                  </p>
                </div>
                <div className="flex-1 px-1.5 pt-1 pb-2">
                  {getSystemsByArea(area.id).map((system) => (
                    <SystemCategoryButton
                      key={system.id}
                      system={system}
                      noteCount={counts(system.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3 border-y border-[var(--color-line)] bg-[var(--color-surface-sunken)] px-3 py-2">
            <span aria-hidden="true" className="h-3 w-[3px] bg-[var(--color-sky)]" />
            <h2 className="label-caps">Representative Solutions</h2>
          </div>

          <div className="grid grid-cols-6 divide-x divide-[var(--color-line-faint)]">
            {businessAreas.map((area) => (
              <div key={area.id} className={`${areaClass(area.id)} px-1.5 py-2`}>
                {getProductsByArea(area.id).map((product) => (
                  <ProductListItem key={`${area.id}-${product.id}`} product={product} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tablet / Mobile: 領域ごとに積む ────────────────────────────── */}
      <div className="space-y-5 lg:hidden">
        {businessAreas.map((area) => (
          <section
            key={area.id}
            className={`${areaClass(area.id)} overflow-hidden rounded-[8px] border border-[var(--color-line)] bg-[var(--color-surface)]`}
          >
            <div aria-hidden="true" className="h-[3px] bg-[var(--area-accent)]" />
            <div className="bg-[var(--area-tint)] px-4 pt-3 pb-4">
              <h2 className="text-[17px] font-bold leading-6 text-[var(--color-ink)]">
                {area.name}
              </h2>
              <p className="label-caps mt-0.5">{area.labelEn}</p>
              <p className="mt-2 max-w-[60ch] text-[13px] leading-6 text-[var(--color-ink-secondary)]">
                {area.summary}
              </p>
            </div>

            <div className="grid gap-x-6 px-2 py-2 sm:grid-cols-2">
              <div>
                <h3 className="label-caps mb-1 border-b-2 border-[var(--color-sky)] px-1 pb-1">
                  System Category
                </h3>
                {getSystemsByArea(area.id).map((system) => (
                  <SystemCategoryButton
                    key={system.id}
                    system={system}
                    noteCount={counts(system.id)}
                  />
                ))}
              </div>
              <div className="mt-5 sm:mt-0">
                <h3 className="label-caps mb-1 border-b-2 border-[var(--color-sky)] px-1 pb-1">
                  Representative Solutions
                </h3>
                <div className="pt-1">
                  {getProductsByArea(area.id).map((product) => (
                    <ProductListItem key={`${area.id}-${product.id}`} product={product} />
                  ))}
                </div>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
