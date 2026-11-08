-- LIEF Crew App. Voer dit bestand uit in de SQL Editor van het Supabase-project.
-- Nieuwe accounts krijgen altijd de rol employee. Promoveer managers uitsluitend
-- via de Supabase SQL Editor: update public.profiles set role = 'manager' where id = '...';

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null,
  role text not null default 'employee' check (role in ('employee', 'manager')),
  avatar_url text
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subtitle text,
  type text not null default 'Event',
  description text not null default '',
  location text not null default 'LIEF Amsterdam',
  start_date date not null,
  end_date date not null,
  manager_id uuid references public.profiles(id) on delete set null,
  check (end_date >= start_date)
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  required_people integer not null default 0 check (required_people >= 0),
  briefing text not null default '',
  announcement text not null default ''
);

create table if not exists public.shift_roles (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  name text not null,
  required_count integer not null check (required_count > 0),
  unique (shift_id, name)
);

create table if not exists public.shift_signups (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  preferred_role text,
  second_preference text,
  assigned_role text,
  available boolean not null default true,
  status text not null default 'aangemeld' check (status in ('aangemeld', 'bevestigd', 'niet beschikbaar')),
  created_at timestamptz not null default now(),
  unique (shift_id, user_id)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  title text not null,
  description text not null default '',
  priority text not null default 'normaal' check (priority in ('normaal', 'belangrijk', 'urgent')),
  status text not null default 'te doen' check (status in ('te doen', 'bezig', 'klaar')),
  assigned_to uuid references public.profiles(id) on delete set null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  title text not null,
  file_url text not null, -- private Storage pad: shift-id/bestandsnaam
  file_type text not null check (file_type in ('Draaiboek', 'Factsheet', 'Plattegrond', 'Briefing', 'Overig')),
  mime_type text not null default 'application/octet-stream',
  uploaded_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create index if not exists shifts_date_idx on public.shifts(date);
create index if not exists shifts_event_idx on public.shifts(event_id);
create index if not exists signups_shift_idx on public.shift_signups(shift_id);
create index if not exists signups_user_idx on public.shift_signups(user_id);
create index if not exists tasks_shift_idx on public.tasks(shift_id);
create index if not exists documents_shift_idx on public.documents(shift_id);

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''), coalesce(new.email, ''), 'employee');
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();
insert into public.profiles (id, full_name, email, role)
select id, coalesce(raw_user_meta_data ->> 'full_name', ''), coalesce(email, ''), 'employee'
from auth.users on conflict (id) do nothing;

create or replace function public.is_manager() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role = 'manager');
$$;
create or replace function public.is_shift_member(p_shift uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.shift_signups
    where shift_id = p_shift and user_id = (select auth.uid()) and available = true);
$$;
create or replace function public.shares_shift_with(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shift_signups mine
    join public.shift_signups theirs on theirs.shift_id = mine.shift_id
    where mine.user_id = (select auth.uid()) and mine.available = true
      and theirs.user_id = p_user and theirs.available = true
  );
$$;
create or replace function public.is_relevant_manager(p_user uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.events ev
    join public.shifts sh on sh.event_id = ev.id
    join public.shift_signups su on su.shift_id = sh.id
    where ev.manager_id = p_user and su.user_id = (select auth.uid()) and su.available
  ) or exists (
    select 1 from public.tasks task
    join public.shift_signups su on su.shift_id = task.shift_id
    where task.created_by = p_user and su.user_id = (select auth.uid()) and su.available
  );
