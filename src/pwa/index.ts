// The game as an installed phone app: offline play and updates, the back gesture, the screen
// wake lock and persistent storage. setupPhoneApp runs once from main.ts; the scenes listen for
// PHONE_EVENTS on window and call the functions below.
//
// Offline play registers the service worker (serviceWorker.ts) and follows the kit's update
// flow. The game page is the only screen, so it counts as the home screen: a newer version takes
// over at once before the player has interacted, and after that the #update-ready toast in
// pages/play/index.html offers it. The flow checks for one on each load, and again when the page
// comes back into view (an installed app resumed without relaunching). The game loads meanwhile:
// only its first screen and any save wait for the check (launchReady).
import { pageRunsAsApp } from "@andornaut/game-kit/pwa/installFlow";
import { serviceWorkerUrl } from "@andornaut/game-kit/pwa/serviceWorkerUrl";
import { requestPersistentStorage } from "@andornaut/game-kit/pwa/storagePersistence";
import { createUpdateFlow, registerWhenDue } from "@andornaut/game-kit/pwa/updateReady";
import { createScreenWakeLock, type ScreenWakeLock } from "@andornaut/game-kit/pwa/wakeLock";

import {
  backCloseWatcher,
  type BackGuard,
  type CloseWatcherFactory,
  type CloseWatcherLike,
  guardBackNavigation,
  isFirefoxAndroidApp,
} from "./backNavigation";
import { type HomeCover, type HomeScreen, trackHomeScreen } from "./homeScreen";

export { PHONE_EVENTS } from "./events";

const SERVICE_WORKER_URL = "/sw.js";
const UPDATE_READY_ID = "update-ready";

// How long a fresh load holds the first screen and the save for a newer version to be checked for
// and installed, so it reloads into that version before the level draws; the game loads
// meanwhile.
const BOOT_WAIT_MS = 4000;
// Input that counts as the player interacting, after which the page never reloads on its own.
const INTERACTION_EVENTS = ["keydown", "pointerdown"] as const;

let backGuard: BackGuard | undefined;
let home: HomeScreen | undefined;
// Resolves once the game may show its first screen and write a save (UpdateFlow.bootable).
let ready: Promise<void> = Promise.resolve();
let screenWakeLock: ScreenWakeLock | undefined;

// The production build only: the dev server has no sw.js, and a worker would serve stale
// modules over hot reloads. A page a version controls registers now, so its update check runs
// while the game loads; a first visit registers once the level shows, so the precache does not
// compete with the game's own downloads (registerWhenDue).
function setupOfflinePlay(): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) {
    return;
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
  for (const type of INTERACTION_EVENTS) {
    window.addEventListener(type, () => flow.noteInteraction(), { capture: true, passive: true });
  }
  const followVisibility = () => flow.setVisible(document.visibilityState === "visible");
  document.addEventListener("visibilitychange", followVisibility);
  // A page restored from the back-forward cache comes back into view with no visibilitychange.
  window.addEventListener("pageshow", followVisibility);
  setTimeout(() => flow.endBootWait(), BOOT_WAIT_MS);
  const onHome = registerWhenDue(container, flow, () =>
    container
      .register(serviceWorkerUrl(SERVICE_WORKER_URL, undefined), { scope: "/" })
      .catch((error: unknown) => {
        console.warn("Service worker registration failed; the game will not work offline.", error);
        throw error;
      }),
  );
  home = trackHomeScreen(onHome);
  ready = flow.bootable;
}

// The browser's CloseWatcher, where it has one (Chrome 120 and later, Firefox 149 and later).
function closeWatcherFactory(): CloseWatcherFactory | undefined {
  const CloseWatcher = (globalThis as { CloseWatcher?: new () => CloseWatcherLike }).CloseWatcher;
  return CloseWatcher === undefined ? undefined : () => new CloseWatcher();
}

// Sets up offline play and the phone app's behaviour. The game is constructed at once and waits
// on launchReady only for its first screen and any save.
export function setupPhoneApp(): void {
  setupOfflinePlay();
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
}

// Resolves once the game may show its first screen and write a save: at once, or after a fresh
// load has checked for a newer version, for at most BOOT_WAIT_MS (it never resolves for a page
// that reloads into one first).
export function launchReady(): Promise<void> {
  return ready;
}

// The level's first frame has shown: the game page is now the home screen, where the update
// toast may show and a first visit registers the service worker.
export function levelShown(): void {
  home?.shown();
}

// Something covers the level, so the update toast waits until it is gone.
export function coverLevel(what: HomeCover, covering: boolean): void {
  home?.cover(what, covering);
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
