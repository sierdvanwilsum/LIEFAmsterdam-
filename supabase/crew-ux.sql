-- Voer één keer uit na schema.sql en notifications.sql.
-- Bestaande tabellen en gegevens blijven behouden.
begin;

alter table public.shifts add column if not exists location text;
alter table public.tasks add column if not exists deadline_at timestamptz;
alter table public.documents add column if not exists file_name text;
alter table public.documents add column if not exists file_size bigint;
create unique index if not exists documents_no_duplicate_file
  on public.documents (shift_id, lower(file_name), file_size)
  where file_name is not null and file_size is not null;

create or replace function public.guard_task_deadline() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_manager() and new.deadline_at is distinct from old.deadline_at then
    raise exception 'Alleen managers kunnen een deadline wijzigen';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_task_deadline on public.tasks;
create trigger guard_task_deadline before update on public.tasks
for each row execute function public.guard_task_deadline();

create table if not exists public.shift_feedback (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  text text not null default '' check (length(text) <= 1000),
  liked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, shift_id)
);
create index if not exists shift_feedback_shift_idx on public.shift_feedback(shift_id);

create or replace function public.shift_has_ended(p_shift uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shifts s where s.id = p_shift
      and (s.date + s.end_time + case when s.end_time <= s.start_time
        then interval '1 day' else interval '0 day' end) < now() at time zone 'Europe/Amsterdam'
  );
$$;
revoke all on function public.shift_has_ended(uuid) from public, anon;
grant execute on function public.shift_has_ended(uuid) to authenticated;

create or replace function public.guard_shift_feedback() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id <> (select auth.uid()) or not public.shift_has_ended(new.shift_id)
    or not public.is_shift_member(new.shift_id) then
    raise exception 'Feedback kan alleen na je eigen afgeronde shift';
  end if;
  if tg_op = 'UPDATE' and (new.user_id is distinct from old.user_id
    or new.shift_id is distinct from old.shift_id or new.created_at is distinct from old.created_at) then
    raise exception 'De eigenaar of shift van feedback kan niet veranderen';
  end if;
  new.updated_at := now();
  return new;
end;
$$;
drop trigger if exists guard_shift_feedback on public.shift_feedback;
create trigger guard_shift_feedback before insert or update on public.shift_feedback
for each row execute function public.guard_shift_feedback();

alter table public.shift_feedback enable row level security;
revoke all on public.shift_feedback from anon, authenticated;
grant select, insert, update on public.shift_feedback to authenticated;
drop policy if exists "eigen feedback en manager" on public.shift_feedback;
create policy "eigen feedback en manager" on public.shift_feedback
  for select to authenticated using (user_id = (select auth.uid()) or public.is_manager());
drop policy if exists "medewerker schrijft feedback" on public.shift_feedback;
create policy "medewerker schrijft feedback" on public.shift_feedback
  for insert to authenticated with check (user_id = (select auth.uid()) and public.is_shift_member(shift_id)
    and public.shift_has_ended(shift_id));
drop policy if exists "medewerker wijzigt eigen feedback" on public.shift_feedback;
create policy "medewerker wijzigt eigen feedback" on public.shift_feedback
  for update to authenticated using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and public.is_shift_member(shift_id)
    and public.shift_has_ended(shift_id));

