-- Uzantı (varsa)
create extension if not exists "pgcrypto";

create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  tc_no text,
  phone text,
  email text,
  created_by uuid not null,
  created_at timestamptz default now()
);

create table if not exists public.cases (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.clients(id) on delete set null,
  case_no text,
  title text not null,
  description text,
  status text default 'open',
  insurance_application_date timestamptz,
  countdown_expires_at timestamptz,
  is_countdown_active boolean default false,
  created_by uuid not null,
  created_at timestamptz default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete cascade,
  name text not null,
  storage_path text not null,
  mime_type text,
  uploaded_by uuid not null,
  created_at timestamptz default now()
);

do $$ begin
  create type calc_type as enum ('kidem','ihbar','fazla_mesai','hafta_tatili','faiz','deger_kaybi');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.calculations (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references public.cases(id) on delete set null,
  type calc_type not null,
  input jsonb not null,
  result jsonb not null,
  created_by uuid not null,
  created_at timestamptz default now()
);
