import { businessAreas, products, systemCategories } from "@/data";

/**
 * Learning Pages 用のプロンプトと JSON Schema。
 *
 * ここは「AI に何を頼むか」だけを持つ。通信は cloudflare.ts、
 * 返ってきた値の検証は lib/learning/schemas.ts が担当する。
 */

/**
 * Cloudflare の制約デコードでは、`required` に入っていないプロパティを
 * モデルが丸ごと省略することがある。実測で、edges を required から外すと
 * flow なのに矢印が1本も返らない状態が再現した。
 *
 * そのため5つの配列をすべて required にし、使わない型の配列は空で
 * 返させる。空配列はサーバー側で捨てる。
 */
export const LEARNING_JSON_SCHEMA: Record<string, unknown> = {
  type: "object",
  properties: {
    title: { type: "string" },
    summary: { type: "string" },
    visualizationType: { type: "string", enum: ["flow", "comparison", "summary"] },
    keyPoints: { type: "array", items: { type: "string" } },
    relatedConcepts: { type: "array", items: { type: "string" } },
    classification: {
      type: "object",
      properties: {
        businessArea: { type: "string" },
        systemCategory: { type: "string" },
        productKey: { type: "string" },
      },
      required: ["businessArea", "systemCategory", "productKey"],
    },
    visualization: {
      type: "object",
      properties: {
        nodes: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string" },
              label: { type: "string" },
              description: { type: "string" },
            },
            required: ["id", "label"],
          },
        },
        edges: {
          type: "array",
          items: {
            type: "object",
            properties: {
              from: { type: "string" },
              to: { type: "string" },
              label: { type: "string" },
            },
            required: ["from", "to"],
          },
        },
        columns: {
          type: "array",
          items: {
            type: "object",
            properties: { id: { type: "string" }, label: { type: "string" } },
            required: ["id", "label"],
          },
        },
        rows: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              values: { type: "object", additionalProperties: { type: "string" } },
            },
            required: ["label", "values"],
          },
        },
        sections: {
          type: "array",
          items: {
            type: "object",
            properties: { heading: { type: "string" }, body: { type: "string" } },
            required: ["heading", "body"],
          },
        },
      },
      required: ["nodes", "edges", "columns", "rows", "sections"],
    },
  },
  required: [
    "title",
    "summary",
    "visualizationType",
    "keyPoints",
    "relatedConcepts",
    "classification",
    "visualization",
  ],
};

/**
 * 分類に使える ID の一覧をプロンプトへ埋め込む。
 * AI に自由な文字列を作らせないため、選択肢を明示する
 * （それでも守らないことがあるので、サーバー側でも存在チェックする）。
 */
function classificationCatalog(): string {
  const areas = businessAreas.map((area) => `${area.id}(${area.name})`).join(", ");
  const systems = systemCategories
    .map((system) => `${system.id}(${system.shortName})`)
    .join(", ");
  const productIds = products.map((product) => `${product.id}(${product.name})`).join(", ");

  return [
    `businessArea の候補: ${areas}`,
    `systemCategory の候補: ${systems}`,
    `productKey の候補: ${productIds}`,
  ].join("\n");
}

export function buildSystemPrompt(): string {
  return `あなたは Business Knowledge Architect です。
経営・マーケティング・営業・カスタマー・IT・SaaS・DX・業務改善・データ分析・AI・システム導入の領域を扱います。

ユーザーが書いた学習メモを、後から本人が復習しやすい構造へ変換してください。

## 厳守すること
- 元の文章の意味を維持する
- 書かれていない事実・数字・製品名を追加しない（捏造禁止）
- 判断できない分類は空文字 "" にする。推測で埋めない
- 情報を過剰に足さない。元メモに無い解説を創作しない
- 日本語を主にする。製品名や英語の専門用語（MQL, Lead Scoring など）は原語のまま
- title は必ず日本語で書く。30文字以内で短く
  （良い例: "Marketoのリード管理フロー" / 悪い例: "Munchkin Cookie Process"）
- summary は1〜3文
- keyPoints は3〜7個
- relatedConcepts は最大8個

## visualizationType の選び方
- 手順・段階・時間順に進むプロセスの説明 → "flow"
- 複数の概念や製品の違いの説明 → "comparison"
- それ以外（定義・特徴・仕組みの説明など） → "summary"

## visualization の埋め方
5つの配列（nodes, edges, columns, rows, sections）すべてを必ず含めます。
選んだ type に対応しない配列は、必ず空配列 [] にしてください。

flow を選んだとき:
- nodes の id は "n1","n2","n3" ... の形式
- nodes は最大10個
- edges は必ず1本以上作る。ノードを並べるだけでは不可
- n1→n2→n3 と進むなら [{"from":"n1","to":"n2"},{"from":"n2","to":"n3"}]
- edges の from/to は必ず nodes に存在する id を使う
- 分岐や差し戻しがあれば、その edge も追加する
- columns, rows, sections は []

comparison を選んだとき:
- columns は比較軸（最大5）。id は "c1","c2" ... 形式、label に軸名（例: 主目的, 対象, 利用フェーズ）
- rows は比較対象（最大10）。label に対象名（例: MA, SFA, CRM）
- rows[].values のキーは columns の id と完全に一致させる
- nodes, edges, sections は []

summary を選んだとき:
- sections は最大6個。heading（見出し）と body（本文）
- nodes, edges, columns, rows は []

## classification
次の ID からのみ選びます。該当が無い、または自信が無い場合は空文字 "" にしてください。
${classificationCatalog()}`;
}

export function buildUserPrompt(text: string): string {
  return `次の学習メモを構造化してください。\n\n---\n${text}\n---`;
}

/** 1回だけ試す修復用プロンプト。JSON として壊れていた場合に使う。 */
export function buildRepairPrompt(text: string): string {
  return `前回の出力は JSON として解釈できませんでした。
スキーマに厳密に従い、JSON オブジェクトだけを返してください。説明文やコードブロックは付けないでください。

対象の学習メモ:
---
${text}
---`;
}
