# public/logos

ここに `<companyId>.svg` を置くと、そのベンダーのマークとして最優先で使われます。
`companyId` は `src/data/companies.ts` の `id`（例: `adobe.svg` / `oracle.svg` / `cybozu.svg`）。

置いたあとに一度だけ実行してください。

    npm run gen:logos

Simple Icons は商標権者の要請で多くのブランドを削除しているため、
Adobe / Oracle / ServiceNow / Genesys / kintone / freee / SmartHR / クラウドサイン / Anaplan は
ベクターを自動取得できません。各社のブランドガイドライン配布ページから公式 SVG を取得して
ここに置くのが、いちばん確実です。

SVG は 1:1 に近い正方形で、余白の少ないシンボルマーク（ワードマークではない方）が
一覧で見たときに揃います。

## 製品単位のロゴ

`public/logos/products/<productId>.svg` を置くと、その製品だけ会社マークより優先されます。
`productId` は `src/data/products.ts` の `id`（例: `tableau.svg` / `power-bi.svg` /
`adobe-marketo-engage.svg` / `kintone.svg`）。

Tableau に Salesforce のロゴが出る、Power BI に Microsoft の4色マークが出る、というのは
「会社マークにフォールバックしている」状態です。製品ロゴを置けば解消します。
