import { businessAreaMap, productMap, systemCategoryMap } from "@/data";
import type {
  ComparisonVisualizationData,
  FlowVisualizationData,
  LearningAIResult,
  LearningClassification,
  SummaryVisualizationData,
  VisualizationData,
  VisualizationType,
} from "./types";

/**
 * AI 出力の検証と正規化。
 *
 * 方針は「落とすより直す」。AI は形をよく間違えるが、内容自体は使える
 * ことが多い。存在しないノードを指す edge のように、そのまま描画すると
 * 壊れるものだけを捨て、残りは活かす。
 *
 * どうしても意味のある構造にならないときだけ null を返し、
 * 呼び出し側（API Route）がエラー応答へ変換する。
 *
 * Zod は入れていない（依存を増やさない方針）。検証対象は1スキーマだけで、
 * かつ「捨てずに直す」処理が中心なので、手書きのほうが意図が明確になる。
 */

const MAX_TITLE = 120;
const MAX_SUMMARY = 600;
const MAX_KEY_POINTS = 7;
const MAX_RELATED = 8;
const MAX_NODES = 10;
const MAX_COLUMNS = 5;
const MAX_ROWS = 10;
const MAX_SECTIONS = 6;
const MAX_TEXT_CELL = 400;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asTrimmedString(value: unknown, maxLength: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function asStringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const item of value) {
    const text = asTrimmedString(item, maxLength);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    result.push(text);
    if (result.length >= maxItems) break;
  }
  return result;
}

/**
 * モデルが返した文字列 or オブジェクトを JSON オブジェクトへ。
 * ```json フェンス付きで返してくるケースにも耐える。
 */
export function parseAiPayload(raw: unknown): Record<string, unknown> | null {
  const direct = asRecord(raw);
  if (direct) return direct;

  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return asRecord(JSON.parse(withoutFence));
  } catch {
    // 前後に説明文が付いている場合の手当てとして、
    // 最初の { から最後の } までを取り出す。
    const start = withoutFence.indexOf("{");
    const end = withoutFence.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return asRecord(JSON.parse(withoutFence.slice(start, end + 1)));
      } catch {
        // 下の復元へ進む
      }
    }
    if (start === -1) return null;
    return asRecord(repairTruncatedJson(withoutFence.slice(start)));
  }
}

/**
 * 生成が途中で打ち切られた JSON を、閉じられる範囲まで閉じて復元する。
 *
 * max_tokens 上限で切れるのが主因なので設定側で余裕を持たせてあるが、
 * それでも起きうる。全部捨てると生成し直し（＝再課金・再待機）になるため、
 * 拾える分は拾う。壊れた末尾の要素は落ちるが、上位の正規化が
 * 「使える形か」を最終判断するので、中途半端なものは結局そこで弾かれる。
 */
function repairTruncatedJson(text: string): unknown {
  let inString = false;
  let escaped = false;
  const stack: string[] = [];
  // 最後に「値として完結した」位置。ここまで戻せば安全に閉じられる。
  let safeEnd = -1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') {
        inString = false;
        safeEnd = index;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{" || char === "[") {
      stack.push(char === "{" ? "}" : "]");
    } else if (char === "}" || char === "]") {
      stack.pop();
      safeEnd = index;
    } else if (char === "," || /\d/.test(char) || char === "e" || char === "l") {
      // 数値・true/false/null の途中でも、直前の完結位置は保持済み
      safeEnd = index;
    }
  }

  if (stack.length === 0) return null; // 閉じ忘れが無いなら別の理由で壊れている
  if (safeEnd < 0) return null;

  let candidate = text.slice(0, safeEnd + 1);
  // 末尾のカンマや開きかけのキーを落とす
  candidate = candidate.replace(/,\s*$/, "");
  candidate = candidate.replace(/,\s*"[^"]*$/, "");

  for (let index = stack.length - 1; index >= 0; index -= 1) {
    candidate += stack[index];
  }

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
}

function normalizeVisualizationType(value: unknown): VisualizationType | null {
  if (value === "flow" || value === "comparison" || value === "summary") return value;
  return null;
}

