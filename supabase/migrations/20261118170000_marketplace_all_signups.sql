-- Laat alle toekomstige aangemelde shifts aanbieden, ook vóór roltoewijzing.
-- Voer dit na 20261118140000_notifications_and_marketplace.sql uit.
begin;

create or replace function public.offer_shift_swap(p_shift uuid, p_note text default '') returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_role text; v_id uuid;
begin
  if (select auth.uid()) is null or public.is_manager() then raise exception 'Alleen medewerkers kunnen een dienst aanbieden'; end if;
  if public.shift_has_ended(p_shift) then raise exception 'Deze shift is al afgerond'; end if;
  select coalesce(su.assigned_role, su.preferred_role, 'Nog niet ingedeeld') into v_role
    from public.shift_signups su join public.shifts s on s.id = su.shift_id
    where su.shift_id = p_shift and su.user_id = (select auth.uid()) and su.available and s.published;
  if not found then raise exception 'Alleen een aangemelde toekomstige shift kan worden aangeboden'; end if;
  insert into public.shift_swaps (shift_id, from_user, role, note)
    values (p_shift, (select auth.uid()), v_role, left(coalesce(p_note,''),300)) returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.approve_shift_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.shift_swaps%rowtype; v_original public.shift_signups%rowtype; v_event text;
begin
  if not public.is_manager() then raise exception 'Alleen managers kunnen een ruil goedkeuren'; end if;
  select * into v from public.shift_swaps where id = p_swap for update;
  if not found or v.status <> 'pending' or v.to_user is null or public.shift_has_ended(v.shift_id)
    then raise exception 'Deze ruil kan niet meer worden goedgekeurd'; end if;
  perform 1 from public.shifts where id = v.shift_id for update;
  select * into v_original from public.shift_signups where shift_id = v.shift_id
    and user_id = v.from_user and available for update;
  if not found or coalesce(v_original.assigned_role, v_original.preferred_role, 'Nog niet ingedeeld') <> v.role
    then raise exception 'De oorspronkelijke aanmelding is gewijzigd'; end if;
  if exists (select 1 from public.shift_signups where shift_id = v.shift_id and user_id = v.to_user and available)
    then raise exception 'De vervanger is al ingeschreven'; end if;
  update public.shift_signups set available = false where shift_id = v.shift_id and user_id = v.from_user;
  insert into public.shift_signups (shift_id, user_id, available, preferred_role, second_preference)
    values (v.shift_id, v.to_user, true, v_original.preferred_role, v_original.second_preference)
    on conflict (shift_id, user_id) do update set available = true,
      preferred_role = excluded.preferred_role, second_preference = excluded.second_preference,
      assigned_role = null;
  update public.shift_signups set assigned_role = v_original.assigned_role
    where shift_id = v.shift_id and user_id = v.to_user;
  update public.shift_swaps set status = 'approved', decided_at = now(), decided_by = (select auth.uid()) where id = p_swap;
  select e.title into v_event from public.events e join public.shifts s on s.event_id = e.id where s.id = v.shift_id;
  perform public.enqueue_crew_notification(v.from_user, 'shift_changed', 'Dienst overgenomen',
    coalesce(v_event,'Event') || ' · je dienst is overgenomen.', '/notifications',
    'swap_original:' || v.id);
end;
$$;

revoke all on function public.offer_shift_swap(uuid,text), public.approve_shift_swap(uuid) from public, anon;
grant execute on function public.offer_shift_swap(uuid,text), public.approve_shift_swap(uuid) to authenticated;

commit;
