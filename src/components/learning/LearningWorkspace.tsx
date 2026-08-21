"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLearning } from "@/lib/learning/LearningProvider";
import {
  learningTitleOrFallback,
  readStringArray,
  sortLearningPages,
  type LearningAIResult,
  type LearningDraft,
  type LearningPage,
} from "@/lib/learning/types";
import { LearningList } from "./LearningList";
import { LearningDetail } from "./LearningDetail";
import { LearningComposer } from "./LearningComposer";
import { LearningPreview } from "./LearningPreview";

/**
 * Desktop は 2ペイン（List / 右ペイン）。md 未満では1ペインずつ。
 * Notes / Projects と同じ骨格に揃えている。
 *
 * 右ペインは3状態:
 *   compose  … 入力（AI 未実行）
 *   preview  … AI 実行後、保存前
 *   detail   … 保存済みの閲覧
 */
type RightPane =
  | { mode: "compose" }
  | { mode: "preview"; result: LearningAIResult; sourceText: string };

export function LearningWorkspace() {
  const { status, pages, createPage } = useLearning();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("page");

  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pane, setPane] = useState<RightPane>({ mode: "compose" });
  const [saving, setSaving] = useState(false);
  // 「一覧に戻る」「新規」で意図的に選択を外した直後だけ true。
  // 無いと自動選択の effect が即座に先頭を選び直してしまう。
  const clearedByUser = useRef(false);

  const visible = useMemo(() => filterPages(pages, query), [pages, query]);

  useEffect(() => {
    if (!requestedId) return;
    if (!pages.some((page) => page.id === requestedId)) return;
    clearedByUser.current = false;
    setSelectedId(requestedId);
    setPane({ mode: "compose" });
  }, [requestedId, pages]);

  useEffect(() => {
    if (selectedId && pages.some((page) => page.id === selectedId)) return;
    if (clearedByUser.current) return;
    setSelectedId(visible[0]?.id ?? null);
  }, [visible, pages, selectedId]);

  const selected = pages.find((page) => page.id === selectedId) ?? null;

  const selectPage = (id: string | null) => {
    clearedByUser.current = id === null;
    setSelectedId(id);
    setPane({ mode: "compose" });
  };

  const startNew = () => {
    clearedByUser.current = true;
    setSelectedId(null);
    setPane({ mode: "compose" });
  };

  const handleSave = async (draft: LearningDraft) => {
    if (saving) return;
    setSaving(true);
    const created = await createPage(draft);
    setSaving(false);
    if (created) {
      clearedByUser.current = false;
      setSelectedId(created.id);
      setPane({ mode: "compose" });
      if (requestedId) router.replace("/learning");
    }
  };

  if (status === "unconfigured") {
    return (
      <Message title="Supabase が未設定です">
        <code className="rounded-[3px] bg-[var(--color-surface-sunken)] px-1.5 py-0.5 text-[13px]">
          .env.local
        </code>{" "}
        に <code className="text-[13px]">NEXT_PUBLIC_SUPABASE_URL</code> と{" "}
        <code className="text-[13px]">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
        を設定すると、Learning の保存が有効になります。
      </Message>
    );
  }

  if (status === "signed-out") {
    return (
      <Message title="Learning を使うにはログインが必要です">
        学習データは個人のものなので、Supabase の Row Level Security
        で本人だけが読み書きできるようにしています。
        <Link href="/login" className="ml-1 text-[var(--color-focus)] underline underline-offset-2">
          ログインする
        </Link>
      </Message>
    );
  }

  if (status === "loading") {
    return <Message title="読み込み中…">Learning を取得しています。</Message>;
  }

  if (status === "error") {
    return (
      <Message title="Learning を取得できませんでした">
        Supabase の接続設定と、learning_pages テーブルの作成・RLS の設定を確認してください。
      </Message>
    );
  }

  const showDetail = selected !== null && pane.mode === "compose";

  return (
    // grid の子には min-w-0 も要る（min-h-0 と同じ理由の横バージョン）。
    // Comparison の表は min-w-[36rem] を持つため、無いと表がペインを
    // 押し広げ、375px でグリッド全体が広がって右側の列が見えなくなる。
    <div className="grid min-h-0 flex-1 md:grid-cols-[minmax(280px,340px)_1fr]">
      <div
        className={`min-h-0 min-w-0 ${
          showDetail || pane.mode === "preview" ? "hidden md:flex md:flex-col" : "flex flex-col"
        }`}
      >
        <LearningList
          pages={visible}
          selectedId={selectedId}
          query={query}
          onQueryChange={setQuery}
          onSelect={selectPage}
          onNew={startNew}
        />
      </div>

      <div
        className={`min-h-0 min-w-0 ${
          showDetail || pane.mode === "preview" ? "flex flex-col" : "hidden md:flex md:flex-col"
        }`}
      >
        {(showDetail || pane.mode === "preview") && (
          <button
            type="button"
            onClick={() => {
              if (pane.mode === "preview") {
                setPane({ mode: "compose" });
                return;
              }
              selectPage(null);
            }}
            className="cursor-pointer border-b border-[var(--color-line)] bg-white px-4 py-2 text-left text-[13px] text-[var(--color-ink-muted)] md:hidden"
          >
            ← 一覧に戻る
          </button>
        )}

        {pane.mode === "preview" ? (
          <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
            <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8">
              <LearningPreview
                result={pane.result}
                sourceText={pane.sourceText}
                saving={saving}
                onSave={(draft) => void handleSave(draft)}
                onRegenerate={() => setPane({ mode: "compose" })}
                onDiscard={() => setPane({ mode: "compose" })}
              />
            </div>
          </div>
        ) : selected ? (
          <LearningDetail key={selected.id} page={selected} />
        ) : (
          <div className="scroll-area min-h-0 flex-1 overflow-y-auto bg-white">
            <div className="mx-auto w-full max-w-[820px] px-5 py-6 sm:px-8">
              <div className="mb-6">
                <h1 className="tracking-display text-[22px] font-bold leading-tight text-[var(--color-ink)]">
                  学んだことを、復習できる形にする
                </h1>
                <p className="mt-2 max-w-[46rem] text-[14px] leading-7 text-[var(--color-ink-secondary)]">
                  そのまま書いた文章を AI
                  が読み取り、手順・比較・要約のどれかに構造化します。保存前に必ず内容を確認できます。
                </p>
              </div>
              <LearningComposer
                onGenerated={(result, sourceText) =>
                  setPane({ mode: "preview", result, sourceText })
                }
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function filterPages(pages: LearningPage[], query: string): LearningPage[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return sortLearningPages(pages);

  return sortLearningPages(
    pages.filter((page) => {
      if (learningTitleOrFallback(page).toLowerCase().includes(needle)) return true;
      if (page.summary.toLowerCase().includes(needle)) return true;
      if (page.source_text.toLowerCase().includes(needle)) return true;
      const keyPoints = readStringArray(page.key_points);
      if (keyPoints.some((point) => point.toLowerCase().includes(needle))) return true;
      const related = readStringArray(page.related_concepts);
      return related.some((concept) => concept.toLowerCase().includes(needle));
    }),
  );
}

function Message({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[560px] px-4 py-16 sm:px-6">
      <h1 className="text-[20px] font-bold text-[var(--color-ink)]">{title}</h1>
      <p className="mt-3 text-[14px] leading-7 text-[var(--color-ink-secondary)]">{children}</p>
    </div>
  );
}
