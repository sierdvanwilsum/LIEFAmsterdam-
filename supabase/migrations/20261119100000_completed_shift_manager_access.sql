-- Eigen afgeronde shifts blijven zichtbaar voor medewerkers. Het volledige
-- historische shift- en bezettingsoverzicht is uitsluitend voor managers.
begin;

drop policy if exists "shifts voor ingelogde crew" on public.shifts;
create policy "shifts voor ingelogde crew" on public.shifts
  for select to authenticated using (
    public.is_manager()
    or (published and (not public.shift_has_ended(id) or public.is_shift_member(id)))
  );

create or replace function public.shift_occupancy()
returns table (shift_id uuid, signup_count bigint, assigned_count bigint)
language sql stable security definer set search_path = '' as $$
  select s.id, count(x.id) filter (where x.available),
    count(x.id) filter (where x.available and x.assigned_role is not null)
  from public.shifts s left join public.shift_signups x on x.shift_id = s.id
  where public.is_manager() or (s.published and not public.shift_has_ended(s.id))
  group by s.id;
$$;

create or replace function public.shift_role_occupancy()
returns table (shift_id uuid, role_name text, assigned_count bigint)
language sql stable security definer set search_path = '' as $$
  select r.shift_id, r.name, count(x.id)
  from public.shift_roles r join public.shifts s on s.id = r.shift_id
  left join public.shift_signups x on x.shift_id = r.shift_id
    and x.assigned_role = r.name and x.available
  where public.is_manager() or (s.published and not public.shift_has_ended(s.id))
  group by r.shift_id, r.name;
$$;

commit;
