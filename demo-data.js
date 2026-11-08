"use strict";

const GVB_EVENT_TEXT = "GVB organiseert een bedrijfsevent bij LIEF Amsterdam met Willy Wonka als thema. Bekijk de shiftbriefing en het draaiboek voor praktische informatie.";
const demoEvents = [
  ["Day 1 – Opbouw", "", "Opbouw", "2026-11-12", "Voorbereiding van het zakelijke event DAY1."],
  ["DAY1", "JayJay Boske", "Event", "2026-11-13", "Een inspirerende dag met presentaties, ontmoetingen en een afsluitend programma."],
  ["GVB", "Willy Wonka", "Opbouw", "2026-12-08", "Opbouw voor het GVB-event met Willy Wonka als thema."],
  ["GVB", "Willy Wonka", "Bedrijfsevent", "2026-12-09", GVB_EVENT_TEXT],
  ["GVB", "Willy Wonka", "Bedrijfsevent", "2026-12-10", GVB_EVENT_TEXT],
  ["GVB", "Willy Wonka", "Bedrijfsevent", "2026-12-11", GVB_EVENT_TEXT],
  ["GVB", "Willy Wonka", "Bedrijfsevent", "2026-12-12", GVB_EVENT_TEXT],
  ["Oud en Opnieuw", "", "Bedrijfsevent", "2026-12-15", "Een feestelijke afsluiting van het jaar voor medewerkers en relaties."],
].map(([title, subtitle, type, start_date, description], index) => ({
  id: `event-${index + 1}`, title, subtitle, type, description,
  location: "LIEF Amsterdam", start_date, end_date: index === 7 ? "2026-12-16" : start_date,
  manager_id: "demo-manager",
}));

const demoShiftSpecs = [
  [0, "Opbouw", "09:00", "15:00", [["Opbouw", 5], ["Productie", 2]], "Meld je bij de productie-ingang voor de startbriefing."],
  [1, "Event", "09:00", "22:00", [["Bar", 8], ["Runner", 5], ["Debras", 4], ["Hospitality", 6], ["Productie", 3], ["Garderobe", 2]], "Ontvangst en crewbriefing vinden plaats bij de hoofdingang."],
  [2, "Opbouw", "09:00", "17:00", [["Opbouw", 8], ["Productie", 3], ["Entertainment support", 2]], "We bouwen de routing en verschillende ruimtes op."],
  [3, "Ochtendshift", "09:00", "18:00", [["Oempa Loempa", 5], ["Bar", 7], ["Runner", 5], ["Hospitality", 5], ["Routing", 4], ["Productie", 3]], "Check in bij de crewbalie en lees het draaiboek."],
  [3, "Middagshift", "12:00", "18:00", [["Oempa Loempa", 3], ["Bar", 4], ["Runner", 3], ["Routing", 3], ["Entertainment support", 2]], "Meld je bij de crewbalie en lees het draaiboek."],
  [4, "Middagshift", "12:00", "18:00", [["Bar", 5], ["Runner", 4], ["Hospitality", 3], ["Routing", 3]], "Lees de briefing en meld je bij de area lead."],
  [4, "Avondshift", "17:00", "02:00", [["Oempa Loempa", 4], ["Bar", 7], ["Runner", 5], ["Debras", 4], ["Routing", 3], ["Entertainment support", 2]], "De eindtijd valt op de volgende kalenderdag."],
  [5, "Eventshift", "12:00", "20:00", [["Oempa Loempa", 4], ["Bar", 6], ["Runner", 4], ["Hospitality", 4], ["Routing", 3]], "Meld je bij de crewbalie en lees het draaiboek."],
  [6, "Ochtendshift", "08:00", "15:00", [["Bar", 5], ["Runner", 4], ["Afbouw", 4], ["Productie", 3]], "Lees de briefing en meld je bij de area lead."],
  [7, "Avondshift", "17:00", "02:00", [["Bar", 6], ["Runner", 4], ["Debras", 4], ["Hospitality", 4], ["Garderobe", 2], ["Afbouw", 2]], "De eindtijd valt op de volgende kalenderdag."],
];

