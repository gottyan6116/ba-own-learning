insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-library', 'project-library', false, 10485760, array['image/png', 'image/jpeg', 'image/webp', 'image/gif'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "project library select own folder" on storage.objects;
create policy "project library select own folder"
on storage.objects for select to authenticated
using (bucket_id = 'project-library' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "project library insert own folder" on storage.objects;
create policy "project library insert own folder"
on storage.objects for insert to authenticated
with check (bucket_id = 'project-library' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "project library delete own folder" on storage.objects;
create policy "project library delete own folder"
on storage.objects for delete to authenticated
using (bucket_id = 'project-library' and (storage.foldername(name))[1] = (select auth.uid()::text));
