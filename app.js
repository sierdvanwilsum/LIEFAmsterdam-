"use strict";

const roleCatalog = [
  { id: "bar", label: "Bar", symbol: "♨" },
  { id: "runner", label: "Runner", symbol: "↗" },
  { id: "debras", label: "Debras", symbol: "◈" },
  { id: "hospitality", label: "Hospitality", symbol: "✦" },
  { id: "productie", label: "Productie", symbol: "✳" },
  { id: "overig", label: "Overig", symbol: "+" },
];

const employees = [
  { id: "noor", name: "Noor de Vries" },
  { id: "daan", name: "Daan Bakker" },
  { id: "samira", name: "Samira El Idrissi" },
  { id: "mila", name: "Mila Jansen" },
  { id: "jay", name: "Jay van Dijk" },
  { id: "lotte", name: "Lotte Bos" },
  { id: "sem", name: "Sem Vermeer" },
  { id: "nina", name: "Nina Smit" },
  { id: "tom", name: "Tom Visser" },
  { id: "fleur", name: "Fleur Meijer" },
  { id: "yara", name: "Yara van Leeuwen" },
  { id: "raf", name: "Raf de Groot" },
  { id: "emma", name: "Emma van den Berg" },
  { id: "kai", name: "Kai Peters" },
  { id: "sophie", name: "Sophie de Wit" },
  { id: "mees", name: "Mees van Loon" },
  { id: "aya", name: "Aya Haddad" },
  { id: "julian", name: "Julian Mulder" },
  { id: "isa", name: "Isa van der Meer" },
  { id: "levi", name: "Levi Kramer" },
  { id: "elise", name: "Elise Vos" },
  { id: "omar", name: "Omar Benali" },
  { id: "eva", name: "Eva de Boer" },
  { id: "felix", name: "Felix Smit" },
  { id: "rosa", name: "Rosa van Dam" },
  { id: "adam", name: "Adam El Amrani" },
  { id: "julia", name: "Julia Dekker" },
  { id: "mats", name: "Mats Kuiper" },
  { id: "ines", name: "Ines Janssen" },
  { id: "thijs", name: "Thijs van Beek" },
  { id: "sara", name: "Sara Verhoeven" },
  { id: "noud", name: "Noud Meijer" },
  { id: "lina", name: "Lina Karim" },
  { id: "pepijn", name: "Pepijn Bos" },
];

