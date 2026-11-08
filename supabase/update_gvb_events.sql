-- Herhaalbare correctie van de vijf eerder gezaaide Willy Wonka-events.
-- Voer dit uit in de Supabase SQL Editor als seed.sql al in dit project is uitgevoerd.
-- Shifts, aanmeldingen, rollen en taken blijven behouden.

update public.events
set title = case
      when id = '10000000-0000-4000-8000-000000000003' then 'GVB bedrijfsfeest – opbouwdag'
      else 'GVB bedrijfsfeest'
    end,
    subtitle = 'Thema: Willy Wonka',
    type = case when id = '10000000-0000-4000-8000-000000000003' then 'Opbouw' else 'Bedrijfsfeest' end,
    description = case
      when id = '10000000-0000-4000-8000-000000000003'
        then 'Opbouw voor het bedrijfsfeest van GVB met Willy Wonka als thema.'
      else 'Bedrijfsfeest van GVB bij LIEF Amsterdam. Het thema is Willy Wonka. Praktische informatie staat in de shiftbriefing en het draaiboek.'
    end
where id in (
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000004',
  '10000000-0000-4000-8000-000000000005',
  '10000000-0000-4000-8000-000000000006',
  '10000000-0000-4000-8000-000000000007'
)
and (title like 'Willy Wonka%' or title in ('GVB', 'GVB bedrijfsfeest', 'GVB bedrijfsfeest – opbouwdag'));

update public.documents
set title = 'GVB bedrijfsfeest – briefing'
where event_id = '10000000-0000-4000-8000-000000000004'
and title in ('Willy Wonka – Briefing', 'GVB · Willy Wonka – Briefing');

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
