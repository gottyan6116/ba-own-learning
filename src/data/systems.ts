import type { BusinessAreaId } from "./businessAreas";

/**
 * System Category — the middle layer of the knowledge map.
 *
 * 1カテゴリ = 「この業務領域で、どんな仕組みが使われているか」の1単位。
 * CRM のように複数の業務領域に登場するカテゴリは、領域ごとに別 id を持つ
 * （`crm-sales` / `crm-customer`）。同じ略称でも、営業から見た CRM と
 * カスタマーから見た CRM は、担う業務も語彙も違うため。
 */
export interface SystemCategory {
  id: string;
  /** マップ上の主表記（略称） */
  shortName: string;
  /** 正式名称（英語） */
  name: string;
  /** 日本語での呼び方 */
  nameJa: string;
  businessArea: BusinessAreaId;
  /** 一言で。Modal ヘッダーとマップの補助表示に使う */
  description: string;
  /** 主な役割 */
  functions: string[];
  /** 関連概念（略語・周辺の考え方） */
  relatedConcepts: string[];
  /** Representative Products（product id）。表示順はこの配列の順。 */
  products: string[];
  /** 混同しやすい隣接カテゴリとの線引き。理解の要になるので必須ではないが重要。 */
  distinction?: string;
}

export const systemCategories: SystemCategory[] = [
  // ── 経営・事業企画 ─────────────────────────────────────────────
  {
    id: "bi",
    shortName: "BI",
    name: "Business Intelligence",
    nameJa: "ビジネスインテリジェンス",
    businessArea: "management",
    description: "社内外に散らばった実績データを集約し、意思決定できる形に可視化する仕組み。",
    functions: [
      "データ接続・統合（ETL / ELT）",
      "データモデリング",
      "ダッシュボード",
      "定型レポートの配信",
      "アドホック分析・ドリルダウン",
      "セルフサービス分析",
    ],
    relatedConcepts: ["DWH", "データマート", "KPI", "ETL / ELT", "セルフサービスBI", "EPM"],
    products: ["power-bi", "tableau"],
    distinction: "BI は「起きたこと」を見る。EPM は「これから起こすこと」を計画する。",
  },
  {
    id: "epm",
    shortName: "EPM",
    name: "Enterprise Performance Management",
    nameJa: "経営管理・計画管理",
    businessArea: "management",
    description: "予算・予測・計画を全社で作り、実績と突き合わせて更新し続ける仕組み。",
    functions: [
      "予算編成",
      "予実管理",
      "ローリングフォーキャスト",
      "シナリオプランニング",
      "連結・配賦",
      "要員計画・販売計画",
    ],
    relatedConcepts: ["予実差異", "FP&A", "連結会計", "KPIツリー", "BI", "ERP"],
    products: ["anaplan"],
    distinction: "ERP が確定した取引の記録なら、EPM は未確定の計画を扱う。",
  },

  // ── マーケティング ─────────────────────────────────────────────
  {
    id: "cms",
    shortName: "Web / CMS",
    name: "Content Management System",
    nameJa: "コンテンツ管理・Webサイト",
    businessArea: "marketing",
    description: "Webサイトやコンテンツを、非エンジニアでも作成・更新・公開できる仕組み。",
    functions: [
      "ページ作成・編集",
      "テンプレート / コンポーネント管理",
      "公開ワークフロー・承認",
      "多言語・多サイト運用",
      "デジタルアセット管理（DAM）",
      "フォーム・ランディングページ",
    ],
    relatedConcepts: ["ヘッドレスCMS", "DAM", "LP", "SEO", "パーソナライゼーション", "MA"],
    products: ["aem-sites", "hubspot-content-hub"],
    distinction: "CMS は「見せる場所」を作る。MA は「見た人を追いかけて育てる」。",
  },
  {
    id: "analytics",
    shortName: "Analytics",
    name: "Digital Analytics",
    nameJa: "デジタル解析",
    businessArea: "marketing",
    description: "サイト・アプリ上のユーザー行動を計測し、施策の良し悪しを判断する仕組み。",
    functions: [
      "計測タグの設置とイベント設計",
      "流入チャネル分析",
      "コンバージョン計測",
      "ファネル・離脱分析",
      "セグメント分析",
      "広告媒体との連携",
    ],
    relatedConcepts: ["GA4", "タグマネージャ", "イベント", "コンバージョン", "アトリビューション", "CDP"],
    products: ["google-analytics"],
    distinction: "Analytics は「行動の集計」、CDP は「個人単位の統合と外部連携」。",
  },
  {
    id: "ma",
    shortName: "MA",
    name: "Marketing Automation",
    nameJa: "マーケティングオートメーション",
    businessArea: "marketing",
    description: "見込み顧客を獲得・育成し、適切なタイミングで営業につなげる仕組み。",
    functions: [
      "Lead Management",
      "Form",
      "Landing Page",
      "Email Marketing",
      "Lead Nurturing",
      "Lead Scoring",
      "Campaign Management",
      "Attribution",
      "Sales Handoff",
    ],
    relatedConcepts: ["Lead", "MQL", "SQL", "CRM", "SFA", "CDP", "Customer Journey"],
    products: ["adobe-marketo-engage", "hubspot-marketing-hub"],
    distinction: "MA の出口は必ず営業。MQL を SQL に渡すところまでが設計範囲。",
  },
  {
    id: "cdp",
    shortName: "CDP",
    name: "Customer Data Platform",
    nameJa: "顧客データ基盤",
    businessArea: "marketing",
    description: "分断された顧客データを個人単位で統合し、各ツールへ配る基盤。",
    functions: [
      "データ収集（Web・アプリ・オフライン）",
      "Identity Resolution（名寄せ）",
      "統合顧客プロファイル",
      "オーディエンス作成",
      "外部ツールへの配信",
      "同意・プライバシー管理",
    ],
    relatedConcepts: ["Identity Resolution", "1st Party Data", "オーディエンス", "DMP", "MA", "Analytics"],
    products: ["segment"],
    distinction: "DMP が匿名の外部データ中心なのに対し、CDP は実名の自社データが中心。",
  },

  // ── 営業 ───────────────────────────────────────────────────────
  {
    id: "sfa",
    shortName: "SFA",
    name: "Sales Force Automation",
    nameJa: "営業支援",
    businessArea: "sales",
    description: "商談の進捗と営業活動を記録し、受注確度と売上見込みを管理する仕組み。",
    functions: [
      "商談（Opportunity）管理",
      "パイプライン / ステージ管理",
      "活動記録（訪問・電話・メール）",
      "売上予測（Forecast）",
      "見込み顧客（Lead）の引き継ぎ",
      "営業レポート",
    ],
    relatedConcepts: ["Opportunity", "Pipeline", "Forecast", "MQL / SQL", "受注確度", "CRM"],
    products: ["salesforce-sales-cloud", "hubspot-sales-hub", "dynamics-365-sales"],
    distinction: "SFA は「案件を前に進める」。CRM は「顧客との関係を蓄積する」。同一製品が両方担うことが多い。",
  },
  {
    id: "crm-sales",
    shortName: "CRM",
    name: "Customer Relationship Management",
    nameJa: "顧客関係管理",
    businessArea: "sales",
    description: "顧客・取引先・担当者の情報と接点履歴を一元管理し、全部署で共有する仕組み。",
    functions: [
      "取引先（Account）/ 担当者（Contact）管理",
      "接点・活動履歴の蓄積",
      "顧客セグメンテーション",
      "取引履歴の参照",
      "他システムへの顧客マスタ提供",
    ],
    relatedConcepts: ["Account", "Contact", "Lead", "顧客マスタ", "名寄せ", "SFA", "MA"],
    products: ["salesforce-sales-cloud", "hubspot-smart-crm", "dynamics-365-sales"],
    distinction: "CRM が顧客の「台帳」、SFA がその上で走る「営業プロセス」。",
  },
  {
    id: "cpq",
    shortName: "CPQ",
    name: "Configure, Price, Quote",
    nameJa: "見積・価格管理",
    businessArea: "sales",
    description: "複雑な製品構成と価格ルールから、正しい見積を素早く作る仕組み。",
    functions: [
      "商品構成（Configure）",
      "価格・割引ルール（Price）",
      "見積書作成（Quote）",
      "承認フロー",
      "契約・更新管理",
      "請求システムへの引き渡し",
    ],
    relatedConcepts: ["Price Book", "割引承認", "サブスクリプション", "Order to Cash", "契約管理", "ERP"],
    products: ["agentforce-revenue-management"],
    distinction: "SFA の商談金額は概算でよいが、CPQ は請求できる精度の金額を作る。",
  },

  // ── デリバリー ─────────────────────────────────────────────────
  {
    id: "pm",
    shortName: "PM",
    name: "Project Management",
    nameJa: "プロジェクト管理",
    businessArea: "delivery",
    description: "作業をタスクに分解し、担当・期日・進捗を追跡して納期を守る仕組み。",
    functions: [
      "タスク / 課題（Issue）管理",
      "担当と期日の割り当て",
      "ボード・ガントによる進捗可視化",
      "スプリント / マイルストーン",
      "工数見積と実績",
      "依存関係とブロッカーの管理",
    ],
    relatedConcepts: ["WBS", "スプリント", "バックログ", "マイルストーン", "リソース管理", "Workflow"],
    products: ["jira", "asana"],
    distinction: "PM は「人が動く単位」を管理する。Workflow は「処理が流れる経路」を自動化する。",
  },
  {
    id: "workflow",
    shortName: "Workflow",
    name: "Workflow Automation",
    nameJa: "業務フロー自動化",
    businessArea: "delivery",
    description: "申請・承認・システム間連携といった定型処理を、人手を介さず流す仕組み。",
    functions: [
      "トリガーとアクションの定義",
      "承認フロー（多段承認・代理承認）",
      "条件分岐",
      "システム間データ連携（iPaaS）",
      "RPA（画面操作の自動化）",
      "実行ログ・エラー再実行",
    ],
    relatedConcepts: ["承認フロー", "iPaaS", "RPA", "トリガー", "コネクタ", "Low-code"],
    products: ["power-automate", "kintone"],
    distinction: "自動化の対象が「業務プロセス」なら Workflow、「アプリそのもの」なら Low-code。",
  },
  {
    id: "lowcode",
    shortName: "Low-code",
    name: "Low-code / No-code Platform",
    nameJa: "ローコード開発基盤",
    businessArea: "delivery",
    description: "現場部門が、コードをほとんど書かずに業務アプリを作れる基盤。",
    functions: [
      "データベース / アプリの定義",
      "フォーム・画面の作成",
      "権限設計（レコード / フィールド単位）",
      "外部サービス連携（API・コネクタ）",
      "スクリプトによる拡張",
    ],
    relatedConcepts: ["市民開発", "シャドーIT", "Dataverse", "内製化", "Workflow", "ERP"],
    products: ["kintone", "power-apps"],
    distinction: "Excel 台帳とスクラッチ開発の中間。作れる範囲と統制のバランスが論点になる。",
  },

  // ── カスタマー ─────────────────────────────────────────────────
  {
    id: "crm-customer",
    shortName: "CRM",
    name: "Customer Relationship Management",
    nameJa: "顧客関係管理（カスタマー視点）",
    businessArea: "customer",
    description: "既存顧客の利用状況・接点・健全性を把握し、継続と拡大につなげる仕組み。",
    functions: [
      "顧客の利用状況・契約情報の参照",
      "対応履歴の一元管理",
      "ヘルススコア / 解約リスクの把握",
      "更新・アップセルの管理",
      "顧客満足度の計測（NPS / CSAT）",
    ],
    relatedConcepts: ["チャーン", "ヘルススコア", "NPS / CSAT", "LTV", "オンボーディング", "SFA"],
    products: ["salesforce-service-cloud", "hubspot-smart-crm"],
    distinction: "営業側 CRM の関心は受注まで。カスタマー側 CRM の関心は受注後の継続。",
  },
  {
    id: "cs",
    shortName: "CS",
    name: "Customer Success",
    nameJa: "カスタマーサクセス",
    businessArea: "customer",
    description: "顧客が製品で成果を出せる状態まで能動的に伴走し、解約を防ぐ仕組み。",
    functions: [
      "オンボーディング管理",
      "利用状況モニタリング",
      "ヘルススコア算出",
      "更新・アップセル機会の検知",
      "顧客への能動的アプローチ",
      "ナレッジ提供",
    ],
    relatedConcepts: ["チャーンレート", "NRR", "オンボーディング", "ヘルススコア", "タッチモデル", "Helpdesk"],
    products: ["salesforce-service-cloud", "hubspot-service-hub", "servicenow-csm"],
    distinction: "Helpdesk は受動（来た問い合わせに答える）。CS は能動（問題になる前に動く）。",
  },
  {
    id: "helpdesk",
    shortName: "Helpdesk",
    name: "Helpdesk / Ticketing",
    nameJa: "問い合わせ管理",
    businessArea: "customer",
    description: "問い合わせをチケット化し、抜け漏れなく期限内に解決する仕組み。",
    functions: [
      "チケット起票・割り当て",
      "ステータス管理・エスカレーション",
      "SLA（応答・解決期限）管理",
      "FAQ / ナレッジベース",
      "定型応答（マクロ・テンプレート）",
      "対応品質のレポート",
    ],
    relatedConcepts: ["チケット", "SLA", "一次解決率", "ナレッジベース", "エスカレーション", "ITSM"],
    products: ["zendesk", "hubspot-service-hub", "servicenow-csm"],
    distinction: "社外顧客向けが Helpdesk / CSM、社内 IT 向けが ITSM。仕組みはほぼ同じ。",
  },
  {
    id: "contact-center",
    shortName: "Contact Center",
    name: "Contact Center",
    nameJa: "コンタクトセンター",
    businessArea: "customer",
    description: "電話を含む複数チャネルの応対を、要員と呼量の観点から運営する仕組み。",
    functions: [
      "ACD（着信呼自動分配）",
      "IVR（音声自動応答）",
      "オムニチャネル受付",
      "WFM（要員配置・シフト管理）",
      "通話録音・品質評価",
      "応答率・放棄呼のモニタリング",
    ],
    relatedConcepts: ["ACD", "IVR", "WFM", "応答率", "AHT（平均処理時間）", "CTI", "Helpdesk"],
    products: ["genesys-cloud-cx"],
    distinction: "Helpdesk がチケット中心なのに対し、こちらは「呼」と「人の稼働」が中心。",
  },

  // ── 管理・バックオフィス ───────────────────────────────────────
  {
    id: "erp",
    shortName: "ERP",
    name: "Enterprise Resource Planning",
    nameJa: "基幹業務システム",
    businessArea: "backoffice",
    description: "販売・購買・在庫・会計といった基幹業務を、ひとつのデータ基盤で統合する仕組み。",
    functions: [
      "財務会計・管理会計",
      "販売管理・受発注",
      "購買・在庫管理",
      "生産管理",
      "原価計算",
      "マスタ管理",
    ],
    relatedConcepts: ["基幹系", "Order to Cash", "Procure to Pay", "マスタデータ", "内部統制", "EPM"],
    products: ["sap-s4hana-cloud", "oracle-fusion-cloud-erp"],
    distinction: "ERP は「確定した取引の唯一の記録」。ここが崩れると全システムの数字が崩れる。",
  },
  {
    id: "accounting",
    shortName: "会計",
    name: "Accounting",
    nameJa: "会計",
    businessArea: "backoffice",
    description: "取引を仕訳として記録し、決算書と税務申告まで持っていく仕組み。",
    functions: [
      "仕訳・総勘定元帳",
      "請求書発行・債権管理",
      "経費精算",
      "月次・年次決算",
      "電子帳簿保存法 / インボイス対応",
      "税務申告連携",
    ],
    relatedConcepts: ["仕訳", "債権・債務", "決算", "インボイス制度", "電子帳簿保存法", "ERP"],
    products: ["freee-accounting"],
    distinction: "大企業は ERP の会計モジュール、中小は会計専用 SaaS という住み分けが多い。",
  },
  {
    id: "hr",
    shortName: "HR",
    name: "Human Resources",
    nameJa: "人事・労務",
    businessArea: "backoffice",
    description: "従業員情報を正として保持し、入退社手続き・給与・評価を回す仕組み。",
    functions: [
      "従業員データベース",
      "入退社・社会保険手続き",
      "勤怠管理",
      "給与計算",
      "年末調整",
      "人事評価・タレントマネジメント",
    ],
    relatedConcepts: ["労務", "勤怠", "給与", "タレントマネジメント", "従業員マスタ", "Workflow"],
    products: ["smarthr"],
    distinction: "「手続き（労務）」と「育成・配置（タレント）」は隣接するが目的が違う。",
  },
  {
    id: "contract",
    shortName: "契約管理",
    name: "Contract Lifecycle Management",
    nameJa: "契約管理",
    businessArea: "backoffice",
    description: "契約の作成・締結・保管・更新期限までを一元的に管理する仕組み。",
    functions: [
      "契約書テンプレート・作成",
      "法務レビュー・承認フロー",
      "電子署名による締結",
      "契約書の保管・検索",
      "更新・満了期限のアラート",
      "リスク条項の管理",
    ],
    relatedConcepts: ["電子署名", "CLM", "リーガルチェック", "更新期限", "タイムスタンプ", "CPQ"],
    products: ["cloudsign"],
    distinction: "CPQ が「何をいくらで売るか」を決め、契約管理が「その約束を保管し守る」。",
  },
];

export const systemCategoryMap: Record<string, SystemCategory> = Object.fromEntries(
  systemCategories.map((system) => [system.id, system]),
);

export function getSystemCategory(id: string | null | undefined): SystemCategory | undefined {
  if (!id) return undefined;
  return systemCategoryMap[id];
}

export function getSystemsByArea(areaId: BusinessAreaId | string): SystemCategory[] {
  return systemCategories.filter((system) => system.businessArea === areaId);
}
