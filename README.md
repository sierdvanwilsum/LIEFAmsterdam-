# LIEF Crew App

De bestaande HTML/CSS/JavaScript-stack is behouden. Met de ingevulde projectgegevens gebruikt de app Supabase Auth, Postgres, Realtime en private Storage. Alleen zonder projectgegevens is er een demomodus.

## Lokaal starten

```sh
python3 dev-server.py
```

Open `http://127.0.0.1:8765/`. Zolang `config.js` geen Supabase-projectgegevens bevat, kun je de app als medewerker of manager verkennen. Demowijzigingen verdwijnen bij herladen.
Als poort 8765 al bezet is, start met `python3 dev-server.py 8766` en open poort 8766. E-maillinks verwijzen ook tijdens lokaal testen naar de gepubliceerde app.

## Supabase aansluiten

1. De Project URL en publishable key staan in [`config.js`](config.js).
2. Voer [`supabase/schema.sql`](supabase/schema.sql) alleen bij de eerste inrichting uit in de SQL Editor. Dit maakt de tabellen, RLS-beveiliging, private Storage-bucket en Realtime-publicatie voor taken. Voer het volledige schema niet opnieuw uit als de tabellen en policies al bestaan.
3. Voer [`supabase/seed.sql`](supabase/seed.sql) uit als je de acht fictieve events en tien shifts wilt. Het script maakt geen accounts aan.
   Als je de seed eerder hebt uitgevoerd, voer dan ook [`supabase/update_gvb_events.sql`](supabase/update_gvb_events.sql) uit. Dit zet de vijf bestaande eventrecords op **GVB bedrijfsfeest** (de opbouwdag op **GVB bedrijfsfeest – opbouwdag**) en toont **Thema: Willy Wonka** apart. Het script werkt ook als je de vorige GVB-update al hebt uitgevoerd. Bestaande shifts, aanmeldingen en rollen blijven bestaan. De laatste `select` toont de aangepaste records.
4. Stel onder **Authentication → URL Configuration** de **Site URL** in op `https://liefamsterdam.vercel.app/`. Voeg als **Redirect URLs** exact `https://liefamsterdam.vercel.app/auth/confirmed` en `https://liefamsterdam.vercel.app/auth/reset-password` toe. Gebruik nooit een lokale URL als Site URL van het productieproject.
5. Maak via **Account aanmaken** in de app een account met eigen naam, e-mailadres en wachtwoord. Bevestig het e-mailadres via de ontvangen mail. Nieuwe accounts krijgen door de databasetrigger altijd de rol `employee`.
6. Promoveer uitsluitend een vertrouwde manager via de SQL Editor met diens Auth-gebruikers-ID uit **Authentication → Users**:

   ```sql
   update public.profiles set role = 'manager' where id = 'AUTH-USER-UUID';
   ```

   Managerrechten intrekken kan met `update public.profiles set role = 'employee' where id = 'AUTH-USER-UUID';`. Laat de gebruiker daarna opnieuw inloggen. De app toont de managerfuncties alleen bij `role = 'manager'`; de database staat ingelogde gebruikers niet toe hun eigen rol te wijzigen.

7. Log in met het account. Gebruik nooit een `service_role` of `sb_secret_...` key in browsercode.