const eventSpecs = [
  {
    id: "noordlicht", title: "Noordlicht Jaarcongres", category: "Jaarcongres", group: "congres",
    date: "2026-11-12", start: "08:00", end: "19:00", art: 1,
    description: "Een dag met plenaire sessies, break-outs en een afsluitende netwerkborrel.",
    roles: [["bar", 5], ["runner", 4], ["debras", 3], ["hospitality", 6], ["productie", 3]],
    assigned: 18, applicants: 20,
  },
  {
    id: "atelier-nova", title: "Atelier Nova Productlancering", category: "Productlancering", group: "lancering",
    date: "2026-11-17", start: "12:00", end: "22:00", art: 2,
    description: "Een nieuwe collectie wordt gepresenteerd aan pers, partners en relaties.",
    roles: [["bar", 3], ["runner", 3], ["debras", 2], ["hospitality", 3], ["productie", 2]],
    assigned: 7, applicants: 10, noorStatus: "pending",
  },
  {
    id: "brug-co", title: "Brug & Co Netwerkborrel", category: "Netwerkborrel", group: "bijeenkomst",
    date: "2026-11-20", start: "15:00", end: "23:00", art: 3,
    description: "Een informele ontmoeting voor klanten en partners in de grote hal.",
    roles: [["bar", 3], ["runner", 2], ["debras", 2], ["hospitality", 3]],
    assigned: 9, applicants: 10, noorStatus: "confirmed",
  },
  {
    id: "meridiaan", title: "Meridiaan Strategiedag", category: "Strategiedag", group: "congres",
    date: "2026-11-26", start: "07:30", end: "18:00", art: 4,
    description: "Presentaties en werksessies voor een organisatie in beweging.",
    roles: [["bar", 2], ["runner", 3], ["debras", 2], ["hospitality", 4], ["productie", 3]],
    assigned: 6, applicants: 9,
  },
  {
    id: "kade-studio", title: "Kade Studio Klantenevent", category: "Klantenevent", group: "bijeenkomst",
    date: "2026-12-03", start: "13:00", end: "23:00", art: 1,
    description: "Een avond vol ontmoetingen, presentaties en een verzorgd diner.",
    roles: [["bar", 5], ["runner", 4], ["debras", 3], ["hospitality", 4], ["productie", 2]],
    assigned: 12, applicants: 15,
  },
  {
    id: "veldwerk", title: "Veldwerk Bedrijfsfestival", category: "Bedrijfsfestival", group: "feest",
    date: "2026-12-10", start: "10:00", end: "23:00", art: 2,
    description: "Een bedrijfsdag op het binnen- en buitenterrein met eten en activiteiten.",
    roles: [["bar", 7], ["runner", 6], ["debras", 5], ["hospitality", 5], ["productie", 3]],
    assigned: 18, applicants: 22, noorStatus: "pending",
  },
  {
    id: "havenhart", title: "Havenhart Prijzendiner", category: "Prijzendiner", group: "feest",
    date: "2026-12-15", start: "14:00", end: "01:00", art: 4,
    description: "Een feestelijke prijsuitreiking met diner voor medewerkers en gasten.",
    roles: [["bar", 4], ["runner", 5], ["debras", 4], ["hospitality", 5], ["productie", 2]],
    assigned: 19, applicants: 20, noorStatus: "confirmed",
  },
  {
    id: "kompas", title: "Kompas & Partners Teamdag", category: "Teamdag", group: "bijeenkomst",
    date: "2026-12-18", start: "08:00", end: "19:00", art: 3,
    description: "Een actieve dag voor het hele team, van ontvangst tot afsluiting.",
    roles: [["bar", 2], ["runner", 3], ["debras", 2], ["hospitality", 3], ["productie", 1]],
    assigned: 5, applicants: 8,
  },
  {
    id: "morrow", title: "Morrow Merkactivatie", category: "Merkactivatie", group: "lancering",
    date: "2027-01-08", start: "09:00", end: "20:00", art: 2,
    description: "Een creatieve merkpresentatie met demo's en gesprekken.",
    roles: [["bar", 3], ["runner", 4], ["debras", 2], ["hospitality", 4], ["productie", 2]],
    assigned: 10, applicants: 12,
  },
  {
    id: "oevergroep", title: "Oevergroep Personeelsfeest", category: "Personeelsfeest", group: "feest",
    date: "2027-01-16", start: "14:00", end: "01:00", art: 1,
    description: "Een feestelijk samenzijn voor collega's met diner en programma.",
    roles: [["bar", 5], ["runner", 4], ["debras", 4], ["hospitality", 3], ["productie", 1]],
    assigned: 14, applicants: 16,
  },
];

function makeMockEvent(spec, eventIndex) {
  const roles = spec.roles.map(([id, need]) => ({ id, need }));
  const assignmentSlots = [];
  for (let round = 0; round < Math.max(...roles.map(role => role.need)); round++) {
    for (const role of roles) if (round < role.need) assignmentSlots.push(role.id);
  }
  const otherEmployees = employees.filter(person => person.id !== "noor");
  const rotated = otherEmployees.slice(eventIndex * 3).concat(otherEmployees.slice(0, eventIndex * 3));
  const participantIds = rotated.slice(0, spec.applicants - (spec.noorStatus ? 1 : 0)).map(person => person.id);
  if (spec.noorStatus === "confirmed") participantIds.unshift("noor");
  if (spec.noorStatus === "pending") participantIds.splice(spec.assigned, 0, "noor");
  const applications = participantIds.map((employeeId, index) => {
    const assignedRole = index < spec.assigned ? assignmentSlots[index] : null;
    const firstRole = assignedRole || roles[(index + eventIndex) % roles.length].id;
    const secondRole = roles.find(role => role.id !== firstRole)?.id || null;
    return { employeeId, available: true, firstRole, secondRole, assignedRole };
  });
  return { ...spec, roles, applications };
}

const events = eventSpecs.map(makeMockEvent);

const state = { filter: "alles", drafts: {}, confirmation: null, toast: "" };
const app = document.getElementById("app");

