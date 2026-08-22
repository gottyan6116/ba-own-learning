# 分析・施策・マインドマップ Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** プロジェクト統合の施策考案、ウェブマーケ分析、Mapify風の文章生成対応マインドマップを提供する。

**Architecture:** Cloudflare WorkerがURL取得・構造化生成を担当し、Next.jsが認証・保存前検証を担当する。Supabaseは分析、プロジェクト紐づけ、施策生成履歴をRLS付きで保存し、React Flowはプロジェクトごとの編集可能なグラフを表示する。

**Tech Stack:** Next.js 15, React 19, TypeScript, Supabase, Cloudflare Workers AI/Browser Run, @xyflow/react, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-23-analysis-and-mindmap-design.md`

## Global Constraints

- Vercel APIは `maxDuration = 300`、Worker呼び出しは295秒、Browser Runは60秒。
- 新規公開テーブルはRLSと所有者検証を必須とする。
- AI出力はWorkerとNext.jsの両方で許可形へ正規化する。
- 既存の分析・タスク・マインドマップを後方互換で読めるようにする。
- 新しいロジックはVitestの失敗テストから実装する。

---

### Task 1: データモデルと共有バリデータ

**Files:**
- Create: `supabase/migrations/*_add_web_marketing_and_initiatives.sql`
- Create: `src/lib/web-marketing/types.ts`, `src/lib/web-marketing/schemas.ts`, `src/lib/initiatives/types.ts`, `src/lib/initiatives/schemas.ts`
- Modify: `src/lib/supabase/types.ts`
- Test: `src/lib/web-marketing/schemas.test.ts`, `src/lib/initiatives/schemas.test.ts`

- [ ] Write failing tests that reject unknown web-analysis sections and malformed initiative priority fields.
- [ ] Run targeted Vitest files and confirm they fail because normalizers do not exist.
- [ ] Implement typed normalizers, migration tables, grants, indexes, and ownership RLS.
- [ ] Run targeted tests and typecheck.
- [ ] Apply migration to the configured production project and verify tables are exposed with RLS.

### Task 2: Worker and protected application APIs

**Files:**
- Modify: `workers/analysis-gateway/src/index.ts`, `workers/analysis-gateway/test/gateway.test.ts`
- Create: `src/app/api/web-marketing/analyze/route.ts`, `src/app/api/projects/[projectId]/initiatives/generate/route.ts`
- Modify: `src/app/api/frameworks/analyze/route.ts`
- Test: `src/lib/web-marketing/request.test.ts`, `src/lib/initiatives/schemas.test.ts`

- [ ] Write failing Worker validation tests for `web_marketing`, `initiative`, and text-to-map payloads.
- [ ] Run Worker tests and confirm missing request modes fail.
- [ ] Implement strict schemas, grounded prompts, maximum duration budgeting, and Worker validation.
- [ ] Implement Next.js authenticated routes that verify project ownership and normalize responses.
- [ ] Run Worker and app tests, then typecheck both packages.

### Task 3: Webマーケ分析と施策UI

**Files:**
- Create: `src/app/web-marketing/page.tsx`, `src/components/web-marketing/WebMarketingWorkspace.tsx`, `src/lib/web-marketing/WebMarketingProvider.tsx`, `src/lib/initiatives/ProjectInitiativesProvider.tsx`
- Modify: `src/components/layout/AppHeader.tsx`, `src/components/projects/detail/ProjectAnalysesTab.tsx`, `src/app/layout.tsx`
- Test: `src/lib/web-marketing/schemas.test.ts`, `src/lib/initiatives/schemas.test.ts`

- [ ] Write failing tests for web-analysis persistence payloads and task-ready initiative normalization.
- [ ] Implement providers and the URL-input workspace with project multi-select links.
- [ ] Rename the header label and add the Web Marketing Analysis route.
- [ ] Add project-level “施策を考案” generation, editable saved cards, and task conversion.
- [ ] Run lint, typecheck, and test suite.

### Task 4: Mapify風マインドマップ

**Files:**
- Modify: `src/components/projects/mindmap/ProjectMindMap.tsx`, `src/lib/mindmaps/types.ts`
- Create: `src/components/projects/mindmap/MindMapNode.tsx`, `src/components/projects/mindmap/MindMapToolbar.tsx`, `src/lib/mindmaps/layout.ts`, `src/lib/mindmaps/export.ts`
- Test: `src/lib/mindmaps/types.test.ts`, `src/lib/mindmaps/layout.test.ts`, `src/lib/mindmaps/export.test.ts`

- [ ] Write failing tests for tree layout, text-map normalization, and Markdown export.
- [ ] Implement the focused node renderer, hierarchy layout, keyboard actions, context menu, toolbar, and debounced persistence.
- [ ] Add authenticated text-to-map generation and replace/add flow.
- [ ] Add browser-side PNG, SVG, and Markdown export.
- [ ] Run focused tests, full test suite, lint, and typecheck.

### Task 5: Delivery verification

**Files:**
- Modify: `README.md`

- [ ] Document new migration and required Cloudflare/Vercel limits.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, Worker typecheck/test, and `npm run build`.
- [ ] Deploy the migration, Worker, Git commit, GitHub push, and Vercel production deployment.
- [ ] Verify production routes and unauthenticated gateway rejection.
