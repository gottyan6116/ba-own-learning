-- ============================================================================
-- projects — 実案件の進行管理
--
-- notes と同じ所有者パターン（RLS: auth.uid() = user_id）。
-- system_categories / product_keys は配列で持ち、Knowledge Map 側の id
-- （src/data/systems.ts, src/data/products.ts）をそのまま入れる。外部キーに
-- しないのは notes.business_area 等と同じ理由 — マスターは Git 管理の
-- TypeScript 側にあり、DB 側で参照整合性を強制する対象ではないため。
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,

  name            text not null default '',
  client          text,
  status          text not null default 'planning'
                    check (status in ('planning', 'active', 'on_hold', 'done')),
  summary         text not null default '',

  business_area     text,
  system_categories text[] not null default '{}',
  product_keys      text[] not null default '{}',

  start_date      date,
  due_date        date,

  is_archived     boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.projects                    is 'Real client/work projects, linked to the local knowledge map by id strings.';
comment on column public.projects.status             is 'planning=検討中 / active=進行中 / on_hold=保留 / done=完了';
comment on column public.projects.system_categories  is 'src/data/systems.ts の id の配列';
comment on column public.projects.product_keys       is 'src/data/products.ts の id の配列';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists projects_user_updated_idx  on public.projects (user_id, updated_at desc);
create index if not exists projects_user_archived_idx on public.projects (user_id, is_archived);
create index if not exists projects_user_status_idx   on public.projects (user_id, status);

-- ---------------------------------------------------------------------------
-- updated_at — notes 側と同じトリガー関数を再利用する
-- ---------------------------------------------------------------------------
drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
  before update on public.projects
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — 他人の案件は一切見えない
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;

drop policy if exists "projects_select_own" on public.projects;
create policy "projects_select_own"
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "projects_insert_own" on public.projects;
create policy "projects_insert_own"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "projects_update_own" on public.projects;
create policy "projects_update_own"
  on public.projects for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "projects_delete_own" on public.projects;
create policy "projects_delete_own"
  on public.projects for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- notes ←→ projects
--
-- 既存の notes テーブルに project_id を足す。null 可 — 案件と無関係の
-- 純粋な学習メモも引き続き成立する。案件を削除してもメモは消さず、
-- 紐付けだけを外す（on delete set null）。
-- ============================================================================

alter table public.notes
  add column if not exists project_id uuid references public.projects (id) on delete set null;

create index if not exists notes_project_idx on public.notes (user_id, project_id);