function icon(name, size = 18) {
  const paths = {
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    users: '<path d="M16 20v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 20v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    alert: '<circle cx="12" cy="12" r="10"/><path d="M12 7v6m0 4h.01"/>',
    ticket: '<path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4V7Z"/><path d="M13 5v2m0 3v4m0 3v2"/>',
    location: '<path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  };
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.ticket}</svg>`;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

function roleLabel(id) { return roleCatalog.find(role => role.id === id)?.label || "—"; }
function roleSymbol(id) { return roleCatalog.find(role => role.id === id)?.symbol || "+"; }
function personName(id) { return employees.find(person => person.id === id)?.name || "Onbekend"; }
function currentApplication(event) { return event.applications.find(item => item.employeeId === "noor"); }
function activeApplications(event) { return event.applications.filter(item => item.available); }
function totalNeed(event) { return event.roles.reduce((sum, role) => sum + role.need, 0); }
function assignedCount(event, roleId) { return activeApplications(event).filter(item => item.assignedRole === roleId).length; }
function totalAssigned(event) { return activeApplications(event).filter(item => item.assignedRole).length; }
function totalOpen(event) { return event.roles.reduce((sum, role) => sum + Math.max(0, role.need - assignedCount(event, role.id)), 0); }
function dateLabel(iso, options = { weekday: "long", day: "numeric", month: "long", year: "numeric" }) {
  return new Intl.DateTimeFormat("nl-NL", options).format(new Date(`${iso}T12:00:00`));
}
function timeLabel(event) { return `${event.start} – ${event.end}`; }
function eventById(id) { return events.find(event => event.id === id); }
function route() {
  const [page, id] = location.hash.replace(/^#\/?/, "").split("/");
  if (page === "inschrijven" && eventById(id)) return { page, id };
  if (page === "beheren" && eventById(id)) return { page, id };
  if (["events", "planning", "manager"].includes(page)) return { page };
  return { page: "events" };
}
function navigate(page, id) {
  const next = `#${page}${id ? `/${id}` : ""}`;
  if (location.hash === next) render(); else location.hash = next;
  window.scrollTo({ top: 0, behavior: "instant" });
}
function statusFor(event) {
  const application = currentApplication(event);
  if (!application) return { label: "Nog niet aangemeld", tone: "soft" };
  if (!application.available) return { label: "Niet beschikbaar", tone: "unavailable" };
  if (application.assignedRole) return { label: "Bevestigd", tone: "confirmed" };
  return { label: "Aangemeld", tone: "pending" };
}
function statusPill(label, tone) { return `<span class="status-pill ${tone}">${esc(label)}</span>`; }
function brand(manager = false) {
  return `<a class="brand" href="#${manager ? "manager" : "events"}" aria-label="LIEF Crew Planner"><span class="brand-logo-frame"><img class="brand-logo" src="design-references/image copy Lief Logo 2.png" alt="LIEF-logo" /></span><span class="brand-badge">${manager ? "MANAGER" : "CREW"}</span></a>`;
}
function employeeHeader(page) {
  return `<header class="topbar">${brand()}<nav class="desktop-crew-nav" aria-label="Medewerker navigatie"><button class="${page === "events" || page === "inschrijven" ? "is-active" : ""}" data-action="navigate" data-page="events" type="button">${icon("calendar", 17)}Events</button><button class="${page === "planning" ? "is-active" : ""}" data-action="navigate" data-page="planning" type="button">${icon("ticket", 17)}Mijn planning</button></nav><div class="header-actions"><div class="mode-switch" aria-label="Weergave"><button class="is-active" type="button" data-action="mode" data-page="events">CREW</button><button type="button" data-action="mode" data-page="manager">MANAGER</button></div><span class="avatar" aria-label="Medewerker Noor">${icon("users", 17)}</span></div></header>`;
}
function employeeNav(page) {
  const planningCount = events.filter(event => currentApplication(event)?.available).length;
  return `<nav class="bottom-nav" aria-label="Medewerker navigatie"><button class="${page === "events" || page === "inschrijven" ? "is-active" : ""}" data-action="navigate" data-page="events" type="button">${icon("calendar", 16)}<span>Events</span></button><button class="${page === "planning" ? "is-active" : ""}" data-action="navigate" data-page="planning" type="button">${icon("ticket", 16)}<span>Mijn planning</span>${planningCount ? `<span class="nav-count">${planningCount}</span>` : ""}</button></nav>`;
}
function employeeFrame(content, page) {
  return `<div class="employee-shell page-${page}">${employeeHeader(page)}<main id="main-content">${content}</main>${employeeNav(page)}</div>`;
}
function managerHeader(page) {
  return `<header class="manager-topbar">${brand(true)}<nav class="manager-nav" aria-label="Manager navigatie"><button type="button" class="${page === "manager" || page === "beheren" ? "is-active" : ""}" data-action="navigate" data-page="manager">Overzicht</button><button type="button" data-action="mode" data-page="events">Crew bekijken</button></nav><span class="avatar" aria-label="Manager">${icon("users", 17)}</span></header>`;
}
function managerFrame(content, page) {
  return `<div class="manager-shell">${managerHeader(page)}<main class="manager-main" id="main-content">${content}</main></div>`;
}
function eventArt(event, extra = "") {
  return `<div class="event-art art-${event.art} ${extra}"><div class="art-top"><span class="pill dark">${esc(event.category)}</span>${statusPill(statusFor(event).label, statusFor(event).tone)}</div><div class="art-bottom"><span class="date">${icon("calendar", 13)}${esc(dateLabel(event.date, { weekday: "short", day: "numeric", month: "short", year: "numeric" }))}</span><span>LIEF Amsterdam</span></div></div>`;
}
function eventCard(event) {
  const need = totalNeed(event), assigned = totalAssigned(event);
  return `<article class="event-card">${eventArt(event)}<div class="event-body"><h2>${esc(event.title)}</h2><span class="meta-line">${icon("calendar", 14)}${esc(dateLabel(event.date))}</span><div class="event-meta event-meta-card"><div><span>Werktijd</span><strong>${esc(timeLabel(event))}</strong></div><div><span>Benodigd</span><strong>${need} medewerkers</strong></div><div><span>Ingepland</span><strong>${assigned} / ${need}</strong></div><div><span>Nog open</span><strong class="open-value">${totalOpen(event)} ${totalOpen(event) === 1 ? "positie" : "posities"}</strong></div></div><div class="progress-track"><span class="progress-fill" style="width:${Math.min(100, assigned / need * 100)}%"></span></div><button type="button" class="cta primary full" data-action="navigate" data-page="inschrijven" data-id="${event.id}"><span>Bekijk event</span><span class="cta-icon">${icon("arrow", 19)}</span></button></div></article>`;
}
function eventsScreen() {
  const filtered = state.filter === "alles" ? events : events.filter(event => event.group === state.filter);
  const chips = [["alles", "Alles"], ["congres", "Congressen"], ["lancering", "Lanceringen"], ["bijeenkomst", "Bijeenkomsten"], ["feest", "Bedrijfsfeesten"]];
  const content = `<div class="intro-band"><span class="heart">✦</span><span>CREATIEF VAN KARAKTER. STRAK GEORGANISEERD.</span><span class="spark">✦</span></div><section class="hero-copy"><div class="mini-row"><span>Hoi Noor</span><span class="pill dark">LIEF CREW</span><span class="pill lime">${events.length} EVENTS OP DE AGENDA</span></div><h1 class="page-heading">WAAR ZET<br><em>JIJ JE IN?</em></h1><p>Van congres tot personeelsfeest: bekijk de komende bedrijfsevenementen en kies jouw shift.</p></section><div class="filter-row" aria-label="Filter evenementen">${chips.map(([value, label]) => `<button type="button" class="filter-chip ${state.filter === value ? "is-active" : ""}" data-action="filter" data-filter="${value}">${label}</button>`).join("")}</div><section class="event-list" aria-label="Aankomende evenementen">${filtered.map(eventCard).join("")}</section>`;
  return employeeFrame(content, "events");
}

