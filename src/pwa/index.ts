// The game as an installed phone app: offline play and updates, the back gesture, the screen
// wake lock and persistent storage. setupPhoneApp runs once from main.ts; the scenes listen for
// PHONE_EVENTS on window and call the functions below.
//
// Offline play registers the service worker (serviceWorker.ts) and follows the kit's update
// flow. The game page is the only screen, so it counts as the home screen: a newer version takes
// over at once before the player has interacted, and after that the #update-ready toast in
// pages/play/index.html offers it. The flow checks for one on each load, and again when the page
// comes back into view (an installed app resumed without relaunching).
import { pageRunsAsApp } from "@andornaut/game-kit/pwa/installFlow";
import { serviceWorkerUrl } from "@andornaut/game-kit/pwa/serviceWorkerUrl";
import { requestPersistentStorage } from "@andornaut/game-kit/pwa/storagePersistence";
import { createUpdateFlow } from "@andornaut/game-kit/pwa/updateReady";
import { createScreenWakeLock, type ScreenWakeLock } from "@andornaut/game-kit/pwa/wakeLock";

import {
  backCloseWatcher,
  type BackGuard,
  type CloseWatcherFactory,
  type CloseWatcherLike,
  guardBackNavigation,
  isFirefoxAndroidApp,
} from "./backNavigation";

export { PHONE_EVENTS } from "./events";

const SERVICE_WORKER_URL = "/sw.js";
const UPDATE_READY_ID = "update-ready";

// How long a fresh load holds the boot for a newer version to be checked for and installed, so
// it reloads into that version before the game draws.
const BOOT_WAIT_MS = 4000;
// Input that counts as the player interacting, after which the page never reloads on its own.
const INTERACTION_EVENTS = ["keydown", "pointerdown"] as const;

let backGuard: BackGuard | undefined;
let screenWakeLock: ScreenWakeLock | undefined;

// The production build only: the dev server has no sw.js, and a worker would serve stale
// modules over hot reloads. Resolves once the game may boot; never for a page that reloads into
// a newer version first.
function setupOfflinePlay(): Promise<void> {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return Promise.resolve();
  }
  const container = navigator.serviceWorker;
  const toast = document.getElementById(UPDATE_READY_ID);
  const flow = createUpdateFlow(
    container,
    () => Date.now(),
    () => navigator.onLine,
    () => window.location.reload(),
    (visible) => {
      if (toast) {
        toast.hidden = !visible;
      }
    },
  );
  toast?.querySelector("button")?.addEventListener("click", () => flow.accept());
  flow.setOnHome(true);
  for (const type of INTERACTION_EVENTS) {
    window.addEventListener(type, () => flow.noteInteraction(), { capture: true, passive: true });
  }
  const followVisibility = () => flow.setVisible(document.visibilityState === "visible");
  document.addEventListener("visibilitychange", followVisibility);
  // A page restored from the back-forward cache comes back into view with no visibilitychange.
  window.addEventListener("pageshow", followVisibility);
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

// The browser's CloseWatcher, where it has one (Chrome 120 and later, Firefox 149 and later).
function closeWatcherFactory(): CloseWatcherFactory | undefined {
  const CloseWatcher = (globalThis as { CloseWatcher?: new () => CloseWatcherLike }).CloseWatcher;
  return CloseWatcher === undefined ? undefined : () => new CloseWatcher();
}

// Resolves once the game may boot: at once, or after a fresh load has checked for a newer
// version (it never resolves for a page that reloads into one first).
export function setupPhoneApp(): Promise<void> {
  const bootable = setupOfflinePlay();
  // Asked once per launch of the installed app, never in a browser tab. Not waited for: the game
  // boots whatever the browser answers, or if it never does.
  void requestPersistentStorage(
    pageRunsAsApp(window),
    "storage" in navigator ? navigator.storage : undefined,
  );
  // Firefox for Android's installed app keeps its own back.
  // WORKAROUND: https://bugzilla.mozilla.org/show_bug.cgi?id=2079243 (see isFirefoxAndroidApp).
  if (!isFirefoxAndroidApp(navigator.userAgent, (query) => matchMedia(query).matches)) {
    backGuard = guardBackNavigation(
      window,
      window,
      backCloseWatcher(navigator.userAgent, closeWatcherFactory()),
      history,
    );
  }
  screenWakeLock = createScreenWakeLock(
    "wakeLock" in navigator ? navigator.wakeLock : undefined,
    document,
  );
  return bootable;
}

// Closes the game's window, or leaves the game for the previous page (BackGuard.leave).
export function leaveGame(): void {
  backGuard?.leave();
}

// Keep the screen on while the game is visible: during play.
export function startWakeLock(): void {
  screenWakeLock?.start();
}

// Let the screen sleep: while the pause card is open.
export function stopWakeLock(): void {
  screenWakeLock?.stop();
}