$$;
create or replace function public.can_view_shift(p_shift uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.is_manager() or public.is_shift_member(p_shift);
$$;
create or replace function public.storage_shift_id(p_path text) returns uuid
language sql immutable set search_path = '' as $$
  select case when split_part(p_path, '/', 1) ~
    '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    then split_part(p_path, '/', 1)::uuid else null end;
$$;

-- Alleen totalen komen beschikbaar voor de planningskaarten; namen blijven
-- via de crewpolicy afgeschermd totdat iemand voor de shift is aangemeld.
create or replace function public.shift_occupancy()
returns table (shift_id uuid, signup_count bigint, assigned_count bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, count(x.id) filter (where x.available),
    count(x.id) filter (where x.available and x.assigned_role is not null)
  from public.shifts s left join public.shift_signups x on x.shift_id = s.id
  group by s.id;
$$;
create or replace function public.shift_role_occupancy()
returns table (shift_id uuid, role_name text, assigned_count bigint)
language sql stable security definer set search_path = '' as $$
  select r.shift_id, r.name, count(x.id)
  from public.shift_roles r left join public.shift_signups x
    on x.shift_id = r.shift_id and x.assigned_role = r.name and x.available
  group by r.shift_id, r.name;
$$;

-- Alleen de manager mag rol/toewijzing bij signups wijzigen. Medewerkers
-- kunnen uitsluitend hun eigen beschikbaarheid en voorkeuren bijwerken.
create or replace function public.guard_signup_change() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_required integer; v_count integer;
begin
  if tg_op = 'UPDATE' and (
    new.shift_id is distinct from old.shift_id or new.user_id is distinct from old.user_id
  ) then raise exception 'Verplaats een aanmelding niet naar een andere shift of gebruiker'; end if;
  if not public.is_manager() then
    if new.user_id <> (select auth.uid()) then raise exception 'Alleen eigen aanmelding toegestaan'; end if;
    if tg_op = 'INSERT' then new.assigned_role := null; end if;
    if tg_op = 'UPDATE' and (
      new.shift_id is distinct from old.shift_id or new.user_id is distinct from old.user_id
      or new.assigned_role is distinct from old.assigned_role
      or new.created_at is distinct from old.created_at
    ) then raise exception 'Deze aanmeldvelden zijn alleen voor managers'; end if;
  end if;
  if not new.available then new.assigned_role := null; end if;
  new.status := case when new.available then
    case when new.assigned_role is null then 'aangemeld' else 'bevestigd' end
    else 'niet beschikbaar' end;
  if new.available and new.preferred_role is not null and not exists (
    select 1 from public.shift_roles where shift_id = new.shift_id and name = new.preferred_role
  ) then raise exception 'Voorkeursrol bestaat niet voor deze shift'; end if;
  if new.available and new.second_preference is not null and (
    new.second_preference = new.preferred_role or not exists (
      select 1 from public.shift_roles where shift_id = new.shift_id and name = new.second_preference
    )
  ) then raise exception 'Tweede voorkeur is ongeldig'; end if;
  if new.assigned_role is not null and not exists (
    select 1 from public.shift_roles where shift_id = new.shift_id and name = new.assigned_role
  ) then raise exception 'Toegewezen rol bestaat niet voor deze shift'; end if;
  if new.assigned_role is not null and (tg_op = 'INSERT' or new.assigned_role is distinct from old.assigned_role) then
    select required_count into v_required from public.shift_roles
      where shift_id = new.shift_id and name = new.assigned_role for update;
    select count(*) into v_count from public.shift_signups
      where shift_id = new.shift_id and assigned_role = new.assigned_role and available
        and id is distinct from new.id;
    if v_count >= v_required then raise exception 'Deze rol is al vol'; end if;
  end if;
  if new.available and (tg_op = 'INSERT' or old.available = false) then
    select required_people into v_required from public.shifts where id = new.shift_id for update;
    select count(*) into v_count from public.shift_signups where shift_id = new.shift_id and available;
    if v_required is null or v_count >= v_required then raise exception 'Deze shift is vol'; end if;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_signup on public.shift_signups;
create trigger guard_signup before insert or update on public.shift_signups
for each row execute function public.guard_signup_change();

create or replace function public.guard_task_change() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.assigned_to is not null and not exists (
    select 1 from public.shift_signups where shift_id = new.shift_id
      and user_id = new.assigned_to and available
  ) then raise exception 'Taak kan alleen aan crew van deze shift worden toegewezen'; end if;
  if tg_op = 'INSERT' then
    if not public.is_manager() or new.created_by <> (select auth.uid()) then
      raise exception 'Alleen managers kunnen taken maken';
    end if;
  elsif not public.is_manager() then
    if old.status = 'klaar' then raise exception 'Een afgeronde taak kan alleen door een manager worden gewijzigd'; end if;
    if new.shift_id is distinct from old.shift_id or new.title is distinct from old.title
      or new.description is distinct from old.description or new.priority is distinct from old.priority
      or new.created_by is distinct from old.created_by or new.created_at is distinct from old.created_at
    then raise exception 'Alleen managers kunnen taakdetails wijzigen'; end if;
    if old.assigned_to is null and new.assigned_to = (select auth.uid()) then
      if new.status not in ('te doen', 'bezig') then raise exception 'Ongeldige claimstatus'; end if;
    elsif old.assigned_to = (select auth.uid()) and new.assigned_to = old.assigned_to then
      if new.status not in ('bezig', 'klaar') then raise exception 'Ongeldige taakstatus'; end if;
    else raise exception 'Deze taak is niet aan jou toegewezen'; end if;
  end if;
  if new.status = 'klaar' then
    new.completed_at := case when tg_op = 'INSERT' then now() else coalesce(old.completed_at, now()) end;
  else
    new.completed_at := null;
  end if;
  return new;
end;
$$;
drop trigger if exists guard_task_insert on public.tasks;
drop trigger if exists guard_task_update on public.tasks;
create trigger guard_task_insert before insert on public.tasks
for each row execute function public.guard_task_change();
create trigger guard_task_update before update on public.tasks
for each row execute function public.guard_task_change();

-- Het totaal benodigd personeel blijft gelijk aan de som van de rollen.
create or replace function public.sync_required_people() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_shift uuid;
begin
  if tg_op = 'DELETE' then
    v_shift := old.shift_id;
  else
    v_shift := new.shift_id;
  end if;
  update public.shifts set required_people =
    (select coalesce(sum(required_count), 0) from public.shift_roles where shift_id = v_shift)
    where id = v_shift;
  return null;
end;
$$;
drop trigger if exists sync_required_people on public.shift_roles;
create trigger sync_required_people after insert or update or delete on public.shift_roles
for each row execute function public.sync_required_people();

create or replace function public.guard_role_need() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_assigned integer;
begin
  if tg_op = 'DELETE' then
    select count(*) into v_assigned from public.shift_signups
      where shift_id = old.shift_id and assigned_role = old.name and available;
    if v_assigned > 0 then raise exception 'Een rol met ingedeelde crew kan niet worden verwijderd'; end if;
    return old;
  end if;
  if tg_op = 'UPDATE' and new.shift_id is distinct from old.shift_id then
    raise exception 'Verplaats een rol niet naar een andere shift';
  end if;
  select count(*) into v_assigned from public.shift_signups
    where shift_id = new.shift_id and assigned_role = new.name and available;
  if new.required_count < v_assigned then raise exception 'Benodigd aantal is lager dan de huidige bezetting'; end if;
  return new;
end;
$$;
drop trigger if exists guard_role_need on public.shift_roles;
create trigger guard_role_need before insert or update or delete on public.shift_roles
for each row execute function public.guard_role_need();

alter table public.profiles enable row level security;
alter table public.events enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_roles enable row level security;
alter table public.shift_signups enable row level security;
alter table public.tasks enable row level security;
alter table public.documents enable row level security;

revoke all on public.profiles, public.events, public.shifts, public.shift_roles,
  public.shift_signups, public.tasks, public.documents from anon, authenticated;
grant usage on schema public to authenticated;
grant select (id, full_name, role, avatar_url) on public.profiles to authenticated;
grant update (full_name, avatar_url) on public.profiles to authenticated;
grant select, insert, update, delete on public.events, public.shifts, public.shift_roles,
  public.shift_signups, public.tasks, public.documents to authenticated;
grant execute on function public.is_manager(), public.is_shift_member(uuid),
  public.shares_shift_with(uuid), public.is_relevant_manager(uuid), public.can_view_shift(uuid), public.storage_shift_id(text),
  public.shift_occupancy(), public.shift_role_occupancy() to authenticated;
revoke execute on function public.is_manager(), public.is_shift_member(uuid),
  public.shares_shift_with(uuid), public.is_relevant_manager(uuid), public.can_view_shift(uuid),
  public.shift_occupancy(), public.shift_role_occupancy() from public, anon;

create policy "profielen van eigen crew" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or public.is_manager() or public.shares_shift_with(id)
    or (role = 'manager' and public.is_relevant_manager(id)));
create policy "eigen profiel aanpassen" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));