/**
 * flow の正規化。
 * - node が無ければ成立しないので null
 * - 存在しない id を指す edge は捨てる
 * - 自己ループは捨てる
 * - edge が1本も残らない場合は、node の並び順で直線に繋ぐ。
 *   モデルは node を工程順に出すため、これは内容の創作ではなく
 *   「並び順という既にある情報」を辺として書き起こしているだけ。
 */
function normalizeFlow(raw: Record<string, unknown>): FlowVisualizationData | null {
  const rawNodes = Array.isArray(raw.nodes) ? raw.nodes : [];
  const nodes: FlowVisualizationData["nodes"] = [];
  const seenIds = new Set<string>();

  for (const item of rawNodes) {
    const record = asRecord(item);
    if (!record) continue;
    const id = asTrimmedString(record.id, 40);
    const label = asTrimmedString(record.label, 120);
    if (!id || !label || seenIds.has(id)) continue;
    seenIds.add(id);
    const description = asTrimmedString(record.description, MAX_TEXT_CELL);
    nodes.push(description ? { id, label, description } : { id, label });
    if (nodes.length >= MAX_NODES) break;
  }

  if (nodes.length === 0) return null;

  const rawEdges = Array.isArray(raw.edges) ? raw.edges : [];
  const edges: FlowVisualizationData["edges"] = [];
  const seenEdges = new Set<string>();

  for (const item of rawEdges) {
    const record = asRecord(item);
    if (!record) continue;
    const from = asTrimmedString(record.from, 40);
    const to = asTrimmedString(record.to, 40);
    if (!from || !to) continue;
    if (!seenIds.has(from) || !seenIds.has(to)) continue; // 幽霊ノード参照を捨てる
    if (from === to) continue; // 自己ループは描いても意味がない
    const key = `${from}->${to}`;
    if (seenEdges.has(key)) continue;
    seenEdges.add(key);
    const label = asTrimmedString(record.label, 60);
    edges.push(label ? { from, to, label } : { from, to });
  }

  if (edges.length === 0 && nodes.length > 1) {
    for (let index = 0; index < nodes.length - 1; index += 1) {
      edges.push({ from: nodes[index].id, to: nodes[index + 1].id });
    }
  }

  return { type: "flow", nodes, edges };
}

/**
 * comparison の正規化。
 * - 列が無ければ成立しないので null
 * - values のキーが列 id と一致しない場合、列 label とも突き合わせて拾う
 *   （モデルが id ではなく label をキーにすることが実測であったため）
 */
function normalizeComparison(raw: Record<string, unknown>): ComparisonVisualizationData | null {
  const rawColumns = Array.isArray(raw.columns) ? raw.columns : [];
  const columns: ComparisonVisualizationData["columns"] = [];
  const seenIds = new Set<string>();
  const labelToId = new Map<string, string>();

  for (const item of rawColumns) {
    const record = asRecord(item);
    if (!record) continue;
    const id = asTrimmedString(record.id, 40);
    const label = asTrimmedString(record.label, 80);
    if (!id || !label || seenIds.has(id)) continue;
    seenIds.add(id);
    labelToId.set(label, id);
    columns.push({ id, label });
    if (columns.length >= MAX_COLUMNS) break;
  }

  if (columns.length === 0) return null;

  const rawRows = Array.isArray(raw.rows) ? raw.rows : [];
  const rows: ComparisonVisualizationData["rows"] = [];

  for (const item of rawRows) {
    const record = asRecord(item);
    if (!record) continue;
    const label = asTrimmedString(record.label, 80);
    if (!label) continue;

    const rawValues = asRecord(record.values) ?? {};
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawValues)) {
      const text = asTrimmedString(value, MAX_TEXT_CELL);
      if (!text) continue;
      const columnId = seenIds.has(key) ? key : labelToId.get(key);
      if (!columnId) continue;
      values[columnId] = text;
    }

    if (Object.keys(values).length === 0) continue; // 中身が空の行は出さない
    rows.push({ label, values });
    if (rows.length >= MAX_ROWS) break;
  }

  if (rows.length === 0) return null;

  return { type: "comparison", columns, rows };
}

