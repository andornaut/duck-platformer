import { TILE } from "./screen";
import type { MapDestination, ZoneMap } from "./types";

// V1's ordered destinations are the source of level order and marker positions.
const DESTINATIONS: readonly MapDestination[] = [
  {
    at: { col: 10, row: 7 },
    icon: "map-icon-blue-cityscape",
    id: "blue-cityscape",
    levels: ["street", "city-boundary"],
  },
  {
    at: { col: 29, row: 7 },
    icon: "map-icon-industrial",
    id: "industrial",
    levels: ["warehouse-district", "freight-terminal"],
  },
  {
    at: { col: 48, row: 7 },
    icon: "map-icon-countryside",
    id: "countryside",
    levels: ["farmland", "river-crossing"],
  },
  {
    at: { col: 48, row: 18 },
    icon: "map-icon-woodland",
    id: "woodland",
    levels: ["forest-paths", "ravine"],
  },
  {
    at: { col: 29, row: 18 },
    icon: "map-icon-home-city",
    id: "home-city",
    levels: ["city-outskirts", "familiar-neighbourhood"],
  },
  {
    at: { col: 10, row: 18 },
    icon: "map-icon-apartment",
    id: "apartment",
    levels: ["entrance-and-lobby", "climb-to-apartment"],
  },
];

// Only built levels have playable keys; unbuilt catalogue entries remain unavailable.
const BUILT_LEVELS: Readonly<Record<string, string>> = { street: "street" };
const LEVELS = DESTINATIONS.flatMap(({ levels }) => levels);
const REGION_ORIGIN = { x: 60, y: 36 };

export const ZONE_MAP: ZoneMap = {
  decorations: DESTINATIONS.map(({ at, id }) => ({
    art: `map-region-${id}`,
    at: {
      x: (at.col + 0.5) * TILE - REGION_ORIGIN.x,
      y: (at.row + 0.5) * TILE - REGION_ORIGIN.y,
    },
  })),
  destinations: DESTINATIONS,
  edges: LEVELS.flatMap((from, index) => {
    const to = LEVELS[index + 1];
    return to === undefined
      ? []
      : [{ built: from in BUILT_LEVELS && to in BUILT_LEVELS, from, to }];
  }),
  finish: "climb-to-apartment",
  nodes: DESTINATIONS.flatMap(({ at, levels }) =>
    levels.map((id) => {
      const zone = BUILT_LEVELS[id];
      return { at, id, kind: "zone" as const, ...(zone === undefined ? {} : { zone }) };
    }),
  ),
  start: "street",
};
