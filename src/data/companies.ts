/**
 * Vendors. Kept separate from products so that「Adobe の製品を横断で見る」
 * が後から作れるようにしてある。
 *
 * `brandColor` は識別のための色。Simple Icons に公式マークがあるベンダーは
 * そのパスと色を使い、無いベンダーはこの色でモノグラムを描く。
 * `public/logos/<id>.svg` を置けばそちらが優先される（README 参照）。
 */

export interface Company {
  id: string;
  name: string;
  /** 日本語表記が別にある場合のみ */
  nameJa?: string;
  /** マーク未取得時のフォールバック表記 */
  monogram: string;
  /** 識別色。ロゴが無いベンダーのモノグラムに使う。 */
  brandColor: string;
  country?: string;
}

export const companies: Company[] = [
  { id: "microsoft", name: "Microsoft", monogram: "MS", brandColor: "#00A4EF", country: "US" },
  { id: "salesforce", name: "Salesforce", monogram: "SF", brandColor: "#00A1E0", country: "US" },
  { id: "adobe", name: "Adobe", monogram: "A", brandColor: "#EB1000", country: "US" },
  { id: "hubspot", name: "HubSpot", monogram: "HS", brandColor: "#FF7A59", country: "US" },
  { id: "google", name: "Google", monogram: "G", brandColor: "#4285F4", country: "US" },
  { id: "anaplan", name: "Anaplan", monogram: "An", brandColor: "#0B4EA2", country: "US" },
  { id: "twilio", name: "Twilio", monogram: "Tw", brandColor: "#F22F46", country: "US" },
  { id: "atlassian", name: "Atlassian", monogram: "At", brandColor: "#0052CC", country: "AU" },
  { id: "asana", name: "Asana", monogram: "As", brandColor: "#F06A6A", country: "US" },
  {
    id: "cybozu",
    name: "Cybozu",
    nameJa: "サイボウズ",
    monogram: "k",
    brandColor: "#EFA31D",
    country: "JP",
  },
  { id: "zendesk", name: "Zendesk", monogram: "Ze", brandColor: "#03363D", country: "US" },
  { id: "servicenow", name: "ServiceNow", monogram: "SN", brandColor: "#2E8B57", country: "US" },
  { id: "genesys", name: "Genesys", monogram: "Ge", brandColor: "#D9400B", country: "US" },
  { id: "sap", name: "SAP", monogram: "SAP", brandColor: "#0FAAFF", country: "DE" },
  { id: "oracle", name: "Oracle", monogram: "O", brandColor: "#C74634", country: "US" },
  {
    id: "freee",
    name: "freee",
    nameJa: "フリー",
    monogram: "fr",
    brandColor: "#0068FF",
    country: "JP",
  },
  { id: "smarthr", name: "SmartHR", monogram: "SH", brandColor: "#00A0B0", country: "JP" },
  {
    id: "bengoshicom",
    name: "Bengoshi.com",
    nameJa: "弁護士ドットコム",
    monogram: "弁",
    brandColor: "#0067B2",
    country: "JP",
  },
];

export const companyMap: Record<string, Company> = Object.fromEntries(
  companies.map((company) => [company.id, company]),
);

export function getCompany(id: string): Company | undefined {
  return companyMap[id];
}
