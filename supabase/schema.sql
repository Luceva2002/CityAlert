-- =============================================================================
-- CityAlert — schema Supabase
-- Esegui in: Dashboard → SQL Editor → New query → Run
-- Idempotente: puoi rieseguirlo su un DB vuoto o parzialmente configurato.
-- =============================================================================

-- Estensioni
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles (gamification + utente)
-- Compatibile con DB nuovi e con template Supabase che ha già profiles + email.
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  display_name text,
  xp integer not null default 0 check (xp >= 0),
  coins integer not null default 0 check (coins >= 0),
  level integer not null default 1 check (level >= 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Colonne CityAlert su tabelle profiles preesistenti
alter table public.profiles add column if not exists email text;
alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists xp integer not null default 0;
alter table public.profiles add column if not exists coins integer not null default 0;
alter table public.profiles add column if not exists level integer not null default 1;
alter table public.profiles add column if not exists created_at timestamptz not null default now();
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

comment on table public.profiles is 'Profilo utente CityAlert (XP, monete, livello)';

-- -----------------------------------------------------------------------------
-- civic_reports (segnalazioni sulla mappa)
-- -----------------------------------------------------------------------------
create table if not exists public.civic_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  category text not null,
  description text not null default '' check (char_length(description) <= 250),
  latitude double precision not null check (latitude >= -90 and latitude <= 90),
  longitude double precision not null check (longitude >= -180 and longitude <= 180),
  photo_url text,
  city text,
  country text,
  address text,
  status text not null default 'open',
  rewarded boolean not null default false,
  created_at timestamptz not null default now()
);

-- Colonna status su DB preesistenti
alter table public.civic_reports add column if not exists status text not null default 'open';

-- Vincolo categorie: aggiornato con le nuove voci comunali
alter table public.civic_reports drop constraint if exists civic_reports_category_check;
alter table public.civic_reports add constraint civic_reports_category_check check (
  category in (
    'Pothole',
    'Broken fountain',
    'Overgrown',
    'Fire',
    'Streetlight out',
    'Illegal dumping',
    'Broken sidewalk',
    'Water leak',
    'Vandalism',
    'Other',
    -- legacy (segnalazioni già inserite)
    'Unmarked hazard',
    'Blocked access'
  )
);

alter table public.civic_reports drop constraint if exists civic_reports_status_check;
alter table public.civic_reports add constraint civic_reports_status_check check (
  status in ('open', 'in_progress', 'resolved')
);

comment on table public.civic_reports is 'Segnalazioni civiche geolocalizzate';

create index if not exists civic_reports_user_id_idx
  on public.civic_reports (user_id);

create index if not exists civic_reports_created_at_idx
  on public.civic_reports (created_at desc);

create index if not exists civic_reports_user_rewarded_day_idx
  on public.civic_reports (user_id, rewarded, created_at desc);

-- -----------------------------------------------------------------------------
-- report_votes (like / dislike per validare le segnalazioni)
-- Un voto per utente per segnalazione: +1 utile, -1 non valida.
-- -----------------------------------------------------------------------------
create table if not exists public.report_votes (
  report_id uuid not null references public.civic_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  value smallint not null check (value in (-1, 1)),
  created_at timestamptz not null default now(),
  primary key (report_id, user_id)
);

comment on table public.report_votes is 'Voti di validazione delle segnalazioni (+1/-1)';

create index if not exists report_votes_report_idx
  on public.report_votes (report_id);

