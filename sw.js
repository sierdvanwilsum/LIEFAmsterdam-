"use strict";

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
    data: { url },
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
    const existing = windows.find(client => {
      try { const url = new URL(client.url); return url.origin === scope.origin && url.pathname.startsWith(scope.pathname); }
      catch { return false; }
    });
    if (existing) {
      try {
        const navigated = await existing.navigate(target.href);
        if (navigated) return navigated.focus();
      } catch { /* Navigatie kan bij een net hervatte PWA mislukken. */ }
      await existing.focus();
      existing.postMessage({ type: "LIEF_NAVIGATE", url: target.pathname + target.search + target.hash });
      return;
    }
    return self.clients.openWindow(target.href);
  })());
});