function draftFor(event) {
  if (!state.drafts[event.id]) {
    const application = currentApplication(event);
    state.drafts[event.id] = {
      available: application ? application.available : true,
      firstRole: application?.firstRole || null,
      secondRole: application?.secondRole || null,
      error: "",
    };
  }
  return state.drafts[event.id];
}
function roleChoice(event, role, draft) {
  const count = assignedCount(event, role.id), full = count >= role.need;
  const isFirst = draft.firstRole === role.id, isSecond = draft.secondRole === role.id;
  const disabled = (!draft.available || (full && !isFirst && !isSecond));
  const tag = isFirst ? `<span class="pill lime">1e voorkeur</span>` : isSecond ? `<span class="pill dark">2e voorkeur</span>` : full ? `<span class="pill closed">Vol ${count}/${role.need}</span>` : `<span class="pill peach">${role.need - count} open</span>`;
  return `<button class="role-option ${isFirst ? "is-first" : ""} ${isSecond ? "is-second" : ""}" type="button" data-action="role-choice" data-id="${event.id}" data-role="${role.id}" ${disabled ? "disabled" : ""} aria-pressed="${isFirst || isSecond}"><span class="role-icon" aria-hidden="true">${roleSymbol(role.id)}</span><span><strong>${esc(roleLabel(role.id))}</strong><small>${count} van ${role.need} ingedeeld</small></span>${tag}</button>`;
}
function signupScreen(event) {
  const draft = draftFor(event), application = currentApplication(event);
  const confirmed = state.confirmation === event.id;
  const intro = `<section class="signup-hero">${eventArt(event)}<h1 class="page-heading">${esc(event.title)}</h1><span class="meta-line">${icon("calendar", 15)}${esc(dateLabel(event.date))} · ${esc(event.category)}</span><p class="event-desc">${esc(event.description)}</p><div class="event-meta"><div><span>Werktijd</span><strong>${esc(timeLabel(event))}</strong></div><div><span>Ingepland / nodig</span><strong>${totalAssigned(event)} / ${totalNeed(event)}</strong></div><div><span>Open posities</span><strong>${totalOpen(event)}</strong></div><div><span>Aangemeld</span><strong>${activeApplications(event).length}</strong></div></div></section>`;
  const success = confirmed ? `<div class="success-card" role="status">${icon("check", 19)}<div><strong>${draft.available ? "Je aanmelding is ontvangen." : "Beschikbaarheid opgeslagen."}</strong><span>${draft.available ? "Je aanmelding staat klaar. Je ziet je status bij Mijn planning." : "Je staat voor dit event als niet beschikbaar geregistreerd."}</span></div></div>` : "";
  const availability = `<section class="white-card signup-panel"><h2>Ben je erbij?</h2><p>Geef aan of je beschikbaar bent voor deze shift.</p><div class="choice-row"><button type="button" class="choice-button ${draft.available ? "is-active" : ""}" data-action="availability" data-id="${event.id}" data-value="yes" aria-pressed="${draft.available}">Ja, ik ben beschikbaar</button><button type="button" class="choice-button ${!draft.available ? "is-active" : ""}" data-action="availability" data-id="${event.id}" data-value="no" aria-pressed="${!draft.available}">Nee, helaas niet</button></div></section>`;
  const choices = draft.available ? `<section class="white-card signup-panel"><h2>Kies jouw plek</h2><p>Tik eerst op je favoriete rol. Kies daarna eventueel een tweede voorkeur.</p><div class="role-list">${event.roles.map(role => roleChoice(event, role, draft)).join("")}</div><p class="choice-help">Je voorkeur helpt de manager bij de indeling. Je rol is pas definitief na toewijzing.</p></section>` : "";
  const submitLabel = draft.available ? (application?.available ? "Aanmelding bijwerken" : "Inschrijven") : "Beschikbaarheid opslaan";
  return employeeFrame(`<button class="back-link" type="button" data-action="navigate" data-page="events">${icon("back", 15)}Terug naar events</button><div class="signup-layout"><div class="signup-info">${intro}${success}</div><div class="signup-form">${availability}${choices}${draft.error ? `<p class="form-message" role="alert">${esc(draft.error)}</p>` : ""}<button type="button" class="cta primary full signup-submit" data-action="submit-signup" data-id="${event.id}"><span>${submitLabel}</span><span class="cta-icon">${icon("arrow", 19)}</span></button></div></div>`, "inschrijven");
}

