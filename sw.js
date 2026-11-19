"use strict";

self.addEventListener("install", event => event.waitUntil(self.skipWaiting()));
self.addEventListener("activate", event => event.waitUntil(self.clients.claim()));

self.addEventListener("push", event => {
  let message = {};
  try { message = event.data?.json() || {}; } catch { message = { body: event.data?.text() || "" }; }
  const title = typeof message.title === "string" ? message.title : "LIEF Crew";
  const body = typeof message.body === "string" ? message.body : "Je hebt een nieuwe melding.";
  const url = typeof message.url === "string" ? message.url : "/notifications";
  event.waitUntil(self.registration.showNotification(title, {
    body,
    icon: "./public/icons/icon-192.png",
    badge: "./public/icons/icon-192.png",
    tag: typeof message.tag === "string" ? message.tag : undefined,
    renotify: false,
    data: { url },
  }));
});

self.addEventListener("pushsubscriptionchange", event => {
  event.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then(clients => {
    clients.forEach(client => client.postMessage({ type: "LIEF_PUSH_REFRESH" }));
  }));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();
  const scope = new URL(self.registration.scope);
  const value = event.notification.data?.url;
  let target;
  try {
    const candidate = new URL(typeof value === "string" && value.startsWith("#") ? `/${value}` : value || "/notifications", scope);
    target = candidate.origin === scope.origin && candidate.pathname.startsWith(scope.pathname) ? candidate : new URL("/notifications", scope);
  } catch { target = new URL("/notifications", scope); }
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const eligible = windows.filter(client => {
      try { const url = new URL(client.url); return url.origin === scope.origin && url.pathname.startsWith(scope.pathname); }
      catch { return false; }
    });
    const existing = eligible.find(client => client.focused) || eligible.find(client => client.visibilityState === "visible") || eligible[0];
    if (existing) {
      try { await existing.focus(); } catch { /* Navigatie blijft mogelijk. */ }
      try {
        const acknowledged = await new Promise(resolve => {
          const channel = new MessageChannel();
          const timer = setTimeout(() => resolve(false), 1200);
          channel.port1.onmessage = message => { clearTimeout(timer); resolve(message.data?.ok === true); };
          existing.postMessage({ type: "LIEF_NAVIGATE", url: target.pathname + target.search + target.hash }, [channel.port2]);
        });
        if (acknowledged) return;
      } catch { /* Een slapende PWA kan het bericht missen. */ }
      try { const navigated = await existing.navigate(target.href); if (navigated) return navigated.focus(); }
      catch { /* Open een nieuw venster met de juiste bestemming. */ }
    }
    return self.clients.openWindow(target.href);
  })());
});
