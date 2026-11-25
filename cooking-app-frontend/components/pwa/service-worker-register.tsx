
"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    // Avoid service worker interference during Next.js development.
    if (process.env.NODE_ENV !== "production") {
      return;
    }

    if (!("serviceWorker" in navigator)) {
      console.warn("Service workers are not supported.");
      return;
    }

    async function registerServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register(
          "/sw.js",
          {
            scope: "/",
          },
        );

        console.info("Service worker registered:", registration.scope);

        registration.addEventListener("updatefound", () => {
          console.info("A new service worker version was found.");
        });

        const activeWorker = registration.active;

        if (activeWorker) {
          console.info(
            "Active service worker:",
            activeWorker.state,
          );
        }
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    }

    registerServiceWorker();
  }, []);

  return null;
}
