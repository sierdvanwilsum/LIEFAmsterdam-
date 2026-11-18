-- Behoud bestaande shift_feedback-rijen en voeg een 1-5 beoordeling toe.
begin;

alter table public.shift_feedback add column if not exists rating integer;
alter table public.shift_feedback add column if not exists feedback_text text;

-- Een oud positief hartje wordt als 5 geïnterpreteerd. Een oud leeg hartje
-- had geen schaalwaarde en blijft onbeoordeeld; alle tekst en datums blijven staan.
update public.shift_feedback
set rating = 5
where rating is null and liked is true;

update public.shift_feedback
set feedback_text = text
where feedback_text is null;

alter table public.shift_feedback alter column feedback_text set default '';
alter table public.shift_feedback alter column feedback_text set not null;

alter table public.shift_feedback
  add constraint shift_feedback_rating_range check (rating between 1 and 5);
alter table public.shift_feedback
  add constraint shift_feedback_text_length check (length(feedback_text) <= 1000);

-- Vergelijk echte tijdstippen, ook tijdens de overgang naar wintertijd.
create or replace function public.shift_has_ended(p_shift uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.shifts s where s.id = p_shift
      and ((s.date + s.end_time + case when s.end_time <= s.start_time
        then interval '1 day' else interval '0 day' end) at time zone 'Europe/Amsterdam') < now()
  );
$$;

create or replace function public.guard_shift_feedback() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.user_id <> (select auth.uid()) or not public.shift_has_ended(new.shift_id)
    or not public.is_shift_member(new.shift_id) then
    raise exception 'Feedback kan alleen na je eigen afgeronde shift';
  end if;
  if new.rating is null or new.rating not between 1 and 5 then
    raise exception 'Kies een beoordeling van 1 tot 5';
  end if;
  if tg_op = 'UPDATE' and (new.user_id is distinct from old.user_id
    or new.shift_id is distinct from old.shift_id or new.created_at is distinct from old.created_at) then
    raise exception 'De eigenaar of shift van feedback kan niet veranderen';
  end if;
  new.feedback_text := coalesce(new.feedback_text, '');
  new.text := new.feedback_text;
  new.liked := true;
  new.updated_at := now();
  return new;
end;
$$;

-- Een crewmember ziet de samenstelling van een lopende shift nog steeds.
-- Na afloop zijn aanmeldingen (en dus individuele uren) alleen voor de
-- medewerker zelf en managers opvraagbaar.
drop policy if exists "crew ziet eigen shiftleden" on public.shift_signups;
create policy "crew ziet eigen shiftleden" on public.shift_signups for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_manager()
    or (public.is_shift_member(shift_id) and not public.shift_has_ended(shift_id))
  );

commit;
