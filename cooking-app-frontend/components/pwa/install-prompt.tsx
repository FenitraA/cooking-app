"use client";

import { logger } from "@/lib/logger";
import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
}

export function InstallPrompt() {
  const gt = useTranslations("General");

  const [installEvent, setInstallEvent] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Detect whether the application is already installed.
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;

    setInstalled(isStandalone);

    // Browser says the PWA can be installed.
    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();

      setInstallEvent(event as BeforeInstallPromptEvent);
      logger.info("PWA installation is available.");
    };

    // User installed the application.
    const handleInstalled = () => {
      logger.info("PWA successfully installed.");

      setInstalled(true);
      setInstallEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);

      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!installEvent) return;

    // This event can only be used once.
    const promptEvent = installEvent;
    setInstallEvent(null);

    try {
      await promptEvent.prompt();

      const { outcome } = await promptEvent.userChoice;

      logger.info("PWA installation choice:", outcome);

      if (outcome === "accepted") {
        setInstalled(true);
      }
    } catch (error) {
      logger.error("PWA installation failed:", error);
    }
  }

  // Don't display anything if installation isn't available.
    if (installed || !installEvent) {
      return null;
    }

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="
              flex items-center w-full px-4 py-3 text-sm
              text-white/90 hover:bg-white/10
              transition-colors cursor-pointer
            "
    >
      <Download size={18} className="mr-3" />
      {gt("actions.installApp")}
    </button>
  );
}
