import type { MapDestination, ZoneMap } from "../data/types";
import { nodeOf, type OpenMap } from "./map";

export function destinationOf(map: ZoneMap, id: string): MapDestination {
  const destination = map.destinations.find((item) => item.id === id);
  if (!destination) {
    throw new Error(`No map destination ${id}`);
  }
  return destination;
}

export function destinationForLevel(map: ZoneMap, level: string): MapDestination {
  const destination = map.destinations.find((item) => item.levels.includes(level));
  if (!destination) {
    throw new Error(`No map destination for level ${level}`);
  }
  return destination;
}

// Catalogue order determines the latest reached level. Only actual plans on open graph nodes
// can be chosen; an unbuilt level never becomes playable merely because its label is present.
export function destinationLevels(
  plans: ReadonlySet<string>,
  map: ZoneMap,
  open: OpenMap,
  destination: MapDestination,
): readonly string[] {
  return destination.levels.filter((id) => {
    const node = nodeOf(map, id);
    return open.zones.includes(id) && node.zone !== undefined && plans.has(node.zone);
  });
}

export type DestinationSelection =
  | { readonly kind: "unavailable" }
  | { readonly kind: "play"; readonly level: string }
  | { readonly kind: "choose"; readonly latest: string; readonly levels: readonly string[] };

// A picker is only useful when more than one level is actually unlocked.
export function destinationSelection(
  plans: ReadonlySet<string>,
  map: ZoneMap,
  open: OpenMap,
  destination: MapDestination,
): DestinationSelection {
  const levels = destinationLevels(plans, map, open, destination);
  const latest = levels.at(-1);
  return latest === undefined
    ? { kind: "unavailable" }
    : levels.length === 1
      ? { kind: "play", level: latest }
      : { kind: "choose", latest, levels };
}

export function steppedDestination(
  plans: ReadonlySet<string>,
  map: ZoneMap,
  open: OpenMap,
  stand: string,
  by: -1 | 1,
): string {
  const destinations = map.destinations.filter(
    (item) => destinationLevels(plans, map, open, item).length > 0,
  );
  const current = destinations.findIndex((item) => item.levels.includes(stand));
  const at = Math.max(0, Math.min(destinations.length - 1, current + by));
  return destinations[at]?.id ?? destinationForLevel(map, stand).id;
}
