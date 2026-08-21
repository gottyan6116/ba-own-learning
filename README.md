# Business Knowledge System

仕事・研修・案件・自主学習で学んだ business / marketing / sales / IT ソリューションの知識を、

```
Business Process → System Category → Product / Solution → Detailed Knowledge → Personal Notes
```

の構造で理解・保存・復習するための個人用 Knowledge System。用語辞典ではなく、
**「会社のどの業務領域で、どんなシステムが使われ、どんな製品が存在するのか」を
トップ画面だけで把握できること**を最重要要件にしている。

---

## 1. Project overview

| | |
|---|---|
| 主機能 A | **Knowledge Map** — 6つの業務領域 × システムカテゴリ × 代表製品を1枚の格子で表示。カテゴリ／製品はページ遷移せずモーダルで開く |
| 主機能 B | **Notes** — OneNote 風の3ペイン。学習メモを書き、検索し、業務領域／システム／製品に紐づける |
| 接続 | Knowledge ←→ Notes は双方向。`MA` に紐づけたメモは MA のモーダルにも出る。モーダルからその場でメモを追加できる |
| 主機能 C | **Learning** — 自由文で書いた学習メモを Cloudflare Workers AI が構造化し、フロー／比較／要約のいずれかに可視化して保存する |
| データ | Knowledge Map のマスターは **リポジトリ内の TypeScript**（Git で履歴が追える）。Supabase に入れるのは **個人データ（notes / projects / learning_pages）だけ** |

### 設計上の優先順位

1. 情報の視認性
2. 情報設計
3. UX
4. 一貫した Design System
5. 見た目の美しさ

装飾ではなく、タイポグラフィ・余白・階層・レイアウトで見せる。判断に迷ったら
`視認性 > 装飾` / `理解速度 > Animation` / `情報構造 > Card Design` / `長期運用 > 一時的な見栄え`。

---

## 2. Tech stack

- **Next.js 15**（App Router）/ **React 19** / **TypeScript**
- **Tailwind CSS v4**（`@theme` によるトークン定義、CSS 変数中心）
- **Supabase**（Postgres + Auth + Row Level Security）— Notes の永続化と認証のみ
- **@radix-ui/react-dialog** — モーダルと検索パレット（focus trap・ESC・aria を自作しないため）
- ランタイム依存はこれだけ。アイコンライブラリは入れていない（必要な SVG は直接記述）
- ベンダーマークは `simple-icons` を **devDependency** として使い、必要な分だけビルド時に
  TypeScript へ抽出する（3,300 個のアイコンを本番バンドルに入れない）

---

## 3. Architecture

```
src/
  app/
    layout.tsx              フォント / Provider / ヘッダー / モーダルの器
    page.tsx                Knowledge Map（トップ）
    notes/page.tsx          Notes
    login/page.tsx          Magic Link ログイン
    auth/callback/route.ts  PKCE コードをセッションに交換
    globals.css             デザイントークン（唯一の色定義場所）

  components/
    knowledge/
      KnowledgeMap            6領域の格子。Desktop=6列 / それ未満=積み上げ
      SystemCategoryButton    マップ上の1行。押すとモーダル
      ProductListItem         Representative Solutions の1行
      KnowledgeModal          モーダルの器（1枚だけ。Nested Modal は作らない）
      ModalHeader             どこの何を見ているかを常に先頭に出す
      SystemDetail            カテゴリ詳細（Overview / Key Functions / Products / Related / My Notes）
      ProductDetail           製品詳細（同じモーダル内で切り替え）
      RelatedNotes            関連メモ表示 + その場でメモ追加
    notes/
      NotesWorkspace          3ペインの司令塔。選択・絞り込み・作成
      NotesSidebar            Notebook（All / ピン / 業務領域 / Uncategorized）
      NotesList               タイトル・プレビュー・紐付け・更新日時
      NotesEditor             本文編集 + 自動保存 + 紐付け変更 + ピン + 削除
    search/GlobalSearch       ⌘K。領域/システム/製品/企業/メモを横断
    layout/AppHeader          ナビ・検索・認証状態
    ui/                       BrandLogo, Section, Chip, AreaBadge, TermList

  data/                      Knowledge のマスターデータ（ここが単一の情報源）
    businessAreas.ts         6つの業務領域
    systems.ts               システムカテゴリ（products を id で参照）
    products.ts              代表製品
    companies.ts             ベンダー
    index.ts                 逆引き（product→system, area→products など）
    brandLogos.generated.ts  自動生成。手で編集しない

  lib/
    knowledge/KnowledgeViewProvider.tsx  モーダルで開いている対象のスタック
    knowledge/search.ts                  Global Search のスコアリング
    notes/NotesProvider.tsx              メモの単一ストア（Map とモーダルで共有）
    notes/relations.ts                   カテゴリ／製品に紐づくメモの抽出
    supabase/                            client / server / env / types

  middleware.ts              セッション Cookie の更新のみ（認可は RLS が担う）

supabase/migrations/         notes テーブル・インデックス・トリガー・RLS
scripts/generate-brand-logos.mjs  simple-icons から必要な分だけ抽出
```

