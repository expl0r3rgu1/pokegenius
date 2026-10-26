import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
export function usePwa() {
  const [installEvent, setInstallEvent] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(
    () =>
      window.matchMedia("(display-mode: standalone)").matches ||
      ("standalone" in navigator && navigator.standalone === true),
  );
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(!("serviceWorker" in navigator));
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    immediate: true,
    onOfflineReady() {
      setReady(true);
    },
    onRegisterError() {
      setError(true);
    },
    onRegisteredSW(_url, registration) {
      const trackInstallation = () => {
        const worker = registration?.installing;
        worker?.addEventListener("statechange", () => {
          if (worker.state === "redundant" && !registration?.active)
            setError(true);
        });
      };
      registration?.addEventListener("updatefound", trackInstallation);
      trackInstallation();
      void navigator.serviceWorker.ready
        .then(() => setReady(true))
        .catch(() => setError(true));
    },
  });
  useEffect(() => {
    const onPrompt = (event: Event) => {
      if (
        "prompt" in event &&
        typeof event.prompt === "function" &&
        "userChoice" in event
      ) {
        event.preventDefault();
        setInstallEvent(event as InstallEvent);
      }
    };
    const onInstalled = () => {
      setInstalled(true);
      setInstallEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);
  const install = async () => {
    if (!installEvent) return false;
    const event = installEvent;
    setInstallEvent(null);
    try {
      await event.prompt();
      await event.userChoice;
      return true;
    } catch {
      return false;
    }
  };
  return {
    installed,
    ready,
    error,
    needRefresh,
    dismissUpdate: () => setNeedRefresh(false),
    update: () => updateServiceWorker(true),
    install,
    canInstall: !!installEvent,
  };
}
