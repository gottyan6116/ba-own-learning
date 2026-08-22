create table if not exists public.web_marketing_analyses (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null, source_notes text not null default '', source_metadata jsonb not null default '{}'::jsonb,
  result_data jsonb not null default '{}'::jsonb, model text, source_fetched_at timestamptz,
  generated_at timestamptz not null default now(), regenerated_from_id uuid references public.web_marketing_analyses(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists web_marketing_analyses_user_generated_idx on public.web_marketing_analyses(user_id, generated_at desc);
create table if not exists public.web_marketing_analysis_projects (
  web_marketing_analysis_id uuid not null references public.web_marketing_analyses(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, created_at timestamptz not null default now(),
  primary key (web_marketing_analysis_id, project_id)
);
create index if not exists web_marketing_analysis_projects_project_idx on public.web_marketing_analysis_projects(project_id, web_marketing_analysis_id);
create table if not exists public.project_initiative_batches (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, source_snapshot jsonb not null default '{}'::jsonb,
  model text, created_at timestamptz not null default now()
);
create table if not exists public.project_initiatives (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade, batch_id uuid references public.project_initiative_batches(id) on delete set null,
  priority text not null check (priority in ('high','medium','low')), title text not null, summary text not null default '', rationale text not null default '',
  success_metric text not null default '', source_analysis_ids jsonb not null default '[]'::jsonb, sort_order integer not null default 0,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists project_initiatives_user_project_idx on public.project_initiatives(user_id, project_id, sort_order);
drop trigger if exists web_marketing_analyses_set_updated_at on public.web_marketing_analyses;
create trigger web_marketing_analyses_set_updated_at before update on public.web_marketing_analyses for each row execute function public.set_updated_at();
drop trigger if exists project_initiatives_set_updated_at on public.project_initiatives;
create trigger project_initiatives_set_updated_at before update on public.project_initiatives for each row execute function public.set_updated_at();
revoke all on table public.web_marketing_analyses, public.web_marketing_analysis_projects, public.project_initiative_batches, public.project_initiatives from anon, authenticated;
grant select, insert, update, delete on table public.web_marketing_analyses, public.project_initiatives to authenticated;
grant select, insert, delete on table public.web_marketing_analysis_projects to authenticated;
grant select, insert on table public.project_initiative_batches to authenticated;
alter table public.web_marketing_analyses enable row level security;
alter table public.web_marketing_analysis_projects enable row level security;
alter table public.project_initiative_batches enable row level security;
alter table public.project_initiatives enable row level security;
create policy "web_marketing_own" on public.web_marketing_analyses for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id);
create policy "web_marketing_links_own" on public.web_marketing_analysis_projects for all to authenticated using (exists(select 1 from public.web_marketing_analyses a where a.id=web_marketing_analysis_id and a.user_id=(select auth.uid())) and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid()))) with check (exists(select 1 from public.web_marketing_analyses a where a.id=web_marketing_analysis_id and a.user_id=(select auth.uid())) and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy "initiative_batches_own" on public.project_initiative_batches for all to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid()))) with check ((select auth.uid())=user_id and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
create policy "initiatives_own" on public.project_initiatives for all to authenticated using ((select auth.uid())=user_id and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid()))) with check ((select auth.uid())=user_id and exists(select 1 from public.projects p where p.id=project_id and p.user_id=(select auth.uid())));