create policy "events voor ingelogde crew" on public.events for select to authenticated using (true);
create policy "managers beheren events" on public.events for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "shifts voor ingelogde crew" on public.shifts for select to authenticated using (true);
create policy "managers beheren shifts" on public.shifts for all to authenticated
  using (public.is_manager()) with check (public.is_manager());
create policy "rollen voor ingelogde crew" on public.shift_roles for select to authenticated using (true);
create policy "managers beheren rollen" on public.shift_roles for all to authenticated
  using (public.is_manager()) with check (public.is_manager());

create policy "crew ziet eigen shiftleden" on public.shift_signups for select to authenticated
  using (user_id = (select auth.uid()) or public.can_view_shift(shift_id));
create policy "medewerker meldt zichzelf aan" on public.shift_signups for insert to authenticated
  with check (user_id = (select auth.uid()) or public.is_manager());
create policy "aanmelding bijwerken" on public.shift_signups for update to authenticated
  using (user_id = (select auth.uid()) or public.is_manager())
  with check (user_id = (select auth.uid()) or public.is_manager());
create policy "manager verwijdert aanmelding" on public.shift_signups for delete to authenticated
  using (public.is_manager());

create policy "shiftleden zien taken" on public.tasks for select to authenticated
  using (public.can_view_shift(shift_id));
