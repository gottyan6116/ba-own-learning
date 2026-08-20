/**
 * Business Process — the top level of the knowledge map.
 *
 * The six areas are deliberately stable: they are the axis every system
 * category, product and personal note hangs off. Adding a seventh area is a
 * structural decision, not a data entry.
 */

export type BusinessAreaId =
  | "management"
  | "marketing"
  | "sales"
  | "delivery"
  | "customer"
  | "backoffice";

export interface BusinessArea {
  id: BusinessAreaId;
  /** 日本語の正式名称 — 画面上の主表記 */
  name: string;
  /** 英語ラベル — 列見出しの副表記、および英語での検索用 */
  labelEn: string;
  /** その領域が「何をする業務か」を1行で */
  summary: string;
  /** その領域でシステムが解こうとしている中心課題 */
  coreQuestion: string;
}

export const businessAreas: BusinessArea[] = [
  {
    id: "management",
    name: "経営・事業企画",
    labelEn: "Management",
    summary: "全社の数字を集約し、実績を可視化して、次の計画に落とす。",
    coreQuestion: "会社はいま何が起きていて、どこへ資源を配るべきか。",
  },
  {
    id: "marketing",
    name: "マーケティング",
    labelEn: "Marketing",
    summary: "market に対して認知を作り、見込み顧客を集め、育てて営業へ渡す。",
    coreQuestion: "誰に何を届ければ、商談として立ち上がるのか。",
  },
  {
    id: "sales",
    name: "営業",
    labelEn: "Sales",
    summary: "商談を管理し、見積・提案を通して受注まで運ぶ。",
    coreQuestion: "どの案件が、いつ、いくらで決まるのか。",
  },
  {
    id: "delivery",
    name: "デリバリー",
    labelEn: "Delivery",
    summary: "受注した仕事を、決めた品質・期日・コストで実際に届ける。",
    coreQuestion: "誰が何をいつまでにやり、どこで詰まっているのか。",
  },
  {
    id: "customer",
    name: "カスタマー",
    labelEn: "Customer",
    summary: "納品後の顧客を支援し、問い合わせに答え、継続と拡大につなげる。",
    coreQuestion: "顧客はいま困っていないか、使い続けてくれるか。",
  },
  {
    id: "backoffice",
    name: "管理・バックオフィス",
    labelEn: "Back Office",
    summary: "ヒト・モノ・カネ・契約という会社の土台を記録し、統制する。",
    coreQuestion: "会社の資源と義務が、正しく記録され守られているか。",
  },
];

export const businessAreaMap: Record<BusinessAreaId, BusinessArea> = Object.fromEntries(
  businessAreas.map((area) => [area.id, area]),
) as Record<BusinessAreaId, BusinessArea>;

export const businessAreaIds = businessAreas.map((area) => area.id);

export function getBusinessArea(id: string | null | undefined): BusinessArea | undefined {
  if (!id) return undefined;
  return businessAreaMap[id as BusinessAreaId];
}