function planningCard(event) {
  const application = currentApplication(event), assigned = Boolean(application.assignedRole);
  return `<article class="planning-card">${assigned ? eventArt(event) : ""}<div class="planning-body"><div class="planning-top">${statusPill(assigned ? "Bevestigd" : "Wacht op indeling", assigned ? "confirmed" : "dark")}<span class="caption">${esc(event.category)}</span></div><h2>${esc(event.title)}</h2><span class="meta-line">${icon("calendar", 14)}${esc(dateLabel(event.date))}</span><div class="event-meta"><div><span>Werktijd</span><strong>${esc(timeLabel(event))}</strong></div><div><span>${assigned ? "Toegewezen rol" : "Jouw voorkeur"}</span><strong>${esc(roleLabel(assigned ? application.assignedRole : application.firstRole))}</strong></div></div>${assigned ? "" : '<p class="planning-note">De manager deelt de rollen in. Je krijgt hier je bevestigde rol te zien.</p>'}<button type="button" class="cta muted full" data-action="navigate" data-page="inschrijven" data-id="${event.id}"><span>${assigned ? "Bekijk event" : "Aanmelding bekijken"}</span><span class="cta-icon">${icon("arrow", 18)}</span></button></div></article>`;
}
function planningScreen() {
  const registered = events.filter(event => currentApplication(event)?.available);
  const confirmed = registered.filter(event => currentApplication(event)?.assignedRole);
  const pending = registered.length - confirmed.length;
  const content = `<div class="eyebrow">PERSOONLIJK ROOSTER</div><h1 class="page-heading">Mijn Planning</h1><div class="planning-stats"><div class="stat-orb"><span class="stat-icon">${icon("calendar", 15)}</span><strong>${registered.length}</strong><small>Aanmeldingen</small></div><div class="stat-orb lime"><span class="stat-icon">${icon("check", 15)}</span><strong>${confirmed.length}</strong><small>Bevestigd</small></div><div class="stat-orb soft"><span class="stat-icon">${icon("clock", 15)}</span><strong>${pending}</strong><small>In behandeling</small></div></div><div class="notice-bar"><span class="notice-icon">${icon("calendar", 17)}</span><div><strong>${confirmed.length ? "Je volgende dienst staat klaar" : "Je planning is nog open"}</strong><span>${confirmed.length ? esc(dateLabel(confirmed[0].date)) : "Meld je aan voor een event"}</span></div></div><div class="section-head"><h2>Komende diensten</h2><span class="caption">${registered.length} in je planning</span></div><section class="planning-list" aria-label="Mijn komende diensten">${registered.length ? registered.map(planningCard).join("") : `<div class="empty-state"><h2>Nog geen diensten</h2><p>Bekijk de events en meld je aan voor je eerste shift.</p><button type="button" class="cta primary full" data-action="navigate" data-page="events"><span>Bekijk events</span><span class="cta-icon">${icon("arrow", 18)}</span></button></div>`}</section>`;
  return employeeFrame(content, "planning");
}

