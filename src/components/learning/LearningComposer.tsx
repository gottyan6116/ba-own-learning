"use client";

import { useState } from "react";
import { LEARNING_INPUT_MAX_LENGTH, LEARNING_INPUT_MIN_LENGTH } from "@/lib/ai/config";
import type { LearningAIResult } from "@/lib/learning/types";

/**
 * 自由文の入力欄。
 *
 * AI 呼び出しはこのボタンからしか起きない（onChange では叩かない）。
 * 二重送信は busy フラグと disabled の両方で止める。
 */
export function LearningComposer({
  onGenerated,
  disabled,
}: {
  onGenerated: (result: LearningAIResult, sourceText: string) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedLength = text.trim().length;
  const tooShort = trimmedLength < LEARNING_INPUT_MIN_LENGTH;
  const tooLong = trimmedLength > LEARNING_INPUT_MAX_LENGTH;
  const canSubmit = !busy && !disabled && !tooShort && !tooLong;

  const generate = async () => {
    if (!canSubmit) return;
    setBusy(true);
    setError(null);

    try {
      const response = await fetch("/api/learning/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      const payload = (await response.json()) as {
        result?: LearningAIResult;
        error?: { code: string; message: string };
      };

      if (!response.ok || !payload.result) {
        setError(payload.error?.message ?? "生成に失敗しました。もう一度お試しください。");
        return;
      }

      onGenerated(payload.result, text.trim());
    } catch {
      setError("通信に失敗しました。接続を確認してもう一度お試しください。");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section>
      <label htmlFor="learning-source" className="label-caps mb-2 block">
        学習メモ
      </label>
      <textarea
        id="learning-source"
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={10}
        disabled={busy}
        placeholder={
          "今日学んだことをそのまま書いてください。\nAI が内容を整理し、復習しやすい形へ変換します。"
        }
        className="w-full resize-y rounded-[4px] border border-[var(--color-line-strong)] bg-white px-3 py-2.5 text-[15px] leading-7 text-[var(--color-ink)] placeholder:text-[var(--color-ink-muted)] disabled:opacity-60"
      />

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        <button
          type="button"
          onClick={() => void generate()}
          disabled={!canSubmit}
          aria-busy={busy}
          className="h-10 cursor-pointer rounded-[4px] bg-[var(--color-zenith)] px-4 text-[14px] font-medium text-white transition-colors duration-150 hover:bg-[var(--color-zenith-hover)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "内容を整理しています…" : "AIで整理・可視化"}
        </button>

        <span
          className={`tabular text-[12px] ${
            tooLong ? "text-[var(--color-danger)]" : "text-[var(--color-ink-muted)]"
          }`}
        >
          {trimmedLength.toLocaleString()} / {LEARNING_INPUT_MAX_LENGTH.toLocaleString()}
        </span>
      </div>

      {busy && (
        <div className="mt-3 max-w-[28rem]">
          <p role="status" className="text-[12px] text-[var(--color-ink-muted)]">
            内容を理解して構造化しています。通常は数秒〜20秒程度かかります。
          </p>
          {/* 進捗は取得できないので、割合は出さない。動いていることだけを示す。 */}
          <div
            aria-hidden="true"
            className="loading-bar mt-2 h-[2px] w-full overflow-hidden rounded-full bg-[var(--color-line-faint)]"
          >
            <div className="loading-bar-fill h-full w-1/3 rounded-full bg-[var(--color-zenith)]" />
          </div>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="mt-3 max-w-[46rem] rounded-[4px] border border-[var(--color-danger)] bg-[var(--color-danger-tint)] px-3 py-2 text-[13px] leading-6 text-[var(--color-danger)]"
        >
          {error}
        </p>
      )}
    </section>
  );
}
