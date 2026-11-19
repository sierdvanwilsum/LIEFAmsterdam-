-- Eenmalige inrichting in de Supabase SQL Editor na deployment van de push Edge Function.
-- Maak eerst in Supabase Vault een secret met naam lief_push_webhook_secret
-- en exact dezelfde waarde als PUSH_WEBHOOK_SECRET van de Edge Function.
create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;

do $$
begin
  if not exists (select 1 from vault.decrypted_secrets where name = 'lief_push_webhook_secret') then
    raise exception 'Vault-secret lief_push_webhook_secret ontbreekt';
  end if;
end;
$$;

select cron.schedule('lief-push-retry', '* * * * *', $job$
  select net.http_post(
    url := 'https://wwqyufcpwbrbjcglskko.supabase.co/functions/v1/push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-lief-webhook-secret',
      (select decrypted_secret from vault.decrypted_secrets where name = 'lief_push_webhook_secret' limit 1)
    ),
    body := '{"action":"retry"}'::jsonb,
    timeout_milliseconds := 15000
  );
$job$);
