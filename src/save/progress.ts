import type { Checked, SaveFormat, StoredObject } from "@andornaut/game-kit/save/versionedSave";

import type { ZoneMap } from "../data/types";

// Where the player's progress resumes: the beginning (no progress saved, the start screen offers
// Start), the map where she stands after clearing a zone, or the start of the zone she is in.
// route is the nodes she has walked this lap, ending at that zone's node. seed: the lap's seed,
// which every assembled zone this lap is assembled from.
export type Progress =
  | { readonly at: "beginning" }
  | { readonly at: "map" | "zone"; readonly route: readonly string[]; readonly seed: number };

export const BEGINNING: Progress = { at: "beginning" };

// The save format's version. Before the first release, a change to the format or a map node or
// zone renamed bumps it, and older saves reset to the beginning. Version 1 had no lap seed: its
// saves gain a new one.
export const PROGRESS_VERSION = 2;

// A new lap's seed: a whole number in [0, 2^32).
export function newLapSeed(): number {
  return Math.floor(Math.random() * 2 ** 32);
}

const isSeed = (seed: unknown): seed is number =>
  Number.isInteger(seed) && (seed as number) >= 0 && (seed as number) < 2 ** 32;

const RESUMES = new Set(["map", "zone"]);

// Why route is not a walk this lap on map, or undefined when it is: from the map's start along
// built paths, ending at a zone node whose zone is in zones.
export function routeProblem(
  map: ZoneMap,
  zones: Readonly<Record<string, unknown>>,
  route: readonly string[],
): string | undefined {
  if (route[0] !== map.start) {
    return "the route does not begin at the map's start";
  }
  for (let index = 1; index < route.length; index++) {
    const from = route[index - 1];
    const to = route[index];
    if (!map.edges.some((edge) => edge.built && edge.from === from && edge.to === to)) {
      return `no built path from ${String(from)} to ${String(to)}`;
    }
  }
  const last = map.nodes.find((node) => node.id === route.at(-1));
  if (last?.kind !== "zone" || last.zone === undefined || !(last.zone in zones)) {
    return "the route does not end at a zone that exists";
  }
  return undefined;
}

// The progress save's format on map and zones: a save whose route no longer fits them (a
// renamed node, a path not built, a zone removed) is refused, and the player starts from the
// beginning. A version 1 save gains a lap seed from drawSeed.
export function progressFormat(
  map: ZoneMap,
  zones: Readonly<Record<string, unknown>>,
  drawSeed: () => number,
): SaveFormat<Progress> {
  const checked = (progress: Progress): Checked<Progress> => {
    if (progress.at === "beginning") {
      return { ok: true, value: progress };
    }
    const problem = routeProblem(map, zones, progress.route);
    return problem === undefined ? { ok: true, value: progress } : { ok: false, reason: problem };
  };
  return {
    decode: ({ at, route, seed }: StoredObject): Checked<Progress> => {
      if (at === "beginning") {
        return { ok: true, value: BEGINNING };
      }
      if (typeof at !== "string" || !RESUMES.has(at)) {
        return { ok: false, reason: "the save does not say where to resume" };
      }
      if (!Array.isArray(route) || !route.every((node) => typeof node === "string")) {
        return { ok: false, reason: "the save's route is not a list of map nodes" };
      }
      if (!isSeed(seed)) {
        return { ok: false, reason: "the save's lap seed is not a whole number in [0, 2^32)" };
      }
      return checked({ at: at as "map" | "zone", route: route as string[], seed });
    },
    encode: (progress: Progress): Checked<StoredObject> => {
      const valid = checked(progress);
      return valid.ok ? { ok: true, value: { ...valid.value } } : valid;
    },
    fresh: () => BEGINNING,
    migrations: {
      1: (save) => (save.at === "beginning" ? save : { ...save, seed: drawSeed() }),
    },
    version: PROGRESS_VERSION,
  };
}
