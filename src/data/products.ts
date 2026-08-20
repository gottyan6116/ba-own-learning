/**
 * Representative Products / Solutions.
 *
 * 「代表的な製品」であって網羅リストではない。1カテゴリにつき、その領域を
 * 理解するために名前を知っておくべきものだけを置く。
 *
 * `functions` は製品固有の用語（覚えるべき固有名詞）を優先して並べる。
 * カテゴリ一般の機能は systems.ts 側に書く。
 */

export interface Product {
  id: string;
  name: string;
  companyId: string;
  /** 一言で「これは何か」 */
  what: string;
  /** 主な機能・その製品固有の用語 */
  functions: string[];
  /** 関連する概念・連携先（system id、または一般用語の文字列） */
  related: string[];
  /** 補足メモ（立ち位置・使いどころ）。1〜2行。 */
  note?: string;
}

export const products: Product[] = [
  // ── 経営・事業企画 ──────────────────────────────────────────────
  {
    id: "power-bi",
    name: "Power BI",
    companyId: "microsoft",
    what: "Microsoft 365 / Azure と密結合した BI・可視化プラットフォーム。",
    functions: [
      "Power Query（データ取得・整形）",
      "データモデル / リレーション",
      "DAX（計算式言語）",
      "Report / Dashboard",
      "Workspace と共有",
      "Power BI Service（クラウド配信）",
    ],
    related: ["bi", "erp", "Excel", "Azure", "Microsoft Fabric"],
    note: "Excel 資産と Microsoft 環境がある企業では第一候補になりやすい。",
  },
  {
    id: "tableau",
    name: "Tableau",
    companyId: "salesforce",
    what: "探索的なデータ可視化に強い BI プラットフォーム。Salesforce 傘下。",
    functions: [
      "Worksheet / Dashboard / Story",
      "Tableau Prep（データ整形）",
      "Tableau Server / Cloud",
      "計算フィールド",
      "ビジュアル分析（ドリルダウン）",
    ],
    related: ["bi", "crm-sales"],
    note: "「分析者が手で掘る」用途に強い。定型レポート配信では Power BI と競合する。",
  },
  {
    id: "anaplan",
    name: "Anaplan",
    companyId: "anaplan",
    what: "計画・予算・予測を全社横断でつなぐ EPM（連結計画）プラットフォーム。",
    functions: [
      "多次元モデル（Hyperblock）",
      "予算・予実管理",
      "需要予測 / 販売計画",
      "要員計画・人件費計画",
      "シナリオプランニング",
    ],
    related: ["epm", "bi", "erp"],
    note: "BI が「実績の可視化」なのに対し、EPM は「計画そのものの作成と更新」が主目的。",
  },

  // ── マーケティング ────────────────────────────────────────────
  {
    id: "aem-sites",
    name: "Adobe Experience Manager Sites",
    companyId: "adobe",
    what: "大規模サイトの多言語・多ブランド運用を前提としたエンタープライズ CMS。",
    functions: [
      "Page / Template / Component",
      "Assets（DAM）",
      "Multi Site Manager（多言語・多地域展開）",
      "Workflow / 承認",
      "パーソナライゼーション連携",
    ],
    related: ["cms", "ma", "cdp"],
    note: "サイト本数と翻訳運用が多い企業向け。小規模には過剰になりやすい。",
  },
  {
    id: "hubspot-content-hub",
    name: "Content Hub",
    companyId: "hubspot",
    what: "HubSpot の CRM と同一基盤上で動く CMS。旧 CMS Hub。",
    functions: [
      "Website / Landing Page",
      "Blog",
      "Smart Content（属性別の出し分け）",
      "フォームと CRM の直結",
      "SEO レコメンデーション",
    ],
    related: ["cms", "ma", "crm-sales"],
    note: "CMS と MA と CRM が同じ顧客レコードを見るのが最大の特徴。",
  },
  {
    id: "google-analytics",
    name: "Google Analytics",
    companyId: "google",
    what: "サイト・アプリの行動計測とレポーティングの事実上の標準。現行は GA4。",
    functions: [
      "イベントベース計測（GA4）",
      "コンバージョン / キーイベント",
      "探索レポート",
      "オーディエンス",
      "Google 広告 / BigQuery 連携",
    ],
    related: ["analytics", "cdp", "Google Tag Manager", "Looker Studio"],
    note: "GA4 はセッション単位ではなくイベント単位。UA 時代の指標感覚を引きずらない。",
  },
  {
    id: "adobe-marketo-engage",
    name: "Adobe Marketo Engage",
    companyId: "adobe",
    what: "BtoB のリード獲得・育成に強いマーケティングオートメーションプラットフォーム。",
    functions: [
      "Person / Lead 管理",
      "Anonymous / Known Person",
      "Smart Campaign（トリガー・バッチ）",
      "Smart List（動的セグメント）",
      "Program（施策の器）",
      "Form / Landing Page",
      "Email",
      "Munchkin（行動トラッキング JS）",
      "Lead Scoring",
    ],
    related: ["ma", "crm-sales", "sfa", "cdp", "Adobe Analytics"],
    note: "Program と Smart Campaign の関係を掴めると、設計が一気に読めるようになる。",
  },
  {
    id: "hubspot-marketing-hub",
    name: "Marketing Hub",
    companyId: "hubspot",
    what: "CRM 一体型の MA。中堅・成長企業での導入が多い。",
    functions: [
      "Contact / List",
      "Form / Landing Page",
      "Email Marketing",
      "Workflow（自動化）",
      "Lead Scoring",
      "Campaign / Attribution レポート",
    ],
    related: ["ma", "cms", "crm-sales"],
    note: "Marketo が「設計の自由度」なら、こちらは「立ち上がりの速さ」。",
  },
  {
    id: "segment",
    name: "Segment",
    companyId: "twilio",
    what: "各チャネルの顧客イベントを一箇所で受け、他ツールへ配る CDP。",
    functions: [
      "Source / Destination",
      "Tracking Plan",
      "Identity Resolution",
      "Audience",
      "リアルタイム配信",
    ],
    related: ["cdp", "analytics", "ma", "crm-sales"],
    note: "「計測タグを各ツールに個別実装する」問題を、1本の受け口に集約して解く。",
  },

  // ── 営業 ──────────────────────────────────────────────────────
  {
    id: "salesforce-sales-cloud",
    name: "Sales Cloud",
    companyId: "salesforce",
    what: "商談・パイプライン管理の代表格。SFA と CRM の両方を担う。",
    functions: [
      "Lead / Account / Contact / Opportunity",
      "Stage とパイプライン",
      "Forecast（売上予測）",
      "Activity（活動履歴）",
      "Report / Dashboard",
      "Flow（プロセス自動化）",
    ],
    related: ["sfa", "crm-sales", "ma", "cpq"],
    note: "Lead → Contact / Account / Opportunity への Convert が、MA との接続点になる。",
  },
  {
    id: "hubspot-sales-hub",
    name: "Sales Hub",
    companyId: "hubspot",
    what: "HubSpot の営業機能。Smart CRM 上で Deal と活動を管理する。",
    functions: [
      "Deal / Pipeline",
      "Sequence（営業メールの自動連続送信）",
      "Meeting Link",
      "Quote（見積）",
      "Forecast",
    ],
    related: ["sfa", "crm-sales", "ma"],
  },
  {
    id: "hubspot-smart-crm",
    name: "Smart CRM",
    companyId: "hubspot",
    what: "HubSpot の全 Hub が共有する顧客データ基盤。",
    functions: [
      "Contact / Company / Deal / Ticket",
      "カスタムオブジェクト",
      "Property（項目）とライフサイクルステージ",
      "Association（レコード間の関連付け）",
    ],
    related: ["crm-sales", "ma", "cs"],
    note: "Marketing / Sales / Service が同じレコードを見る構造そのものが製品価値。",
  },
  {
    id: "dynamics-365-sales",
    name: "Dynamics 365 Sales",
    companyId: "microsoft",
    what: "Microsoft の業務アプリ群に属する SFA / CRM。Dataverse 上で動く。",
    functions: [
      "Lead / Opportunity / Account",
      "Dataverse（共通データ基盤）",
      "Power Platform 連携",
      "Outlook / Teams 連携",
      "売上予測",
    ],
    related: ["sfa", "crm-sales", "lowcode", "erp"],
    note: "Power Apps / Power Automate と同じ基盤に載るのが差別化点。",
  },
  {
    id: "agentforce-revenue-management",
    name: "Agentforce Revenue Management",
    companyId: "salesforce",
    what: "見積から契約・請求までの収益プロセスを扱う Salesforce の CPQ / Revenue 領域。",
    functions: [
      "Product / Price Book",
      "Quote（見積）と承認",
      "割引ルール / 承認フロー",
      "契約・更新（Subscription）",
      "請求（Billing）連携",
    ],
    related: ["cpq", "sfa", "erp", "accounting"],
    note: "CPQ = Configure（構成）/ Price（価格）/ Quote（見積）。価格体系が複雑なほど効く。",
  },

  // ── デリバリー ────────────────────────────────────────────────
  {
    id: "jira",
    name: "Jira",
    companyId: "atlassian",
    what: "課題（Issue）単位で開発・運用作業を追跡する代表的なプロジェクト管理ツール。",
    functions: [
      "Issue / Epic / Story / Sub-task",
      "Board（Scrum / Kanban）",
      "Sprint / Backlog",
      "Workflow とステータス遷移",
      "JQL（検索言語）",
    ],
    related: ["pm", "workflow"],
    note: "「ステータス遷移をワークフローとして定義できる」ことが、単なる ToDo 管理との差。",
  },
  {
    id: "asana",
    name: "Asana",
    companyId: "asana",
    what: "非エンジニア部門を含めた業務のタスク・進行管理。",
    functions: [
      "Task / Project / Portfolio",
      "List / Board / Timeline / Calendar ビュー",
      "Rule（自動化）",
      "Goal（目標との紐付け）",
    ],
    related: ["pm", "workflow"],
    note: "Jira が開発向けなら、Asana はマーケ・制作など横断業務向き。",
  },
  {
    id: "kintone",
    name: "kintone",
    companyId: "cybozu",
    what: "業務アプリをノーコードで作れる、日本発の業務プラットフォーム。",
    functions: [
      "アプリ（業務ごとのデータベース）作成",
      "フォームとフィールド設計",
      "プロセス管理（承認フロー）",
      "アクセス権限（レコード / フィールド単位）",
      "プラグイン / JavaScript カスタマイズ",
      "REST API",
    ],
    related: ["lowcode", "workflow", "erp"],
    note: "Excel 台帳と個別 SaaS の中間を埋める。国内中堅企業での採用が厚い。",
  },
  {
    id: "power-apps",
    name: "Power Apps",
    companyId: "microsoft",
    what: "Microsoft のローコード業務アプリ開発。Dataverse をデータ基盤に使う。",
    functions: [
      "Canvas App / Model-driven App",
      "Dataverse",
      "コネクタ（各種 SaaS 接続）",
      "Power Fx（式言語）",
    ],
    related: ["lowcode", "workflow", "sfa"],
  },
  {
    id: "power-automate",
    name: "Power Automate",
    companyId: "microsoft",
    what: "業務フローの自動化。SaaS 間連携と承認フローを担う。",
    functions: [
      "クラウドフロー（トリガー / アクション）",
      "承認（Approvals）",
      "デスクトップフロー（RPA）",
      "コネクタ",
    ],
    related: ["workflow", "lowcode", "erp"],
    note: "Power Apps が「画面」、Power Automate が「処理と承認」と切り分けると理解しやすい。",
  },

  // ── カスタマー ────────────────────────────────────────────────
  {
    id: "salesforce-service-cloud",
    name: "Service Cloud",
    companyId: "salesforce",
    what: "問い合わせを Case として管理するカスタマーサービス基盤。",
    functions: [
      "Case 管理",
      "Omni-Channel ルーティング",
      "Knowledge（ナレッジ記事）",
      "Entitlement / SLA",
      "Service Console",
    ],
    related: ["cs", "crm-customer", "helpdesk", "contact-center"],
    note: "Sales Cloud と同じ Account / Contact を共有できるのが強み。",
  },
  {
    id: "hubspot-service-hub",
    name: "Service Hub",
    companyId: "hubspot",
    what: "HubSpot の Ticket ベースのカスタマーサポート機能。",
    functions: [
      "Ticket / Pipeline",
      "Inbox（共有受信箱）",
      "Knowledge Base",
      "Customer Feedback（NPS / CSAT）",
    ],
    related: ["cs", "helpdesk", "crm-customer"],
  },
  {
    id: "zendesk",
    name: "Zendesk",
    companyId: "zendesk",
    what: "チケット管理を中心に据えたカスタマーサポート専業プラットフォーム。",
    functions: [
      "Ticket / View / Trigger / Automation",
      "Help Center（FAQ）",
      "マルチチャネル受付（メール・チャット・電話）",
      "Macro（定型対応）",
      "SLA ポリシー",
    ],
    related: ["helpdesk", "cs", "contact-center"],
    note: "サポート業務の型（View・Trigger・Macro）が最初から用意されている。",
  },
  {
    id: "servicenow-csm",
    name: "Customer Service Management",
    companyId: "servicenow",
    what: "問い合わせ対応と、その背後の業務プロセスを一体で回す ServiceNow の CSM。",
    functions: [
      "Case 管理",
      "Workflow / プロセス自動化",
      "CMDB（構成管理データベース）連携",
      "ITSM との連携",
      "セルフサービスポータル",
    ],
    related: ["cs", "helpdesk", "workflow"],
    note: "「窓口だけ」でなく「原因側の業務プロセス」まで踏み込むのが特徴。",
  },
  {
    id: "genesys-cloud-cx",
    name: "Genesys Cloud CX",
    companyId: "genesys",
    what: "電話を含むオムニチャネルのコンタクトセンター基盤。",
    functions: [
      "ACD（着信呼自動分配）",
      "IVR（音声自動応答）",
      "WFM（要員管理）",
      "通話録音・品質管理",
      "オムニチャネル（音声 / チャット / メール）",
    ],
    related: ["contact-center", "cs", "crm-customer"],
    note: "Helpdesk 系との違いは、「呼量と要員の管理」が中心にあること。",
  },

  // ── 管理・バックオフィス ──────────────────────────────────────
  {
    id: "sap-s4hana-cloud",
    name: "SAP Cloud ERP / SAP S/4HANA Cloud",
    companyId: "sap",
    what: "大企業の基幹業務を統合する ERP のデファクトスタンダード。",
    functions: [
      "FI（財務会計）/ CO（管理会計）",
      "MM（購買・在庫）",
      "SD（販売管理）",
      "PP（生産計画）",
      "Fiori（UI）",
    ],
    related: ["erp", "accounting", "bi", "epm"],
    note: "モジュール略号（FI / CO / MM / SD）が会話に出てくるので、先に覚えると早い。",
  },
  {
    id: "oracle-fusion-cloud-erp",
    name: "Oracle Fusion Cloud ERP",
    companyId: "oracle",
    what: "Oracle のクラウド ERP。財務・調達・プロジェクト管理を統合する。",
    functions: [
      "General Ledger（総勘定元帳）",
      "Procurement（調達）",
      "Project Portfolio Management",
      "Risk Management",
      "EPM 連携",
    ],
    related: ["erp", "accounting", "epm"],
  },
  {
    id: "freee-accounting",
    name: "freee会計",
    companyId: "freee",
    what: "日本の中小企業向けクラウド会計。銀行明細の自動取込を軸にする。",
    functions: [
      "自動仕訳・明細取込",
      "請求書 / 経費精算",
      "決算書作成",
      "電子帳簿保存法対応",
      "API 連携",
    ],
    related: ["accounting", "erp", "contract"],
  },
  {
    id: "smarthr",
    name: "SmartHR",
    companyId: "smarthr",
    what: "入退社手続きと従業員データベースを起点にした、日本の HR SaaS。",
    functions: [
      "従業員データベース",
      "入退社・社会保険手続き",
      "年末調整",
      "労務書類の電子配布",
      "人事評価 / タレントマネジメント",
    ],
    related: ["hr", "accounting"],
    note: "「手続きの電子化」から入って「人材データの活用」へ広げる構造。",
  },
  {
    id: "cloudsign",
    name: "クラウドサイン",
    companyId: "bengoshicom",
    what: "国内シェアの高い電子契約サービス。契約の締結と管理を担う。",
    functions: [
      "電子署名 / 契約締結",
      "契約書の一元管理",
      "テンプレート",
      "承認フロー",
      "タイムスタンプ・法的要件への対応",
    ],
    related: ["contract", "accounting", "cpq"],
  },
];

export const productMap: Record<string, Product> = Object.fromEntries(
  products.map((product) => [product.id, product]),
);

export function getProduct(id: string | null | undefined): Product | undefined {
  if (!id) return undefined;
  return productMap[id];
}
