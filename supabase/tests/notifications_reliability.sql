-- Voer als postgres uit na de notificatie-migratie. Alle testdata worden teruggedraaid.
begin;

do $$
declare
  v_manager uuid;
  v_a uuid;
  v_b uuid;
  v_event uuid := gen_random_uuid();
  v_shift uuid := gen_random_uuid();
  v_task uuid := gen_random_uuid();
  v_target text;
  v_count integer;
begin
  select id into v_manager from public.profiles where role = 'manager' order by id limit 1;
  select id into v_a from public.profiles where role = 'employee' order by id limit 1;
  select id into v_b from public.profiles where role = 'employee' and id <> v_a order by id limit 1;
  if v_manager is null or v_a is null or v_b is null then
    raise exception 'Twee medewerkers en een manager zijn nodig voor deze test';
  end if;
  perform set_config('request.jwt.claim.sub', v_manager::text, true);
  insert into public.events (id, title, type, description, location, start_date, end_date, manager_id)
  values (v_event, 'Notificatietest', 'Test', '', 'LIEF Amsterdam', current_date + 1, current_date + 1, v_manager);
  insert into public.shifts (id, event_id, title, date, start_time, end_time, required_people, published)
  values (v_shift, v_event, 'Testshift', current_date + 1, '09:00', '17:00', 1, true);
  insert into public.shift_signups (shift_id, user_id, available)
  values (v_shift, v_a, true);
  v_target := '/events/' || v_event || '/shifts/' || v_shift || '?tab=tasks&task=' || v_task;

  insert into public.tasks (id, shift_id, title, description, assigned_to, created_by)
  values (v_task, v_shift, 'Eerste taak', 'Omschrijving', v_a, v_manager);
  select count(*) into v_count from public.notifications
    where user_id = v_a and category = 'new_tasks' and target_url = v_target;
  if v_count <> 1 then raise exception 'Taaktoewijzing: A kreeg % meldingen in plaats van 1', v_count; end if;
  select count(*) into v_count from public.notifications
    where user_id = v_b and category = 'new_tasks' and target_url = v_target;
  if v_count <> 0 then raise exception 'Verkeerde ontvanger B kreeg taakmelding'; end if;

  update public.tasks set title = 'Gewijzigde taak' where id = v_task;
  update public.tasks set title = 'Gewijzigde taak' where id = v_task;
  select count(*) into v_count from public.notifications
    where user_id = v_a and category = 'new_tasks' and target_url = v_target;
  if v_count <> 2 then raise exception 'Taakwijziging of ongewijzigde update leverde % meldingen op in plaats van 2', v_count; end if;

  update public.notification_preferences set new_tasks = false where user_id = v_a;
  update public.tasks set description = 'Nieuwe omschrijving' where id = v_task;
  select count(*) into v_count from public.notifications
    where user_id = v_a and category = 'new_tasks' and target_url = v_target;
  if v_count <> 3 then raise exception 'In-app melding ontbreekt als pushvoorkeur uit staat'; end if;

  update public.shifts set start_time = '10:00' where id = v_shift;
  select count(*) into v_count from public.notifications
    where user_id = v_a and category = 'shift_changed' and target_url = '/my-shifts/' || v_shift;
  if v_count <> 1 then raise exception 'Shiftwijziging niet bij A bezorgd'; end if;
  update public.shifts set announcement = 'Belangrijke mededeling' where id = v_shift;
  select count(*) into v_count from public.notifications
    where user_id = v_a and category = 'event_announcements'
      and target_url = '/events/' || v_event || '/shifts/' || v_shift;
  if v_count <> 1 then raise exception 'Mededeling heeft geen geldige shiftlink'; end if;

  perform set_config('audit.notification_target', v_target, true);
  perform set_config('audit.employee_b', v_b::text, true);
end;
$$;

set local role authenticated;
select set_config('request.jwt.claim.sub', current_setting('audit.employee_b'), true);
do $$
declare v_count integer;
begin
  select count(*) into v_count from public.notifications
  where target_url = current_setting('audit.notification_target');
  if v_count <> 0 then raise exception 'Medewerker B kan taakmeldingen van A lezen'; end if;
  begin
    select count(*) into v_count from public.push_deliveries;
    raise exception 'Medewerker B kan pushbezorgingen lezen';
  exception when insufficient_privilege then null;
  end;
end;
$$;

rollback;
