-- Run in Supabase SQL Editor as postgres. Fixture rows and test actions roll back.
begin;

create temporary table security_test_results (
  test text not null,
  expected text not null,
  actual text not null,
  passed boolean not null,
  adjustment text not null
);
grant select, insert on security_test_results to anon, authenticated;

do $$
declare
  v_employee_a uuid;
  v_employee_b uuid;
  v_manager uuid;
  v_event uuid := gen_random_uuid();
  v_shift uuid := gen_random_uuid();
  v_draft_shift uuid := gen_random_uuid();
  v_past_shift uuid := gen_random_uuid();
  v_task uuid := gen_random_uuid();
  v_document uuid := gen_random_uuid();
  v_swap uuid := gen_random_uuid();
  v_key text := 'security-test-' || gen_random_uuid()::text;
begin
  select id into v_employee_a from public.profiles where role = 'employee' order by id limit 1;
  select id into v_employee_b from public.profiles where role = 'employee' and id <> v_employee_a order by id limit 1;
  select id into v_manager from public.profiles where role = 'manager' order by id limit 1;

  if v_employee_a is null or v_employee_b is null or v_manager is null then
    raise exception 'Tests require two employee profiles and one manager profile';
  end if;

  perform set_config('audit.employee_a', v_employee_a::text, true);
  perform set_config('audit.employee_b', v_employee_b::text, true);
  perform set_config('audit.manager', v_manager::text, true);
  perform set_config('audit.event', v_event::text, true);
  perform set_config('audit.shift', v_shift::text, true);
  perform set_config('audit.draft_shift', v_draft_shift::text, true);
  perform set_config('audit.past_shift', v_past_shift::text, true);
  perform set_config('audit.task', v_task::text, true);
  perform set_config('audit.document', v_document::text, true);
  perform set_config('audit.swap', v_swap::text, true);
  perform set_config('audit.key', v_key, true);

  if exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r','p') and not c.relrowsecurity
  ) or not exists (
    select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'storage' and c.relname = 'objects' and c.relrowsecurity
  ) then
    raise exception 'RLS is disabled on a public table or storage.objects';
  end if;

  if coalesce((select public from storage.buckets where id = 'crew-documents'), true) then
    raise exception 'crew-documents bucket must exist and be private';
  end if;

  perform set_config('request.jwt.claim.sub', v_manager::text, true);
  insert into public.events (id, title, type, description, location, start_date, end_date, manager_id)
  values (v_event, 'Temporary security test', 'Test', '', 'Test', current_date - 2, current_date + 31, v_manager);
  insert into public.shifts (id, event_id, title, date, start_time, end_time, required_people, published)
  values
    (v_shift, v_event, 'Published security fixture', current_date + 30, '09:00', '10:00', 99, true),
    (v_draft_shift, v_event, 'Draft security fixture', current_date + 31, '09:00', '10:00', 99, false),
    (v_past_shift, v_event, 'Completed overnight fixture', current_date - 2, '17:00', '02:00', 2, true);
  insert into public.shift_roles (shift_id, name, required_count)
  values (v_past_shift, 'Bar', 1), (v_past_shift, 'Runner', 1);
  insert into public.shift_signups (shift_id, user_id, available)
  values (v_shift, v_employee_a, true);
  insert into public.shift_signups (shift_id, user_id, available, assigned_role, status)
  values (v_past_shift, v_employee_a, true, 'Bar', 'bevestigd'),
    (v_past_shift, v_employee_b, true, 'Runner', 'bevestigd');
  perform set_config('request.jwt.claim.sub', v_employee_a::text, true);
  insert into public.shift_feedback (shift_id, user_id, rating, feedback_text)
  values (v_past_shift, v_employee_a, 1, 'Eigen feedback');
  perform set_config('request.jwt.claim.sub', v_employee_b::text, true);
  insert into public.shift_feedback (shift_id, user_id, rating, feedback_text)
  values (v_past_shift, v_employee_b, 5, 'Feedback van collega');
  perform set_config('request.jwt.claim.sub', v_manager::text, true);
  insert into public.tasks (id, shift_id, title, description, created_by)
  values (v_task, v_shift, 'Temporary security task', 'Before manager update', v_manager);
  insert into public.documents (id, shift_id, event_id, title, file_url, file_type, uploaded_by)
  values (v_document, v_shift, v_event, 'Temporary security document', v_shift::text || '/security-test.pdf', 'Overig', v_manager);
  insert into storage.objects (bucket_id, name, owner_id, metadata)
  values ('crew-documents', v_shift::text || '/security-test.pdf', v_manager::text, '{"mimetype":"application/pdf","size":1}');
  insert into public.notifications (user_id, category, title, body, target_url, source_key)
  values
    (v_employee_a, 'new_shifts', 'Security test A', 'Temporary', '/notifications', v_key || '-a'),
    (v_employee_b, 'new_shifts', 'Security test B', 'Temporary', '/notifications', v_key || '-b');
  insert into public.shift_swaps (id, shift_id, from_user, to_user, role, status)
  values (v_swap, v_shift, v_employee_a, v_employee_b, 'Nog niet ingedeeld', 'pending');
