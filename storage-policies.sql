-- Storage bucket 'documents' için sıkı politika örneği
-- Not: Bu SQL'i Supabase SQL Editor'da çalıştırın.

-- Bucket private olmalı (Dashboard > Storage > documents > Private)

-- RLS: storage.objects tablosunda politikalar
alter table storage.objects enable row level security;

-- Sadece sahibi görebilsin (metadata->>'owner' = auth.uid())
create policy "documents_select_owner"
on storage.objects for select
using (
  bucket_id = 'documents'
  and (metadata ->> 'owner') is not null
  and (metadata ->> 'owner') = auth.uid()::text
);

-- Sadece sahibi yükleyebilsin
create policy "documents_insert_owner"
on storage.objects for insert
with check (
  bucket_id = 'documents'
  and (metadata ->> 'owner') is not null
  and (metadata ->> 'owner') = auth.uid()::text
);

-- Sadece sahibi silebilsin
create policy "documents_delete_owner"
on storage.objects for delete
using (
  bucket_id = 'documents'
  and (metadata ->> 'owner') is not null
  and (metadata ->> 'owner') = auth.uid()::text
);

-- İsteğe bağlı: Public erişimi tamamen kapatma (Bucket private + public policy yok)



