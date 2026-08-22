import type {
  FrameworkAnalysisProjectRow,
  FrameworkAnalysisRow,
  FrameworkType as FrameworkTypeRow,
} from "@/lib/supabase/types";

/** Supported company-analysis lenses. This mirrors the database CHECK constraint. */
export type FrameworkType = FrameworkTypeRow;

export const FRAMEWORK_TYPES: FrameworkType[] = ["3c", "five_forces", "swot", "pestel", "stp"];

export const FRAMEWORK_LABEL: Record<FrameworkType, string> = {
  "3c": "3C",
  five_forces: "ファイブフォース",
  swot: "SWOT",
  pestel: "PESTEL",
  stp: "STP",
};

export const FRAMEWORK_SECTIONS: Record<
  FrameworkType,
  ReadonlyArray<{ id: string; title: string }>
> = {
  "3c": [
    { id: "customer", title: "顧客・市場 (Customer)" },
    { id: "company", title: "自社 (Company)" },
    { id: "competitors", title: "競合 (Competitors)" },
  ],
  five_forces: [
    { id: "competitive_rivalry", title: "競合他社との競争" },
    { id: "new_entrants", title: "新規参入の脅威" },
    { id: "supplier_power", title: "供給者の交渉力" },
    { id: "buyer_power", title: "買い手の交渉力" },
    { id: "substitutes", title: "代替品の脅威" },
  ],
  swot: [
    { id: "strengths", title: "強み (Strengths)" },
    { id: "weaknesses", title: "弱み (Weaknesses)" },
    { id: "opportunities", title: "機会 (Opportunities)" },
    { id: "threats", title: "脅威 (Threats)" },
  ],
  pestel: [
    { id: "political", title: "政治 (Political)" },
    { id: "economic", title: "経済 (Economic)" },
    { id: "social", title: "社会 (Social)" },
    { id: "technological", title: "技術 (Technological)" },
    { id: "environmental", title: "環境 (Environmental)" },
    { id: "legal", title: "法規制 (Legal)" },
  ],
  stp: [
    { id: "segmentation", title: "市場細分化 (Segmentation)" },
    { id: "targeting", title: "標的市場 (Targeting)" },
    { id: "positioning", title: "ポジショニング (Positioning)" },
  ],
};

export interface FrameworkAnalysisSection {
  id: string;
  title: string;
  analysis: string;
  evidence: string[];
}

/** The validated, renderer-safe subset of an AI response. */
export interface FrameworkAnalysisResult {
  version: 1;
  framework: FrameworkType;
  title: string;
  executiveSummary: string;
  sections: FrameworkAnalysisSection[];
  recommendations: string[];
  limitations: string[];
}

export type FrameworkAnalysis = FrameworkAnalysisRow;
export type FrameworkAnalysisProject = FrameworkAnalysisProjectRow;

/** Data accepted after the API route has validated an AI response. */
export interface FrameworkAnalysisDraft {
  companyName: string;
  sourceUrl: string;
  sourceNotes?: string;
  sourceMetadata?: Record<string, unknown>;
  frameworkType: FrameworkType;
  result: FrameworkAnalysisResult;
  model?: string | null;
  sourceFetchedAt?: string | null;
  generatedAt?: string;
  regeneratedFromId?: string | null;
}

export type FrameworkAnalysesStatus =
  | "unconfigured"
  | "loading"
  | "signed-out"
  | "ready"
  | "error";

export function analysisTitleOrFallback(analysis: FrameworkAnalysis): string {
  return analysis.company_name.trim() || "無題の分析";
}

/** Newest generated result first, regardless of when a project was linked. */
export function sortFrameworkAnalyses(analyses: FrameworkAnalysis[]): FrameworkAnalysis[] {
  return [...analyses].sort((a, b) => b.generated_at.localeCompare(a.generated_at));
}
