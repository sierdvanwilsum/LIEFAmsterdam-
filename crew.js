"use strict";

const root = document.getElementById("app");
const supaConfig = window.LIEF_SUPABASE || {};
const configured = Boolean(supaConfig.url && supaConfig.publishableKey);
const supa = configured && window.supabase ? window.supabase.createClient(supaConfig.url, supaConfig.publishableKey) : null;
const roleNames = ["Bar", "Runner", "Debras", "Opbouw", "Afbouw", "Productie", "Garderobe", "Hospitality", "Oempa Loempa", "Routing", "Entertainment support", "Anders"];
const documentTypes = ["Draaiboek", "Factsheet", "Plattegrond", "Briefing", "Overig"];
const state = { user: null, profile: null, data: null, busy: false, toast: "", authMode: new URLSearchParams(location.search).get("auth") === "recovery" ? "reset" : "login", filter: "alles", draftShift: null, firstRole: "", secondRole: "", available: true, editTask: null, roomChannel: null, roomChannelId: null, showEventForm: false, notificationPreferences: null, notificationError: "", pushEnabled: false };
const notificationChoices = [
  ["new_tasks", "Nieuwe taken"], ["new_shifts", "Nieuwe shifts"],
  ["shift_accepted", "Shift geaccepteerd"], ["shift_changed", "Shift gewijzigd"],
  ["event_announcements", "Belangrijke eventmededelingen"], ["document_changed", "Document gewijzigd"],
];
const defaultNotificationPreferences = Object.fromEntries(notificationChoices.map(([key]) => [key, true]));
function supportsPush() { return Boolean(supa && window.isSecureContext && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window && window.LIEF_VAPID_PUBLIC_KEY); }
function vapidBytes() { const value = window.LIEF_VAPID_PUBLIC_KEY.replace(/-/g, "+").replace(/_/g, "/"); return Uint8Array.from(atob(value.padEnd(Math.ceil(value.length / 4) * 4, "=")), c => c.charCodeAt(0)); }
async function pushRegistration() {
  await navigator.serviceWorker.register("./sw.js");
  return Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error("Service worker kon niet starten.")), 8000)),
  ]);
}
async function pushAction(action, payload = {}) {
  const result = await supa.functions.invoke("push", { body: { action, ...payload } });
  if (result.error || result.data?.error) throw new Error(result.data?.error || "Pushdienst is nog niet ingericht. Controleer de Edge Function.");
  return result.data;
}
async function loadNotificationSettings() {
  state.notificationError = "";
  state.notificationPreferences = null;
  if (!supa || !state.user) return;
  const result = await supa.from("notification_preferences").select("*").eq("user_id", state.user.id).maybeSingle();
  if (result.error) state.notificationError = "Meldingen zijn nog niet ingericht. Voer notifications.sql uit in Supabase.";
  else state.notificationPreferences = result.data || { user_id: state.user.id, ...defaultNotificationPreferences };
  if (supportsPush() && Notification.permission === "granted") {
    try {
      const subscription = await (await pushRegistration()).pushManager.getSubscription();
      state.pushEnabled = Boolean(subscription);
      if (subscription) await pushAction("subscribe", { subscription: subscription.toJSON() });
    } catch (error) {
      console.error(error);
      state.pushEnabled = false;
      state.notificationError ||= "Pushmeldingen zijn nog niet beschikbaar. Controleer de Edge Function.";
    }
  } else state.pushEnabled = false;
}

function appUrl() { return `${location.origin}${location.pathname}`; }
function resetUrl() { return `${appUrl()}?auth=recovery`; }
function clearResetUrl() {
  const url = new URL(location.href);
  url.searchParams.delete("auth");
  history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
}