function summaryTile(number, label, tone = "") {
  return `<div class="summary-tile ${tone}"><strong>${number}</strong><span>${label}</span></div>`;
}
function managerEventRow(event) {
  const rolePills = event.roles.map(role => `<span class="manager-role-pill ${assignedCount(event, role.id) >= role.need ? "is-full" : ""}">${esc(roleLabel(role.id))} ${assignedCount(event, role.id)}/${role.need}</span>`).join("");
  return `<button class="manager-event-row" type="button" data-action="navigate" data-page="beheren" data-id="${event.id}"><span class="manager-event-title"><span class="eyebrow">${esc(dateLabel(event.date, { day: "numeric", month: "long", year: "numeric" }))} · ${esc(timeLabel(event))}</span><strong>${esc(event.title)}</strong><span class="manager-event-type">${esc(event.category)} · ${totalOpen(event) ? `${totalOpen(event)} ${totalOpen(event) === 1 ? "positie" : "posities"} open` : "Volledig ingepland"}</span><span class="manager-role-pills">${rolePills}</span></span><span class="manager-event-stat"><span>Nodig</span><strong>${totalNeed(event)}</strong></span><span class="manager-event-stat"><span>Ingepland</span><strong>${totalAssigned(event)}</strong></span><span class="manager-event-stat"><span>Aangemeld</span><strong>${activeApplications(event).length}</strong></span><span class="manager-event-stat"><span>Open</span><strong class="${totalOpen(event) ? "open" : ""}">${totalOpen(event)}</strong></span><span class="manager-row-arrow">${icon("arrow", 19)}</span></button>`;
}
function managerOverview() {
  const need = events.reduce((sum, event) => sum + totalNeed(event), 0);
  const assigned = events.reduce((sum, event) => sum + totalAssigned(event), 0);
  const open = events.reduce((sum, event) => sum + totalOpen(event), 0);
  const content = `<section class="manager-heading"><div><span class="eyebrow">PERSONEELSPLANNING · LIEF AMSTERDAM</span><h1>De crew, in één oogopslag.</h1></div><p>Een helder overzicht van alle komende bedrijfsevenementen, bezetting en open rollen.</p></section><div class="manager-overview-grid"><aside class="manager-side"><div class="manager-dark"><span class="eyebrow">EVENTOPERATIE</span><h2>Elk event goed bezet.</h2><p>Open een event om de rollen en aanmeldingen te bekijken en medewerkers in te delen.</p></div><div class="summary-grid">${summaryTile(events.length, "Aankomende events")}${summaryTile(need, "Medewerkers nodig")}${summaryTile(assigned, "Ingepland", "lime")}${summaryTile(open, "Open posities", "peach")}</div></aside><section><div class="section-head" style="margin-top:0"><h2>Aankomende events</h2><span class="caption">${events.length} evenementen</span></div><div class="manager-event-list">${events.map(managerEventRow).join("")}</div><p class="manager-footnote">Bezetting per rol telt ingedeelde medewerkers. Aanmeldingen kunnen nog op een rol wachten.</p></section></div>`;
  return managerFrame(content, "manager");
}

