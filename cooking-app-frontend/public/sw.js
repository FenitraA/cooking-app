const SW_VERSION = "cooking-ap-v1";

self.addEventListener("install", (event) => {
  console.info(`[Service Worker] Installing ${SW_VERSION}`);
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.info(`[Service Worker] Activated ${SW_VERSION}`);
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Pass requests through to the network (or replace with caching logic).
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request));
  }
});