end
$$;

select set_config('request.jwt.claim.sub', '', true);
set local role anon;

do $$
declare
  v_table text;
  v_count bigint;
  v_denied boolean;
begin
  foreach v_table in array array[
    'profiles','events','shifts','shift_roles','shift_signups','tasks','documents',
    'notifications','notification_preferences','shift_swaps','shift_feedback','push_subscriptions'
  ] loop
    v_denied := false;
    begin
      execute format('select count(*) from public.%I', v_table) into v_count;
      v_denied := v_count = 0;
    exception when insufficient_privilege then
      v_denied := true;
    end;
    insert into security_test_results values (
      'anon SELECT public.' || v_table, 'geen interne rijen/toegang',
      case when v_denied then 'geweigerd of 0 rijen' else v_count::text || ' rijen zichtbaar' end,
      v_denied, 'geen'
    );
  end loop;

  v_denied := false;
  begin
    execute 'select count(*) from storage.objects where bucket_id = ''crew-documents''' into v_count;
    v_denied := v_count = 0;
  exception when insufficient_privilege then
    v_denied := true;
  end;
  insert into security_test_results values (
    'anon SELECT storage.objects', 'geen crewbestanden zichtbaar',
    case when v_denied then 'geweigerd of 0 rijen' else v_count::text || ' rijen zichtbaar' end,
    v_denied, 'geen'
  );
end
$$;

reset role;
select set_config('request.jwt.claim.sub', current_setting('audit.employee_a'), true);
set local role authenticated;

do $$
declare
  v_count bigint;
  v_rows bigint;
  v_denied boolean;
  v_error text;
