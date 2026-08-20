-- ============================================================================
-- notes — 個人の学習メモ
--
-- Knowledge Map（business_area / system_category / product_key）と紐づく。
-- これらは Supabase 側の外部キーではなく、リポジトリ内のマスターデータ
-- (src/data/*.ts) の id を入れる text カラムにしている。
-- 理由: Knowledge のマスターは Git で履歴管理したいので DB に置かない。
-- 将来 Knowledge を DB へ移す場合は、ここを FK に昇格させる。
--
-- 個人データなので RLS 必須。自分の行だけ CRUD できる。
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.notes (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,

  title           text not null default '',
  content         text not null default '',

  business_area   text,
  system_category text,
  product_key     text,

  is_pinned       boolean not null default false,

  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table  public.notes                 is 'Personal learning notes, linked to the local knowledge map by id strings.';
comment on column public.notes.business_area   is 'src/data/businessAreas.ts の id（management / marketing / ...）';
comment on column public.notes.system_category is 'src/data/systems.ts の id（ma / sfa / erp ...）';
comment on column public.notes.product_key     is 'src/data/products.ts の id（adobe-marketo-engage ...）';

-- ---------------------------------------------------------------------------
-- Indexes — 一覧は user_id + updated_at desc、モーダルは関連 id での絞り込み
-- ---------------------------------------------------------------------------
create index if not exists notes_user_updated_idx  on public.notes (user_id, updated_at desc);
create index if not exists notes_user_pinned_idx   on public.notes (user_id, is_pinned) where is_pinned;
create index if not exists notes_system_idx        on public.notes (user_id, system_category);
create index if not exists notes_product_idx       on public.notes (user_id, product_key);
create index if not exists notes_area_idx          on public.notes (user_id, business_area);

-- ---------------------------------------------------------------------------
-- updated_at をアプリ任せにしない
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists notes_set_updated_at on public.notes;
create trigger notes_set_updated_at
  before update on public.notes
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security — 他人のメモは一切見えない
-- ---------------------------------------------------------------------------
alter table public.notes enable row level security;

drop policy if exists "notes_select_own" on public.notes;
create policy "notes_select_own"
  on public.notes for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "notes_insert_own" on public.notes;
create policy "notes_insert_own"
  on public.notes for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "notes_update_own" on public.notes;
create policy "notes_update_own"
  on public.notes for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "notes_delete_own" on public.notes;
create policy "notes_delete_own"
  on public.notes for delete
  to authenticated
  using (auth.uid() = user_id);
