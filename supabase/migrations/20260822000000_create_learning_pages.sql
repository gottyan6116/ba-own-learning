-- ============================================================================
-- learning_pages — AI が構造化した学習ページ
--
-- notes / projects と同じ所有者パターン（RLS: auth.uid() = user_id）。
--
-- 設計上の要点:
-- - source_text（AI 変換前の原文）を必ず保存する。AI の解釈ミスを後から
--   確認でき、再生成もできる。これが無いと構造化結果を検証する術が消える。
-- - visualization_data は jsonb。可視化の形はこれから増える想定なので、
--   列を増やさずに済むようにしている。形の検証はアプリ側の責務。
-- - schema_version は、可視化スキーマを変えたときに古い行を判別するため。
-- - business_area / system_category / product_key は notes と同じく
--   外部キーにしない。マスターは Git 管理の TypeScript 側にあるため。
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.learning_pages (
  id                 uuid primary key default gen_random_uuid(),
  user_id            uuid not null references auth.users (id) on delete cascade,

  title              text not null default '',
  source_text        text not null default '',
  summary            text not null default '',

  visualization_type text not null
                       check (visualization_type in ('flow', 'comparison', 'summary')),
  visualization_data jsonb not null default '{}'::jsonb,

  key_points         jsonb not null default '[]'::jsonb,
  related_concepts   jsonb not null default '[]'::jsonb,

  business_area      text,
  system_category    text,
  product_key        text,

  -- 案件・メモは消えてもこの学習ページ自体は残す（紐付けだけ外れる）
  project_id         uuid references public.projects (id) on delete set null,
  source_note_id     uuid references public.notes (id) on delete set null,

  schema_version     integer not null default 1,

  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table  public.learning_pages                    is 'AI-structured learning pages generated from free-form notes.';
comment on column public.learning_pages.source_text        is 'AI 変換前の原文。再生成と解釈ミス確認のため必須。';
comment on column public.learning_pages.visualization_type is 'flow / comparison / summary';
comment on column public.learning_pages.visualization_data is '型は visualization_type に対応。形の検証はアプリ側。';
comment on column public.learning_pages.schema_version     is '可視化スキーマのバージョン。移行時に古い行を判別する。';

-- ---------------------------------------------------------------------------
-- Indexes — 一覧は user_id + updated_at desc、関連表示は各 id での絞り込み
-- ---------------------------------------------------------------------------
create index if not exists learning_pages_user_updated_idx on public.learning_pages (user_id, updated_at desc);
create index if not exists learning_pages_system_idx       on public.learning_pages (user_id, system_category);
create index if not exists learning_pages_product_idx      on public.learning_pages (user_id, product_key);
create index if not exists learning_pages_area_idx         on public.learning_pages (user_id, business_area);
create index if not exists learning_pages_project_idx      on public.learning_pages (user_id, project_id);

-- ---------------------------------------------------------------------------
-- updated_at — notes 側で定義済みの関数を再利用する（重複定義しない）
-- ---------------------------------------------------------------------------
drop trigger if exists learning_pages_set_updated_at on public.learning_pages;
create trigger learning_pages_set_updated_at
  before update on public.learning_pages
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — 他人の学習ページは一切見えない
-- ---------------------------------------------------------------------------
alter table public.learning_pages enable row level security;

drop policy if exists "learning_pages_select_own" on public.learning_pages;
create policy "learning_pages_select_own"
  on public.learning_pages for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "learning_pages_insert_own" on public.learning_pages;
create policy "learning_pages_insert_own"
  on public.learning_pages for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "learning_pages_update_own" on public.learning_pages;
create policy "learning_pages_update_own"
  on public.learning_pages for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "learning_pages_delete_own" on public.learning_pages;
create policy "learning_pages_delete_own"
  on public.learning_pages for delete
  to authenticated
  using (auth.uid() = user_id);
