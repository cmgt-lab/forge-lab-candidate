-- Fixture synthétique : table clients avec RLS.
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  field_x text null,
  created_at timestamptz not null default now()
);
alter table public.clients enable row level security;
create policy "clients_read_authenticated" on public.clients
  for select to authenticated using (true);
