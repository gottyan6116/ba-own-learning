-- ============================================================================
-- project_tasks — Tasks View と Gantt View が共有する単一のタスクデータ
--
-- Gantt 専用のデータは持たない。Tasks View も Gantt View も、この1テーブルを
-- 読み書きするだけ（表で見るか、タイムラインで見るかの違いでしかない）。
-- ============================================================================

create table if not exists public.project_tasks (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  project_id   uuid not null references public.projects (id) on delete cascade,

  title        text not null default '',
  description  text,
  status       text not null default 'todo'
                 check (status in ('todo', 'in_progress', 'blocked', 'done')),

  start_date   date,
  end_date     date,
  progress     smallint not null default 0
                 check (progress >= 0 and progress <= 100),

  sort_order   integer not null default 0,

  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),

  -- 未スケジュール（Backlog）を許すため date は両方 null 可。
  -- ただし両方入っているときは逆転期間を禁止する。
  constraint project_tasks_date_order check (
    start_date is null or end_date is null or end_date >= start_date
  )
);

comment on table  public.project_tasks           is 'Tasks View / Gantt View が共有する単一データ。Gantt 専用テーブルは作らない。';
comment on column public.project_tasks.status    is 'todo=未着手 / in_progress=進行中 / blocked=ブロック / done=完了';
comment on column public.project_tasks.progress  is '0〜100。DB 側でも範囲を強制する。';

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists project_tasks_user_project_idx on public.project_tasks (user_id, project_id);
create index if not exists project_tasks_project_sort_idx on public.project_tasks (project_id, sort_order);
create index if not exists project_tasks_project_start_idx on public.project_tasks (project_id, start_date);
create index if not exists project_tasks_project_end_idx on public.project_tasks (project_id, end_date);

-- ---------------------------------------------------------------------------
-- updated_at — projects / notes と同じトリガー関数を再利用する
-- ---------------------------------------------------------------------------
drop trigger if exists project_tasks_set_updated_at on public.project_tasks;
create trigger project_tasks_set_updated_at
  before update on public.project_tasks
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- 単純な auth.uid() = user_id だけでは、他人の project_id へ自分の
-- Task を紐づけられてしまう（project_id の所有権を検証していないため）。
-- INSERT / UPDATE では、project_id が「本当に自分の projects 行か」を
-- 追加で EXISTS 検証する。
-- ---------------------------------------------------------------------------
alter table public.project_tasks enable row level security;

drop policy if exists "project_tasks_select_own" on public.project_tasks;
create policy "project_tasks_select_own"
  on public.project_tasks for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "project_tasks_insert_own" on public.project_tasks;
create policy "project_tasks_insert_own"
  on public.project_tasks for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_tasks.project_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "project_tasks_update_own" on public.project_tasks;
create policy "project_tasks_update_own"
  on public.project_tasks for update
  to authenticated
  using (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_tasks.project_id
        and p.user_id = auth.uid()
    )
  )
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.projects p
      where p.id = project_tasks.project_id
        and p.user_id = auth.uid()
    )
  );

drop policy if exists "project_tasks_delete_own" on public.project_tasks;
create policy "project_tasks_delete_own"
  on public.project_tasks for delete
  to authenticated
  using (auth.uid() = user_id);
