"use strict";

self.addEventListener("push", event => {
  let message = {};
  try { message = event.data?.json() || {}; } catch { message = { body: event.data?.text() || "" }; }
  const title = typeof message.title === "string" ? message.title : "LIEF Crew";
  const body = typeof message.body === "string" ? message.body : "Je hebt een nieuwe melding.";
  const url = typeof message.url === "string" && message.url.startsWith("#") ? message.url : "#home";
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
  const target = new URL(`./${event.notification.data?.url || "#home"}`, self.registration.scope).href;
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    const existing = windows.find(client => client.url.split("#")[0] === target.split("#")[0]);
    if (existing) {
      await existing.navigate(target);
      return existing.focus();
    }
    return self.clients.openWindow(target);
  })());
});