function e(value) { return String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]); }
function icon(name, size = 20) {
  const p = {
    home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><path d="M9 21v-7h6v7"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    ticket: '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4V7Z"/>',
    room: '<rect x="3" y="4" width="18" height="17" rx="2"/><path d="M7 21v-9h10v9M8 8h8"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    file: '<path d="M5 3h9l5 5v13H5z"/><path d="M14 3v6h5M8 14h8M8 18h6"/>',
    alert: '<path d="M12 3 2 21h20L12 3Z"/><path d="M12 9v5m0 3h.01"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p[name] || p.ticket}</svg>`;
}
function dateText(value, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) { return new Intl.DateTimeFormat("nl-NL", options).format(new Date(`${value}T12:00:00`)); }
function dateTimeText(value) { return value ? new Intl.DateTimeFormat("nl-NL", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value)) : ""; }
function todayIso() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; }
function dayNumber(value) { return dateText(value, { day: "2-digit" }); }
function monthShort(value) { return dateText(value, { month: "short" }).replace(".", "").toUpperCase(); }
function timeText(value) { return String(value || "").slice(0, 5); }
function shiftTime(s) { return `${timeText(s.start_time)} — ${timeText(s.end_time)}`; }
function isManager() { return state.profile?.role === "manager"; }
function firstName() { return state.profile?.full_name?.trim().split(/\s+/)[0] || "collega"; }
function profile(id) { return state.data?.profiles.find(p => p.id === id); }
function nameOf(id) { return profile(id)?.full_name || "Crewlid"; }
function eventOf(shift) { return state.data?.events.find(event => event.id === shift.event_id); }
function shiftOf(id) { return state.data?.shifts.find(shift => shift.id === id); }
function rolesOf(id) { return state.data?.shift_roles.filter(role => role.shift_id === id) || []; }
function signupsOf(id) { return state.data?.shift_signups.filter(item => item.shift_id === id && item.available) || []; }
function mySignup(id) { return state.data?.shift_signups.find(item => item.shift_id === id && item.user_id === state.user?.id); }
function tasksOf(id) { return state.data?.tasks.filter(task => task.shift_id === id) || []; }
function docsOf(id) { return state.data?.documents.filter(doc => doc.shift_id === id) || []; }
function occupancyOf(id) { return state.data?.occupancy.find(item => item.shift_id === id)?.signup_count || 0; }
function assignedOf(id) { return state.data?.occupancy.find(item => item.shift_id === id)?.assigned_count || 0; }
function roleAssigned(id, name) { return state.data?.role_occupancy.find(item => item.shift_id === id && item.role_name === name)?.assigned_count || 0; }
function openOf(shift) { return Math.max(0, shift.required_people - assignedOf(shift.id)); }
function shiftStatus(shift) {
  if (shift.published === false) return ["Concept", "pending"];
  const count = occupancyOf(shift.id);
  if (shift.required_people === 0) return ["Rollen ontbreken", "closed"];
  if (count >= shift.required_people && shift.required_people > 0) return ["Vol", "closed"];
  if (count >= shift.required_people * .8 && count > 0) return ["Bijna vol", "pending"];
  return ["Beschikbaar", "confirmed"];
}
function canRoom(shiftId) { return isManager() || Boolean(mySignup(shiftId)?.available); }
function orderedShifts() { return [...(state.data?.shifts || [])].sort((a, b) => `${a.date}T${a.start_time}`.localeCompare(`${b.date}T${b.start_time}`)); }
function upcomingShifts() { const today = todayIso(); return orderedShifts().filter(shift => shift.date >= today && (isManager() || shift.published !== false)); }
function badge(text, tone = "soft") { return `<span class="crew-badge ${tone}">${e(text)}</span>`; }
function button(label, action, id = "", tone = "primary", extra = "") { return `<button type="button" class="crew-button ${tone}" data-action="${action}" ${id ? `data-id="${e(id)}"` : ""} ${extra}><span>${e(label)}</span><span class="crew-button-icon">${icon("arrow", 17)}</span></button>`; }
function go(path) { const target = `#${path}`; if (location.hash === target) render(); else location.hash = target; window.scrollTo({ top: 0, behavior: "instant" }); }
function openSignup(id) {
  const signup = mySignup(id);
  state.draftShift = id;
  state.firstRole = signup?.preferred_role || "";
  state.secondRole = signup?.second_preference || "";
  state.available = signup?.available ?? true;
  go(`signup/${id}`);
}
function currentRoute() { const [page = "home", id, tab, itemId] = location.hash.replace(/^#\/?/, "").split("/"); return { page: page || "home", id, tab, itemId }; }
function toast(message) { state.toast = message; render(); }
function getError(error) {
  if (error?.name === "Error" && error.message) return error.message;
  if (error?.code === "23505") return "Dit onderdeel bestaat al.";
  if (/invalid login credentials/i.test(error?.message || "")) return "E-mailadres of wachtwoord klopt niet.";
  if (/email not confirmed/i.test(error?.message || "")) return "Bevestig eerst je e-mailadres.";
  if (/email_address_not_authorized|email address not authorized/i.test(`${error?.code || ""} ${error?.message || ""}`)) return "Dit e-mailadres kan nog geen mail ontvangen. Vraag de beheerder om de e-mailinstellingen te controleren.";
  if (/password should be at least|weak password/i.test(error?.message || "")) return "Kies een sterker wachtwoord van minimaal 8 tekens.";
  if (/user already registered/i.test(error?.message || "")) return "Dit e-mailadres heeft al een account. Log in of herstel je wachtwoord.";
  if (/rate limit|too many requests|over_email_send_rate_limit/i.test(`${error?.code || ""} ${error?.message || ""}`)) return "Er zijn te veel pogingen. Probeer het later opnieuw.";
  return "Er is iets misgegaan. Probeer opnieuw.";
}
async function run(work) {
  if (state.busy) return;
  state.busy = true;
  try { await work(); } catch (error) { console.error(error); toast(getError(error)); }
  finally { state.busy = false; }
}

async function loadData() {
  if (!supa) {
    const d = state.data;
    d.occupancy = d.shifts.map(shift => ({ shift_id: shift.id, signup_count: d.shift_signups.filter(x => x.shift_id === shift.id && x.available).length, assigned_count: d.shift_signups.filter(x => x.shift_id === shift.id && x.available && x.assigned_role).length }));
    d.role_occupancy = d.shift_roles.map(role => ({ shift_id: role.shift_id, role_name: role.name, assigned_count: d.shift_signups.filter(x => x.shift_id === role.shift_id && x.available && x.assigned_role === role.name).length }));
    return;
  }
  const tables = ["profiles", "events", "shifts", "shift_roles", "shift_signups", "tasks", "documents"];
  const queries = tables.map(table => supa.from(table).select(table === "profiles" ? "id,full_name,role,avatar_url" : "*"));
  const results = await Promise.all([...queries, supa.rpc("shift_occupancy"), supa.rpc("shift_role_occupancy")]);
  results.forEach(result => { if (result.error) throw result.error; });
  state.data = Object.fromEntries(tables.map((table, index) => [table, results[index].data || []]));
  state.data.occupancy = results[tables.length].data || [];
  state.data.role_occupancy = results[tables.length + 1].data || [];
}
async function refresh() { await loadData(); render(); }
async function bootstrap() {
  if (configured && !supa) { root.innerHTML = `<div class="crew-gateway"><h1>Verbinding niet beschikbaar</h1><p>De Supabase-bibliotheek kon niet geladen worden. Controleer je internetverbinding.</p></div>`; return; }
  if (!configured) { render(); return; }
  const sessionResult = await supa.auth.getSession();
  if (sessionResult.error) { root.innerHTML = `<div class="crew-gateway"><h1>Verbinding mislukt</h1><p>${e(getError(sessionResult.error))}</p></div>`; return; }
  if (state.authMode === "reset") { render(); return; }
  if (!sessionResult.data.session) { state.user = null; state.profile = null; state.data = null; render(); return; }
  const { data, error } = await supa.auth.getUser();
  if (error || !data?.user) { root.innerHTML = `<div class="crew-gateway"><h1>Sessie verlopen</h1><p>Log opnieuw in om verder te gaan.</p><button class="crew-button secondary" data-action="logout" type="button">Uitloggen</button></div>`; return; }
  state.user = data.user;
  const result = await supa.from("profiles").select("id,full_name,role,avatar_url").eq("id", state.user.id).single();
  if (result.error) { root.innerHTML = `<div class="crew-gateway"><h1>Profiel ontbreekt</h1><p>Voer eerst schema.sql uit in Supabase en meld je opnieuw aan.</p><button class="crew-button secondary" data-action="logout" type="button">Uitloggen</button></div>`; return; }
  state.profile = result.data;
  await loadData();
  await loadNotificationSettings();
  if (!location.hash && isManager()) go("manager");
  else render();
}

function logo() { return `<img class="crew-logo" src="design-references/image copy Lief Logo 2.png" alt="LIEF Amsterdam" />`; }
function navItems() { return [["home", "Home", "home"], ["planning", "Planning", "calendar"], ["shifts", "Mijn shifts", "ticket"], ["rooms", "Eventruimte", "room"], ["profile", "Profiel", "user"], ...(isManager() ? [["manager", "Manager", "grid"]] : [])]; }
function nav(active, mobile = false) {
  return `<nav class="${mobile ? "crew-bottom-nav" : "crew-desktop-nav"}" aria-label="Hoofdnavigatie">${navItems().map(([path, label, symbol]) => `<a href="#${path}" class="${active === path ? "active" : ""}" aria-current="${active === path ? "page" : "false"}">${icon(symbol, mobile ? 18 : 17)}<span>${e(label)}</span></a>`).join("")}</nav>`;
}
function shell(content, active = "home") {
  const demo = !configured ? `<span class="crew-demo-label">DEMO · voorbeeldgegevens</span>` : "";
  return `<div class="crew-shell"><header class="crew-header"><a href="#home" class="crew-brand" aria-label="LIEF Amsterdam, naar home">${logo()}<span class="crew-brand-copy"><strong>CREW APP</strong><small>LIEF AMSTERDAM</small></span></a>${nav(active)}<div class="crew-header-end">${demo}<span class="crew-avatar" aria-label="${e(state.profile?.full_name)}">${e(firstName().slice(0, 1).toUpperCase())}</span></div></header><main class="crew-main" id="main-content">${content}</main>${nav(active, true)}${state.toast ? `<div class="toast" role="status">${e(state.toast)}</div>` : ""}</div>`;
}
function heading(eyebrow, title, description = "") { return `<div class="crew-heading"><span class="eyebrow">${e(eyebrow)}</span><h1>${e(title)}</h1>${description ? `<p>${e(description)}</p>` : ""}</div>`; }
function empty(title, description, action = "", label = "") { return `<div class="crew-empty"><span class="crew-empty-icon">✦</span><h2>${e(title)}</h2><p>${e(description)}</p>${action ? button(label, "go", action) : ""}</div>`; }

function gateway() {
  const mode = state.authMode;
  const titles = { login: "Welkom bij de crew.", signup: "Maak je account.", forgot: "Wachtwoord vergeten?", reset: "Kies een nieuw wachtwoord." };
  const descriptions = { login: "Planning, taken en alle informatie voor jouw event op één plek.", signup: "Meld je aan met je eigen e-mailadres. Je begint als medewerker.", forgot: "Vul je e-mailadres in. Als er een account bestaat, ontvang je een herstelmail.", reset: "Vul een nieuw wachtwoord in voor je account." };
  const emailInput = `<label>E-mailadres<input name="email" type="email" autocomplete="email" required /></label>`;
  const passwordInput = `<label>Wachtwoord<input name="password" type="password" autocomplete="current-password" required /></label>`;
  const newPasswordInputs = `<label>Nieuw wachtwoord<input name="password" type="password" autocomplete="new-password" minlength="8" required /></label><label>Herhaal wachtwoord<input name="password_confirm" type="password" autocomplete="new-password" minlength="8" required /></label>`;
  const submit = label => `<button type="submit" class="crew-button primary"><span>${label}</span><span class="crew-button-icon">${icon("arrow", 17)}</span></button>`;
  const link = (label, target) => `<button type="button" class="crew-auth-link" data-action="auth-mode" data-id="${target}">${label}</button>`;
  const forms = {
    login: `<form data-form="login" class="crew-form">${emailInput}${passwordInput}${submit("Inloggen")}</form><div class="crew-auth-links">${link("Account aanmaken", "signup")}${link("Wachtwoord vergeten?", "forgot")}</div>`,
    signup: `<form data-form="signup" class="crew-form"><label>Volledige naam<input name="full_name" type="text" autocomplete="name" maxlength="100" required /></label>${emailInput}${newPasswordInputs}${submit("Account aanmaken")}</form><div class="crew-auth-links">${link("Ik heb al een account", "login")}</div>`,
    forgot: `<form data-form="forgot" class="crew-form">${emailInput}${submit("Stuur herstelmail")}</form><div class="crew-auth-links">${link("Terug naar inloggen", "login")}</div>`,
    reset: `<form data-form="reset" class="crew-form">${newPasswordInputs}${submit("Wachtwoord opslaan")}</form><div class="crew-auth-links">${link("Terug naar inloggen", "login")}</div>`,
  };
  return `<div class="crew-gateway"><div class="crew-gateway-card">${logo()}<span class="eyebrow">LIEF AMSTERDAM · INTERNE CREW APP</span><h1>${configured ? titles[mode] : titles.login}</h1><p>${configured ? descriptions[mode] : descriptions.login}</p>${state.toast ? `<p class="crew-auth-notice" role="status">${e(state.toast)}</p>` : ""}${configured ? `${forms[mode]}<p class="crew-gateway-note">Managerrechten worden door LIEF toegekend.</p>` : `<div class="crew-demo-options">${button("Bekijk als medewerker", "demo-employee")}${button("Bekijk als manager", "demo-manager", "", "secondary")}</div><p class="crew-gateway-note">Demomodus met fictieve gegevens. Vul config.js in om Supabase te gebruiken.</p>`}</div></div>`;
}

function shiftCard(shift, options = {}) {
  const event = eventOf(shift), count = occupancyOf(shift.id), need = shift.required_people;
  const [status, tone] = shiftStatus(shift);
  const signup = mySignup(shift.id);
  const personal = signup?.available ? signup.assigned_role ? badge("Bevestigd", "confirmed") : badge("Aangemeld", "pending") : signup && !signup.available ? badge("Niet beschikbaar", "soft") : "";
  const title = event?.title || "Event";
  const themed = event?.subtitle?.includes("Willy Wonka");
  return `<article class="crew-shift-card ${themed ? "is-themed" : ""}"><div class="crew-date-block"><strong>${dayNumber(shift.date)}</strong><span>${monthShort(shift.date)}</span></div><div class="crew-shift-body"><div class="crew-card-top"><span class="eyebrow">${e(event?.type || "Event")} · ${e(shift.title)}</span>${badge(status, tone)}</div><h2>${e(title)}</h2>${event?.subtitle ? `<p class="crew-subtitle">${e(event.subtitle)}</p>` : ""}${personal ? `<div class="crew-personal-status">${personal}</div>` : ""}<div class="crew-shift-meta"><span>${icon("clock", 15)}${e(shiftTime(shift))}</span><span>${icon("users", 15)}${count} / ${need} aangemeld</span></div>${button(options.room ? "Open eventruimte" : options.manage ? "Shift beheren" : signup?.available ? "Bekijk aanmelding" : "Bekijk shift", options.room ? "room" : options.manage ? "manage-shift" : "signup", shift.id, options.room ? "secondary" : "primary")}</div></article>`;
}

function homePage() {
  const own = upcomingShifts().filter(shift => mySignup(shift.id)?.available);
  const next = own[0];
  const urgent = state.data.tasks.filter(task => task.priority === "urgent" && task.status !== "klaar" && canRoom(task.shift_id));
  return shell(`<div class="crew-home-hero"><span class="eyebrow">GOED OM JE TE ZIEN, ${e(firstName().toUpperCase())}</span><h1>Jouw volgende<br><em>event.</em></h1><div class="crew-home-actions">${button("Bekijk planning", "go", "planning")}</div></div><div class="crew-home-grid"><section><div class="crew-section-head"><h2>Jouw volgende shift</h2><a href="#shifts">Alle shifts ${icon("arrow", 15)}</a></div>${next ? shiftCard(next, { room: true }) : empty("Nog geen shift gepland", "Bekijk de planning en meld je aan voor een shift.", "planning", "Bekijk planning")}</section><section><div class="crew-section-head"><h2>Nu belangrijk</h2><a href="#rooms">Eventruimtes ${icon("arrow", 15)}</a></div>${urgent.length ? urgent.slice(0, 3).map(task => taskCard(task, true)).join("") : `<div class="crew-info-card"><h3>Geen urgente taken.</h3><p>Nieuwe taken voor jouw shifts verschijnen hier.</p></div>`}</section></div>`, "home");
}

function planningPage() {
  const list = upcomingShifts().filter(shift => state.filter === "alles" || state.filter === "mijn" && mySignup(shift.id)?.available || state.filter === "vrij" && occupancyOf(shift.id) < shift.required_people);
  return shell(`${heading("CREWPLANNING", "Kies jouw shift.", "Alle aankomende events en diensten op één plek.")}<div class="crew-filter-row">${[["alles", "Alle shifts"], ["vrij", "Beschikbaar"], ["mijn", "Mijn aanmeldingen"]].map(([id, label]) => `<button type="button" class="crew-filter ${state.filter === id ? "active" : ""}" data-action="filter" data-id="${id}">${label}</button>`).join("")}</div><div class="crew-shift-grid">${list.length ? list.map(shift => shiftCard(shift)).join("") : empty("Geen shifts gevonden", "Kies een ander filter om meer shifts te zien.")}</div>`, "planning");
}

function signupPage(shift) {
  const event = eventOf(shift), signup = mySignup(shift.id), roles = rolesOf(shift.id), full = occupancyOf(shift.id) >= shift.required_people;
  const first = state.firstRole;
  const second = state.secondRole;
  const available = state.available;
  return shell(`<a class="crew-back" href="#planning">${icon("back", 16)} Terug naar planning</a><div class="crew-detail-grid"><section><div class="crew-detail-hero ${event.subtitle?.includes("Willy Wonka") ? "is-themed" : ""}"><div class="crew-detail-date"><strong>${dayNumber(shift.date)}</strong><span>${monthShort(shift.date)}</span></div><span class="eyebrow">${e(event.type)} · ${e(shift.title)}</span><h1>${e(event.title)}</h1>${event.subtitle ? `<h2>${e(event.subtitle)}</h2>` : ""}<p>${e(event.description)}</p></div><div class="crew-facts"><div><span>Datum</span><strong>${e(dateText(shift.date))}</strong></div><div><span>Werktijd</span><strong>${e(shiftTime(shift))}</strong></div><div><span>Locatie</span><strong>${e(event.location)}</strong></div><div><span>Bezetting</span><strong>${occupancyOf(shift.id)} / ${shift.required_people} aangemeld</strong></div></div></section><section class="crew-white-panel"><div class="crew-section-head"><h2>Inschrijven</h2>${signup ? badge(signup.assigned_role ? "Bevestigd" : signup.available ? "Aangemeld" : "Niet beschikbaar", signup.assigned_role ? "confirmed" : "pending") : badge(shiftStatus(shift)[0], shiftStatus(shift)[1])}</div><p>Geef je beschikbaarheid en voorkeursrollen door. De manager maakt de indeling.</p><div class="crew-choice-row"><button type="button" class="crew-choice ${available ? "active" : ""}" data-action="available" data-id="yes" aria-pressed="${available}">Beschikbaar</button><button type="button" class="crew-choice ${!available ? "active" : ""}" data-action="available" data-id="no" aria-pressed="${!available}">Niet beschikbaar</button></div>${available ? `<div class="crew-form"><label>Eerste voorkeur<select id="first-role" data-action="first-role"><option value="">Kies een rol</option>${roles.map(role => `<option value="${e(role.name)}" ${first === role.name ? "selected" : ""}>${e(role.name)} · ${Math.max(0, role.required_count - roleAssigned(shift.id, role.name))} open</option>`).join("")}</select></label><label>Tweede voorkeur <small>(optioneel)</small><select id="second-role" data-action="second-role"><option value="">Geen tweede voorkeur</option>${roles.filter(role => role.name !== first).map(role => `<option value="${e(role.name)}" ${second === role.name ? "selected" : ""}>${e(role.name)}</option>`).join("")}</select></label></div>` : ""}<div class="crew-role-availability"><strong>Rollen en bezetting</strong>${roles.map(role => `<div><span>${e(role.name)}</span><span>${roleAssigned(shift.id, role.name)} / ${role.required_count} ingedeeld</span></div>`).join("")}</div>${full && !signup?.available ? `<p class="crew-alert">Deze shift is vol. Aanmelden is momenteel niet mogelijk.</p>` : ""}${button(signup ? "Aanmelding bijwerken" : "Inschrijven", "save-signup", shift.id, "primary", full && !signup?.available && available ? "disabled" : "")}${signup?.available ? `<a class="crew-text-link" href="#room/${shift.id}/overzicht">Open eventruimte ${icon("arrow", 16)}</a>` : ""}</section></div>`, "planning");
}

function myShiftsPage() {
  const own = upcomingShifts().filter(shift => mySignup(shift.id)?.available);
  return shell(`${heading("PERSOONLIJK ROOSTER", "Mijn shifts", "Alle shifts waarvoor jij je hebt aangemeld.")}<div class="crew-shift-grid">${own.length ? own.map(shift => shiftCard(shift, { room: true })).join("") : empty("Nog geen shifts", "Meld je aan via de planning. Daarna staat je eventruimte hier klaar.", "planning", "Bekijk planning")}</div>`, "shifts");
}

function roomsPage() {
  const accessible = upcomingShifts().filter(shift => canRoom(shift.id));
  return shell(`${heading("OPERATIE", "Eventruimte", "Briefing, taken, crew en documenten per shift.")}<div class="crew-shift-grid">${accessible.length ? accessible.map(shift => shiftCard(shift, { room: true })).join("") : empty("Nog geen eventruimte", "Meld je aan voor een shift om toegang te krijgen.", "planning", "Bekijk planning")}</div>`, "rooms");
}

function profilePage() {
  const status = state.pushEnabled && window.Notification?.permission === "granted" ? "Meldingen staan aan" : "Meldingen staan uit";
  const pushSupport = supportsPush();
  const settings = configured ? `<section class="crew-white-panel crew-notifications"><div class="crew-section-head"><h2>Meldingen</h2>${badge(status, state.pushEnabled ? "confirmed" : "soft")}</div><p>Ontvang bericht over je shifts, taken en belangrijke eventinformatie.</p>${state.notificationError ? `<p class="crew-alert">${e(state.notificationError)}</p>` : ""}${pushSupport ? `${state.pushEnabled ? button("Meldingen uitschakelen", "disable-push", "", "secondary") : button("Meldingen inschakelen", "enable-push")}${state.pushEnabled ? button("Stuur testmelding", "test-push", "", "secondary") : ""}` : `<p class="crew-form-hint">Pushmeldingen worden op deze browser of dit apparaat niet ondersteund. Op iPhone werkt dit na toevoegen aan het beginscherm.</p>`}<div class="crew-notification-options">${notificationChoices.map(([key, label]) => `<label class="crew-notification-option"><span>${e(label)}</span><input type="checkbox" data-action="notification-preference" data-id="${key}" ${state.notificationPreferences?.[key] !== false ? "checked" : ""} ${!state.notificationPreferences ? "disabled" : ""} aria-label="${e(label)}" /></label>`).join("")}</div></section>` : `<section class="crew-white-panel crew-notifications"><h2>Meldingen</h2><p>Meldingen zijn beschikbaar zodra Supabase is aangesloten.</p></section>`;
  return shell(`${heading("JOUW GEGEVENS", "Profiel")}<div class="crew-profile-card"><div class="crew-profile-avatar">${e(firstName().slice(0, 1).toUpperCase())}</div><div><h2>${e(state.profile.full_name)}</h2>${badge(isManager() ? "Manager" : "Medewerker", isManager() ? "lime" : "soft")}</div></div><div class="crew-white-panel crew-profile-details"><div class="crew-facts"><div><span>E-mailadres</span><strong>${e(state.user.email || "Demo-account")}</strong></div></div>${configured ? `<form class="crew-form" data-form="profile"><label>Volledige naam<input name="full_name" maxlength="100" value="${e(state.profile.full_name)}" required /></label><button class="crew-button primary" type="submit"><span>Naam opslaan</span><span class="crew-button-icon">${icon("check", 17)}</span></button></form>` : ""}${button(configured ? "Uitloggen" : "Terug naar demo-keuze", "logout", "", "secondary")}</div>${settings}`, "profile");
}

function taskCard(task, compact = false) {
  const mine = task.assigned_to === state.user?.id;
  const detail = compact ? `<a class="crew-text-link" href="#room/${e(task.shift_id)}/taken">Bekijk taak ${icon("arrow", 15)}</a>` : `<div class="crew-task-actions">${!isManager() && !task.assigned_to && task.status !== "klaar" ? button("Claim taak", "claim-task", task.id) : ""}${!isManager() && mine && task.status === "te doen" ? button("Start taak", "start-task", task.id, "secondary") : ""}${!isManager() && mine && task.status !== "klaar" ? button("Afronden", "finish-task", task.id) : ""}${isManager() ? `<button type="button" class="crew-small-button" data-action="edit-task" data-id="${e(task.id)}">Wijzig</button><button type="button" class="crew-small-button danger" data-action="delete-task" data-id="${e(task.id)}">Verwijder</button>` : ""}</div>`;
  return `<article id="task-${e(task.id)}" class="crew-task-card priority-${e(task.priority)}"><div class="crew-task-top">${badge(task.priority === "urgent" ? "Urgent" : task.priority === "belangrijk" ? "Belangrijk" : "Normaal", task.priority)}${badge(task.status === "klaar" ? "Klaar" : task.status === "bezig" ? "Bezig" : "Te doen", task.status === "klaar" ? "confirmed" : "soft")}</div><h3>${e(task.title)}</h3>${!compact && task.description ? `<p>${e(task.description)}</p>` : ""}<div class="crew-task-assignee">${icon("user", 15)}${task.assigned_to ? `Toegewezen aan: <strong>${e(nameOf(task.assigned_to))}</strong>` : "Nog niet toegewezen"}</div>${!compact ? `<div class="crew-task-meta">Aangemaakt door ${e(nameOf(task.created_by))} · ${e(dateTimeText(task.created_at))}${task.completed_at ? ` · Afgerond ${e(dateTimeText(task.completed_at))}` : ""}</div>` : ""}${detail}</article>`;
}

function taskForm(shiftId) {
  const task = state.editTask ? state.data.tasks.find(item => item.id === state.editTask) : null;
  const people = signupsOf(shiftId);
  return `<form class="crew-task-form crew-white-panel" data-form="task" data-id="${e(shiftId)}" ${task ? `data-task="${e(task.id)}"` : ""}><div class="crew-section-head"><h2>${task ? "Taak wijzigen" : "Nieuwe taak"}</h2>${task ? `<button type="button" class="crew-small-button" data-action="cancel-edit">Annuleren</button>` : ""}</div><div class="crew-form"><label>Titel<input name="title" required maxlength="120" value="${e(task?.title || "")}" placeholder="Wat moet er gebeuren?" /></label><label>Omschrijving<textarea name="description" rows="3" maxlength="1000" placeholder="Praktische details">${e(task?.description || "")}</textarea></label><div class="crew-form-pair"><label>Prioriteit<select name="priority">${["normaal", "belangrijk", "urgent"].map(x => `<option value="${x}" ${task?.priority === x ? "selected" : ""}>${x[0].toUpperCase() + x.slice(1)}</option>`).join("")}</select></label><label>Status<select name="status">${["te doen", "bezig", "klaar"].map(x => `<option value="${x}" ${task?.status === x ? "selected" : ""}>${x[0].toUpperCase() + x.slice(1)}</option>`).join("")}</select></label></div><label>Toewijzen aan<select name="assigned_to"><option value="">Nog niet toegewezen</option>${people.map(x => `<option value="${e(x.user_id)}" ${task?.assigned_to === x.user_id ? "selected" : ""}>${e(nameOf(x.user_id))}</option>`).join("")}</select></label><label class="crew-broadcast-option"><input type="checkbox" name="notify_all" ${task?.notify_all ? "checked" : ""} /> Meld urgente taak aan alle crewleden van deze shift</label><button type="submit" class="crew-button primary"><span>${task ? "Wijzigingen opslaan" : "Taak toevoegen"}</span><span class="crew-button-icon">${icon("plus", 17)}</span></button></div></form>`;
}

function overviewTab(shift) {
  const event = eventOf(shift);
  return `<div class="crew-room-grid"><section class="crew-white-panel"><h2>Briefing</h2><p class="crew-long-text">${e(shift.briefing || event.description || "De briefing volgt binnenkort.")}</p></section><aside><div class="crew-info-card accent"><span class="eyebrow">BELANGRIJKE MEDEDELING</span><h3>${shift.announcement ? "Goed om te weten" : "Nog geen mededelingen"}</h3><p>${e(shift.announcement || "Nieuwe informatie verschijnt hier zodra de manager die deelt.")}</p></div><div class="crew-info-card"><span class="eyebrow">EVENTMANAGER</span><h3>${e(event.manager_id ? nameOf(event.manager_id) : "LIEF eventteam")}</h3></div></aside></div>`;
}
function tasksTab(shift) {
  const tasks = tasksOf(shift.id).sort((a, b) => ({ urgent: 0, belangrijk: 1, normaal: 2 }[a.priority] - { urgent: 0, belangrijk: 1, normaal: 2 }[b.priority]) || ({ "te doen": 0, bezig: 1, klaar: 2 }[a.status] - { "te doen": 0, bezig: 1, klaar: 2 }[b.status]));
  return `<div class="crew-room-grid"><section><div class="crew-section-head"><h2>Taken</h2>${badge(`${tasks.filter(t => t.status !== "klaar").length} open`, "open")}</div><div class="crew-task-list">${tasks.length ? tasks.map(task => taskCard(task)).join("") : empty("Geen taken", "Voor deze shift staan nog geen taken klaar.")}</div></section>${isManager() ? `<aside>${taskForm(shift.id)}</aside>` : `<aside><div class="crew-info-card"><span class="eyebrow">SNEL AAN DE SLAG</span><h3>Pak een taak op.</h3><p>Claim een vrije taak, zet hem op Bezig en rond hem af zodra het werk klaar is.</p></div></aside>`}</div>`;
}
function crewTab(shift) {
  const members = signupsOf(shift.id);
  return `<div class="crew-section-head"><h2>Crew voor deze shift</h2>${badge(`${members.length} aangemeld`, "soft")}</div><div class="crew-member-grid">${members.length ? members.map(item => `<article class="crew-member-card"><div class="crew-member-avatar">${e(nameOf(item.user_id).slice(0, 1))}</div><div class="crew-member-details"><h3>${e(nameOf(item.user_id))}</h3><span>Voorkeur: ${e(item.preferred_role || "—")}${item.second_preference ? ` · ${e(item.second_preference)}` : ""}</span><div>${badge(item.assigned_role ? "Bevestigd" : "Aangemeld", item.assigned_role ? "confirmed" : "pending")}</div></div>${isManager() ? `<label class="crew-assign">Rol<select data-action="assign-role" data-id="${e(item.id)}"><option value="">Nog niet ingedeeld</option>${rolesOf(shift.id).map(role => `<option value="${e(role.name)}" ${item.assigned_role === role.name ? "selected" : ""} ${roleAssigned(shift.id, role.name) >= role.required_count && item.assigned_role !== role.name ? "disabled" : ""}>${e(role.name)}</option>`).join("")}</select></label>` : `<strong class="crew-member-role">${e(item.assigned_role || "Nog niet ingedeeld")}</strong>`}</article>`).join("") : empty("Nog geen crew", "Er zijn nog geen medewerkers aangemeld.")}</div>`;
}
function documentsTab(shift) {
  const docs = docsOf(shift.id);
  return `<div class="crew-room-grid"><section><div class="crew-section-head"><h2>Documenten</h2>${badge(`${docs.length} bestanden`, "soft")}</div><div class="crew-doc-grid">${docs.length ? docs.map(doc => `<article class="crew-doc-card"><div class="crew-doc-icon">${icon("file", 28)}</div><span class="eyebrow">${e(doc.file_type)}</span><h3>${e(doc.title)}</h3><p>${e(doc.mime_type?.split("/").pop().toUpperCase() || "BESTAND")}</p>${button("Open document", "open-doc", doc.id, "secondary")}<button type="button" class="crew-text-link" data-action="download-doc" data-id="${e(doc.id)}">Download bestand</button>${isManager() ? `<button type="button" class="crew-text-link" data-action="delete-doc" data-id="${e(doc.id)}">Document verwijderen</button>` : ""}</article>`).join("") : empty("Nog geen documenten", "Het draaiboek en andere bestanden verschijnen hier zodra ze zijn toegevoegd.")}</div></section>${isManager() ? `<aside><form class="crew-white-panel crew-form" data-form="document" data-id="${e(shift.id)}"><h2>Document toevoegen</h2><label>Titel<input name="title" maxlength="120" required placeholder="Bijvoorbeeld: draaiboek" /></label><label>Type<select name="file_type">${documentTypes.map(type => `<option>${e(type)}</option>`).join("")}</select></label><label>Bestand<input name="file" type="file" required accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.txt" /></label><p class="crew-form-hint">Maximaal 20 MB. Alleen crew van deze shift kan het bestand openen.</p><button type="submit" class="crew-button primary"><span>Upload document</span><span class="crew-button-icon">${icon("plus", 17)}</span></button></form></aside>` : ""}</div>`;
}
function roomPage(shift, tab) {
  const event = eventOf(shift);
  const tabs = [["overzicht", "Overzicht"], ["taken", "Taken"], ["crew", "Crew"], ["documenten", "Documenten"]];
  const selected = tabs.some(([id]) => id === tab) ? tab : "overzicht";
  const body = selected === "taken" ? tasksTab(shift) : selected === "crew" ? crewTab(shift) : selected === "documenten" ? documentsTab(shift) : overviewTab(shift);
  return shell(`<a class="crew-back" href="#${isManager() ? `manage/${event.id}` : "shifts"}">${icon("back", 16)} Terug naar ${isManager() ? "event" : "mijn shifts"}</a><div class="crew-room-hero"><span class="eyebrow">EVENTRUIMTE · ${e(shift.title.toUpperCase())}</span><h1>${e(event.title)}</h1>${event.subtitle ? `<p class="crew-hero-subtitle">${e(event.subtitle)}</p>` : ""}<div><span>${icon("calendar", 16)}${e(dateText(shift.date))}</span><span>${icon("clock", 16)}${e(shiftTime(shift))}</span><span>${icon("users", 16)}${occupancyOf(shift.id)} crewleden</span><span>${icon("room", 16)}${e(event.location)}</span></div></div><div class="crew-tab-bar" role="tablist" aria-label="Eventruimte onderdelen">${tabs.map(([id, label]) => `<a role="tab" aria-selected="${selected === id}" href="#room/${e(shift.id)}/${id}" class="${selected === id ? "active" : ""}">${label}</a>`).join("")}</div><div class="crew-room-content">${body}</div>`, "rooms");
}

function eventCardManager(event) {
  const shifts = state.data.shifts.filter(s => s.event_id === event.id);
  const need = shifts.reduce((sum, s) => sum + s.required_people, 0);
  const assigned = shifts.reduce((sum, s) => sum + assignedOf(s.id), 0);
  const openRoles = shifts.flatMap(s => rolesOf(s.id).filter(role => roleAssigned(s.id, role.name) < role.required_count).map(role => role.name));
  return `<article class="crew-manager-event"><div class="crew-manager-event-head"><div class="crew-date-block"><strong>${dayNumber(event.start_date)}</strong><span>${monthShort(event.start_date)}</span></div><div><span class="eyebrow">${e(event.type)} · ${shifts.length} shift${shifts.length === 1 ? "" : "s"}</span><h2>${e(event.title)}</h2>${event.subtitle ? `<p>${e(event.subtitle)}</p>` : ""}</div>${badge(!need ? "Rollen ontbreken" : need - assigned > 0 ? `${need - assigned} posities open` : "Volledig ingepland", !need || need - assigned > 0 ? "open" : "confirmed")}</div><div class="crew-manager-event-stats"><div><span>Benodigd</span><strong>${need}</strong></div><div><span>Ingepland</span><strong>${assigned}</strong></div></div><div class="crew-manager-event-roles"><span>Open rollen:</span> ${openRoles.length ? [...new Set(openRoles)].map(x => badge(x, "peach")).join("") : badge(need ? "Geen" : "Nog toevoegen", need ? "confirmed" : "open")}</div>${button("Event beheren", "manage-event", event.id)}</article>`;
}
function eventForm() {
  return `<form class="crew-white-panel crew-form crew-create-form" data-form="event"><div class="crew-section-head"><h2>Nieuw event</h2><button type="button" class="crew-small-button" data-action="hide-event-form">Sluiten</button></div><label>Eventnaam<input name="title" required maxlength="120" /></label><label>Thema of subtitel <small>(optioneel)</small><input name="subtitle" maxlength="120" /></label><div class="crew-form-pair"><label>Type<input name="type" required maxlength="80" value="Event" /></label><label>Locatie<input name="location" required value="LIEF Amsterdam" /></label></div><div class="crew-form-pair"><label>Startdatum<input name="start_date" type="date" required /></label><label>Einddatum<input name="end_date" type="date" required /></label></div><label>Omschrijving<textarea name="description" rows="3"></textarea></label><button type="submit" class="crew-button primary"><span>Event aanmaken</span><span class="crew-button-icon">${icon("plus", 17)}</span></button></form>`;
}
function editEventForm(event) {
  return `<details class="crew-edit-details"><summary>Eventinformatie bewerken</summary><form class="crew-form" data-form="event-edit" data-id="${e(event.id)}"><label>Eventnaam<input name="title" required maxlength="120" value="${e(event.title)}" /></label><label>Thema of subtitel <small>(optioneel)</small><input name="subtitle" maxlength="120" value="${e(event.subtitle || "")}" /></label><div class="crew-form-pair"><label>Type<input name="type" required maxlength="80" value="${e(event.type)}" /></label><label>Locatie<input name="location" required value="${e(event.location)}" /></label></div><div class="crew-form-pair"><label>Startdatum<input name="start_date" type="date" required value="${e(event.start_date)}" /></label><label>Einddatum<input name="end_date" type="date" required value="${e(event.end_date)}" /></label></div><label>Eventmanager<select name="manager_id"><option value="">LIEF eventteam</option>${state.data.profiles.filter(person => person.role === "manager").map(person => `<option value="${e(person.id)}" ${event.manager_id === person.id ? "selected" : ""}>${e(person.full_name)}</option>`).join("")}</select></label><label>Omschrijving<textarea name="description" rows="5">${e(event.description)}</textarea></label><button type="submit" class="crew-button primary"><span>Event opslaan</span><span class="crew-button-icon">${icon("check", 17)}</span></button></form></details>`;
}
function managerPage() {
  const upcoming = state.data.events.filter(event => event.end_date >= todayIso()).sort((a, b) => a.start_date.localeCompare(b.start_date));
  const openShifts = upcomingShifts().filter(shift => shift.required_people === 0 || occupancyOf(shift.id) < shift.required_people).length;
  const openTasks = state.data.tasks.filter(task => task.status !== "klaar");
  const stats = [[upcoming.length, "Aankomende events"], [openShifts, "Open shifts"], [state.data.profiles.filter(p => p.role === "employee").length, "Crewleden"], [openTasks.length, "Open taken"], [openTasks.filter(t => t.priority === "urgent").length, "Urgente taken"]];
  return shell(`<div class="crew-manager-title">${heading("MANAGER · LIEF AMSTERDAM", "De operatie in beeld.", "Events, shifts en bezetting in één overzicht.")}<button type="button" class="crew-button primary" data-action="show-event-form"><span>Nieuw event</span><span class="crew-button-icon">${icon("plus", 18)}</span></button></div>${state.showEventForm ? eventForm() : ""}<div class="crew-manager-stats">${stats.map(([value, label], index) => `<div class="${index === 4 ? "accent" : ""}"><strong>${value}</strong><span>${label}</span></div>`).join("")}</div><div class="crew-section-head"><h2>Aankomende events</h2>${badge(`${upcoming.length} events`, "soft")}</div><div class="crew-manager-event-grid">${upcoming.length ? upcoming.map(eventCardManager).join("") : empty("Nog geen events", "Maak het eerste event aan om shifts te plannen.")}</div>`, "manager");
}
function shiftManagePanel(shift) {
  const members = signupsOf(shift.id);
  const event = eventOf(shift);
  return `<article class="crew-white-panel crew-manage-shift" id="shift-${e(shift.id)}"><div class="crew-section-head"><div><span class="eyebrow">${e(dateText(shift.date))} · ${e(shiftTime(shift))}</span><h2>${e(shift.title)}</h2></div>${shift.published === false ? badge("Concept", "pending") : badge(`${assignedOf(shift.id)} / ${shift.required_people} ingepland`, openOf(shift) ? "open" : "confirmed")}</div><div class="crew-manage-metrics"><span>${occupancyOf(shift.id)} aangemeld</span><span>${openOf(shift)} posities open</span><span>${tasksOf(shift.id).filter(t => t.status !== "klaar").length} taken open</span><span>${docsOf(shift.id).length} documenten</span></div>${shift.published === false ? `<div class="crew-publish"><p>Deze shift is nog niet zichtbaar voor medewerkers. Voeg eerst rollen toe en publiceer daarna.</p>${button("Publiceer shift", "publish-shift", shift.id, "primary", rolesOf(shift.id).length ? "" : "disabled")}</div>` : ""}<details class="crew-edit-details"><summary>Shift en briefing bewerken</summary><form class="crew-form" data-form="shift-edit" data-id="${e(shift.id)}"><label>Shiftnaam<input name="title" required maxlength="80" value="${e(shift.title)}" /></label><label>Datum<input name="date" type="date" min="${e(event.start_date)}" max="${e(event.end_date)}" required value="${e(shift.date)}" /></label><div class="crew-form-pair"><label>Begintijd<input name="start_time" type="time" required value="${e(timeText(shift.start_time))}" /></label><label>Eindtijd<input name="end_time" type="time" required value="${e(timeText(shift.end_time))}" /></label></div><label>Briefing<textarea name="briefing" rows="3">${e(shift.briefing)}</textarea></label><label>Belangrijke mededeling<textarea name="announcement" rows="2">${e(shift.announcement)}</textarea></label><button type="submit" class="crew-button primary"><span>Shift opslaan</span><span class="crew-button-icon">${icon("check", 17)}</span></button></form></details><div class="crew-role-table"><div class="crew-role-header"><strong>Rol</strong><strong>Bezet</strong><strong>Benodigd</strong></div>${rolesOf(shift.id).map(role => `<div class="crew-role-row"><span>${e(role.name)}</span><strong>${roleAssigned(shift.id, role.name)} / ${role.required_count}</strong><input type="number" min="${Math.max(1, roleAssigned(shift.id, role.name))}" max="99" value="${role.required_count}" data-action="role-need" data-id="${e(role.id)}" aria-label="Benodigd aantal ${e(role.name)}" /></div>`).join("")}</div><form class="crew-add-role" data-form="role" data-id="${e(shift.id)}"><label>Rol toevoegen<input name="name" list="role-suggestions" required maxlength="80" placeholder="Bijvoorbeeld Bar" /></label><label>Aantal<input name="required_count" type="number" min="1" max="99" value="1" required /></label><button type="submit" class="crew-small-button lime">${icon("plus", 17)} Toevoegen</button></form><div class="crew-manage-crew"><strong>Aangemelde crew</strong>${members.length ? members.map(x => `<div><span>${e(nameOf(x.user_id))} <small>· ${e(x.preferred_role || "geen voorkeur")}</small></span><select data-action="assign-role" data-id="${e(x.id)}" aria-label="Rol van ${e(nameOf(x.user_id))}"><option value="">Nog niet ingedeeld</option>${rolesOf(shift.id).map(role => `<option value="${e(role.name)}" ${x.assigned_role === role.name ? "selected" : ""} ${roleAssigned(shift.id, role.name) >= role.required_count && x.assigned_role !== role.name ? "disabled" : ""}>${e(role.name)}</option>`).join("")}</select></div>`).join("") : "<p>Nog geen aanmeldingen.</p>"}</div><a class="crew-button secondary" href="#room/${e(shift.id)}/overzicht"><span>Open eventruimte</span><span class="crew-button-icon">${icon("arrow", 17)}</span></a></article>`;
}
function manageEventPage(event) {
  const shifts = orderedShifts().filter(shift => shift.event_id === event.id);
  return shell(`<a class="crew-back" href="#manager">${icon("back", 16)} Terug naar overzicht</a><div class="crew-manage-hero"><span class="eyebrow">EVENT BEHEREN · ${e(event.type.toUpperCase())}</span><h1>${e(event.title)}</h1>${event.subtitle ? `<p class="crew-hero-subtitle">${e(event.subtitle)}</p>` : ""}<p>${e(event.description)}</p><div><span>${icon("calendar", 16)}${e(dateText(event.start_date))}</span><span>${icon("room", 16)}${e(event.location)}</span><span>${icon("ticket", 16)}${shifts.length} shift${shifts.length === 1 ? "" : "s"}</span></div></div>${editEventForm(event)}<div class="crew-section-head"><h2>Shifts en bezetting</h2>${badge(`${shifts.reduce((sum, shift) => sum + openOf(shift), 0)} posities open`, "open")}</div><div class="crew-manage-grid"><section>${shifts.length ? shifts.map(shiftManagePanel).join("") : empty("Nog geen shifts", "Voeg hieronder de eerste shift toe.")}</section><aside><form class="crew-white-panel crew-form" data-form="shift" data-id="${e(event.id)}"><h2>Shift toevoegen</h2><label>Naam<input name="title" required maxlength="80" placeholder="Bijvoorbeeld Ochtendshift" /></label><label>Datum<input name="date" type="date" min="${e(event.start_date)}" max="${e(event.end_date)}" value="${e(event.start_date)}" required /></label><div class="crew-form-pair"><label>Begintijd<input name="start_time" type="time" required /></label><label>Eindtijd<input name="end_time" type="time" required /></label></div><label>Briefing<textarea name="briefing" rows="3"></textarea></label><button type="submit" class="crew-button primary"><span>Shift toevoegen</span><span class="crew-button-icon">${icon("plus", 17)}</span></button><p class="crew-form-hint">Voeg daarna rollen en benodigde aantallen toe.</p></form></aside></div><datalist id="role-suggestions">${roleNames.map(name => `<option value="${e(name)}"></option>`).join("")}</datalist>`, "manager");
}

function render() {
  if (configured && state.authMode === "reset") { root.innerHTML = gateway(); return; }
  if (!state.profile || !state.data) { root.innerHTML = gateway(); return; }
  const { page, id, tab, itemId } = currentRoute();
  const shift = shiftOf(id), event = state.data.events.find(item => item.id === id);
  if (page === "signup" && shift && state.draftShift !== id) {
    const signup = mySignup(id);
    state.draftShift = id;
    state.firstRole = signup?.preferred_role || "";
    state.secondRole = signup?.second_preference || "";
    state.available = signup?.available ?? true;
  }
  const allowed = page === "room" && shift && canRoom(id);
  if (page === "room" && !allowed) root.innerHTML = shell(empty("Geen toegang", "Meld je aan voor deze shift om de eventruimte te openen.", "planning", "Bekijk planning"), "rooms");
  else if (page === "room") root.innerHTML = roomPage(shift, tab);
  else if (page === "signup" && shift) root.innerHTML = signupPage(shift);
  else if (page === "shifts") root.innerHTML = myShiftsPage();
  else if (page === "rooms") root.innerHTML = roomsPage();
  else if (page === "planning") root.innerHTML = planningPage();
  else if (page === "profile") root.innerHTML = profilePage();
  else if (page === "manager" && isManager()) root.innerHTML = managerPage();
  else if (page === "manage" && event && isManager()) root.innerHTML = manageEventPage(event);
  else root.innerHTML = homePage();
  document.title = `${page === "room" ? "Eventruimte" : page === "manager" ? "Manager" : "Crew"} · LIEF Amsterdam`;
  if (allowed && tab === "taken" && itemId) requestAnimationFrame(() => document.getElementById(`task-${itemId}`)?.scrollIntoView({ block: "center" }));
  state.toast = "";
  const roomId = allowed ? id : null;
  if (supa && state.roomChannelId !== roomId) {
    if (state.roomChannel) supa.removeChannel(state.roomChannel);
    state.roomChannel = null;
    state.roomChannelId = roomId;
    if (roomId) state.roomChannel = supa.channel(`shift-tasks-${roomId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `shift_id=eq.${roomId}` }, () => refresh().catch(console.error)).subscribe();
  }
}

async function insertRow(table, row) {
  if (supa) { const { error } = await supa.from(table).insert(row); if (error) throw error; }
  else state.data[table].push({ id: crypto.randomUUID(), ...row });
  await refresh();
}
async function updateRow(table, id, changes) {
  if (supa) { const { data, error } = await supa.from(table).update(changes).eq("id", id).select("id"); if (error) throw error; if (!data?.length) throw new Error("Geen toegang of onderdeel bestaat niet meer."); }
  else Object.assign(state.data[table].find(row => row.id === id), changes);
  await refresh();
}
async function deleteRow(table, id) {
  if (supa) { const { data, error } = await supa.from(table).delete().eq("id", id).select("id"); if (error) throw error; if (!data?.length) throw new Error("Geen toegang of onderdeel bestaat niet meer."); }
  else state.data[table] = state.data[table].filter(row => row.id !== id);
  await refresh();
}

root.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action, id = target.dataset.id;
  if (action === "auth-mode") {
    if (state.authMode === "reset" && id !== "reset") run(async () => {
      const { error } = await supa.auth.signOut();
      if (error) throw error;
      clearResetUrl();
      state.authMode = id;
      state.toast = "";
      render();
    });
    else { state.authMode = id; state.toast = ""; render(); }
  }
  if (action === "demo-employee" || action === "demo-manager") {
    state.data = makeDemoData();
    state.user = { id: action === "demo-manager" ? "demo-manager" : "demo-employee", email: "" };
    state.profile = profile(state.user.id);
    loadData().then(() => go(isManager() ? "manager" : "home"));
  }
  if (action === "go") go(id);
  if (action === "filter") { state.filter = id; render(); }
  if (action === "available") { state.available = id === "yes"; render(); }
  if (action === "signup") openSignup(id);
  if (action === "room") go(`room/${id}/overzicht`);
  if (action === "manage-event") go(`manage/${id}`);
  if (action === "manage-shift") { const s = shiftOf(id); go(`manage/${s.event_id}`); setTimeout(() => document.getElementById(`shift-${id}`)?.scrollIntoView({ behavior: "smooth" }), 50); }
  if (action === "publish-shift" && isManager()) run(async () => {
    if (!rolesOf(id).length) throw new Error("Voeg eerst minimaal één rol toe.");
    await updateRow("shifts", id, { published: true });
    toast("Shift gepubliceerd. Medewerkers met Nieuwe shifts ingeschakeld krijgen een melding.");
  });
  if (action === "enable-push") run(async () => {
    if (!supportsPush()) throw new Error("Meldingen worden op dit apparaat niet ondersteund.");
    if (!state.notificationPreferences) throw new Error("Voer eerst notifications.sql uit in Supabase.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") { toast("Meldingen staan uit. Je kunt toestemming geven via je browserinstellingen."); return; }
    const registration = await pushRegistration();
    let subscription = await registration.pushManager.getSubscription();
    const created = !subscription;
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: vapidBytes() });
    try { await pushAction("subscribe", { subscription: subscription.toJSON() }); }
    catch (error) { if (created) await subscription.unsubscribe(); throw error; }
    state.pushEnabled = true;
    toast("Meldingen staan aan.");
  });
  if (action === "disable-push") run(async () => {
    const subscription = await (await pushRegistration()).pushManager.getSubscription();
    if (subscription) {
      await pushAction("unsubscribe", { endpoint: subscription.endpoint });
      await subscription.unsubscribe();
    }
    state.pushEnabled = false;
    toast("Meldingen staan uit.");
  });
  if (action === "test-push") run(async () => {
    const subscription = await (await pushRegistration()).pushManager.getSubscription();
    if (!subscription) throw new Error("Schakel eerst meldingen in op dit apparaat.");
    await pushAction("test", { endpoint: subscription.endpoint });
    toast("Testmelding verstuurd.");
  });
  if (action === "show-event-form") { state.showEventForm = true; render(); }
  if (action === "hide-event-form") { state.showEventForm = false; render(); }
  if (action === "cancel-edit") { state.editTask = null; render(); }
  if (action === "edit-task" && isManager()) { state.editTask = id; render(); document.querySelector(".crew-task-form")?.scrollIntoView({ behavior: "smooth" }); }
  if (action === "save-signup") run(async () => {
    const shift = shiftOf(id), existing = mySignup(id);
    const first = state.firstRole || null;
    const second = state.secondRole || null;
    if (state.available && !first) throw new Error("Kies eerst een voorkeursrol.");
    if (first && second && first === second) throw new Error("Kies twee verschillende rollen.");
    if (state.available && !existing?.available && occupancyOf(id) >= shift.required_people) throw new Error("Deze shift is vol.");
    const changes = { available: state.available, preferred_role: state.available ? first : null, second_preference: state.available ? second : null };
    if (existing) await updateRow("shift_signups", existing.id, changes);
    else await insertRow("shift_signups", { shift_id: id, user_id: state.user.id, ...changes, status: state.available ? "aangemeld" : "niet beschikbaar" });
    state.draftShift = null;
    toast(state.available ? "Je aanmelding is opgeslagen. De eventruimte staat voor je klaar." : "Je beschikbaarheid is opgeslagen.");
  });
  if (action === "claim-task" || action === "start-task" || action === "finish-task") run(async () => {
    const task = state.data.tasks.find(x => x.id === id);
    if (!task || !canRoom(task.shift_id)) throw new Error("Geen toegang tot deze taak.");
    if (action === "claim-task") {
      if (task.assigned_to) throw new Error("Deze taak is al geclaimd.");
      if (supa) {
        const { data, error } = await supa.from("tasks").update({ assigned_to: state.user.id, status: "bezig" }).eq("id", id).is("assigned_to", null).select("id");
        if (error) throw error;
        if (!data.length) throw new Error("Deze taak is inmiddels geclaimd.");
        await refresh();
      } else await updateRow("tasks", id, { assigned_to: state.user.id, status: "bezig" });
    } else {
      if (task.assigned_to !== state.user.id && !isManager()) throw new Error("Deze taak is niet aan jou toegewezen.");
      await updateRow("tasks", id, { status: action === "finish-task" ? "klaar" : "bezig", completed_at: action === "finish-task" ? new Date().toISOString() : null });
    }
    toast(action === "finish-task" ? "Taak afgerond." : action === "claim-task" ? "Taak geclaimd." : "Taak gestart.");
  });
  if (action === "delete-task" && isManager() && confirm("Deze taak verwijderen?")) run(async () => { await deleteRow("tasks", id); toast("Taak verwijderd."); });
  if (action === "open-doc") run(async () => {
    const doc = state.data.documents.find(x => x.id === id);
    if (!doc || !canRoom(doc.shift_id)) throw new Error("Geen toegang tot dit document.");
    const tab = window.open("", "_blank");
    if (!tab) throw new Error("Sta pop-ups toe om het document te openen.");
    if (supa) {
      const { data, error } = await supa.storage.from("crew-documents").createSignedUrl(doc.file_url, 60);
      if (error) { tab.close(); throw error; }
      tab.location.href = data.signedUrl;
    } else {
      const url = doc.demo_url || URL.createObjectURL(new Blob([doc.demo_text || doc.title], { type: doc.mime_type || "text/plain" }));
      tab.location.href = url;
    }
  });
  if (action === "download-doc") run(async () => {
    const doc = state.data.documents.find(x => x.id === id);
    if (!doc || !canRoom(doc.shift_id)) throw new Error("Geen toegang tot dit document.");
    let blob;
    if (supa) {
      const result = await supa.storage.from("crew-documents").download(doc.file_url);
      if (result.error) throw result.error;
      blob = result.data;
    } else blob = doc.demo_url ? await (await fetch(doc.demo_url)).blob() : new Blob([doc.demo_text || doc.title], { type: doc.mime_type || "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = doc.file_url?.split("/").pop()?.replace(/^[0-9a-f-]{37}/i, "") || `${doc.title}.txt`;
    document.body.appendChild(link);
    link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  });
  if (action === "delete-doc" && isManager() && confirm("Dit document verwijderen?")) run(async () => {
    const doc = state.data.documents.find(x => x.id === id);
    await deleteRow("documents", id);
    if (supa) { const { error } = await supa.storage.from("crew-documents").remove([doc.file_url]); if (error) throw error; }
    toast("Document verwijderd.");
  });
  if (action === "logout") run(async () => {
    if (supportsPush() && Notification.permission === "granted") {
      const subscription = await (await pushRegistration()).pushManager.getSubscription();
      if (subscription) {
        try { await pushAction("unsubscribe", { endpoint: subscription.endpoint }); } catch (error) { console.error(error); }
        await subscription.unsubscribe();
      }
    }
    if (supa) { const { error } = await supa.auth.signOut(); if (error) throw error; }
    if (state.roomChannel && supa) supa.removeChannel(state.roomChannel);
    state.roomChannel = null; state.roomChannelId = null; state.user = null; state.profile = null; state.data = null; state.notificationPreferences = null; state.pushEnabled = false; state.authMode = "login";
    location.hash = ""; render();
  });
});

root.addEventListener("change", event => {
  const target = event.target, action = target.dataset.action;
  if (action === "notification-preference" && supa) run(async () => {
    const key = target.dataset.id;
    if (!notificationChoices.some(([name]) => name === key)) return;
    const update = { user_id: state.user.id, [key]: target.checked };
    const result = await supa.from("notification_preferences").upsert(update, { onConflict: "user_id" });
    if (result.error) { target.checked = !target.checked; throw result.error; }
    state.notificationPreferences = { ...(state.notificationPreferences || defaultNotificationPreferences), ...update };
    toast("Meldingsvoorkeur opgeslagen.");
  });
  if (action === "first-role") { state.firstRole = target.value; if (state.secondRole === target.value) state.secondRole = ""; render(); }
  if (action === "second-role") { state.secondRole = target.value; }
  if (action === "assign-role" && isManager()) run(async () => {
    const signup = state.data.shift_signups.find(x => x.id === target.dataset.id), role = target.value;
    if (role) {
      const required = rolesOf(signup.shift_id).find(x => x.name === role)?.required_count || 0;
      if (roleAssigned(signup.shift_id, role) >= required && signup.assigned_role !== role) throw new Error("Deze rol is al vol.");
    }
    await updateRow("shift_signups", signup.id, { assigned_role: role || null, status: role ? "bevestigd" : "aangemeld" });
    toast(role ? `${nameOf(signup.user_id)} is ingedeeld bij ${role}.` : `${nameOf(signup.user_id)} is nog niet ingedeeld.`);
  });
  if (action === "role-need" && isManager()) run(async () => {
    const role = state.data.shift_roles.find(x => x.id === target.dataset.id), value = Number(target.value);
    if (!Number.isInteger(value) || value < Math.max(1, roleAssigned(role.shift_id, role.name)) || value > 99) throw new Error("Kies een geldig benodigd aantal.");
    await updateRow("shift_roles", role.id, { required_count: value });
    if (!supa) { shiftOf(role.shift_id).required_people = rolesOf(role.shift_id).reduce((sum, x) => sum + x.required_count, 0); await refresh(); }
    toast(`Benodigd aantal voor ${role.name} bijgewerkt.`);
  });
});

root.addEventListener("submit", event => {
  const form = event.target.closest("form[data-form]");
  if (!form) return;
  event.preventDefault();
  const values = Object.fromEntries(new FormData(form).entries());
  if (form.dataset.form === "login") run(async () => {
    const { error } = await supa.auth.signInWithPassword({ email: String(values.email).trim(), password: String(values.password) });
    if (error) throw error;
    await bootstrap();
  });
  if (form.dataset.form === "signup") run(async () => {
    const full_name = String(values.full_name).trim();
    const password = String(values.password);
    if (!full_name) throw new Error("Vul je naam in.");
    if (password.length < 8) throw new Error("Gebruik minimaal 8 tekens voor je wachtwoord.");
    if (password !== String(values.password_confirm)) throw new Error("De wachtwoorden zijn niet gelijk.");
    const { data, error } = await supa.auth.signUp({
      email: String(values.email).trim(), password,
      options: { data: { full_name }, emailRedirectTo: appUrl() },
    });
    if (error) throw error;
    state.authMode = "login";
    if (data.session) await bootstrap();
    else toast("Controleer je e-mail om je account te bevestigen. Daarna kun je inloggen.");
  });
  if (form.dataset.form === "forgot") run(async () => {
    const { error } = await supa.auth.resetPasswordForEmail(String(values.email).trim(), { redirectTo: resetUrl() });
    if (error) throw error;
    toast("Als dit e-mailadres een account heeft, ontvang je een mail met een herstel-link.");
  });
  if (form.dataset.form === "reset") run(async () => {
    const password = String(values.password);
    if (password.length < 8) throw new Error("Gebruik minimaal 8 tekens voor je wachtwoord.");
    if (password !== String(values.password_confirm)) throw new Error("De wachtwoorden zijn niet gelijk.");
    const session = await supa.auth.getSession();
    if (session.error) throw session.error;
    if (!session.data.session) throw new Error("Open de geldige herstel-link uit je e-mail opnieuw.");
    const { error } = await supa.auth.updateUser({ password });
    if (error) throw error;
    const signOut = await supa.auth.signOut();
    if (signOut.error) throw signOut.error;
    state.user = null; state.profile = null; state.data = null; state.authMode = "login";
    clearResetUrl();
    toast("Je wachtwoord is gewijzigd. Log in met je nieuwe wachtwoord.");
  });
  if (form.dataset.form === "profile") run(async () => {
    const full_name = String(values.full_name).trim();
    if (!full_name) throw new Error("Vul je naam in.");
    const { error } = await supa.from("profiles").update({ full_name }).eq("id", state.user.id);
    if (error) throw error;
    state.profile.full_name = full_name;
    toast("Je naam is opgeslagen.");
  });
  if (form.dataset.form === "event" && isManager()) run(async () => {
    if (values.end_date < values.start_date) throw new Error("De einddatum moet op of na de startdatum liggen.");
    await insertRow("events", { title: String(values.title).trim(), subtitle: String(values.subtitle).trim(), type: String(values.type).trim(), description: String(values.description).trim(), location: String(values.location).trim(), start_date: values.start_date, end_date: values.end_date, manager_id: state.user.id });
    state.showEventForm = false; toast("Event aangemaakt. Voeg nu shifts toe.");
  });
  if (form.dataset.form === "event-edit" && isManager()) run(async () => {
    if (values.end_date < values.start_date) throw new Error("De einddatum moet op of na de startdatum liggen.");
    const shifts = state.data.shifts.filter(shift => shift.event_id === form.dataset.id);
    if (shifts.some(shift => shift.date < values.start_date || shift.date > values.end_date)) throw new Error("Een bestaande shift valt buiten deze datums.");
    await updateRow("events", form.dataset.id, { title: String(values.title).trim(), subtitle: String(values.subtitle).trim(), type: String(values.type).trim(), location: String(values.location).trim(), description: String(values.description).trim(), start_date: values.start_date, end_date: values.end_date, manager_id: values.manager_id || null });
    toast("Eventinformatie opgeslagen.");
  });
  if (form.dataset.form === "shift" && isManager()) run(async () => {
    await insertRow("shifts", { event_id: form.dataset.id, title: String(values.title).trim(), date: values.date, start_time: values.start_time, end_time: values.end_time, briefing: String(values.briefing).trim(), announcement: "", required_people: 0, published: false });
    toast("Conceptshift toegevoegd. Voeg rollen toe en publiceer de shift.");
  });
  if (form.dataset.form === "shift-edit" && isManager()) run(async () => {
    await updateRow("shifts", form.dataset.id, { title: String(values.title).trim(), date: values.date, start_time: values.start_time, end_time: values.end_time, briefing: String(values.briefing).trim(), announcement: String(values.announcement).trim() });
    toast("Shift en briefing opgeslagen.");
  });
  if (form.dataset.form === "role" && isManager()) run(async () => {
    const name = String(values.name).trim(), required_count = Number(values.required_count);
    if (!name || !Number.isInteger(required_count) || required_count < 1 || required_count > 99) throw new Error("Vul een rol en een geldig aantal in.");
    if (rolesOf(form.dataset.id).some(role => role.name.toLowerCase() === name.toLowerCase())) throw new Error("Deze rol bestaat al voor deze shift.");
    await insertRow("shift_roles", { shift_id: form.dataset.id, name, required_count });
    if (!supa) { shiftOf(form.dataset.id).required_people = rolesOf(form.dataset.id).reduce((sum, x) => sum + x.required_count, 0); await refresh(); }
    toast(`${name} toegevoegd.`);
  });
  if (form.dataset.form === "task" && isManager()) run(async () => {
    const row = { title: String(values.title).trim(), description: String(values.description).trim(), priority: values.priority, status: values.status, assigned_to: values.assigned_to || null, notify_all: values.notify_all === "on" };
    if (!row.title) throw new Error("Geef de taak een titel.");
    if (row.notify_all && row.priority !== "urgent") throw new Error("Kies prioriteit Urgent voor een melding aan de hele shift.");
    if (!supa) row.completed_at = row.status === "klaar" ? new Date().toISOString() : null;
    if (form.dataset.task) await updateRow("tasks", form.dataset.task, row);
    else await insertRow("tasks", { shift_id: form.dataset.id, ...row, created_by: state.user.id, created_at: new Date().toISOString(), completed_at: null });
    state.editTask = null; toast("Taak opgeslagen.");
  });
  if (form.dataset.form === "document" && isManager()) run(async () => {
    const file = values.file;
    if (!(file instanceof File) || !file.name) throw new Error("Kies eerst een bestand.");
    if (file.size > 20 * 1024 * 1024) throw new Error("Bestand mag maximaal 20 MB zijn.");
    const shift = shiftOf(form.dataset.id), path = `${shift.id}/${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`;
    if (supa) {
      const upload = await supa.storage.from("crew-documents").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false });
      if (upload.error) throw upload.error;
      try { await insertRow("documents", { shift_id: shift.id, event_id: shift.event_id, title: String(values.title).trim(), file_url: path, file_type: values.file_type, mime_type: file.type || "application/octet-stream", uploaded_by: state.user.id }); }
      catch (error) { await supa.storage.from("crew-documents").remove([path]); throw error; }
    } else await insertRow("documents", { shift_id: shift.id, event_id: shift.event_id, title: String(values.title).trim(), file_url: path, file_type: values.file_type, mime_type: file.type || "application/octet-stream", uploaded_by: state.user.id, created_at: new Date().toISOString(), demo_url: URL.createObjectURL(file) });
    toast("Document toegevoegd.");
  });
});

if (supa) supa.auth.onAuthStateChange((event) => {
  if (event === "PASSWORD_RECOVERY") { state.authMode = "reset"; setTimeout(render, 0); }
  if (event === "SIGNED_OUT") {
    if (supportsPush()) pushRegistration().then(registration => registration.pushManager.getSubscription()).then(subscription => subscription?.unsubscribe()).catch(console.error);
    state.user = null; state.profile = null; state.data = null; state.notificationPreferences = null; state.pushEnabled = false;
    if (state.authMode !== "reset") setTimeout(render, 0);
  }
  if (event === "SIGNED_IN" && !state.user && state.authMode !== "reset") {
    setTimeout(() => bootstrap().catch(console.error), 0);
  }
});
window.addEventListener("hashchange", render);
if ("serviceWorker" in navigator && window.isSecureContext) navigator.serviceWorker.register("./sw.js").catch(console.error);
bootstrap().catch(error => { console.error(error); root.innerHTML = `<div class="crew-gateway"><h1>App kon niet starten</h1><p>${e(getError(error))}</p></div>`; });
