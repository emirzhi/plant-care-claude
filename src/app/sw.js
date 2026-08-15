import { defaultCache } from "@serwist/next/worker";
import { Serwist } from "serwist";

// self.__SW_MANIFEST is injected at build time by @serwist/next's
// InjectManifest plugin. If it's undefined at runtime, the plugin didn't run
// (see the Turbopack gotcha in next.config.mjs / CLAUDE.md).
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: defaultCache,
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.destination === "document";
        },
      },
    ],
  },
});

serwist.addEventListeners();

// ---------------------------------------------------------------------------
// Web push — the daily overdue-task digest sent by /api/cron/push-digest
// ---------------------------------------------------------------------------
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    payload = { title: "Plant Care", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title ?? "Plant Care", {
      body: payload.body ?? "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      tag: payload.tag ?? "plant-care-digest",
      data: { url: payload.url ?? "/plants" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url ?? "/plants";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus an already-open tab if there is one, rather than opening a duplicate.
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      return self.clients.openWindow(targetUrl);
    }),
  );
});
