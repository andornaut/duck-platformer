import type { Checked, SaveFormat, StoredObject } from "@andornaut/game-kit/save/versionedSave";

import type { ZoneMap } from "../data/types";
import { openMap } from "../rules/map";

// The player's progress: the beginning (no progress saved, the start screen offers Start), or
// the map, with the zone nodes she has completed and the zone node she stands on.
export type Progress =
  | { readonly at: "beginning" }
  | { readonly at: "map"; readonly completed: readonly string[]; readonly stand: string };

export const BEGINNING: Progress = { at: "beginning" };

// The save format's version. Before the first release, a change to the format or a map node or
// zone renamed bumps it, and older saves reset to the beginning.
export const PROGRESS_VERSION = 3;

// Where she is on the map for progress: the beginning stands her on the map's start with
// nothing completed.
export function mapProgress(
  map: ZoneMap,
  progress: Progress,
): { readonly completed: readonly string[]; readonly stand: string } {
  return progress.at === "beginning" ? { completed: [], stand: map.start } : progress;
}

const isNames = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((name) => typeof name === "string");

// Why progress does not fit map and zones, or undefined when it does: each completed zone node,
// and the node she stands on, is a zone node the completed zones open (openMap), whose zone is in
// zones, named once.
export function progressProblem(
  map: ZoneMap,
  zones: Readonly<Record<string, unknown>>,
  completed: readonly string[],
  stand: string,
): string | undefined {
  const done = new Set(completed);
  if (done.size !== completed.length) {
    return "the save names a completed zone twice";
  }
  const open = openMap(map, done).zones.filter((id) => {
    const zone = map.nodes.find((node) => node.id === id)?.zone;
    return zone !== undefined && zone in zones;
  });
  const closed = completed.find((id) => !open.includes(id));
  if (closed !== undefined) {
    return `the completed zone ${closed} is not open on the map`;
  }
  return open.includes(stand) ? undefined : `she stands on ${stand}, not an open zone`;
}

// CLEANUP (added 2026-10-30): version 2 saved this lap's route and where it resumed. Its zones
// count as completed, except a final zone she was only entering, and she stands on its last
// node. Remove once every player's version 2 save has loaded and been written as version 3.
function fromLapRoute(map: ZoneMap, save: StoredObject): StoredObject {
  const { at, route } = save;
  if (at === "beginning" || !isNames(route)) {
    return save;
  }
  const zones = route.filter((id) =>
    map.nodes.some((node) => node.id === id && node.kind === "zone"),
  );
  const completed = at === "zone" ? zones.slice(0, -1) : zones;
  return { at: "map", completed: [...new Set(completed)], stand: route.at(-1) };
}

// The progress save's format on map and zones: a save that no longer fits them (a renamed node, a
// path not built, a zone removed) is refused, and the player starts from the beginning.
export function progressFormat(
  map: ZoneMap,
  zones: Readonly<Record<string, unknown>>,
): SaveFormat<Progress> {
  const checked = (progress: Progress): Checked<Progress> => {
    if (progress.at === "beginning") {
      return { ok: true, value: progress };
    }
    const problem = progressProblem(map, zones, progress.completed, progress.stand);
    return problem === undefined ? { ok: true, value: progress } : { ok: false, reason: problem };
  };
  return {
    decode: ({ at, completed, stand }: StoredObject): Checked<Progress> => {
      if (at === "beginning") {
        return { ok: true, value: BEGINNING };
      }
      if (at !== "map") {
        return { ok: false, reason: "the save does not say where she is" };
      }
      if (!isNames(completed)) {
        return { ok: false, reason: "the save's completed zones are not a list of map nodes" };
      }
      if (typeof stand !== "string") {
        return { ok: false, reason: "the save does not say where she stands" };
      }
      return checked({ at, completed, stand });
    },
    encode: (progress: Progress): Checked<StoredObject> => {
      const valid = checked(progress);
      return valid.ok ? { ok: true, value: { ...valid.value } } : valid;
    },
    fresh: () => BEGINNING,
    migrations: { 2: (save) => fromLapRoute(map, save) },
    version: PROGRESS_VERSION,
  };
}
