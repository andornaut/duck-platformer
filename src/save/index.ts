// The player's progress, kept in localStorage as the kit's versioned save (save/saveStore): read
// once as the game boots, after launchReady, and written each time the map shows, she walks on
// it, or she completes a zone. A save that cannot be read is backed up and play starts from the
// beginning; where storage is unavailable, progress lasts until the page closes.
import { saveStore } from "@andornaut/game-kit/save/saveStore";
import { localSaveStorage } from "@andornaut/game-kit/save/storage";

import { ZONE_MAP } from "../data/map";
import { RECIPES, ZONES } from "../data/zones";
import { BEGINNING, mapProgress, type Progress, progressFormat } from "./progress";

export { type Progress } from "./progress";

const KEYS = { backup: "duck-platformer.save-backup", save: "duck-platformer.save" } as const;

const store = saveStore(
  localSaveStorage(),
  KEYS,
  progressFormat(ZONE_MAP, { ...ZONES, ...RECIPES }),
);
let progress: Progress = BEGINNING;

// Reads the stored progress into savedProgress.
export async function loadProgress(): Promise<void> {
  progress = (await store.load()).save;
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
  write({ at: "map", completed: savedMap().completed, stand });
}

// She has completed the zone at node: it opens the map past it, and she stands on it.
export function saveCompleted(node: string): void {
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
