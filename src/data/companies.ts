/**
 * Vendors. Kept separate from products so that "Adobe の製品を横断で見る"
 * works later without re-keying every product row.
 */

export interface Company {
  id: string;
  name: string;
  /** 日本語表記が別にある場合のみ */
  nameJa?: string;
  /** モノグラム表示のフォールバック（Simple Icons に無いベンダー） */
  monogram: string;
  country?: string;
}

export const companies: Company[] = [
  { id: "microsoft", name: "Microsoft", monogram: "MS", country: "US" },
  { id: "salesforce", name: "Salesforce", monogram: "SF", country: "US" },
  { id: "adobe", name: "Adobe", monogram: "Ad", country: "US" },
  { id: "hubspot", name: "HubSpot", monogram: "HS", country: "US" },
  { id: "google", name: "Google", monogram: "Go", country: "US" },
  { id: "anaplan", name: "Anaplan", monogram: "An", country: "US" },
  { id: "twilio", name: "Twilio", monogram: "Tw", country: "US" },
  { id: "atlassian", name: "Atlassian", monogram: "At", country: "AU" },
  { id: "asana", name: "Asana", monogram: "As", country: "US" },
  { id: "cybozu", name: "Cybozu", nameJa: "サイボウズ", monogram: "cy", country: "JP" },
  { id: "zendesk", name: "Zendesk", monogram: "Ze", country: "US" },
  { id: "servicenow", name: "ServiceNow", monogram: "SN", country: "US" },
  { id: "genesys", name: "Genesys", monogram: "Ge", country: "US" },
  { id: "sap", name: "SAP", monogram: "SAP", country: "DE" },
  { id: "oracle", name: "Oracle", monogram: "Or", country: "US" },
  { id: "freee", name: "freee", nameJa: "フリー", monogram: "fr", country: "JP" },
  { id: "smarthr", name: "SmartHR", monogram: "SH", country: "JP" },
  { id: "bengoshicom", name: "Bengoshi.com", nameJa: "弁護士ドットコム", monogram: "弁", country: "JP" },
];

export const companyMap: Record<string, Company> = Object.fromEntries(
  companies.map((company) => [company.id, company]),
);

export function getCompany(id: string): Company | undefined {
  return companyMap[id];
}
