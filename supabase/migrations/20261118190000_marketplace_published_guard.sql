begin;

create or replace function public.interest_shift_swap(p_swap uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v public.shift_swaps%rowtype;
begin
  if (select auth.uid()) is null or public.is_manager() then raise exception 'Alleen medewerkers kunnen een dienst overnemen'; end if;
  select * into v from public.shift_swaps where id = p_swap for update;
  if not found or v.status <> 'offered' or v.to_user is not null or v.from_user = (select auth.uid())
    then raise exception 'Deze dienst is niet meer beschikbaar'; end if;
  perform 1 from public.shifts where id = v.shift_id and published for update;
  if not found or public.shift_has_ended(v.shift_id) then raise exception 'Deze dienst is niet meer beschikbaar'; end if;
  if exists (select 1 from public.shift_signups where shift_id = v.shift_id and user_id = (select auth.uid()) and available)
    then raise exception 'Je bent al ingeschreven voor deze shift'; end if;
  update public.shift_swaps set to_user = (select auth.uid()), status = 'pending' where id = p_swap;
end;
$$;

commit;
