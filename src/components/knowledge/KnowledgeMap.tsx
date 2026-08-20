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
 * 面を色で塗らず、罫線と文字の強弱だけで表を組む。領域の色は英字ラベルにだけ乗る。
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
        {/* 表頭 */}
        <div className="grid grid-cols-6 border-t-2 border-[var(--color-rule)]">
          {businessAreas.map((area) => (
            <div key={area.id} className={`${areaClass(area.id)} pt-4 pr-5 pb-5`}>
              <h2 className="text-[16px] font-bold leading-6 text-[var(--color-ink)]">
                {area.name}
              </h2>
              <p className="label-area mt-1">{area.labelEn}</p>
              <p className="mt-2.5 min-h-[3.75rem] max-w-[22ch] text-[12px] leading-5 text-[var(--color-ink-muted)]">
                {area.summary}
              </p>
            </div>
          ))}
        </div>

        {/* System Category */}
        <div className="grid grid-cols-6 border-t border-[var(--color-line-strong)]">
          {businessAreas.map((area) => (
            <div key={area.id} className={`${areaClass(area.id)} -ml-2 pr-3 pb-2`}>
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

        {/* Representative Solutions */}
        <div className="mt-6 border-t border-[var(--color-line-strong)] pt-2.5">
          <h2 className="label-caps">Representative Solutions</h2>
          <div className="mt-2 grid grid-cols-6">
            {businessAreas.map((area) => (
              <div key={area.id} className={`${areaClass(area.id)} -ml-2 pr-3`}>
                {getProductsByArea(area.id).map((product) => (
                  <ProductListItem key={`${area.id}-${product.id}`} product={product} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tablet / Mobile: 領域ごとに積む ────────────────────────────── */}
      <div className="lg:hidden">
        {businessAreas.map((area) => (
          <section
            key={area.id}
            className={`${areaClass(area.id)} border-t-2 border-[var(--color-rule)] pt-4 pb-8`}
          >
            <h2 className="text-[18px] font-bold leading-7 text-[var(--color-ink)]">{area.name}</h2>
            <p className="label-area mt-1">{area.labelEn}</p>
            <p className="mt-2 max-w-[56ch] text-[13px] leading-6 text-[var(--color-ink-muted)]">
              {area.summary}
            </p>

            <div className="mt-4 grid gap-x-8 sm:grid-cols-2">
              <div>
                <h3 className="label-caps border-b border-[var(--color-line)] pb-1.5">
                  System Category
                </h3>
                <div className="-ml-2 pt-1">
                  {getSystemsByArea(area.id).map((system) => (
                    <SystemCategoryButton
                      key={system.id}
                      system={system}
                      noteCount={counts(system.id)}
                    />
                  ))}
                </div>
              </div>
              <div className="mt-6 sm:mt-0">
                <h3 className="label-caps border-b border-[var(--color-line)] pb-1.5">
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
