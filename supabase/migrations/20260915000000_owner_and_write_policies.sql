-- Fixture synthétique : propriété par utilisateur et droits d'écriture (F-10).
-- Contrat déclaré dans supabase/access-contract.json ; vérifié par le banc Forge, jamais déduit.
-- Les lignes antérieures à cette migration reçoivent un propriétaire système : une migration qui
-- ajouterait la colonne « not null » d'un coup casserait sur toute base non vide.
alter table public.clients add column if not exists owner_id uuid;
update public.clients set owner_id = '00000000-0000-4000-8000-000000000000' where owner_id is null;
alter table public.clients alter column owner_id set not null;
alter table public.clients alter column owner_id set default auth.uid();
alter table public.clients add column if not exists synced_at timestamptz null;
drop policy if exists "clients_read_authenticated" on public.clients;
create policy "clients_select_own" on public.clients
  for select to authenticated using (owner_id = auth.uid());
create policy "clients_insert_own" on public.clients
  for insert to authenticated with check (owner_id = auth.uid());
create policy "clients_update_own" on public.clients
  for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "clients_delete_own" on public.clients
  for delete to authenticated using (owner_id = auth.uid());
