insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'note-images',
  'note-images',
  false,
  10485760,
  array['image/png', 'image/jpeg', 'image/webp', 'image/gif']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "note images select own folder" on storage.objects;
create policy "note images select own folder"
on storage.objects for select to authenticated
using (
  bucket_id = 'note-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "note images insert own folder" on storage.objects;
create policy "note images insert own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'note-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);

drop policy if exists "note images delete own folder" on storage.objects;
create policy "note images delete own folder"
on storage.objects for delete to authenticated
using (
  bucket_id = 'note-images'
  and (storage.foldername(name))[1] = (select auth.uid()::text)
);
