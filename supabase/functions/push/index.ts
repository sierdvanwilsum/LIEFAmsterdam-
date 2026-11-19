import { createClient } from "npm:@supabase/supabase-js@2";
import * as webpush from "jsr:@negrel/webpush@0.5.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info, x-lief-webhook-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { ...cors, "Content-Type": "application/json" },
});
const required = (key: string) => {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`${key} ontbreekt`);
  return value;
};
function adminKey() {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  const keys = JSON.parse(required("SUPABASE_SECRET_KEYS"));
  const first = Object.values(keys).find(value => typeof value === "string");
  if (!first) throw new Error("Geen Supabase secret key beschikbaar");
  return first as string;
}
const admin = createClient(required("SUPABASE_URL"), adminKey(), {
  auth: { persistSession: false, autoRefreshToken: false },
});
let server: Promise<webpush.ApplicationServer> | undefined;
function base64Bytes(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "=")), ch => ch.charCodeAt(0));
}
function base64Url(value: Uint8Array) {
  return btoa(String.fromCharCode(...value)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function appServer() {
  server ??= (async () => {
    const point = base64Bytes(required("VAPID_PUBLIC_KEY"));
    const privateKey = base64Bytes(required("VAPID_PRIVATE_KEY"));
    if (point.length !== 65 || point[0] !== 4 || privateKey.length !== 32) throw new Error("Ongeldige VAPID-sleutels");
    const x = base64Url(point.slice(1, 33)), y = base64Url(point.slice(33));
    const base = { kty: "EC", crv: "P-256", x, y, alg: "ES256" };
    const vapidKeys = await webpush.importVapidKeys({
      publicKey: { ...base, key_ops: ["verify"], ext: true },
      privateKey: { ...base, d: base64Url(privateKey), key_ops: ["sign"], ext: true },
    });
    return webpush.ApplicationServer.new({
      contactInformation: required("VAPID_CONTACT"), vapidKeys,
    });
  })();
  return server;
}
type Subscription = { id: string; endpoint: string; p256dh: string; auth_key: string };
type Notice = { id: string; user_id: string; category: string; title: string; body: string; target_url: string };
type Delivery = { notification_id: string; subscription_id: string; state: string; attempted_at: string | null; attempts: number };
async function deliver(subscription: Subscription, message: { title: string; body: string; url: string; tag?: string }) {
  try {
    const server = await appServer();
    await server.subscribe({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth_key } })
      .pushTextMessage(JSON.stringify(message), { ttl: 86400 });
    return { ok: true, invalid: false, error: null };
  } catch (error) {
    const invalid = error instanceof webpush.PushMessageError && [404, 410].includes(error.response.status);
    if (invalid) {
      const removed = await admin.from("push_subscriptions").delete().eq("id", subscription.id);
      if (removed.error) console.error("Ongeldig abonnement verwijderen mislukt", removed.error);
    }
    console.error("Push verzenden mislukt", error);
    return { ok: false, invalid, error: error instanceof Error ? error.message.slice(0, 500) : "Onbekende pushfout" };
  }
}
async function sendToSubscription(notice: Notice, subscription: Subscription) {
  const inserted = await admin.from("push_deliveries").upsert({
    notification_id: notice.id, subscription_id: subscription.id,
  }, { onConflict: "notification_id,subscription_id", ignoreDuplicates: true });
  if (inserted.error) throw inserted.error;
  const current = await admin.from("push_deliveries").select("*")
    .eq("notification_id", notice.id).eq("subscription_id", subscription.id).single();
  if (current.error) throw current.error;
  const delivery = current.data as Delivery;
  if (delivery.state === "sent" || delivery.state === "invalid") return;
  if (delivery.state === "sending" && delivery.attempted_at &&
    Date.now() - new Date(delivery.attempted_at).getTime() < 120000) return;
  if (delivery.state === "failed" && delivery.attempted_at &&
    Date.now() - new Date(delivery.attempted_at).getTime() < 10000) return;
  let claim = admin.from("push_deliveries").update({
    state: "sending", attempts: delivery.attempts + 1, attempted_at: new Date().toISOString(), last_error: null,
  }).eq("notification_id", notice.id).eq("subscription_id", subscription.id).eq("state", delivery.state);
  if (delivery.attempted_at) claim = claim.eq("attempted_at", delivery.attempted_at);
  else claim = claim.is("attempted_at", null);
  const claimed = await claim.select("subscription_id").maybeSingle();
  if (claimed.error) throw claimed.error;
  if (!claimed.data) return;
  const outcome = await deliver(subscription, {
    title: notice.title, body: notice.body, url: notice.target_url, tag: notice.id,
  });
  if (outcome.invalid) return; // ON DELETE CASCADE verwijdert de bezorgpoging.
  const saved = await admin.from("push_deliveries").update({
    state: outcome.ok ? "sent" : "failed", last_error: outcome.error,
  }).eq("notification_id", notice.id).eq("subscription_id", subscription.id);
  if (saved.error) throw saved.error;
}
async function sendNotice(id: string) {
  const found = await admin.from("notifications").select("id,user_id,category,title,body,target_url").eq("id", id).maybeSingle();
  if (found.error) throw found.error;
  const notice = found.data as Notice | null;
  if (!notice) return { skipped: true };
  try {
    const preference = await admin.from("notification_preferences").select(notice.category).eq("user_id", notice.user_id).maybeSingle();
    if (preference.error) throw preference.error;
    if (preference.data?.[notice.category] === false) {
      const muted = await admin.from("notifications").update({ delivery_state: "no_subscription", last_error: "push_preference_disabled" }).eq("id", id);
      if (muted.error) throw muted.error;
      return { muted: true };
    }
    const result = await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq("user_id", notice.user_id);
    if (result.error) throw result.error;
    const subscriptions = (result.data || []) as Subscription[];
    await Promise.all(subscriptions.map(subscription => sendToSubscription(notice, subscription)));
    const deliveryRows = await admin.from("push_deliveries").select("state").eq("notification_id", id);
    if (deliveryRows.error) throw deliveryRows.error;
    const rows = deliveryRows.data || [];
    const sent = rows.filter(row => row.state === "sent").length;
    const delivery_state = !subscriptions.length || !rows.length ? "no_subscription" : rows.some(row => row.state === "failed")
      ? "failed" : rows.some(row => row.state === "sending" || row.state === "pending") ? "sending" : "sent";
    const updated = await admin.from("notifications").update({
      delivery_state, delivery_count: sent, delivered_at: sent ? new Date().toISOString() : null,
      last_error: delivery_state === "failed" ? "Een of meer apparaten zijn niet bereikt; zie Edge Function logs." : null,
    }).eq("id", id);
    if (updated.error) throw updated.error;
    return { delivered: sent, subscriptions: subscriptions.length };
  } catch (error) {
    await admin.from("notifications").update({ delivery_state: "failed", last_error: "Verzenden mislukt; controleer de Edge Function logs." }).eq("id", id);
    throw error;
  }
}
async function drainUser(userId: string) {
  const since = new Date(Date.now() - 86400000).toISOString();
  const pending = await admin.from("notifications").select("id,created_at,delivery_state,last_error")
    .eq("user_id", userId).gte("created_at", since)
    .in("delivery_state", ["pending", "sending", "failed"])
    .order("created_at", { ascending: false }).limit(30);
  if (pending.error) throw pending.error;
  const recent = await admin.from("notifications").select("id,created_at,delivery_state,last_error")
    .eq("user_id", userId).gte("created_at", new Date(Date.now() - 600000).toISOString())
    .eq("delivery_state", "no_subscription").order("created_at", { ascending: false }).limit(20);
  if (recent.error) throw recent.error;
  let processed = 0;
  for (const notice of [...(pending.data || []), ...(recent.data || [])]) {
    if (notice.last_error === "push_preference_disabled") continue;
    if (notice.delivery_state === "no_subscription" && Date.now() - new Date(notice.created_at).getTime() > 600000) continue;
    await sendNotice(notice.id);
    processed++;
  }
  return { processed };
}
async function retryBacklog() {
  const since = new Date(Date.now() - 86400000).toISOString();
  const pending = await admin.from("notifications").select("id,created_at,delivery_state,last_error")
    .gte("created_at", since).in("delivery_state", ["pending", "sending", "failed"])
    .order("created_at", { ascending: false }).limit(100);
  if (pending.error) throw pending.error;
  const recent = await admin.from("notifications").select("id,created_at,delivery_state,last_error")
    .gte("created_at", new Date(Date.now() - 600000).toISOString()).eq("delivery_state", "no_subscription")
    .order("created_at", { ascending: false }).limit(50);
  if (recent.error) throw recent.error;
  let processed = 0, errors = 0;
  for (const notice of [...(pending.data || []), ...(recent.data || [])]) {
    if (notice.last_error === "push_preference_disabled") continue;
    if (notice.delivery_state === "no_subscription" && Date.now() - new Date(notice.created_at).getTime() > 600000) continue;
    try { await sendNotice(notice.id); processed++; }
    catch (error) { errors++; console.error("Push opnieuw proberen mislukt", notice.id, error); }
  }
  return { processed, errors };
}
async function userFromRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return null;
  const result = await admin.auth.getUser(token);
  return result.error ? null : result.data.user;
}
Deno.serve(async request => {
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });
  if (request.method !== "POST") return json({ error: "Methode niet toegestaan" }, 405);
  try {
    const body = await request.json();
    if (body?.action === "retry") {
      if (request.headers.get("x-lief-webhook-secret") !== required("PUSH_WEBHOOK_SECRET")) return json({ error: "Geen toegang" }, 401);
      return json(await retryBacklog());
    }
    if (body?.type === "INSERT" && body?.table === "notifications") {
      const expected = required("PUSH_WEBHOOK_SECRET");
      if (request.headers.get("x-lief-webhook-secret") !== expected) return json({ error: "Geen toegang" }, 401);
      if (!body.record?.id) return json({ error: "Ongeldige webhook" }, 400);
      const result = await sendNotice(body.record.id);
      await drainUser(body.record.user_id);
      return json(result);
    }
    const user = await userFromRequest(request);
    if (!user) return json({ error: "Log opnieuw in" }, 401);
    if (body?.action === "subscribe") {
      const subscription = body.subscription;
      const deviceId = body.device_id;
      if (typeof subscription?.endpoint !== "string" || !subscription.endpoint.startsWith("https://") ||
        typeof subscription?.keys?.p256dh !== "string" || typeof subscription?.keys?.auth !== "string" ||
        typeof deviceId !== "string" || !/^[0-9a-f-]{36}$/.test(deviceId)) return json({ error: "Ongeldige push subscription" }, 400);
      const old = await admin.from("push_subscriptions").delete().eq("user_id", user.id)
        .eq("device_id", deviceId).neq("endpoint", subscription.endpoint);
      if (old.error) throw old.error;
      const saved = await admin.from("push_subscriptions").upsert({
        user_id: user.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh,
        auth_key: subscription.keys.auth, device_id: deviceId, last_seen_at: new Date().toISOString(),
      }, { onConflict: "endpoint" });
      if (saved.error) throw saved.error;
      await drainUser(user.id);
      return json({ ok: true });
    }
    if (body?.action === "sync") return json(await drainUser(user.id));
    if (body?.action === "unsubscribe") {
      if (typeof body.endpoint !== "string") return json({ error: "Ongeldige subscription" }, 400);
      const deleted = await admin.from("push_subscriptions").delete().eq("user_id", user.id).eq("endpoint", body.endpoint);
      if (deleted.error) throw deleted.error;
      return json({ ok: true });
    }
    if (body?.action === "test") {
      if (typeof body.endpoint !== "string") return json({ error: "Ongeldige subscription" }, 400);
      const subscriptions = await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq("user_id", user.id).eq("endpoint", body.endpoint);
      if (subscriptions.error) throw subscriptions.error;
      if (!subscriptions.data?.length) return json({ error: "Schakel eerst meldingen in op dit apparaat." }, 400);
      const outcomes = await Promise.all((subscriptions.data as Subscription[]).map(item => deliver(item, {
        title: "LIEF Crew testmelding", body: "Meldingen werken op dit apparaat.", url: "/notifications",
      })));
      if (!outcomes.some(item => item.ok)) return json({ error: "Verzenden mislukt. Controleer de Edge Function logs." }, 502);
      return json({ ok: true, delivered: outcomes.filter(item => item.ok).length });
    }
    return json({ error: "Onbekende actie" }, 400);
  } catch (error) {
    console.error("Push function fout", error);
    return json({ error: "Melding kon niet worden verwerkt" }, 500);
  }
});
