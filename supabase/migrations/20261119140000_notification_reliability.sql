-- Herstel van de bestaande meldingenketen; bestaande records blijven behouden.
begin;

alter table public.push_subscriptions add column if not exists device_id text;
alter table public.push_subscriptions add column if not exists last_seen_at timestamptz not null default now();
create unique index if not exists push_subscriptions_user_device_idx
  on public.push_subscriptions(user_id, device_id) where device_id is not null;

create table if not exists public.push_deliveries (
  notification_id uuid not null references public.notifications(id) on delete cascade,
  subscription_id uuid not null references public.push_subscriptions(id) on delete cascade,
  state text not null default 'pending' check (state in ('pending', 'sending', 'sent', 'failed', 'invalid')),
  attempts integer not null default 0,
  attempted_at timestamptz,
  last_error text,
  primary key (notification_id, subscription_id)
);
create index if not exists push_deliveries_retry_idx on public.push_deliveries(state, attempted_at);
alter table public.push_deliveries enable row level security;
revoke all on public.push_deliveries from anon, authenticated;

-- Een pushvoorkeur dempt de telefoon, niet het postvak in de app.
create or replace function public.enqueue_crew_notification(
  p_user uuid, p_category text, p_title text, p_body text,
  p_url text, p_source text
) returns void language plpgsql security definer set search_path = '' as $$
begin
  insert into public.notifications (user_id, category, title, body, target_url, source_key)
  values (p_user, p_category, p_title, p_body, p_url, p_source)
  on conflict (user_id, source_key) do nothing;
end;
$$;
revoke all on function public.enqueue_crew_notification(uuid,text,text,text,text,text) from public, anon, authenticated;

create or replace function public.notify_task_assignment() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_event text;
  v_event_id uuid;
  v_person record;
  v_changed boolean;
  v_broadcast boolean;
  v_new_assignment boolean;
  v_source text;
  v_target text;
begin
  select e.id, e.title into v_event_id, v_event from public.events e
    join public.shifts s on s.event_id = e.id where s.id = new.shift_id;
  v_target := '/events/' || v_event_id || '/shifts/' || new.shift_id || '?tab=tasks&task=' || new.id;
  if tg_op = 'INSERT' then
    v_changed := true;
    v_new_assignment := new.assigned_to is not null;
  else
    v_changed := (new.shift_id, new.title, new.description, new.status, new.priority, new.deadline_at, new.notify_all)
      is distinct from (old.shift_id, old.title, old.description, old.status, old.priority, old.deadline_at, old.notify_all);
    v_new_assignment := new.assigned_to is not null and new.assigned_to is distinct from old.assigned_to;
    if not v_changed and not v_new_assignment then return new; end if;
  end if;
  v_broadcast := new.priority = 'urgent' and new.notify_all and v_changed and public.is_manager();
  v_source := 'task:' || new.id || ':' || gen_random_uuid();
  if v_broadcast then
    for v_person in select distinct user_id from public.shift_signups
      where shift_id = new.shift_id and available loop
      perform public.enqueue_crew_notification(v_person.user_id, 'new_tasks',
        'Urgente taak · ' || coalesce(v_event, 'Event'), new.title, v_target, v_source);
    end loop;
  end if;
  if new.assigned_to is not null and (v_new_assignment or v_changed)
    and (select auth.uid()) is distinct from new.assigned_to
    and (not v_broadcast or not exists (
      select 1 from public.shift_signups where shift_id = new.shift_id
        and user_id = new.assigned_to and available
    )) then
    perform public.enqueue_crew_notification(new.assigned_to, 'new_tasks',
      case when v_new_assignment then 'Nieuwe taak · ' else 'Taak gewijzigd · ' end || coalesce(v_event, 'Event'),
      new.title, v_target, v_source);
  end if;
  return new;
end;
$$;
drop trigger if exists push_task_assignment on public.tasks;
create trigger push_task_assignment after insert or update of assigned_to, shift_id, title, description, status, priority, deadline_at, notify_all on public.tasks
for each row execute function public.notify_task_assignment();

commit;
