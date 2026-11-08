# LIEF Crew App

De bestaande HTML/CSS/JavaScript-stack is behouden. Met de ingevulde projectgegevens gebruikt de app Supabase Auth, Postgres, Realtime en private Storage. Alleen zonder projectgegevens is er een demomodus.

## Lokaal starten

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/`. Zolang `config.js` geen Supabase-projectgegevens bevat, kun je de app als medewerker of manager verkennen. Demowijzigingen verdwijnen bij herladen.

## Supabase aansluiten

1. De Project URL en publishable key staan in [`config.js`](config.js).
2. Voer [`supabase/schema.sql`](supabase/schema.sql) alleen bij de eerste inrichting uit in de SQL Editor. Dit maakt de tabellen, RLS-beveiliging, private Storage-bucket en Realtime-publicatie voor taken. Voer het volledige schema niet opnieuw uit als de tabellen en policies al bestaan.
3. Voer [`supabase/seed.sql`](supabase/seed.sql) uit als je de acht fictieve events en tien shifts wilt. Het script maakt geen accounts aan.
   Als je de seed eerder hebt uitgevoerd met de naam Willy Wonka, voer dan ook [`supabase/update_gvb_events.sql`](supabase/update_gvb_events.sql) uit. Dit wijzigt de vijf bestaande eventrecords naar **GVB** met **Willy Wonka** als thema. Bestaande shifts, aanmeldingen en rollen blijven bestaan. De laatste `select` toont de aangepaste records.
4. Stel onder **Authentication → URL Configuration** de lokale Site URL in op `http://127.0.0.1:8765/` en voeg `http://127.0.0.1:8765/` en `http://127.0.0.1:8765/?auth=recovery` toe aan de Redirect URLs. Voeg na publicatie ook de productie-URL's toe.
5. Maak via **Account aanmaken** in de app een account met eigen naam, e-mailadres en wachtwoord. Bevestig het e-mailadres via de ontvangen mail. Nieuwe accounts krijgen door de databasetrigger altijd de rol `employee`.
6. Promoveer uitsluitend een vertrouwde manager via de SQL Editor met diens Auth-gebruikers-ID uit **Authentication → Users**:

   ```sql
   update public.profiles set role = 'manager' where id = 'AUTH-USER-UUID';
   ```

   Managerrechten intrekken kan met `update public.profiles set role = 'employee' where id = 'AUTH-USER-UUID';`. Laat de gebruiker daarna opnieuw inloggen. De app toont de managerfuncties alleen bij `role = 'manager'`; de database staat ingelogde gebruikers niet toe hun eigen rol te wijzigen.

7. Log in met het account. Gebruik nooit een `service_role` of `sb_secret_...` key in browsercode.

**E-mail voor medewerkers:** Supabase verstuurt via de standaard maildienst alleen naar e-mailadressen van projectteamleden en heeft een lage verzendlimiet. Configureer onder Authentication een eigen SMTP-server voordat medewerkers buiten het projectteam registratie- en herstelmails moeten ontvangen. Deel SMTP-wachtwoorden niet in de app of chat.

De app toont alleen medewerkerfuncties aan medewerkers. Managers krijgen daarnaast event-, shift-, rol-, crew-, taken- en documentenbeheer. Eventruimtes, taken en bestanden worden in Supabase door RLS afgeschermd per shift.

## Huidige grenzen

- De Project URL en publishable key zijn ingesteld, Auth is bereikbaar en de tabellen bestaan. Anonieme toegang tot de tabellen wordt geweigerd. Een volledige test van de ingelogde stromen vereist een medewerkeraccount en een manageraccount; de inhoud van de seed-data is zonder login niet te controleren.
- Zelfregistratie staat aan: elk bevestigd e-mailadres krijgt nu medewerkersrechten. Voor een strikt besloten interne uitrol is daarnaast een uitnodigings- of goedkeuringsstap nodig.
- Bestanden in de demomodus zijn alleen tijdens de huidige browsersessie beschikbaar. In Supabase worden ze in de private bucket `crew-documents` opgeslagen.
- De bestaande mock planner staat nog in `app.js`; de nieuwe app gebruikt `crew.js` als hoofdingang.
