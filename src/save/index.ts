// The player's progress, kept in localStorage as the kit's versioned save (save/saveStore): read
// once as the game boots, after launchReady, and written each time the map shows, she walks on
// it, or she completes a zone. A save that cannot be read is backed up and play starts from the
// beginning; where storage is unavailable, progress lasts until the page closes.
import { saveStore } from "@andornaut/game-kit/save/saveStore";
import { localSaveStorage } from "@andornaut/game-kit/save/storage";

import { ZONE_MAP } from "../data/map";
import { RECIPES, ZONES } from "../data/zones";
import { activeStepSeconds } from "../rules/death";
import type { ZoneState } from "../rules/zone";
import { BEGINNING, mapProgress, type Progress, progressFormat } from "./progress";
import { levelStatsStore } from "./stats";

export { type Progress } from "./progress";

const KEYS = { backup: "duck-platformer.save-backup", save: "duck-platformer.save" } as const;

const store = saveStore(
  localSaveStorage(),
  KEYS,
  progressFormat(ZONE_MAP, { ...ZONES, ...RECIPES }),
);
let progress: Progress = BEGINNING;
const LEVELS = new Set(ZONE_MAP.destinations.flatMap(({ levels }) => levels));
const stats = levelStatsStore(localSaveStorage(), LEVELS);
let statsLifecycleInstalled = false;

function installStatsLifecycle(): void {
  if (statsLifecycleInstalled || typeof window === "undefined" || typeof document === "undefined") {
    return;
  }
  statsLifecycleInstalled = true;
  window.addEventListener("pagehide", () => {
    void stats.flush();
  });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void stats.flush();
    }
  });
}

// Reads the stored progress into savedProgress.
export async function loadProgress(): Promise<void> {
  const [loaded] = await Promise.all([store.load(), stats.load()]);
  progress = loaded.save;
  installStatsLifecycle();
}

export function activeLevelTime(level: string): number {
  return stats.seconds(level);
}

// Developer test chains have no persistent level identity and do not write real-level stats.
export function recordActiveLevelStep(
  level: string,
  seconds: number,
  before: ZoneState,
  after: ZoneState,
): void {
  if (LEVELS.has(level)) {
    stats.addActiveTime(level, activeStepSeconds(seconds, before, after));
  }
}

export function clearLevelTime(level: string): void {
  if (LEVELS.has(level)) {
    stats.clearLevel(level);
  }
}

export function flushStats(): Promise<void> {
  return stats.flush();
}

// The saved progress, or the beginning.
export function savedProgress(): Progress {
  return progress;
}

// Where she is on the map: the zones she has completed and the zone node she stands on, the
// map's start with nothing completed from the beginning.
export function savedMap(): { readonly completed: readonly string[]; readonly stand: string } {
  return mapProgress(ZONE_MAP, progress);
}

// She stands on the zone node stand: the map opens there.
export function saveStand(stand: string): void {
  void stats.flush();
  write({ at: "map", completed: savedMap().completed, stand });
}

// She has completed the zone at node: it opens the map past it, and she stands on it.
export function saveCompleted(node: string): void {
  clearLevelTime(node);
  const { completed } = savedMap();
  write({
    at: "map",
    completed: completed.includes(node) ? completed : [...completed, node],
    stand: node,
  });
}

function write(next: Progress): void {
  progress = next;
  void store.save(next);
}

// Restart: progress goes back to the beginning, and the map opens on the first zone with nothing
// completed. Only progress is cleared.
export function clearProgress(): void {
  void stats.flush();
  write(BEGINNING);
}
