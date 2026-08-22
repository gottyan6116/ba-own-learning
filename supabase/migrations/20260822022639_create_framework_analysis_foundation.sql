-- ============================================================================
-- Framework analyses and project mind maps
--
-- AI output and the captured source are stored as jsonb intentionally. Their
-- renderer-facing shapes are checked in src/lib/frameworks/schemas.ts and the
-- Mind Map UI boundary; database constraints enforce ownership and relations.
-- ============================================================================

create extension if not exists "pgcrypto";

create table if not exists public.framework_analyses (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references auth.users (id) on delete cascade,
  company_name         text not null default '',
  source_url           text not null,
  source_notes         text not null default '',
  source_metadata      jsonb not null default '{}'::jsonb,
  framework_type       text not null
                         check (framework_type in ('3c', 'five_forces', 'swot', 'pestel', 'stp')),
  result_data          jsonb not null default '{}'::jsonb,
  model                text,
  source_fetched_at    timestamptz,
  generated_at         timestamptz not null default now(),
  regenerated_from_id  uuid references public.framework_analyses (id) on delete set null,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

comment on table public.framework_analyses is
  'Versioned AI-generated company analyses. Regeneration creates a new row and preserves the previous result.';
comment on column public.framework_analyses.source_metadata is
  'Fetched source title/excerpt/diagnostics; never render without application validation.';
comment on column public.framework_analyses.result_data is
  'AI response validated by src/lib/frameworks/schemas.ts before rendering.';
comment on column public.framework_analyses.regenerated_from_id is
  'Previous analysis version. The previous version is retained instead of overwritten.';

create index if not exists framework_analyses_user_generated_idx
  on public.framework_analyses (user_id, generated_at desc);
create index if not exists framework_analyses_regenerated_from_idx
  on public.framework_analyses (regenerated_from_id)
  where regenerated_from_id is not null;

drop trigger if exists framework_analyses_set_updated_at on public.framework_analyses;
create trigger framework_analyses_set_updated_at
  before update on public.framework_analyses
  for each row execute function public.set_updated_at();

create table if not exists public.framework_analysis_projects (
  framework_analysis_id uuid not null references public.framework_analyses (id) on delete cascade,
  project_id            uuid not null references public.projects (id) on delete cascade,
  created_at            timestamptz not null default now(),
  primary key (framework_analysis_id, project_id)
);

comment on table public.framework_analysis_projects is
  'Many-to-many links between saved framework analyses and projects.';

create index if not exists framework_analysis_projects_project_idx
  on public.framework_analysis_projects (project_id, framework_analysis_id);

create table if not exists public.project_mind_maps (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  project_id  uuid not null unique references public.projects (id) on delete cascade,
  nodes       jsonb not null default '[]'::jsonb,
  edges       jsonb not null default '[]'::jsonb,
  viewport    jsonb not null default '{"x":0,"y":0,"zoom":1}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.project_mind_maps is
  'One editable graph per project. nodes/edges/viewport are React Flow persistence payloads.';

create index if not exists project_mind_maps_user_project_idx
  on public.project_mind_maps (user_id, project_id);

drop trigger if exists project_mind_maps_set_updated_at on public.project_mind_maps;
create trigger project_mind_maps_set_updated_at
  before update on public.project_mind_maps
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Data API and RLS
-- Revoke broad defaults first, then grant only the authenticated CRUD paths.
-- The project link and mind map policies verify ownership of both sides.
-- ---------------------------------------------------------------------------
revoke all on table public.framework_analyses from anon, authenticated;
revoke all on table public.framework_analysis_projects from anon, authenticated;
revoke all on table public.project_mind_maps from anon, authenticated;

grant select, insert, update, delete on table public.framework_analyses to authenticated;
grant select, insert, delete on table public.framework_analysis_projects to authenticated;
grant select, insert, update, delete on table public.project_mind_maps to authenticated;

alter table public.framework_analyses enable row level security;
alter table public.framework_analysis_projects enable row level security;
alter table public.project_mind_maps enable row level security;

drop policy if exists "framework_analyses_select_own" on public.framework_analyses;
create policy "framework_analyses_select_own" on public.framework_analyses
  for select to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "framework_analyses_insert_own" on public.framework_analyses;
create policy "framework_analyses_insert_own" on public.framework_analyses
  for insert to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "framework_analyses_update_own" on public.framework_analyses;
create policy "framework_analyses_update_own" on public.framework_analyses
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "framework_analyses_delete_own" on public.framework_analyses;
create policy "framework_analyses_delete_own" on public.framework_analyses
  for delete to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "framework_analysis_projects_select_own" on public.framework_analysis_projects;
create policy "framework_analysis_projects_select_own" on public.framework_analysis_projects
  for select to authenticated
  using (
    exists (
      select 1 from public.framework_analyses analysis
      where analysis.id = framework_analysis_projects.framework_analysis_id
        and analysis.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.projects project
      where project.id = framework_analysis_projects.project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "framework_analysis_projects_insert_own" on public.framework_analysis_projects;
create policy "framework_analysis_projects_insert_own" on public.framework_analysis_projects
  for insert to authenticated
  with check (
    exists (
      select 1 from public.framework_analyses analysis
      where analysis.id = framework_analysis_projects.framework_analysis_id
        and analysis.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.projects project
      where project.id = framework_analysis_projects.project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "framework_analysis_projects_delete_own" on public.framework_analysis_projects;
create policy "framework_analysis_projects_delete_own" on public.framework_analysis_projects
  for delete to authenticated
  using (
    exists (
      select 1 from public.framework_analyses analysis
      where analysis.id = framework_analysis_projects.framework_analysis_id
        and analysis.user_id = (select auth.uid())
    )
    and exists (
      select 1 from public.projects project
      where project.id = framework_analysis_projects.project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "project_mind_maps_select_own" on public.project_mind_maps;
create policy "project_mind_maps_select_own" on public.project_mind_maps
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_mind_maps.project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "project_mind_maps_insert_own" on public.project_mind_maps;
create policy "project_mind_maps_insert_own" on public.project_mind_maps
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_mind_maps.project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "project_mind_maps_update_own" on public.project_mind_maps;
create policy "project_mind_maps_update_own" on public.project_mind_maps
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_mind_maps.project_id
        and project.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_mind_maps.project_id
        and project.user_id = (select auth.uid())
    )
  );

drop policy if exists "project_mind_maps_delete_own" on public.project_mind_maps;
create policy "project_mind_maps_delete_own" on public.project_mind_maps
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.projects project
      where project.id = project_mind_maps.project_id
        and project.user_id = (select auth.uid())
    )
  );