function managerRoleCount(event, role) {
  const assigned = assignedCount(event, role.id), open = Math.max(0, role.need - assigned), percent = Math.min(100, assigned / role.need * 100);
  return `<div class="role-count"><div class="role-count-top"><span class="role-count-name"><span class="role-icon" aria-hidden="true">${roleSymbol(role.id)}</span>${esc(roleLabel(role.id))}</span>${statusPill(open ? `${open} open` : "Vol", open ? "open" : "confirmed")}</div><div class="role-count-bottom"><div class="progress-track"><span class="progress-fill" style="width:${percent}%"></span></div><span class="count">${assigned}/${role.need}</span><span class="role-target"><label for="need-${event.id}-${role.id}">Nodig</label><input id="need-${event.id}-${role.id}" type="number" min="1" max="99" value="${role.need}" data-action="set-need" data-id="${event.id}" data-role="${role.id}" aria-label="Benodigd aantal ${esc(roleLabel(role.id))}" /></span></div></div>`;
}
function assignmentOptions(event, application) {
  return `<option value="">Nog niet ingedeeld</option>${event.roles.map(role => {
    const full = assignedCount(event, role.id) >= role.need && application.assignedRole !== role.id;
    return `<option value="${role.id}" ${application.assignedRole === role.id ? "selected" : ""} ${full ? "disabled" : ""}>${esc(roleLabel(role.id))}${full ? " · vol" : ""}</option>`;
  }).join("")}`;
}
function rosterRow(event, application) {
  const assigned = Boolean(application.assignedRole);
  return `<tr><td>${esc(personName(application.employeeId))}</td><td>${esc(roleLabel(application.firstRole))}</td><td class="small-muted">${application.secondRole ? esc(roleLabel(application.secondRole)) : "—"}</td><td><select class="assignment-select" data-action="assign" data-id="${event.id}" data-person="${application.employeeId}" aria-label="Rol toewijzen aan ${esc(personName(application.employeeId))}">${assignmentOptions(event, application)}</select></td><td>${statusPill(assigned ? "Ingedeeld" : "Wacht", assigned ? "confirmed" : "pending")}</td></tr>`;
}
function managerDetail(event) {
  const availableRoles = roleCatalog.filter(role => !event.roles.some(item => item.id === role.id));
  const applications = activeApplications(event);
  const content = `<div class="manager-detail-head"><div><button class="back-link" type="button" data-action="navigate" data-page="manager">${icon("back", 15)}Alle events</button><h1>${esc(event.title)}</h1><span class="meta-line">${icon("calendar", 15)}${esc(dateLabel(event.date))}</span><span class="meta-line">${icon("clock", 15)}${esc(timeLabel(event))}</span></div><button type="button" class="cta secondary" data-action="navigate" data-page="manager"><span>Terug naar overzicht</span><span class="cta-icon">${icon("arrow", 18)}</span></button></div><div class="detail-summary">${summaryTile(totalNeed(event), "Medewerkers nodig")}${summaryTile(applications.length, "Aangemeld")}${summaryTile(totalAssigned(event), "Ingedeeld", "lime")}${summaryTile(totalOpen(event), "Open posities", "peach")}</div><div class="manager-detail-grid"><section class="manager-panel"><div class="panel-title"><h2>Bezetting per rol</h2><span class="caption">${event.roles.length} rollen</span></div><div class="role-count-list">${event.roles.map(role => managerRoleCount(event, role)).join("")}</div><form class="add-role-form" data-action="add-role" data-id="${event.id}"><label class="sr-only" for="new-role-${event.id}">Nieuwe rol</label><select id="new-role-${event.id}" name="role" ${availableRoles.length ? "" : "disabled"}>${availableRoles.length ? availableRoles.map(role => `<option value="${role.id}">${esc(role.label)}</option>`).join("") : '<option>Alle rollen toegevoegd</option>'}</select><label class="sr-only" for="new-need-${event.id}">Benodigd aantal</label><input id="new-need-${event.id}" name="need" type="number" min="1" max="99" value="1" ${availableRoles.length ? "" : "disabled"} /><button type="submit" ${availableRoles.length ? "" : "disabled"} aria-label="Rol toevoegen">${icon("plus", 19)}</button></form><p class="panel-help">Voeg een rol toe of pas het benodigde aantal direct aan.</p></section><section class="manager-panel"><div class="panel-title"><h2>Aangemelde medewerkers</h2><span class="caption">${applications.length} aangemeld</span></div><div class="roster-table-wrap"><table class="roster-table"><thead><tr><th>Medewerker</th><th>1e voorkeur</th><th>2e voorkeur</th><th>Toegewezen rol</th><th>Status</th></tr></thead><tbody>${applications.length ? applications.map(application => rosterRow(event, application)).join("") : '<tr><td colspan="5">Nog geen aanmeldingen voor dit event.</td></tr>'}</tbody></table></div>${totalOpen(event) ? `<div class="manager-alert">${icon("alert", 17)}<span>Nog ${totalOpen(event)} ${totalOpen(event) === 1 ? "positie" : "posities"} open. Bekijk de bezetting per rol en wijs aangemelde medewerkers toe.</span></div>` : `<div class="success-card">${icon("check", 17)}<div><strong>Alle rollen zijn gevuld.</strong><span>De bezetting is compleet.</span></div></div>`}</section></div>`;
  return managerFrame(content, "beheren");
}

