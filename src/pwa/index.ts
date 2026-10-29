// Offline play and updates: registers the service worker (serviceWorker.ts) and follows the
// kit's update flow. A newer version takes over at once before the player has interacted, and
// after that on the next launch.
import { serviceWorkerUrl } from "@andornaut/game-kit/pwa/serviceWorkerUrl";
import { createUpdateFlow } from "@andornaut/game-kit/pwa/updateReady";

const SERVICE_WORKER_URL = "/sw.js";

// How long a fresh load holds the boot for a newer version to be checked for and installed, so
// it reloads into that version before the game draws.
const BOOT_WAIT_MS = 4000;
// Input that counts as the player interacting, after which the page never reloads on its own.
const INTERACTION_EVENTS = ["keydown", "pointerdown"] as const;

// The production build only: the dev server has no sw.js, and a worker would serve stale
// modules over hot reloads. Resolves once the game may boot; never for a page that reloads into
// a newer version first.
export function setupOfflinePlay(): Promise<void> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return Promise.resolve();
  }
  const container = navigator.serviceWorker;
  const flow = createUpdateFlow(
    container,
    () => Date.now(),
    () => navigator.onLine,
    () => window.location.reload(),
    () => undefined,
  );
  for (const type of INTERACTION_EVENTS) {
    window.addEventListener(type, () => flow.noteInteraction(), { capture: true, passive: true });
  }
  document.addEventListener("visibilitychange", () =>
    flow.setVisible(document.visibilityState === "visible"),
  );
  setTimeout(() => flow.endBootWait(), BOOT_WAIT_MS);
  container
    .register(serviceWorkerUrl(SERVICE_WORKER_URL, undefined), { scope: "/" })
    .then((registration) => flow.watch(registration))
    .catch((error: unknown) => {
      console.warn("Service worker registration failed; the game will not work offline.", error);
      flow.noRegistration();
    });
  return flow.bootable;
}
