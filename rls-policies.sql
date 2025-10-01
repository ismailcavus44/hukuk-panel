-- RLS (Row Level Security) + Politikalar
alter table public.clients enable row level security;
alter table public.cases enable row level security;
alter table public.documents enable row level security;
alter table public.calculations enable row level security;

-- Genel kural: satırı oluşturan kullanıcı görür/yazar
create policy "clients_select_own" on public.clients
for select using (auth.uid() = created_by);
create policy "clients_insert_own" on public.clients
for insert with check (auth.uid() = created_by);
create policy "clients_update_own" on public.clients
for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "clients_delete_own" on public.clients
for delete using (auth.uid() = created_by);

create policy "cases_select_own" on public.cases
for select using (auth.uid() = created_by);
create policy "cases_ins_own" on public.cases
for insert with check (auth.uid() = created_by);
create policy "cases_upd_own" on public.cases
for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
create policy "cases_del_own" on public.cases
for delete using (auth.uid() = created_by);

create policy "docs_select_own" on public.documents
for select using (auth.uid() = uploaded_by);
create policy "docs_insert_own" on public.documents
for insert with check (auth.uid() = uploaded_by);
create policy "docs_delete_own" on public.documents
for delete using (auth.uid() = uploaded_by);

create policy "calcs_select_own" on public.calculations
for select using (auth.uid() = created_by);
create policy "calcs_insert_own" on public.calculations
for insert with check (auth.uid() = created_by);


