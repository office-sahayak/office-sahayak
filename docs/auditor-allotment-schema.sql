-- Execute in a private Supabase project (SQL Editor).
-- Do not place source Excel/CSV in this public repository.
create table if not exists public.auditor_allotment (
  id bigint generated always as identity primary key,
  registration_number text not null,
  society_name text not null,
  auditor_name text,
  source_page integer,
  allotment_year text not null default '2025-26'
);
create index if not exists auditor_allotment_registration_idx
  on public.auditor_allotment (registration_number);
alter table public.auditor_allotment enable row level security;
-- No public SELECT policy: all public/anon requests remain denied.
revoke all on public.auditor_allotment from anon, authenticated;
-- Server reads with service_role key, stored only in server environment.