**E-mail voor medewerkers:** Supabase verstuurt via de standaard maildienst alleen naar e-mailadressen van projectteamleden en heeft een lage verzendlimiet. Configureer onder **Authentication → SMTP Settings** een eigen SMTP-server voordat medewerkers buiten het projectteam registratie- en herstelmails moeten ontvangen. Na het instellen kan een medewerker op het inlogscherm **Bevestigingsmail opnieuw** kiezen voor een account dat nog niet is bevestigd. Deel SMTP-wachtwoorden niet in de app of chat. Zie de [Supabase-documentatie over e-mailverzending](https://supabase.com/docs/guides/auth/auth-smtp).

De app toont alleen medewerkerfuncties aan medewerkers. Managers krijgen daarnaast event-, shift-, rol-, crew-, taken- en documentenbeheer. Eventruimtes, taken en bestanden worden in Supabase door RLS afgeschermd per shift.

## PWA en pushmeldingen activeren

Het officiële logo uit `design-references/image copy Lief Logo 2.png` staat als install-icoon in `public/icons/`. `manifest.webmanifest` en `sw.js` worden door de app geladen. Als de oude Crew/C-snelkoppeling nog het oude icoon toont, verwijder die snelkoppeling en voeg de app opnieuw toe. Op iPhone werken webpushmeldingen vanaf iOS 16.4 als de website via Safari aan het beginscherm is toegevoegd. Gebruik in productie HTTPS. Lokaal werkt `127.0.0.1` als veilige testomgeving.

De code en SQL voor push zijn aanwezig, maar **live push werkt pas na deze Supabase-stappen**:

1. Voer [`supabase/notifications.sql`](supabase/notifications.sql) uit in de SQL Editor, na `schema.sql`. **Voer dit script opnieuw uit als push al eerder is ingericht**: het is herhaalbaar en voegt `read_at`, de inbox-RLS, Realtime voor meldingen en nieuwe doellinks aan bestaande installaties toe. Bestaande meldingen en shifts blijven bestaan.
2. De publieke VAPID-sleutel staat in [`config.js`](config.js). De bijbehorende privésleutel en een willekeurig webhookgeheim zijn lokaal gegenereerd in `/private/tmp/lief-crew-push-secrets.env` met bestandsrechten `600`. Bewaar dit bestand veilig; deel de privésleutel of het webhookgeheim niet in chat, browsercode of Git. Bij een nieuwe computer moet je **dezelfde** VAPID-sleutels blijven gebruiken voor bestaande abonnementen.
3. Koppel de Supabase CLI aan project `wwqyufcpwbrbjcglskko` en stel de vier secrets uit dit bestand in. Voer de commando's uit in de projectmap:

   ```sh
   supabase login
   supabase link --project-ref wwqyufcpwbrbjcglskko
   supabase secrets set --env-file /private/tmp/lief-crew-push-secrets.env
   supabase functions deploy push --no-verify-jwt
   ```

   De function heeft `verify_jwt = false` omdat de database-webhook geen gebruikers-JWT stuurt. De function controleert browseracties zelf met Supabase Auth en de webhook met `PUSH_WEBHOOK_SECRET`. De secret/service key blijft uitsluitend server-side.
4. Maak in Supabase **Database → Webhooks** een webhook `lief-push` op `public.notifications`, alleen voor **INSERT**. Kies als doel de Edge Function **push**. Voeg een HTTP-header `x-lief-webhook-secret` toe met de waarde van `PUSH_WEBHOOK_SECRET` uit het lokale bestand. Laat de standaard JSON-payload van Supabase aan staan. De webhook mag niet rechtstreeks door een browser worden aangeroepen.
5. Publiceer de app via HTTPS. Voeg de publicatie-URL ook toe bij **Authentication → URL Configuration**. Open de app als medewerker, ga naar **Profiel → Meldingen** en klik **Meldingen inschakelen**. Op iPhone: installeer eerst de site op het beginscherm en open de geïnstalleerde app.

**Controleren:** klik als medewerker op **Stuur testmelding**. Een manager kan daarna een taak toewijzen, een medewerker bij een shift indelen en een nieuwe conceptshift met rollen publiceren. Elke actie maakt een rij in `notifications`; `delivery_state = sent` betekent dat de pushdienst de melding accepteerde. Een melding verschijnt alleen als de gebruiker push op het apparaat heeft ingeschakeld en de betreffende voorkeur aan staat. Bij problemen: controleer de Edge Function logs en de webhook-logs in Supabase.

De voorkeuren voor nieuwe taken, nieuwe shifts, geaccepteerde of gewijzigde shifts, eventmededelingen en documenten staan per gebruiker in Supabase. Een manager kan een urgente taak aan alle ingeschreven crewleden van één shift melden via het selectievakje in het taakformulier. Een gewijzigde belangrijke mededeling in de shiftbriefing meldt ook de ingeschreven crew. Nieuwe shifts starten als concept en sturen pas bij **Publiceer shift** een melding.

## Productie-URL en e-maillinks

De app gebruikt voor alle e-maillinks de publieke productie-URL uit [`config.js`](config.js): `https://liefamsterdam.vercel.app`, ook wanneer iemand zich via een lokale ontwikkelserver registreert. Signup stuurt naar `/auth/confirmed`; wachtwoordherstel naar `/auth/reset-password`. De directe routes worden op Vercel via [`vercel.json`](vercel.json) naar de app geleid; lokaal doet `dev-server.py` dit.

1. Zet in Supabase **Authentication → URL Configuration** de **Site URL** op `https://liefamsterdam.vercel.app/` en voeg de twee exacte productie-Redirect URLs uit stap 4 hierboven toe. Verwijder oude lokale of IP-adressen die je niet meer gebruikt. Supabase valt terug op de Site URL als de opgegeven redirect niet is toegestaan.
2. Controleer **Authentication → Email Templates** voor *Confirm signup* en *Reset password*. Gebruik de standaard verificatielink `{{ .ConfirmationURL }}`. Verwijder hardcoded localhost/IP-links en zelfgebouwde links met `{{ .SiteURL }}` die de opgegeven `redirectTo` negeren. Als je een aangepaste template gebruikt, moet die de toegestane redirect volgen.
3. Publiceer deze projectversie opnieuw op Vercel. Controleer in **Vercel → Project → Settings → Environment Variables** dat geen oude URL-variabele of buildstap `config.js` overschrijft. Deze statische app heeft geen servergeheim of aparte URL-variabele in Vercel nodig.
4. Voer `supabase/notifications.sql` opnieuw uit en deploy de `push` Edge Function opnieuw. Nieuwe pushberichten openen de bijbehorende shift, taak of de meldingenpagina. Oude meldingen met hash-links blijven binnen de app werken.

Test daarna op een telefoon met een nieuw medewerkeraccount: aanmelden, mail bevestigen, inloggen, herstelmail aanvragen, wachtwoord wijzigen en opnieuw inloggen. Test met een manager en medewerker tegelijk een nieuwe taak, de knop **Ververs**, de automatische update, een taakpush en een push zonder bestemming. Een live end-to-endtest vereist toegang tot beide accounts en de gepubliceerde Supabase/Vercel-configuratie.

## Huidige grenzen

- De Project URL en publishable key zijn ingesteld, Auth is bereikbaar en de tabellen bestaan. Anonieme toegang tot de tabellen wordt geweigerd. Een volledige test van de ingelogde stromen vereist een medewerkeraccount en een manageraccount; de inhoud van de seed-data is zonder login niet te controleren.
- Zelfregistratie staat aan: elk bevestigd e-mailadres krijgt nu medewerkersrechten. Voor een strikt besloten interne uitrol is daarnaast een uitnodigings- of goedkeuringsstap nodig.
- Bestanden in de demomodus zijn alleen tijdens de huidige browsersessie beschikbaar. In Supabase worden ze in de private bucket `crew-documents` opgeslagen.
- De bestaande mock planner staat nog in `app.js`; de nieuwe app gebruikt `crew.js` als hoofdingang.
- Zonder uitgevoerde `notifications.sql`, gedeployde `push` Edge Function en ingestelde webhook werken de bestaande planning en eventruimtes wel, maar worden geen pushmeldingen afgeleverd.
