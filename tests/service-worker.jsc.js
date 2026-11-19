// Run from project root: jsc tests/service-worker.jsc.js
var handlers = {};
var shown = [];
var opened = [];
var windows = [];
var self = {
  addEventListener(name, callback) { handlers[name] = callback; },
  registration: {
    scope: "https://lief.example/",
    showNotification(title, options) { shown.push({ title, options }); return Promise.resolve(); },
  },
  clients: {
    matchAll() { return Promise.resolve(windows); },
    openWindow(url) { opened.push(url); return Promise.resolve({ url }); },
  },
};
var URL = class {
  constructor(value, base) {
    const href = value.startsWith("http") ? value : (base.origin || new URL(base).origin) + value;
    const match = href.match(/^(https?:\/\/[^/]+)(\/[^?#]*)?(\?[^#]*)?(#.*)?$/);
    if (!match) throw new Error("Bad URL");
    this.origin = match[1]; this.pathname = match[2] || "/";
    this.search = match[3] || ""; this.hash = match[4] || "";
    this.href = href;
  }
};
var setTimeout = function() { return 1; };
var clearTimeout = function() {};
var lastChannel;
var MessageChannel = class {
  constructor() { this.port1 = {}; this.port2 = {}; lastChannel = this; }
};
eval(readFile("sw.js"));
function check(label, value) { if (!value) throw new Error(label); print("PASS " + label); }
function click(url) {
  let work;
  handlers.notificationclick({ notification: { data: { url }, close() {} }, waitUntil(promise) { work = promise; } });
  return work;
}
async function verify() {
  let work;
  handlers.push({
    data: { json() { return { title: "Nieuwe taak", body: "Runner", url: "/events/e/shifts/s?tab=tasks&task=t", tag: "notice-1" }; } },
    waitUntil(promise) { work = promise; },
  });
  await work;
  check("push toont taak met vaste deduplicatietag", shown[0].options.tag === "notice-1" && shown[0].options.renotify === false);
  await click("/events/e/shifts/s?tab=tasks&task=t");
  check("gesloten app opent juiste taak", opened[0] === "https://lief.example/events/e/shifts/s?tab=tasks&task=t");
  windows = [{ url: "https://lief.example/", focused: true, focus() { return Promise.resolve(); }, postMessage(message) {
    this.message = message;
    lastChannel.port1.onmessage({ data: { ok: true } });
  } }];
  await click("/events/e/shifts/s?tab=tasks&task=t");
  check("open app ontvangt taaklink", windows[0].message.url === "/events/e/shifts/s?tab=tasks&task=t" && opened.length === 1);
  windows = [{ url: "https://lief.example/", focused: true, focus() { return Promise.resolve(); },
    postMessage() { lastChannel.port1.onmessage({ data: { ok: false } }); },
    navigate() { return Promise.resolve(null); },
  }];
  await click("/my-shifts/s");
  check("slapende app krijgt nieuwe deep link", opened[1] === "https://lief.example/my-shifts/s");
  await click("https://evil.example/path");
  check("externe link wordt geblokkeerd", opened[2] === "https://lief.example/notifications");
  let refreshMessage;
  windows = [{ postMessage(message) { refreshMessage = message; } }];
  let changed;
  handlers.pushsubscriptionchange({ waitUntil(promise) { changed = promise; } });
  await changed;
  check("abonnementswijziging vraagt app om herregistratie", refreshMessage.type === "LIEF_PUSH_REFRESH");
}
verify().catch(error => { print(error); throw error; });
