insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'exchange-evidence',
  'exchange-evidence',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "authenticated_read_exchange_evidence" on storage.objects;
drop policy if exists "authenticated_upload_exchange_evidence" on storage.objects;
drop policy if exists "authenticated_update_exchange_evidence" on storage.objects;

create policy "authenticated_read_exchange_evidence"
on storage.objects
for select
to authenticated
using (bucket_id = 'exchange-evidence');

create policy "authenticated_upload_exchange_evidence"
on storage.objects
for insert
to authenticated
with check (bucket_id = 'exchange-evidence');

create policy "authenticated_update_exchange_evidence"
on storage.objects
for update
to authenticated
using (bucket_id = 'exchange-evidence')
with check (bucket_id = 'exchange-evidence');
