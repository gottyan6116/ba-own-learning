-- Optional per-task Gantt color. Null preserves the current status-derived color.
alter table public.project_tasks
  add column if not exists bar_color text;

alter table public.project_tasks
  drop constraint if exists project_tasks_bar_color_check;

alter table public.project_tasks
  add constraint project_tasks_bar_color_check
  check (bar_color is null or bar_color in ('blue', 'purple', 'green', 'orange', 'red', 'pink'));

comment on column public.project_tasks.bar_color is 'Optional explicit Gantt bar color; null uses the task status color.';