create table if not exists public.shift_swaps (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts(id) on delete cascade,
  from_user uuid not null references public.profiles(id) on delete cascade,
  to_user uuid references public.profiles(id) on delete set null,
  role text not null,
  note text not null default '' check (length(note) <= 300),
  status text not null default 'offered' check (status in ('offered','interested','pending','approved','rejected','withdrawn')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by uuid references public.profiles(id),
  check (to_user is null or from_user <> to_user)
);
create unique index if not exists shift_swaps_one_active_offer on public.shift_swaps(shift_id, from_user)
  where status in ('offered','interested','pending');
create index if not exists shift_swaps_shift_idx on public.shift_swaps(shift_id);
alter table public.shift_swaps enable row level security;
revoke all on public.shift_swaps from anon, authenticated;
grant select on public.shift_swaps to authenticated;
drop policy if exists "relevante dienstaanbiedingen" on public.shift_swaps;
create policy "relevante dienstaanbiedingen" on public.shift_swaps for select to authenticated
  using (public.is_manager() or from_user = (select auth.uid()) or to_user = (select auth.uid())
    or (status in ('offered','interested','pending') and exists
      (select 1 from public.shifts s where s.id = shift_id and s.published)));

create or replace function public.offer_shift_swap(p_shift uuid, p_note text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_role text; v_id uuid;
begin
  if (select auth.uid()) is null or public.is_manager() then raise exception 'Alleen medewerkers kunnen een dienst aanbieden'; end if;
  if public.shift_has_ended(p_shift) then raise exception 'Deze shift is al afgerond'; end if;
  select su.assigned_role into v_role from public.shift_signups su join public.shifts s on s.id = su.shift_id
    where su.shift_id = p_shift and su.user_id = (select auth.uid()) and su.available and s.published;
  if v_role is null then raise exception 'Alleen een ingedeelde dienst kan worden aangeboden'; end if;
  insert into public.shift_swaps (shift_id, from_user, role, note)
    values (p_shift, (select auth.uid()), v_role, left(coalesce(p_note,''),300)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.interest_shift_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.shift_swaps%rowtype;
begin
  if (select auth.uid()) is null or public.is_manager() then raise exception 'Alleen medewerkers kunnen een dienst overnemen'; end if;
  select * into v from public.shift_swaps where id = p_swap for update;
  if not found or v.status <> 'offered' or v.to_user is not null or v.from_user = (select auth.uid())
    or public.shift_has_ended(v.shift_id) then raise exception 'Deze dienst is niet meer beschikbaar'; end if;
  if exists (select 1 from public.shift_signups where shift_id = v.shift_id and user_id = (select auth.uid()) and available)
    then raise exception 'Je bent al ingeschreven voor deze shift'; end if;
  update public.shift_swaps set to_user = (select auth.uid()), status = 'pending' where id = p_swap;
end;
$$;

create or replace function public.withdraw_shift_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.shift_swaps set status = 'withdrawn' where id = p_swap
    and from_user = (select auth.uid()) and status in ('offered','pending');
  if not found then raise exception 'Dit aanbod kan niet worden ingetrokken'; end if;
end;
$$;

create or replace function public.reject_shift_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_manager() then raise exception 'Alleen managers kunnen een ruil afwijzen'; end if;
  update public.shift_swaps set status = 'rejected', decided_at = now(), decided_by = (select auth.uid())
    where id = p_swap and status in ('offered','pending');
  if not found then raise exception 'Deze aanvraag kan niet meer worden afgewezen'; end if;
end;
$$;

create or replace function public.approve_shift_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.shift_swaps%rowtype; v_new uuid; v_event text;
begin
  if not public.is_manager() then raise exception 'Alleen managers kunnen een ruil goedkeuren'; end if;
  select * into v from public.shift_swaps where id = p_swap for update;
  if not found or v.status <> 'pending' or v.to_user is null or public.shift_has_ended(v.shift_id)
    then raise exception 'Deze ruil kan niet meer worden goedgekeurd'; end if;
  perform 1 from public.shifts where id = v.shift_id for update;
  perform 1 from public.shift_signups where shift_id = v.shift_id and user_id = v.from_user
    and available and assigned_role = v.role for update;
  if not found then raise exception 'De oorspronkelijke indeling is gewijzigd'; end if;
  if exists (select 1 from public.shift_signups where shift_id = v.shift_id and user_id = v.to_user and available)
    then raise exception 'De vervanger is al ingeschreven'; end if;
  update public.shift_signups set available = false where shift_id = v.shift_id and user_id = v.from_user;
  insert into public.shift_signups (shift_id, user_id, available, preferred_role)
    values (v.shift_id, v.to_user, true, v.role)
    on conflict (shift_id, user_id) do update set available = true, preferred_role = v.role,
      second_preference = null, assigned_role = null;
  update public.shift_signups set assigned_role = v.role
    where shift_id = v.shift_id and user_id = v.to_user;
  update public.shift_swaps set status = 'approved', decided_at = now(), decided_by = (select auth.uid()) where id = p_swap;
  select e.title into v_event from public.events e join public.shifts s on s.event_id = e.id where s.id = v.shift_id;
  perform public.enqueue_crew_notification(v.from_user, 'shift_changed', 'Dienst overgenomen',
    coalesce(v_event,'Event') || ' · je dienst is overgenomen.', '/notifications',
    'swap_original:' || v.id);
end;
$$;
revoke all on function public.offer_shift_swap(uuid,text), public.interest_shift_swap(uuid),
  public.withdraw_shift_swap(uuid), public.reject_shift_swap(uuid), public.approve_shift_swap(uuid) from public, anon;
grant execute on function public.offer_shift_swap(uuid,text), public.interest_shift_swap(uuid),
  public.withdraw_shift_swap(uuid), public.reject_shift_swap(uuid), public.approve_shift_swap(uuid) to authenticated;

create or replace function public.notify_shift_announcement() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_event text; v_event_id uuid; v_person record;
begin
  if new.published and nullif(trim(new.announcement), '') is not null
    and new.announcement is distinct from old.announcement then
    select id, title into v_event_id, v_event from public.events where id = new.event_id;
    for v_person in select user_id from public.shift_signups where shift_id = new.id and available loop
      perform public.enqueue_crew_notification(v_person.user_id, 'event_announcements',
        'Belangrijk · ' || coalesce(v_event, 'Event'), new.announcement,
        '/events/' || v_event_id || '/shifts/' || new.id,
        'announcement:' || new.id || ':' || txid_current());
    end loop;
  end if;
  return new;
end;
$$;

do $$
declare v_table text;
begin
  foreach v_table in array array['documents','shifts','shift_roles','shift_signups','shift_swaps','shift_feedback'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime'
      and schemaname = 'public' and tablename = v_table) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end $$;

commit;