function render() {
  const current = route();
  if (current.page === "events") app.innerHTML = eventsScreen();
  if (current.page === "inschrijven") app.innerHTML = signupScreen(eventById(current.id));
  if (current.page === "planning") app.innerHTML = planningScreen();
  if (current.page === "manager") app.innerHTML = managerOverview();
  if (current.page === "beheren") app.innerHTML = managerDetail(eventById(current.id));
  document.title = `${current.page === "manager" || current.page === "beheren" ? "Manager" : "Crew"} · LIEF Crew Planner`;
  if (state.toast) {
    app.insertAdjacentHTML("beforeend", `<div class="toast" role="status">${esc(state.toast)}</div>`);
    state.toast = "";
  }
}

app.addEventListener("click", event => {
  const target = event.target.closest("[data-action]");
  if (!target || !app.contains(target)) return;
  const action = target.dataset.action;
  if (action === "navigate" || action === "mode") return navigate(target.dataset.page, target.dataset.id);
  if (action === "filter") { state.filter = target.dataset.filter; return render(); }
  if (action === "availability") {
    const draft = draftFor(eventById(target.dataset.id));
    draft.available = target.dataset.value === "yes";
    draft.error = "";
    state.confirmation = null;
    return render();
  }
  if (action === "role-choice") {
    const draft = draftFor(eventById(target.dataset.id)), selected = target.dataset.role;
    if (draft.firstRole === selected) { draft.firstRole = draft.secondRole; draft.secondRole = null; }
    else if (draft.secondRole === selected) draft.secondRole = null;
    else if (!draft.firstRole) draft.firstRole = selected;
    else if (!draft.secondRole) draft.secondRole = selected;
    else { draft.secondRole = draft.firstRole; draft.firstRole = selected; }
    draft.error = "";
    state.confirmation = null;
    return render();
  }
  if (action === "submit-signup") {
    const selectedEvent = eventById(target.dataset.id), draft = draftFor(selectedEvent);
    if (draft.available && !draft.firstRole) { draft.error = "Kies eerst een voorkeursrol."; return render(); }
    const application = currentApplication(selectedEvent);
    const payload = { employeeId: "noor", available: draft.available, firstRole: draft.available ? draft.firstRole : null, secondRole: draft.available ? draft.secondRole : null, assignedRole: draft.available ? (application?.assignedRole || null) : null };
    if (application) Object.assign(application, payload); else selectedEvent.applications.push(payload);
    draft.error = "";
    state.confirmation = selectedEvent.id;
    return render();
  }
});

app.addEventListener("submit", event => {
  const form = event.target.closest('form[data-action="add-role"]');
  if (!form) return;
  event.preventDefault();
  const selectedEvent = eventById(form.dataset.id);
  const formData = new FormData(form), roleId = formData.get("role"), need = Number(formData.get("need"));
  if (!roleCatalog.some(role => role.id === roleId) || selectedEvent.roles.some(role => role.id === roleId) || !Number.isInteger(need) || need < 1 || need > 99) {
    state.toast = "Controleer de rol en het benodigde aantal."; return render();
  }
  selectedEvent.roles.push({ id: roleId, need });
  state.toast = `${roleLabel(roleId)} toegevoegd aan dit event.`;
  render();
});

app.addEventListener("change", event => {
  const target = event.target;
  if (target.dataset.action === "set-need") {
    const selectedEvent = eventById(target.dataset.id), role = selectedEvent.roles.find(item => item.id === target.dataset.role);
    const value = Number(target.value), assigned = assignedCount(selectedEvent, role.id);
    if (!Number.isInteger(value) || value < Math.max(1, assigned) || value > 99) {
      state.toast = `Kies een aantal tussen ${Math.max(1, assigned)} en 99.`; return render();
    }
    role.need = value;
    state.toast = `Benodigd aantal voor ${roleLabel(role.id)} bijgewerkt.`;
    return render();
  }
  if (target.dataset.action === "assign") {
    const selectedEvent = eventById(target.dataset.id), application = selectedEvent.applications.find(item => item.employeeId === target.dataset.person);
    const nextRole = target.value;
    if (nextRole && (!selectedEvent.roles.some(role => role.id === nextRole) || assignedCount(selectedEvent, nextRole) >= selectedEvent.roles.find(role => role.id === nextRole).need)) {
      state.toast = "Deze rol is al vol."; return render();
    }
    application.assignedRole = nextRole || null;
    state.toast = nextRole ? `${personName(application.employeeId)} is ingedeeld bij ${roleLabel(nextRole)}.` : `${personName(application.employeeId)} staat weer op de wachtlijst.`;
    return render();
  }
});

window.addEventListener("hashchange", render);
render();
