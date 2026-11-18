// Run from the project root with macOS JavaScriptCore: jsc tests/completed-shifts.jsc.js
var clickHandler;
var submitHandler;
var rootNode = { innerHTML: "", addEventListener(type, handler) { if (type === "click") clickHandler = handler; if (type === "submit") submitHandler = handler; } };
var document = { getElementById() { return rootNode; }, addEventListener() {} };
var window = { LIEF_SUPABASE: {}, addEventListener() {} };
var navigator = {};
var location = { pathname: "/", hash: "", search: "" };
var URLSearchParams = class { get() { return null; } has() { return false; } };
var setInterval = function() {};
var FormData = class { constructor(form) { this.form = form; } entries() { return Object.entries(this.form.values); } };
var crypto = { randomUUID() { return "test-feedback-id"; } };
var source = readFile("crew.js");
source = source.slice(0, source.lastIndexOf("bootstrap().catch"));
eval(source + `
  function check(label, actual) { if (!actual) throw new Error(label); print("PASS " + label); }
  const dayShift = { id: "day", event_id: "event", title: "Dag", date: "2020-12-10", start_time: "09:00", end_time: "17:00" };
  const nightShift = { id: "night", event_id: "event", title: "Nacht", date: "2020-12-11", start_time: "17:00", end_time: "02:00" };
  const futureShift = { id: "future", event_id: "event", title: "Toekomst", date: "2099-12-11", start_time: "09:00", end_time: "17:00" };
  check("09:00–17:00 is 8 uur", plannedMinutes(dayShift) === 480);
  check("17:00–02:00 is 9 uur", plannedMinutes(nightShift) === 540);
  check("zomertijdnacht telt 5 echte uren", plannedMinutes({ date: "2026-03-28", start_time: "22:00", end_time: "04:00" }) === 300);
  check("wintertijdnacht telt 7 echte uren", plannedMinutes({ date: "2026-10-24", start_time: "22:00", end_time: "04:00" }) === 420);
  check("niet-bestaande 02:30 schuift door naar 03:30", plannedMinutes({ date: "2026-03-28", start_time: "22:00", end_time: "02:30" }) === 270);
  check("dubbele 02:30 gebruikt latere eindtijd", plannedMinutes({ date: "2026-10-24", start_time: "22:00", end_time: "02:30" }) === 330);
  check("afgeronde shift herkend", isCompleted(nightShift));
  check("toekomstige shift niet afgerond", !isCompleted(futureShift));
  state.user = { id: "a" };
  state.profile = { id: "a", full_name: "Noor", role: "employee" };
  state.data = {
    events: [{ id: "event", title: "Willy Wonka" }], shifts: [dayShift, nightShift, futureShift],
    shift_signups: [
      { id: "signup-a-day", shift_id: "day", user_id: "a", available: true, assigned_role: null },
      { id: "signup-a-night", shift_id: "night", user_id: "a", available: true, assigned_role: "Runner" },
      { id: "signup-b-night", shift_id: "night", user_id: "b", available: true, assigned_role: "Bar" },
      { id: "signup-a-future", shift_id: "future", user_id: "a", available: true, assigned_role: "Bar" }
    ],
    shift_feedback: [
      { shift_id: "night", user_id: "a", rating: 1, feedback_text: "Goed", created_at: "2020-12-12T04:00:00Z" },
      { shift_id: "night", user_id: "b", rating: 5, feedback_text: "Top", created_at: "2020-12-12T05:00:00Z" }
    ], profiles: [{ id: "a", full_name: "Noor" }, { id: "b", full_name: "Daan" }]
  };
  const ownHours = myHoursPage();
  check("Mijn uren toont eigen afgeronde diensten", ownHours.includes("17:00–02:00") && ownHours.includes("17 uur"));
  check("afgeronde aanmelding zonder rol blijft zichtbaar", ownHours.includes("Niet ingedeeld") && (ownHours.match(/class="crew-data-row"/g) || []).length === 2);
  check("Mijn uren verbergt toekomstige diensten", !ownHours.includes("Toekomst"));
  check("Mijn uren verbergt collega", !ownHours.includes("Daan"));
  check("één hartje in formulier", feedbackForm(nightShift).includes('name="rating" value="1"'));
  state.data.shift_feedback[0].rating = 5;
  check("vijf hartjes in formulier", (feedbackForm(nightShift).match(/class="crew-heart active"/g) || []).length === 5);
  const controls = [1,2,3,4,5].map(score => ({ dataset: { score }, classList: { active: false, toggle(name, value) { if (name === "active") this.active = value; }, remove() {}, add() {} }, span: {}, querySelector() { return this.span; }, setAttribute() {} }));
  const ratingInput = { value: "0" };
  const form = { querySelector() { return ratingInput; }, querySelectorAll() { return controls; } };
  const selected = { dataset: { action: "select-heart", score: "4" }, classList: { add() {} }, offsetWidth: 48, closest(selector) { return selector === "form" ? form : this; } };
  clickHandler({ target: selected });
  check("hartjes 1 t/m 4 rood", ratingInput.value === "4" && controls.slice(0, 4).every(control => control.classList.active) && !controls[4].classList.active);
  state.data.shift_feedback[0].rating = 1;
  state.profile.role = "manager";
  const overview = completedPage();
  check("manager ziet gemiddeld 3 hartjes", overview.includes("3,0 / 5"));
  const detail = completedDetailPage(nightShift);
  check("manager ziet beide medewerkers en 18 uur", detail.includes("Noor") && detail.includes("Daan") && detail.includes("18 uur"));
  check("manager ziet medewerker zonder toegewezen rol", completedDetailPage(dayShift).includes("Niet ingedeeld"));
  check("manager ziet feedback bij juiste shift", detail.includes("Goed") && detail.includes("Top"));
  async function testPersistence() {
    state.profile.role = "employee";
    state.data.shift_feedback = state.data.shift_feedback.filter(item => item.user_id !== "a");
    refresh = async function() {};
    toast = function() {};
    const form = { dataset: { form: "feedback", id: "night" }, values: { rating: "1", feedback_text: "Eerste reactie" } };
    const event = { target: { closest() { return form; } }, preventDefault() {} };
    submitHandler(event);
    check("feedback wordt opgeslagen", state.data.shift_feedback.some(item => item.user_id === "a" && item.rating === 1 && item.feedback_text === "Eerste reactie"));
    await Promise.resolve(); await Promise.resolve();
    form.values = { rating: "5", feedback_text: "Aangepaste reactie" };
    submitHandler(event);
    check("feedback wordt aangepast zonder duplicaat", state.data.shift_feedback.filter(item => item.user_id === "a").length === 1 && state.data.shift_feedback.find(item => item.user_id === "a").rating === 5);
  }
  testPersistence().catch(error => { print(error); throw error; });
`);
