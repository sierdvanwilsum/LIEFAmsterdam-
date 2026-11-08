-- Fictieve planning. Voer na schema.sql uit in de Supabase SQL Editor.
-- Geen accounts of echte persoonsgegevens worden aangemaakt.

insert into public.events (id, title, subtitle, type, description, location, start_date, end_date) values
('10000000-0000-4000-8000-000000000001', 'Day 1 – Opbouw', null, 'Opbouw', 'Voorbereiding van het zakelijke event DAY1.', 'LIEF Amsterdam', '2026-11-12', '2026-11-12'),
('10000000-0000-4000-8000-000000000002', 'DAY1', 'JayJay Boske', 'Event', 'Een inspirerende dag met presentaties, ontmoetingen en een afsluitend programma.', 'LIEF Amsterdam', '2026-11-13', '2026-11-13'),
('10000000-0000-4000-8000-000000000003', 'GVB bedrijfsfeest – opbouwdag', 'Thema: Willy Wonka', 'Opbouw', 'Opbouw voor het bedrijfsfeest van GVB met Willy Wonka als thema.', 'LIEF Amsterdam', '2026-12-08', '2026-12-08'),
('10000000-0000-4000-8000-000000000004', 'GVB bedrijfsfeest', 'Thema: Willy Wonka', 'Bedrijfsfeest', 'Bedrijfsfeest van GVB bij LIEF Amsterdam. Het thema is Willy Wonka. Praktische informatie staat in de shiftbriefing en het draaiboek.', 'LIEF Amsterdam', '2026-12-09', '2026-12-09'),
('10000000-0000-4000-8000-000000000005', 'GVB bedrijfsfeest', 'Thema: Willy Wonka', 'Bedrijfsfeest', 'Bedrijfsfeest van GVB bij LIEF Amsterdam. Het thema is Willy Wonka. Praktische informatie staat in de shiftbriefing en het draaiboek.', 'LIEF Amsterdam', '2026-12-10', '2026-12-10'),
('10000000-0000-4000-8000-000000000006', 'GVB bedrijfsfeest', 'Thema: Willy Wonka', 'Bedrijfsfeest', 'Bedrijfsfeest van GVB bij LIEF Amsterdam. Het thema is Willy Wonka. Praktische informatie staat in de shiftbriefing en het draaiboek.', 'LIEF Amsterdam', '2026-12-11', '2026-12-11'),
('10000000-0000-4000-8000-000000000007', 'GVB bedrijfsfeest', 'Thema: Willy Wonka', 'Bedrijfsfeest', 'Bedrijfsfeest van GVB bij LIEF Amsterdam. Het thema is Willy Wonka. Praktische informatie staat in de shiftbriefing en het draaiboek.', 'LIEF Amsterdam', '2026-12-12', '2026-12-12'),
('10000000-0000-4000-8000-000000000008', 'Oud en Opnieuw', null, 'Bedrijfsevent', 'Een feestelijke afsluiting van het jaar voor medewerkers en relaties.', 'LIEF Amsterdam', '2026-12-15', '2026-12-16')
on conflict (id) do nothing;

insert into public.shifts (id, event_id, title, date, start_time, end_time, briefing, announcement) values
('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Opbouw', '2026-11-12', '09:00', '15:00', 'Meld je bij de productie-ingang voor de startbriefing.', ''),
('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Event', '2026-11-13', '09:00', '22:00', 'Ontvangst en crewbriefing vinden plaats bij de hoofdingang.', 'Neem je legitimatie mee voor de crewregistratie.'),
('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Opbouw', '2026-12-08', '09:00', '17:00', 'We bouwen de routing en verschillende ruimtes op.', ''),
('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Ochtendshift', '2026-12-09', '09:00', '18:00', 'Check in bij de crewbalie en lees het draaiboek.', 'Crewbriefing om 08:45.'),
('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000004', 'Middagshift', '2026-12-09', '12:00', '18:00', 'Meld je bij de crewbalie en lees het draaiboek.', ''),
('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', 'Middagshift', '2026-12-10', '12:00', '18:00', 'Lees de briefing en meld je bij de area lead.', ''),
('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000005', 'Avondshift', '2026-12-10', '17:00', '02:00', 'De eindtijd valt op de volgende kalenderdag.', 'Crewbriefing om 16:45.'),
('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000006', 'Eventshift', '2026-12-11', '12:00', '20:00', 'Meld je bij de crewbalie en lees het draaiboek.', ''),
('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000007', 'Ochtendshift', '2026-12-12', '08:00', '15:00', 'Lees de briefing en meld je bij de area lead.', ''),
('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000008', 'Avondshift', '2026-12-15', '17:00', '02:00', 'De eindtijd valt op de volgende kalenderdag.', '')
on conflict (id) do nothing;

