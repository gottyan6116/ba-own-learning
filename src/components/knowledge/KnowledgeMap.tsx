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
 * カスタマー → 管理）になるように、1枚の格子で構成している。
 *
 * Desktop（lg 以上）は6列の格子。それ未満は縮小せず縦に積む。
 * 6列を無理に縮めると略称も日本語名も読めなくなり、地図の意味が消えるため。
 */
export function KnowledgeMap() {
  const { notes } = useNotes();
  const counts = (systemId: string) => countNotesForSystem(notes, systemId);

  return (
    <div>
      {/* ── Desktop: 6-column map ─────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div className="grid grid-cols-6 gap-x-5">
          {businessAreas.map((area) => (
            <div key={area.id} className={areaClass(area.id)}>
              <div aria-hidden="true" className="h-[3px] bg-[var(--area-accent)]" />
              <h2 className="mt-3 text-[15px] font-bold leading-5 text-[var(--color-ink)]">
                {area.name}
              </h2>
              <p className="label-caps mt-0.5">{area.labelEn}</p>
              <p className="mt-2 min-h-[3.5rem] text-[12px] leading-5 text-[var(--color-ink-muted)]">
                {area.summary}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-3 grid grid-cols-6 gap-x-5 border-t border-[var(--color-line-strong)] pt-2">
          {businessAreas.map((area) => (
            <div key={area.id} className={areaClass(area.id)}>
              {getSystemsByArea(area.id).map((system) => (
                <SystemCategoryButton
                  key={system.id}
                  system={system}
                  noteCount={counts(system.id)}
                />
              ))}
            </div>
          ))}
        </div>

        <div className="mt-8 flex items-center gap-4">
          <h2 className="label-caps whitespace-nowrap">Representative Solutions</h2>
          <span aria-hidden="true" className="h-px flex-1 bg-[var(--color-line-strong)]" />
        </div>

        <div className="mt-3 grid grid-cols-6 gap-x-5">
          {businessAreas.map((area) => (
            <div key={area.id} className={`${areaClass(area.id)} -ml-2`}>
              {getProductsByArea(area.id).map((product) => (
                <ProductListItem key={`${area.id}-${product.id}`} product={product} />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* ── Tablet / Mobile: stacked ──────────────────────────────────── */}
      <div className="space-y-8 lg:hidden">
        {businessAreas.map((area) => (
          <section key={area.id} className={areaClass(area.id)}>
            <div aria-hidden="true" className="h-[3px] bg-[var(--area-accent)]" />
            <div className="mt-3 mb-3">
              <h2 className="text-[17px] font-bold leading-6 text-[var(--color-ink)]">
                {area.name}
              </h2>
              <p className="label-caps mt-0.5">{area.labelEn}</p>
              <p className="mt-2 max-w-[60ch] text-[13px] leading-6 text-[var(--color-ink-muted)]">
                {area.summary}
              </p>
            </div>

            <div className="grid gap-x-6 sm:grid-cols-2">
              <div>
                <h3 className="label-caps mb-1 border-b border-[var(--color-line-strong)] pb-1">
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
                <h3 className="label-caps mb-1 border-b border-[var(--color-line-strong)] pb-1">
                  Representative Solutions
                </h3>
                <div className="-ml-2 pt-1">
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
