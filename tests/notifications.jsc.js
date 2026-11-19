// Run from project root: jsc tests/notifications.jsc.js
new Function(readFile("crew.js"));
new Function(readFile("sw.js"));

var rootNode = { innerHTML: "", addEventListener() {} };
var console = { error(error) { if (!registerFails) print(error); } };
var badgeNode = { textContent: "", hidden: true };
var bell = { label: "", setAttribute(name, value) { this.label = value; }, querySelector() { return badgeNode; } };
var document = { getElementById() { return rootNode; }, querySelector(selector) { return selector === ".crew-notification-bell" ? bell : null; }, addEventListener() {}, visibilityState: "visible" };
var records = [];
var subscriptions = [];
var subscribed = false;
var registered = false;
var registerFails = false;
var authCallback;
var currentSubscription = null;
var unsubscribed = false;
var subscription = { endpoint: "https://push.example/device", toJSON() { return { endpoint: this.endpoint, keys: { p256dh: "p", auth: "a" } }; }, unsubscribe() { unsubscribed = true; currentSubscription = null; return Promise.resolve(true); } };
var client = {
  auth: { onAuthStateChange(callback) { authCallback = callback; } },
  functions: { invoke(name, options) { registered = name === "push" && options.body.action === "subscribe" && Boolean(options.body.device_id); return Promise.resolve(registerFails ? { error: new Error("Tijdelijk offline") } : { data: { ok: true } }); } },
  removeChannel() {},
  from(table) {
    if (table === "notification_preferences") return { select() { return { eq() { return { maybeSingle() { return Promise.resolve({ data: { user_id: "employee-a", new_tasks: true } }); } }; } }; } };
    if (table !== "notifications") throw new Error("Unexpected table");
    return { select() { return { eq(field, userId) { return { order() { return Promise.resolve({ data: records.filter(row => row.user_id === userId) }); } }; } }; } };
  },
  channel() {
    const handlers = [];
    return {
      on(event, filter, callback) { handlers.push(callback); return this; },
      subscribe(statusCallback) { subscriptions = handlers; statusCallback("SUBSCRIBED"); return this; },
    };
  },
};
var window = { LIEF_SUPABASE: { url: "test", publishableKey: "test" }, supabase: { createClient() { return client; } }, addEventListener() {} };
var navigator = {};
var location = { pathname: "/", hash: "#home", search: "", origin: "https://test.local" };
var URL = class {
  constructor(value, origin) {
    this.origin = origin;
    const match = value.match(/^([^?#]+)(\?[^#]*)?(#.*)?$/);
    this.pathname = match[1]; this.search = match[2] || ""; this.hash = match[3] || "";
  }
};
var URLSearchParams = class { get() { return null; } has() { return false; } };
var setInterval = function() {};
var setTimeout = function() { return 1; };
var clearTimeout = function() {};
var localStorage = { values: { "lief-push-opt-in": "yes" }, getItem(key) { return this.values[key] || null; }, setItem(key, value) { this.values[key] = value; }, removeItem(key) { delete this.values[key]; } };
var crypto = { randomUUID() { return "11111111-1111-1111-1111-111111111111"; } };
var atob = function() { return "A"; };
var Notification = { permission: "granted" };
var source = readFile("crew.js");
source = source.slice(0, source.lastIndexOf("bootstrap().catch"));
eval(source + `
  function check(label, value) { if (!value) throw new Error(label); print("PASS " + label); }
  state.user = { id: "employee-a" };
  state.profile = { id: "employee-a", full_name: "Anna", role: "employee" };
  state.data = { shifts: [], events: [], shift_signups: [], tasks: [], profiles: [] };
  records = [
    { id: "task-a", user_id: "employee-a", category: "new_tasks", title: "Nieuwe taak", target_url: "/events/e/shifts/s?tab=tasks&task=t", read_at: null },
    { id: "task-b", user_id: "employee-b", category: "new_tasks", title: "Andere medewerker", target_url: "/notifications", read_at: null },
  ];
  async function verify() {
    await loadNotifications();
    check("A ziet eigen melding bij belletje", state.notifications.length === 1 && state.notifications[0].id === "task-a");
    check("B is niet zichtbaar", !state.notifications.some(item => item.id === "task-b"));
    check("badge toont één ongelezen melding", !badgeNode.hidden && badgeNode.textContent === "1" && bell.label.includes("1 ongelezen"));
    check("bel staat in de header", shell("", "home").includes('class="crew-notification-bell'));
    check("taakmelding heeft de juiste deep link", safeNotificationTarget(state.notifications[0].target_url) === "/events/e/shifts/s?tab=tasks&task=t");
    startNotificationChannel();
    records.push({ id: "task-a-2", user_id: "employee-a", category: "new_tasks", title: "Volgende taak", read_at: null });
    subscriptions[0]();
    await Promise.resolve(); await Promise.resolve();
    check("realtime werkt voor meerdere taken", state.notifications.length === 2 && badgeNode.textContent === "2");
    records[0].read_at = "2026-11-19T12:00:00Z";
    subscriptions[1]();
    await Promise.resolve(); await Promise.resolve();
    check("badge daalt na lezen", badgeNode.textContent === "1");
    window.isSecureContext = true;
    window.PushManager = function() {};
    window.LIEF_VAPID_PUBLIC_KEY = "AA";
    window.Notification = Notification;
    navigator.serviceWorker = {
      register() { return Promise.resolve(); },
      ready: Promise.resolve({ pushManager: {
        getSubscription() { return Promise.resolve(currentSubscription); },
        subscribe() { subscribed = true; currentSubscription = subscription; return Promise.resolve(subscription); },
      } }),
    };
    await loadNotificationSettings();
    check("app herstelt verlopen abonnement bij opnieuw openen", subscribed && registered && state.pushEnabled && state.pushReady);
    check("keuze is opgeslagen voor dit account", localStorage.getItem("lief-push-opt-in:employee-a") === "yes");
    authCallback("SIGNED_OUT");
    check("afmelden wist de gekozen pushinstelling niet", localStorage.getItem("lief-push-opt-in:employee-a") === "yes");
    currentSubscription = null;
    subscribed = false;
    state.user = { id: "employee-a" };
    state.profile = { id: "employee-a", full_name: "Anna", role: "employee" };
    registerFails = true;
    await loadNotificationSettings();
    check("opnieuw aanmelden maakt automatisch abonnement", subscribed);
    check("tijdelijke serverfout zet keuze niet uit", state.pushEnabled && !state.pushReady && pushOptedIn());
    check("profiel toont herstelstatus", profilePage().includes("Meldingen worden hersteld"));
    registerFails = false;
    await loadNotificationSettings();
    check("registratie wordt later opnieuw geprobeerd", state.pushEnabled && state.pushReady);
    state.user = { id: "employee-b" };
    check("andere medewerker erft keuze niet", pushChoice() === null);
    await loadNotificationSettings();
    check("abonnement van vorige medewerker wordt losgekoppeld", unsubscribed && !state.pushEnabled && pushChoice() === null);
    state.user = { id: "employee-a" };
    pushOptedIn(false);
    subscribed = false;
    await loadNotificationSettings();
    check("uitzetten blijft uit na herladen", !subscribed && !state.pushEnabled && !state.pushReady);
  }
  verify().catch(error => { print(error); throw error; });
`);
