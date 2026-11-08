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
type Notice = { id: string; user_id: string; title: string; body: string; target_url: string; delivery_count: number };
async function deliver(subscription: Subscription, message: { title: string; body: string; url: string; tag?: string }) {
  try {
    const server = await appServer();
    await server.subscribe({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth_key } })
      .pushTextMessage(JSON.stringify(message), { ttl: 86400 });
    return true;
  } catch (error) {
    if (error instanceof webpush.PushMessageError && [404, 410].includes(error.response.status)) {
      await admin.from("push_subscriptions").delete().eq("id", subscription.id);
    }
    console.error("Push verzenden mislukt", error);
    return false;
  }
}
async function sendNotice(id: string) {
  const claimed = await admin.from("notifications").update({ delivery_state: "sending" })
    .eq("id", id).eq("delivery_state", "pending").select("*").maybeSingle();
  if (claimed.error) throw claimed.error;
  const notice = claimed.data as Notice | null;
  if (!notice) return { skipped: true };
  try {
    const result = await admin.from("push_subscriptions").select("id,endpoint,p256dh,auth_key").eq("user_id", notice.user_id);
    if (result.error) throw result.error;
    const subscriptions = (result.data || []) as Subscription[];
    const outcomes = await Promise.all(subscriptions.map(subscription => deliver(subscription, {
      title: notice.title, body: notice.body, url: notice.target_url, tag: notice.id,
    })));
    const sent = outcomes.filter(Boolean).length;
    const delivery_state = !subscriptions.length ? "no_subscription" : sent ? "sent" : "failed";
    const updated = await admin.from("notifications").update({
      delivery_state, delivery_count: sent, delivered_at: sent ? new Date().toISOString() : null,
      last_error: delivery_state === "failed" ? "Pushdienst weigerde de melding; controleer de Edge Function logs." : null,
    }).eq("id", id);
    if (updated.error) throw updated.error;
    return { delivered: sent, subscriptions: subscriptions.length };
  } catch (error) {
    await admin.from("notifications").update({ delivery_state: "failed", last_error: "Verzenden mislukt; controleer de Edge Function logs." }).eq("id", id);
    throw error;
  }
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
    if (body?.type === "INSERT" && body?.table === "notifications") {
      const expected = required("PUSH_WEBHOOK_SECRET");
      if (request.headers.get("x-lief-webhook-secret") !== expected) return json({ error: "Geen toegang" }, 401);
      if (!body.record?.id) return json({ error: "Ongeldige webhook" }, 400);
      return json(await sendNotice(body.record.id));
    }
    const user = await userFromRequest(request);
    if (!user) return json({ error: "Log opnieuw in" }, 401);
    if (body?.action === "subscribe") {
      const subscription = body.subscription;
      if (typeof subscription?.endpoint !== "string" || !subscription.endpoint.startsWith("https://") ||
        typeof subscription?.keys?.p256dh !== "string" || typeof subscription?.keys?.auth !== "string") return json({ error: "Ongeldige push subscription" }, 400);
      const saved = await admin.from("push_subscriptions").upsert({
        user_id: user.id, endpoint: subscription.endpoint, p256dh: subscription.keys.p256dh, auth_key: subscription.keys.auth,
      }, { onConflict: "endpoint" });
      if (saved.error) throw saved.error;
      return json({ ok: true });
    }
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
        title: "LIEF Crew testmelding", body: "Meldingen werken op dit apparaat.", url: "#profile",
      })));
      if (!outcomes.some(Boolean)) return json({ error: "Verzenden mislukt. Controleer de Edge Function logs." }, 502);
      return json({ ok: true, delivered: outcomes.filter(Boolean).length });
    }
    return json({ error: "Onbekende actie" }, 400);
  } catch (error) {
    console.error("Push function fout", error);
    return json({ error: "Melding kon niet worden verwerkt" }, 500);
  }
});
