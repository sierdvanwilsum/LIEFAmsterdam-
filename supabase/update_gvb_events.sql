-- Eenmalige, herhaalbare naamswijziging van de vijf eerder gezaaide Willy Wonka-events.
-- Voer dit uit in de Supabase SQL Editor als seed.sql al in dit project is uitgevoerd.
-- Shifts, aanmeldingen, rollen en taken blijven behouden.

update public.events
set title = 'GVB',
    subtitle = 'Willy Wonka',
    type = case when id = '10000000-0000-4000-8000-000000000003' then 'Opbouw' else 'Bedrijfsevent' end,
    description = case
      when id = '10000000-0000-4000-8000-000000000003'
        then 'Opbouw voor het GVB-event met Willy Wonka als thema.'
      else 'GVB organiseert een bedrijfsevent bij LIEF Amsterdam met Willy Wonka als thema. Bekijk de shiftbriefing en het draaiboek voor praktische informatie.'
    end
where id in (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007'
)
and title like 'Willy Wonka%';

update public.documents
set title = 'GVB · Willy Wonka – Briefing'
where event_id = '10000000-0000-4000-8000-000000000004'
and title = 'Willy Wonka – Briefing';

select id, start_date, title, subtitle, type
from public.events
where id in (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007'
)
order by start_date;