function normalizeSummary(raw: Record<string, unknown>): SummaryVisualizationData | null {
  const rawSections = Array.isArray(raw.sections) ? raw.sections : [];
  const sections: SummaryVisualizationData["sections"] = [];

  for (const item of rawSections) {
    const record = asRecord(item);
    if (!record) continue;
    const heading = asTrimmedString(record.heading, 80);
    const body = asTrimmedString(record.body, 1200);
    if (!heading && !body) continue;
    sections.push({ heading: heading || "補足", body });
    if (sections.length >= MAX_SECTIONS) break;
  }

  if (sections.length === 0) return null;

  return { type: "summary", sections };
}

/**
 * AI が選んだ型で正規化を試し、失敗したら他の型へフォールバックする。
 * 「型は summary と言っているが実際は nodes しか入っていない」ような
 * ズレを、破棄せず拾うため。
 */
function normalizeVisualization(
  declaredType: VisualizationType,
  raw: Record<string, unknown>,
  summaryText: string,
  keyPoints: string[],
): VisualizationData {
  const attempts: VisualizationType[] =
    declaredType === "flow"
      ? ["flow", "comparison", "summary"]
      : declaredType === "comparison"
        ? ["comparison", "flow", "summary"]
        : ["summary", "flow", "comparison"];

  for (const type of attempts) {
    const result =
      type === "flow"
        ? normalizeFlow(raw)
        : type === "comparison"
          ? normalizeComparison(raw)
          : normalizeSummary(raw);
    if (result) return result;
  }

  // どの形も作れなかった場合の最終手段。
  // AI が出した summary と keyPoints は使えているので、
  // それを summary セクションとして見せる（内容の創作はしない）。
  const sections: SummaryVisualizationData["sections"] = [];
  if (summaryText) sections.push({ heading: "概要", body: summaryText });
  if (keyPoints.length > 0) sections.push({ heading: "要点", body: keyPoints.join("\n") });
  if (sections.length === 0) sections.push({ heading: "概要", body: "構造化できる内容が見つかりませんでした。" });
  return { type: "summary", sections };
}

/** Knowledge Map に実在する ID だけ通す。存在しなければ null。 */
function normalizeClassification(raw: unknown): LearningClassification {
  const record = asRecord(raw) ?? {};

  const businessArea = asTrimmedString(record.businessArea, 60);
  const systemCategory = asTrimmedString(record.systemCategory, 60);
  const productKey = asTrimmedString(record.productKey, 80);

  const validArea = businessArea && businessAreaMap[businessArea as never] ? businessArea : null;
  const validSystem = systemCategory && systemCategoryMap[systemCategory] ? systemCategory : null;
  const validProduct = productKey && productMap[productKey] ? productKey : null;

  // 製品が分かっていて領域が空なら、マスターから埋める（推測ではなく参照）
  const system = validSystem ? systemCategoryMap[validSystem] : undefined;
  const derivedArea = validArea ?? (system ? system.businessArea : null);

  return {
    businessArea: derivedArea,
    systemCategory: validSystem,
    productKey: validProduct,
  };
}

/**
 * AI の生レスポンスを LearningAIResult へ。
 * title と summary の両方が取れない場合だけ null（何も作れていない）。
 */
export function normalizeLearningResult(raw: unknown): LearningAIResult | null {
  const payload = parseAiPayload(raw);
  if (!payload) return null;

  const title = asTrimmedString(payload.title, MAX_TITLE);
  const summary = asTrimmedString(payload.summary, MAX_SUMMARY);
  if (!title && !summary) return null;

  const keyPoints = asStringList(payload.keyPoints, MAX_KEY_POINTS, 300);
  const relatedConcepts = asStringList(payload.relatedConcepts, MAX_RELATED, 60);
  const declaredType = normalizeVisualizationType(payload.visualizationType) ?? "summary";
  const rawVisualization = asRecord(payload.visualization) ?? {};

  const visualization = normalizeVisualization(
    declaredType,
    rawVisualization,
    summary,
    keyPoints,
  );

  return {
    version: 1,
    title: title || summary.slice(0, 40),
    summary,
    visualizationType: visualization.type,
    keyPoints,
    relatedConcepts,
    classification: normalizeClassification(payload.classification),
    visualization,
  };
}