### 意図的にそうしている点

- **モーダルは常に1枚**。カテゴリ → 製品 → 戻る、はスタックで表現する。Nested Modal を作らないのは、
  「Knowledge Map のどこにいるか」の認知を壊さないため。
- **CRM は `crm-sales` と `crm-customer` に分けている**。同じ略称でも、営業から見た CRM と
  カスタマーから見た CRM は担う業務も語彙も違うため。
- **Notes のストアは1つ**。Notes ページとモーダルの関連メモが同じ配列を見るので、
  モーダルで書いたメモが即座に一覧へ反映される。
- **middleware で認可判定をしない**。データの保護は Supabase の RLS だけが担う（守りを二重化して片方が形骸化するのを避ける）。

---

## 4. Local setup

```bash
npm install
cp .env.example .env.local   # Windows PowerShell: copy .env.example .env.local
# .env.local に Supabase の値を入れる
npm run dev
```

`http://localhost:3000` を開く。Supabase 未設定でも Knowledge Map は動く（Notes だけ無効になる）。

---

## 5. Supabase setup

1. [supabase.com](https://supabase.com) でプロジェクトを作る（Free Plan で足りる）。
2. **SQL Editor** を開き、`supabase/migrations/` の SQL を**ファイル名順に**貼って実行する。
   それぞれテーブル・インデックス・`updated_at` トリガー・RLS ポリシーがまとめて作られる。

   | 順 | ファイル | 作られるもの |
   |---|---|---|
   | 1 | `20260820000000_create_notes.sql` | `notes` |
   | 2 | `20260821000000_create_projects.sql` | `projects` と `notes.project_id` |
   | 3 | `20260822000000_create_learning_pages.sql` | `learning_pages` |

   3 は 1・2 で作られる `set_updated_at()` 関数と `projects` / `notes` を参照するので、
   順番を飛ばすと失敗する。
3. **Authentication → Sign In / Providers → Email** で、Email を有効にする。
   ログインはメール＋パスワード方式（`Confirm email` はどちらでもよい）。

   - **ON（既定）**: 新規登録の直後だけ確認メールのリンクを1回踏む必要がある。以後はパスワードのみでログイン。
   - **OFF**: 登録した瞬間にログイン状態になる。1人で使う個人用ツールなら OFF のほうが摩擦がない。

   どちらでも、**Authentication → Sign In / Providers → Email → Allow new users to sign up**
   は、自分のアカウントを作り終えたら OFF にしておくことを推奨する（第三者が勝手にアカウントを
   作れる状態を残さないため）。
4. **Authentication → URL Configuration** を設定する。ここは間違えやすいので下の表のとおりに。

   | 項目 | 入れる値 | 意味 |
   |---|---|---|
   | Site URL | `https://<project>.vercel.app`（**本番のURL1つだけ**） | リダイレクト先が指定されなかったときの既定値。メール文面のリンクの土台にもなる |
   | Redirect URLs | `http://localhost:3000/auth/callback` と `https://<project>.vercel.app/auth/callback`（**両方**） | 戻り先として許可する URL の一覧。ここに無い URL へは戻れない |

   Site URL は「1つしか入らない欄」なので、**本番の URL を入れる**。
   ローカル開発は Redirect URLs 側に localhost を足しておけば通る
   （このアプリは `NEXT_PUBLIC_SITE_URL` から戻り先を明示的に渡しているため、
   ローカルでは localhost、Vercel では本番ドメインへ戻る）。

   まだデプロイしていない段階なら、Site URL に一時的に `http://localhost:3000` を入れても動く。
   デプロイしたら本番 URL に直すこと。直し忘れると、本番から送ったログインメールのリンクが
   localhost に戻ろうとして開けない。
5. **Project Settings → API** から URL と anon（publishable）キーを取得し、`.env.local` に入れる。

### RLS の確認

`Table Editor → notes → RLS enabled` になっていること、ポリシーが4つ（select / insert / update / delete）
あり、いずれも条件が `auth.uid() = user_id` であることを確認する。
これが有効な限り、他人のメモは API 経由でも取得できない。

---

## 6. Environment variables

`.env.local`（Git 管理外）に置く。`.env.example` を参照。

| 変数 | 用途 | ブラウザ露出 |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL | する（RLS で保護） |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon / publishable キー | する（RLS で保護） |
| `NEXT_PUBLIC_SITE_URL` | ログイン後の戻り先 | する |
| `CLOUDFLARE_ACCOUNT_ID` | Workers AI のアカウント | **しない（server 専用）** |
| `CLOUDFLARE_API_TOKEN` | Workers AI の API トークン | **しない（server 専用）** |

`service_role` キーはこのアプリでは一切使わない。`.env.local` に置かないこと。

Cloudflare の2つには **`NEXT_PUBLIC_` を付けてはいけない**。付けるとブラウザのバンドルに
埋め込まれ、トークンが公開される。呼び出しは `src/app/api/learning/generate/route.ts`
（server）からのみ行い、`src/lib/ai/cloudflare.ts` はブラウザから import されると
実行時に例外を投げるようにしてある。

ビルド後に漏れていないことを確認するには:

```bash
npm run build
grep -rl "$CLOUDFLARE_API_TOKEN" .next/static/   # 何も出なければ OK
```

Vercel では **Project Settings → Environment Variables** に同じ3つを設定する
（`NEXT_PUBLIC_SITE_URL` は本番ドメイン）。

---

## 7. Database migration

MVP では Supabase CLI を必須にしていない。SQL Editor に貼るだけで動く。
CLI を使う場合:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

スキーマを変えたら、`supabase/migrations/` に新しい SQL を追加し、
`src/lib/supabase/types.ts` の型も手で合わせる。

---

## 8. Development

```bash
npm run dev        # 開発サーバー
npm run lint       # ESLint
npm run typecheck  # tsc --noEmit
npm run build      # 本番ビルド
npm run gen:logos  # ベンダーマークの再生成（simple-icons から抽出）
```

---

## 9. Deployment

GitHub の `main` に push すると Vercel が本番デプロイする。
デプロイ前に Vercel 側の環境変数3つと、Supabase の Redirect URLs に本番ドメインを追加しておくこと。
これを忘れるとマジックリンクが localhost に戻ろうとして失敗する。

---

## 10. データの追加方法

Knowledge Map は DB ではなく `src/data/` の TypeScript を編集して育てる。

### 製品を1つ足す

1. ベンダーが未登録なら `src/data/companies.ts` に追加（`monogram` は2文字程度）。
2. `src/data/products.ts` に追加する。

```ts
{
  id: "adobe-analytics",          // ケバブケース。あとで変えない
  name: "Adobe Analytics",
  companyId: "adobe",
  what: "一言でこれは何か。",
  functions: ["その製品固有の用語を優先して並べる"],
  related: ["analytics", "cdp"],  // system id でも一般用語でもよい
  note: "立ち位置・使いどころを1〜2行。任意。",
}
```

3. `src/data/systems.ts` の該当カテゴリの `products` 配列に id を足す。**表示順はこの配列の順**。

### システムカテゴリを1つ足す

`src/data/systems.ts` に追加する。`businessArea` は6領域の id のいずれか。
同じ略称が別の業務領域にも出る場合は、`crm-sales` / `crm-customer` のように id を分ける。

`distinction`（隣接カテゴリとの線引き）は任意だが、理解の要になるので埋めることを推奨。

### 業務領域を足す

構造そのものの変更なので慎重に。`src/data/businessAreas.ts` に追加したうえで、
`src/app/globals.css` の `.area-<id>` にアクセント色とティントを定義し、
`@theme` の `--color-area-<id>` も足す（未定義色を画面に出さないため）。

Desktop のマップは `grid-cols-6` 固定なので、列数も合わせて変更する。

### ベンダーマーク・製品ロゴ

マークは次の優先順位で解決される（`scripts/generate-brand-logos.mjs`）。

| 優先 | 置き場所 | 用途 |
|---|---|---|
| 1 | `public/logos/products/<productId>.svg` | 製品そのもののロゴ。会社マークより優先 |
| 2 | `public/logos/<companyId>.svg` | 会社のロゴ |
| 3 | `simple-icons` の公式パス | 自動取得（CC0）。公式ブランドカラーで描画 |
| 4 | `companies.ts` の `monogram` + `brandColor` | 上のどれも無いベンダー |

SVG を置いたら `npm run gen:logos` を1回実行する。出力は `src/data/brandLogos.generated.ts`
（手で編集しない）。

**現状ベクターで入っているのは9社ぶんだけ**。Simple Icons は商標権者の要請で多くのブランドを
削除しており、Adobe / Oracle / ServiceNow / Genesys / kintone / freee / SmartHR /
クラウドサイン / Anaplan / Tableau / Power BI は自動取得できないため、ブランドカラーの
モノグラムで表示している。各社のブランドガイドラインのページから公式 SVG を落として
`public/logos/` に置けば、そのまま本物に差し替わる。

ロゴは**識別子としてのみ**使う（装飾アイコンとして使わない）。商標は各社に帰属する。

---

## 11. Visual design

色は `src/app/globals.css` の `@theme` にしかない。コンポーネントに raw hex を書かない。

3つの原則で組んでいる。

1. **下地は白。面を色で塗らない。** 淡い水色が敷かれるのは hover と選択のときだけ。
2. **上端・左端に色のバーを置かない。** 構造は罫線（`--color-rule` の太罫と
   `--color-line` のヘアライン）と、文字のウェイト・サイズ差で示す。
3. **色は2系統に分ける。**
   - **水色は差し色**（`--color-zenith` ほか）。操作できるもの — ボタン、リンク、
     フォーカスリング、選択中の行、アクティブなタブ — と、読み取ってほしい数字にだけ出す。
   - **業務領域の色**（`--color-area-*`）は**文字にだけ**出す。具体的には表頭の英字ラベル
     （`.label-area`）と、モーダル／検索結果の領域名。面・枠・バーには使わない。

Knowledge Map は「6枚のカード」ではなく「罫線で組んだ1枚の表」。列が上から下まで
つながって見えることが、この地図の読み方（業務 → システム → 製品）そのものだから。

文字色は白と淡い水色の面の両方で 4.5:1 以上を確保している。トークンを触るときは
`--color-ink-muted`（12px の補助テキストに使う）と `--color-area-*`（11px の英字ラベルに
使う）のコントラストを必ず測り直すこと。

---

## 12. 既知の制約 / 今後

- 全文検索は素朴な部分一致。メモが数千件を超えたら Supabase 側の全文検索へ寄せる。
- Notes の本文はプレーンテキスト。Markdown レンダリングは未実装。
- ダークモードは未実装（トークンは `globals.css` の1箇所に集約済みなので追加は容易）。
- Knowledge データを将来 Supabase へ移す場合は、`src/data/*` と同じ形のテーブルを作り、
  `src/data/index.ts` の逆引き関数の実装だけを差し替える想定。