-- -----------------------------------------------------------------------------
-- report_comments (commenti della comunità sulle segnalazioni)
-- -----------------------------------------------------------------------------
create table if not exists public.report_comments (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.civic_reports (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  body text not null check (char_length(body) between 1 and 300),
  created_at timestamptz not null default now()
);

comment on table public.report_comments is 'Commenti della comunità sulle segnalazioni';

create index if not exists report_comments_report_idx
  on public.report_comments (report_id, created_at);

-- FK verso profiles: consente l'embed PostgREST profiles(display_name)
alter table public.report_comments
  drop constraint if exists report_comments_profile_fkey;
alter table public.report_comments
  add constraint report_comments_profile_fkey
  foreign key (user_id) references public.profiles (id) on delete cascade;

-- -----------------------------------------------------------------------------
-- Vista feed: segnalazioni + aggregati sociali (like, dislike, commenti, mio voto)
-- security_invoker: applica le RLS delle tabelle sottostanti al chiamante.
-- -----------------------------------------------------------------------------
create or replace view public.civic_reports_feed
with (security_invoker = on) as
select
  r.id,
  r.user_id,
  r.category,
  r.description,
  r.latitude,
  r.longitude,
  r.photo_url,
  r.city,
  r.country,
  r.address,
  r.status,
  r.rewarded,
  r.created_at,
  coalesce((select count(*) from public.report_votes v
            where v.report_id = r.id and v.value = 1), 0)::int  as likes,
  coalesce((select count(*) from public.report_votes v
            where v.report_id = r.id and v.value = -1), 0)::int as dislikes,
  coalesce((select count(*) from public.report_comments c
            where c.report_id = r.id), 0)::int                  as comments_count,
  (select v.value from public.report_votes v
   where v.report_id = r.id and v.user_id = auth.uid())::int    as my_vote
from public.civic_reports r;

-- -----------------------------------------------------------------------------
-- Reward: XP e monete per ogni segnalazione (max 5 premiate al giorno)
-- Ritorna il profilo aggiornato + quanto è stato assegnato.
-- -----------------------------------------------------------------------------
create or replace function public.award_report(p_report_id uuid)
returns table (xp integer, coins integer, level integer, xp_awarded integer, coins_awarded integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_already boolean;
  v_today_count integer;
  v_xp_award integer := 20;
  v_coins_award integer := 5;
begin
  select r.user_id, r.rewarded into v_user_id, v_already
  from public.civic_reports r
  where r.id = p_report_id
    and r.user_id = auth.uid();

  if v_user_id is null then
    raise exception 'report not found';
  end if;

  -- Quante segnalazioni premiate oggi (limite anti-spam: 5/giorno)
  select count(*) into v_today_count
  from public.civic_reports r
  where r.user_id = v_user_id
    and r.rewarded
    and r.created_at >= date_trunc('day', now());

  if v_already or v_today_count >= 5 then
    v_xp_award := 0;
    v_coins_award := 0;
  else
    update public.civic_reports set rewarded = true where id = p_report_id;

    update public.profiles p
    set xp = p.xp + v_xp_award,
        coins = p.coins + v_coins_award,
        level = floor((p.xp + v_xp_award) / 100) + 1
    where p.id = v_user_id;
  end if;

  return query
  select p.xp, p.coins, p.level, v_xp_award, v_coins_award
  from public.profiles p
  where p.id = v_user_id;
end;
$$;

revoke execute on function public.award_report(uuid) from public, anon;
grant execute on function public.award_report(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Trigger: profilo alla registrazione
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_display_name text;
begin
  profile_display_name := coalesce(
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    split_part(coalesce(new.email, ''), '@', 1)
  );

  insert into public.profiles (id, email, display_name, xp, coins, level)
  values (new.id, new.email, profile_display_name, 0, 0, 1)
  on conflict (id) do update set
    email = coalesce(public.profiles.email, excluded.email),
    display_name = coalesce(public.profiles.display_name, excluded.display_name);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- Solo il trigger può chiamarla, mai i client REST
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Profili per utenti già registrati (se il trigger non li ha creati)
insert into public.profiles (id, email, display_name, xp, coins, level)
select
  u.id,
  u.email,
  coalesce(
    u.raw_user_meta_data->>'display_name',
    u.raw_user_meta_data->>'full_name',
    split_part(coalesce(u.email, ''), '@', 1)
  ),
  0,
  0,
  1
from auth.users u
where not exists (
  select 1 from public.profiles p where p.id = u.id
);

-- Ripara profili creati senza email (es. run precedente fallito a metà)
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null
  and u.email is not null;

-- -----------------------------------------------------------------------------
-- updated_at automatico su profiles
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.civic_reports enable row level security;
alter table public.report_votes enable row level security;
alter table public.report_comments enable row level security;

-- profiles: leggibili da tutti gli autenticati (serve per i nomi autore nei
-- commenti); la privacy della colonna email è garantita dai grant per colonna.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated"
  on public.profiles
  for select
  to authenticated
  using (true);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- civic_reports: la mappa è della comunità → tutti gli utenti autenticati
-- vedono tutte le segnalazioni (tempo reale cittadino).
drop policy if exists "civic_reports_select_own" on public.civic_reports;
drop policy if exists "civic_reports_select_all" on public.civic_reports;
create policy "civic_reports_select_all"
  on public.civic_reports
  for select
  to authenticated
  using (true);

drop policy if exists "civic_reports_insert_own" on public.civic_reports;
create policy "civic_reports_insert_own"
  on public.civic_reports
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- report_votes: tutti leggono, ognuno gestisce solo il proprio voto
drop policy if exists "report_votes_select_all" on public.report_votes;
create policy "report_votes_select_all"
  on public.report_votes
  for select
  to authenticated
  using (true);

drop policy if exists "report_votes_insert_own" on public.report_votes;
create policy "report_votes_insert_own"
  on public.report_votes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "report_votes_update_own" on public.report_votes;
create policy "report_votes_update_own"
  on public.report_votes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "report_votes_delete_own" on public.report_votes;
create policy "report_votes_delete_own"
  on public.report_votes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- report_comments: tutti leggono, si inserisce/cancella solo il proprio
drop policy if exists "report_comments_select_all" on public.report_comments;
create policy "report_comments_select_all"
  on public.report_comments
  for select
  to authenticated
  using (true);

drop policy if exists "report_comments_insert_own" on public.report_comments;
create policy "report_comments_insert_own"
  on public.report_comments
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "report_comments_delete_own" on public.report_comments;
create policy "report_comments_delete_own"
  on public.report_comments
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- -----------------------------------------------------------------------------
-- Realtime: nuove segnalazioni push verso i client connessi
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'civic_reports'
  ) then
    alter publication supabase_realtime add table public.civic_reports;
  end if;
exception
  when undefined_object then
    -- publication assente (istanza self-hosted senza realtime): ignora
    null;
end;
$$;

-- -----------------------------------------------------------------------------
-- Storage: bucket foto segnalazioni (path: {user_id}/{uuid}.ext)
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'civic-photos',
  'civic-photos',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Upload solo nella propria cartella
drop policy if exists "civic_photos_insert_own" on storage.objects;
create policy "civic_photos_insert_own"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'civic-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Lettura: il bucket è pubblico, gli URL da getPublicUrl funzionano senza
-- policy SELECT. Nessuna policy broad → i client non possono listare i file.
drop policy if exists "civic_photos_select_public" on storage.objects;

-- Update/delete solo propri file (upsert / rimozione)
drop policy if exists "civic_photos_update_own" on storage.objects;
create policy "civic_photos_update_own"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'civic-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'civic-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "civic_photos_delete_own" on storage.objects;
create policy "civic_photos_delete_own"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'civic-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- -----------------------------------------------------------------------------
-- Grant (ruoli Supabase)
-- -----------------------------------------------------------------------------
grant usage on schema public to postgres, anon, authenticated, service_role;

-- profiles: grant per colonna → email mai leggibile dagli altri utenti,
-- xp/coins/level modificabili solo dalla RPC award_report (security definer).
revoke select, update, insert, delete on table public.profiles from authenticated;
grant select (id, display_name, xp, coins, level, created_at)
  on table public.profiles to authenticated;
grant update (display_name) on table public.profiles to authenticated;

grant select, insert on table public.civic_reports to authenticated;
grant select, insert, update, delete on table public.report_votes to authenticated;
grant select, insert, delete on table public.report_comments to authenticated;
grant select on public.civic_reports_feed to authenticated;

grant all on table public.profiles to service_role;
grant all on table public.civic_reports to service_role;
grant all on table public.report_votes to service_role;
grant all on table public.report_comments to service_role;
