-- Storage RLS (bucket `documents`)
-- Supabase → Storage → `documents` → Policies:

-- Sadece sahibi okusun/insersin/silsin (storage.objects üzerinde)
create policy "read_own_files" on storage.objects
for select using (auth.uid() = owner);
create policy "upload_own_files" on storage.objects
for insert with check (auth.uid() = owner);
create policy "delete_own_files" on storage.objects
for delete using (auth.uid() = owner);