begin
  select count(*) into v_count from public.shifts where id = current_setting('audit.shift')::uuid;
  insert into security_test_results values ('employee A sees published shift', '1 shift', v_count::text, v_count = 1, 'geen');
  select count(*) into v_count from public.shifts where id = current_setting('audit.draft_shift')::uuid;
  insert into security_test_results values ('employee A cannot see draft shift', '0 shifts', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from public.tasks where id = current_setting('audit.task')::uuid;
  insert into security_test_results values ('employee A sees relevant task', '1 task', v_count::text, v_count = 1, 'geen');
  select count(*) into v_count from public.documents where id = current_setting('audit.document')::uuid;
  insert into security_test_results values ('employee A sees relevant document metadata', '1 document', v_count::text, v_count = 1, 'geen');
  select count(*) into v_count from storage.objects where bucket_id = 'crew-documents'
    and name = current_setting('audit.shift') || '/security-test.pdf';
  insert into security_test_results values ('employee A opens relevant shift file', '1 file row', v_count::text, v_count = 1, 'geen');
  select count(*) into v_count from public.notifications where source_key = current_setting('audit.key') || '-a';
  insert into security_test_results values ('employee A sees own notification', '1 notification', v_count::text, v_count = 1, 'geen');
  select count(*) into v_count from public.notifications where source_key = current_setting('audit.key') || '-b';
  insert into security_test_results values ('employee A cannot see B notification', '0 notifications', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from public.shift_signups
    where shift_id = current_setting('audit.past_shift')::uuid and user_id = current_setting('audit.employee_b')::uuid;
  insert into security_test_results values ('employee A cannot query coworker completed hours', '0 signups', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from public.shift_feedback
    where shift_id = current_setting('audit.past_shift')::uuid and user_id = current_setting('audit.employee_b')::uuid;
  insert into security_test_results values ('employee A cannot query coworker feedback', '0 feedback', v_count::text, v_count = 0, 'geen');
  update public.shift_feedback set rating = 1
    where shift_id = current_setting('audit.past_shift')::uuid and user_id = current_setting('audit.employee_b')::uuid;
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('employee A cannot edit coworker feedback', '0 updated', v_rows::text, v_rows = 0, 'geen');
  update public.shift_feedback set rating = 5, feedback_text = 'Aangepast'
    where shift_id = current_setting('audit.past_shift')::uuid and user_id = auth.uid();
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('employee A edits own feedback', '1 updated', v_rows::text, v_rows = 1, 'geen');

  update public.notifications set read_at = now()
  where source_key = current_setting('audit.key') || '-a' and user_id = auth.uid();
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('employee A marks own notification read', '1 updated', v_rows::text || ' updated', v_rows = 1, 'geen');

  update public.notifications set read_at = now()
  where source_key = current_setting('audit.key') || '-b';
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('employee A cannot mark B notification read', '0 updated', v_rows::text || ' updated', v_rows = 0, 'geen');

  update public.profiles set full_name = full_name || ' security-test'
  where id = current_setting('audit.employee_b')::uuid;
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('employee A cannot edit B profile', '0 updated', v_rows::text || ' updated', v_rows = 0, 'geen');

  v_denied := false;
  begin
    execute 'update public.profiles set role = ''manager'' where id = auth.uid()';
    get diagnostics v_rows = row_count;
    v_denied := v_rows = 0;
    v_error := case when v_denied then '0 updated' else v_rows::text || ' updated' end;
  exception when insufficient_privilege then
    v_denied := true;
    v_error := 'permission denied';
  end;
  insert into security_test_results values ('employee A cannot promote self', 'role update denied', v_error, v_denied, 'geen');

  update public.events set title = title || ' security-test'
  where id = current_setting('audit.event')::uuid;
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('employee A cannot update event', '0 updated', v_rows::text || ' updated', v_rows = 0, 'geen');

  v_denied := false;
  begin
    perform public.approve_shift_swap('00000000-0000-0000-0000-000000000000');
    v_error := 'RPC succeeded';
  exception when others then
    v_error := sqlerrm;
    v_denied := sqlerrm = 'Alleen managers kunnen een ruil goedkeuren';
  end;
  insert into security_test_results values ('employee A cannot approve swap', 'manager-only rejection', v_error, v_denied, 'geen');
end
$$;

select set_config('request.jwt.claim.sub', current_setting('audit.employee_b'), true);

do $$
declare v_count bigint;
begin
  select count(*) into v_count from public.shifts where id = current_setting('audit.draft_shift')::uuid;
  insert into security_test_results values ('employee B cannot see draft shift', '0 shifts', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from public.tasks where id = current_setting('audit.task')::uuid;
  insert into security_test_results values ('employee B cannot see A-only task', '0 tasks', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from public.documents where id = current_setting('audit.document')::uuid;
  insert into security_test_results values ('employee B cannot read A-only document', '0 documents', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from storage.objects where bucket_id = 'crew-documents'
    and name = current_setting('audit.shift') || '/security-test.pdf';
  insert into security_test_results values ('employee B cannot open A-only file', '0 file rows', v_count::text, v_count = 0, 'geen');
  select count(*) into v_count from public.notifications where source_key = current_setting('audit.key') || '-a';
  insert into security_test_results values ('employee B cannot see A notification', '0 notifications', v_count::text, v_count = 0, 'geen');
end
$$;

select set_config('request.jwt.claim.sub', current_setting('audit.manager'), true);

do $$
declare
  v_count bigint;
  v_rows bigint;
begin
  if not public.is_manager() then
    raise exception 'Manager role was not recognized';
  end if;
  select count(*) into v_count from public.shifts where id = current_setting('audit.draft_shift')::uuid;
  insert into security_test_results values ('manager sees draft shift', '1 shift', v_count::text, v_count = 1, 'geen');
  select count(*) into v_count from public.shift_signups where shift_id = current_setting('audit.past_shift')::uuid;
  insert into security_test_results values ('manager sees all completed employees', '2 signups', v_count::text, v_count = 2, 'geen');
  select count(*) into v_count from public.shift_feedback where shift_id = current_setting('audit.past_shift')::uuid;
  insert into security_test_results values ('manager sees all completed feedback', '2 feedback', v_count::text, v_count = 2, 'geen');
  select count(*) into v_count from public.tasks where id = current_setting('audit.task')::uuid;
  insert into security_test_results values ('manager sees task', '1 task', v_count::text, v_count = 1, 'geen');
  update public.events set title = title || ' manager-test' where id = current_setting('audit.event')::uuid;
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('manager updates event', '1 updated', v_rows::text || ' updated', v_rows = 1, 'geen');
  update public.tasks set description = 'Manager update verified' where id = current_setting('audit.task')::uuid;
  get diagnostics v_rows = row_count;
  insert into security_test_results values ('manager updates task details', '1 updated', v_rows::text || ' updated', v_rows = 1, 'geen');

  perform public.approve_shift_swap(current_setting('audit.swap')::uuid);
  select count(*) into v_count from public.shift_swaps
    where id = current_setting('audit.swap')::uuid and status = 'approved';
  insert into security_test_results values ('manager approves swap', 'approved', v_count::text || ' approved', v_count = 1, 'geen');
  select count(*) into v_count from public.shift_signups
    where shift_id = current_setting('audit.shift')::uuid and user_id = current_setting('audit.employee_b')::uuid and available;
  insert into security_test_results values ('approved swap activates replacement signup', '1 active signup', v_count::text || ' active', v_count = 1, 'geen');
end
$$;

reset role;
select test, expected, actual, case when passed then 'PASS' else 'FAIL' end as result, adjustment
from security_test_results order by test;
rollback;