function makeDemoData() {
  const profiles = [
    { id: "demo-manager", full_name: "Sierd van LIEF", role: "manager", avatar_url: null },
    { id: "demo-employee", full_name: "Noor de Vries", role: "employee", avatar_url: null },
    ...["Daan Bakker", "Samira El Idrissi", "Mila Jansen", "Jay van Dijk", "Lotte Bos", "Sem Vermeer", "Nina Smit", "Tom Visser", "Fleur Meijer", "Yara van Leeuwen", "Raf de Groot", "Emma van den Berg", "Kai Peters", "Sophie de Wit", "Mees van Loon", "Aya Haddad", "Julian Mulder", "Isa van der Meer", "Levi Kramer", "Elise Vos", "Omar Benali", "Eva de Boer", "Felix Smit", "Rosa van Dam", "Adam El Amrani", "Julia Dekker", "Mats Kuiper", "Ines Janssen", "Thijs van Beek", "Sara Verhoeven", "Noud Meijer", "Lina Karim", "Pepijn Bos"].map((full_name, i) => ({ id: `crew-${i}`, full_name, role: "employee", avatar_url: null })),
  ];
  const events = structuredClone(demoEvents);
  const shifts = demoShiftSpecs.map(([eventIndex, title, start_time, end_time, roles, briefing], index) => ({
    id: `shift-${index + 1}`, event_id: events[eventIndex].id, title,
    date: events[eventIndex].start_date, start_time, end_time,
    required_people: roles.reduce((sum, [, need]) => sum + need, 0), briefing,
    announcement: index === 1 ? "Neem je legitimatie mee voor de crewregistratie." : index === 3 ? "Crewbriefing om 08:45." : "",
  }));
  const shift_roles = demoShiftSpecs.flatMap(([, , , , roles], shiftIndex) => roles.map(([name, required_count], roleIndex) => ({
    id: `role-${shiftIndex}-${roleIndex}`, shift_id: shifts[shiftIndex].id, name, required_count,
  })));
  const fillFractions = [0.72, 0.82, 0.38, 0.45, 0.93, 0.67, 0.52, 0.8, 0.94, 0.6];
  const shift_signups = [];
  shifts.forEach((shift, shiftIndex) => {
    const need = Math.floor(shift.required_people * fillFractions[shiftIndex]);
    const roles = shift_roles.filter(role => role.shift_id === shift.id);
    const slots = roles.flatMap(role => Array(role.required_count).fill(role.name));
    const people = profiles.slice(2).slice(shiftIndex * 2).concat(profiles.slice(2, shiftIndex * 2));
    if ([1, 3, 6].includes(shiftIndex)) people.unshift(profiles[1]);
    for (let i = 0; i < need; i++) shift_signups.push({
      id: `signup-${shiftIndex}-${i}`, shift_id: shift.id, user_id: people[i].id,
      preferred_role: slots[i], second_preference: roles.find(role => role.name !== slots[i])?.name || null,
      assigned_role: i < Math.max(0, need - 2) ? slots[i] : null,
      available: true, status: i < Math.max(0, need - 2) ? "bevestigd" : "aangemeld",
      created_at: new Date().toISOString(),
    });
  });
  const tasks = [
    [1, "Extra statafels naar The Main", "Plaats vier statafels bij de ingang van The Main.", "urgent", "bezig", "demo-employee"],
    [1, "Crewbalie gereedmaken", "Leg badges en de crewlijst klaar.", "belangrijk", "te doen", null],
    [1, "Signage controleren", "Loop de routing naar de congreszaal na.", "normaal", "te doen", null],
    [3, "Draaiboek bij crewbalie leggen", "Print een actuele versie voor de ontvangst.", "belangrijk", "te doen", null],
    [3, "Routing markeren", "Controleer de markeringen voor alle areas.", "urgent", "te doen", null],
    [6, "Barvoorraad nalopen", "Controleer de voorraad voor aanvang.", "normaal", "te doen", null],
  ].map(([shiftIndex, title, description, priority, status, assigned_to], i) => ({
    id: `task-${i}`, shift_id: shifts[shiftIndex].id, title, description, priority, status,
    assigned_to, created_by: "demo-manager", created_at: new Date().toISOString(), completed_at: null,
  }));
  const documents = [
    { id: "doc-1", shift_id: shifts[1].id, event_id: shifts[1].event_id, title: "DAY1 – Draaiboek", file_type: "Draaiboek", mime_type: "text/plain", file_url: "", uploaded_by: "demo-manager", created_at: new Date().toISOString(), demo_text: "DAY1 – Draaiboek\nCrewbriefing 08:45\nOntvangst gasten 09:00\nAfsluiting 22:00" },
    { id: "doc-2", shift_id: shifts[3].id, event_id: shifts[3].event_id, title: "GVB · Willy Wonka – Briefing", file_type: "Briefing", mime_type: "text/plain", file_url: "", uploaded_by: "demo-manager", created_at: new Date().toISOString(), demo_text: "GVB · Willy Wonka – Briefing\nCheck in bij de crewbalie.\nLees alle belangrijke mededelingen in de eventruimte." },
  ];
  return { profiles, events, shifts, shift_roles, shift_signups, tasks, documents };
}
