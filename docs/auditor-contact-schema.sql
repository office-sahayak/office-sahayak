-- Keep private; do not add anonymous/public SELECT policies.
create table if not exists public.auditor_contacts (
  id bigint generated always as identity primary key,
  employee_code text,
  auditor_name text not null,
  name_key text not null,
  designation text,
  mobile_number text not null
);
create index if not exists auditor_contacts_name_key_idx on public.auditor_contacts (name_key);
alter table public.auditor_contacts enable row level security;
revoke all on public.auditor_contacts from anon, authenticated;