insert into public.shift_roles (shift_id, name, required_count) values
('20000000-0000-4000-8000-000000000001', 'Opbouw', 5), ('20000000-0000-4000-8000-000000000001', 'Productie', 2),
('20000000-0000-4000-8000-000000000002', 'Bar', 8), ('20000000-0000-4000-8000-000000000002', 'Runner', 5), ('20000000-0000-4000-8000-000000000002', 'Debras', 4), ('20000000-0000-4000-8000-000000000002', 'Hospitality', 6), ('20000000-0000-4000-8000-000000000002', 'Productie', 3), ('20000000-0000-4000-8000-000000000002', 'Garderobe', 2),
('20000000-0000-4000-8000-000000000003', 'Opbouw', 8), ('20000000-0000-4000-8000-000000000003', 'Productie', 3), ('20000000-0000-4000-8000-000000000003', 'Entertainment support', 2),
('20000000-0000-4000-8000-000000000004', 'Oempa Loempa', 5), ('20000000-0000-4000-8000-000000000004', 'Bar', 7), ('20000000-0000-4000-8000-000000000004', 'Runner', 5), ('20000000-0000-4000-8000-000000000004', 'Hospitality', 5), ('20000000-0000-4000-8000-000000000004', 'Routing', 4), ('20000000-0000-4000-8000-000000000004', 'Productie', 3),
('20000000-0000-4000-8000-000000000005', 'Oempa Loempa', 3), ('20000000-0000-4000-8000-000000000005', 'Bar', 4), ('20000000-0000-4000-8000-000000000005', 'Runner', 3), ('20000000-0000-4000-8000-000000000005', 'Routing', 3), ('20000000-0000-4000-8000-000000000005', 'Entertainment support', 2),
('20000000-0000-4000-8000-000000000006', 'Bar', 5), ('20000000-0000-4000-8000-000000000006', 'Runner', 4), ('20000000-0000-4000-8000-000000000006', 'Hospitality', 3), ('20000000-0000-4000-8000-000000000006', 'Routing', 3),
('20000000-0000-4000-8000-000000000007', 'Oempa Loempa', 4), ('20000000-0000-4000-8000-000000000007', 'Bar', 7), ('20000000-0000-4000-8000-000000000007', 'Runner', 5), ('20000000-0000-4000-8000-000000000007', 'Debras', 4), ('20000000-0000-4000-8000-000000000007', 'Routing', 3), ('20000000-0000-4000-8000-000000000007', 'Entertainment support', 2),
('20000000-0000-4000-8000-000000000008', 'Oempa Loempa', 4), ('20000000-0000-4000-8000-000000000008', 'Bar', 6), ('20000000-0000-4000-8000-000000000008', 'Runner', 4), ('20000000-0000-4000-8000-000000000008', 'Hospitality', 4), ('20000000-0000-4000-8000-000000000008', 'Routing', 3),
('20000000-0000-4000-8000-000000000009', 'Bar', 5), ('20000000-0000-4000-8000-000000000009', 'Runner', 4), ('20000000-0000-4000-8000-000000000009', 'Afbouw', 4), ('20000000-0000-4000-8000-000000000009', 'Productie', 3),
('20000000-0000-4000-8000-000000000010', 'Bar', 6), ('20000000-0000-4000-8000-000000000010', 'Runner', 4), ('20000000-0000-4000-8000-000000000010', 'Debras', 4), ('20000000-0000-4000-8000-000000000010', 'Hospitality', 4), ('20000000-0000-4000-8000-000000000010', 'Garderobe', 2), ('20000000-0000-4000-8000-000000000010', 'Afbouw', 2)
on conflict (shift_id, name) do nothing;
