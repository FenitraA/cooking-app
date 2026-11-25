const SW_VERSION = "cooking-ap-v1";

self.addEventListener("install", (event) => {
  console.info(`[Service Worker] Installing ${SW_VERSION}`);

  // Activate the new worker without waiting for old tabs to close.
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  console.info(`[Service Worker] Activated ${SW_VERSION}`);

  // Allow this worker to control already-open pages.
  event.waitUntil(self.clients.claim());
});
