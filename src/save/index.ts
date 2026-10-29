// The player's progress, kept in localStorage as the kit's versioned save (save/saveStore): read
// once as the game boots, after launchReady, and written each time she enters a zone or clears
// one. A save that cannot be read is backed up and play starts from the beginning; where storage
// is unavailable, progress lasts until the page closes.
import { saveStore } from "@andornaut/game-kit/save/saveStore";
import { localSaveStorage } from "@andornaut/game-kit/save/storage";

import { ZONE_MAP } from "../data/map";
import { ZONES } from "../data/zones";
import { BEGINNING, type Progress, progressFormat } from "./progress";

export { type Progress } from "./progress";

const KEYS = { backup: "duck-platformer.save-backup", save: "duck-platformer.save" } as const;

const store = saveStore(localSaveStorage(), KEYS, progressFormat(ZONE_MAP, ZONES));
let progress: Progress = BEGINNING;

// Reads the stored progress into savedProgress.
export async function loadProgress(): Promise<void> {
  progress = (await store.load()).save;
}

// Where the start screen's Continue resumes, or the beginning.
export function savedProgress(): Progress {
  return progress;
}

// She has entered the zone at the end of route: Continue resumes at that zone's start.
export function saveZoneStart(route: readonly string[]): void {
  write({ at: "zone", route });
}

// She has cleared the zone at the end of route: Continue resumes on the map, where she stands
// after it.
export function saveClearedZone(route: readonly string[]): void {
  write({ at: "map", route });
}

function write(next: Progress): void {
  progress = next;
  void store.save(next);
}
