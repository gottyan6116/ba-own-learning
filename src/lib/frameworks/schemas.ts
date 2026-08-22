import { FRAMEWORK_SECTIONS, type FrameworkAnalysisResult, type FrameworkAnalysisSection, type FrameworkType } from "./types";

const MAX_TITLE = 160;
const MAX_SUMMARY = 2_000;
const MAX_SECTION_ANALYSIS = 3_000;
const MAX_EVIDENCE = 8;
const MAX_EVIDENCE_LENGTH = 500;
const MAX_RECOMMENDATIONS = 8;
const MAX_LIMITATIONS = 8;
const MAX_LIST_ITEM_LENGTH = 500;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function trimmedString(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function stringList(value: unknown, maxItems: number, maxLength: number): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const values: string[] = [];
  for (const item of value) {
    const text = trimmedString(item, maxLength);
    if (!text || seen.has(text)) continue;
    seen.add(text);
    values.push(text);
    if (values.length === maxItems) break;
  }
  return values;
}

/**
 * Validates an AI result before it is persisted or rendered.
 * Unknown sections are discarded; the section titles are always taken from
 * local definitions so a model cannot change the meaning of the framework.
 */
export function normalizeFrameworkResult(
  framework: FrameworkType,
  raw: unknown,
): FrameworkAnalysisResult | null {
  const payload = asRecord(raw);
  if (!payload) return null;

  const title = trimmedString(payload.title, MAX_TITLE);
  const executiveSummary = trimmedString(payload.executiveSummary, MAX_SUMMARY);
  const expectedSections = FRAMEWORK_SECTIONS[framework];
  const sectionDefinitions = new Map(expectedSections.map((section) => [section.id, section]));
  const collected = new Map<string, FrameworkAnalysisSection>();

  if (Array.isArray(payload.sections)) {
    for (const rawSection of payload.sections) {
      const section = asRecord(rawSection);
      if (!section) continue;
      const id = trimmedString(section.id, 64);
      const definition = sectionDefinitions.get(id);
      const analysis = trimmedString(section.analysis, MAX_SECTION_ANALYSIS);
      if (!definition || !analysis || collected.has(id)) continue;
      collected.set(id, {
        id,
        title: definition.title,
        analysis,
        evidence: stringList(section.evidence, MAX_EVIDENCE, MAX_EVIDENCE_LENGTH),
      });
    }
  }

  const sections = expectedSections
    .map((definition) => collected.get(definition.id))
    .filter((section): section is FrameworkAnalysisSection => Boolean(section));

  if (!title || !executiveSummary || sections.length === 0) return null;

  return {
    version: 1,
    framework,
    title,
    executiveSummary,
    sections,
    recommendations: stringList(payload.recommendations, MAX_RECOMMENDATIONS, MAX_LIST_ITEM_LENGTH),
    limitations: stringList(payload.limitations, MAX_LIMITATIONS, MAX_LIST_ITEM_LENGTH),
  };
}

/** Reads a persisted jsonb value without exposing an unchecked value to UI code. */
export function readFrameworkResult(analysis: { framework_type: FrameworkType; result_data: unknown }): FrameworkAnalysisResult | null {
  return normalizeFrameworkResult(analysis.framework_type, analysis.result_data);
}
