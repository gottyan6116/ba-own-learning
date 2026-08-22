import { FRAMEWORK_TYPES, type FrameworkType } from "./types";

export const FRAMEWORK_COMPANY_NAME_MAX_LENGTH = 160;
export const FRAMEWORK_SOURCE_URL_MAX_LENGTH = 2_048;
export const FRAMEWORK_NOTES_MAX_LENGTH = 6_000;

export interface FrameworkAnalysisRequest {
  companyName: string;
  sourceUrl: string;
  framework: FrameworkType;
  notes: string;
}

function isPublicHttpsUrl(value: string): boolean {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase().replace(/\.$/, "");
    return (
      url.protocol === "https:" &&
      !url.username &&
      !url.password &&
      (url.port === "" || url.port === "443") &&
      hostname.includes(".") &&
      hostname !== "localhost" &&
      !hostname.endsWith(".localhost") &&
      !hostname.endsWith(".local") &&
      !/^\d{1,3}(?:\.\d{1,3}){3}$/.test(hostname) &&
      !hostname.includes(":")
    );
  } catch {
    return false;
  }
}

/** Route とフォームが共有する、Gateway 呼び出し前の最小入力境界。 */
export function parseFrameworkAnalysisRequest(value: unknown): FrameworkAnalysisRequest {
  const body = value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim() : "";
  const sourceUrl = typeof body?.sourceUrl === "string" ? body.sourceUrl.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  const framework = body?.framework;

  if (!companyName || companyName.length > FRAMEWORK_COMPANY_NAME_MAX_LENGTH) {
    throw new Error(`会社名は ${FRAMEWORK_COMPANY_NAME_MAX_LENGTH} 文字以内で入力してください。`);
  }
  if (sourceUrl.length > FRAMEWORK_SOURCE_URL_MAX_LENGTH || !isPublicHttpsUrl(sourceUrl)) {
    throw new Error("公開HTTPS URLを入力してください。");
  }
  if (!FRAMEWORK_TYPES.includes(framework as FrameworkType)) {
    throw new Error("分析フレームワークを選択してください。");
  }
  if (notes.length > FRAMEWORK_NOTES_MAX_LENGTH) {
    throw new Error(`補足メモは ${FRAMEWORK_NOTES_MAX_LENGTH.toLocaleString()} 文字以内で入力してください。`);
  }
  return { companyName, sourceUrl, framework: framework as FrameworkType, notes };
}