create policy "manager maakt taken" on public.tasks for insert to authenticated
  with check (public.is_manager() and created_by = (select auth.uid()));
create policy "taken bijwerken" on public.tasks for update to authenticated
  using (public.can_view_shift(shift_id)) with check (public.can_view_shift(shift_id));
create policy "manager verwijdert taken" on public.tasks for delete to authenticated
  using (public.is_manager());

create policy "shiftleden zien documenten" on public.documents for select to authenticated
  using (public.can_view_shift(shift_id));
create policy "manager voegt documenten toe" on public.documents for insert to authenticated
  with check (public.is_manager() and uploaded_by = (select auth.uid())
    and event_id = (select event_id from public.shifts where id = shift_id)
    and split_part(file_url, '/', 1) = shift_id::text);
create policy "manager verwijdert documenten" on public.documents for delete to authenticated
  using (public.is_manager());

insert into storage.buckets (id, name, public, file_size_limit)
values ('crew-documents', 'crew-documents', false, 20971520)
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit;

create policy "shiftleden openen crewbestanden" on storage.objects for select to authenticated
  using (bucket_id = 'crew-documents'
    and public.can_view_shift(public.storage_shift_id(name)));
create policy "manager uploadt crewbestanden" on storage.objects for insert to authenticated
  with check (bucket_id = 'crew-documents' and public.is_manager()
    and public.storage_shift_id(name) is not null);
create policy "manager verwijdert crewbestanden" on storage.objects for delete to authenticated
  using (bucket_id = 'crew-documents' and public.is_manager());

do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks') then
      alter publication supabase_realtime add table public.tasks;
    end if;
  end if;
end $$;
