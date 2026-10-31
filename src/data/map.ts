import { TILE } from "./screen";
import type { MapDestination, ZoneMap } from "./types";

// V1's ordered destinations are the source of stage order and marker positions.
const DESTINATIONS: readonly MapDestination[] = [
  {
    at: { col: 10, row: 7 },
    icon: "map-icon-blue-cityscape",
    id: "blue-cityscape",
    stages: ["street", "city-boundary"],
  },
  {
    at: { col: 29, row: 7 },
    icon: "map-icon-industrial",
    id: "industrial",
    stages: ["warehouse-district", "freight-terminal"],
  },
  {
    at: { col: 48, row: 7 },
    icon: "map-icon-countryside",
    id: "countryside",
    stages: ["farmland", "river-crossing"],
  },
  {
    at: { col: 48, row: 18 },
    icon: "map-icon-woodland",
    id: "woodland",
    stages: ["forest-paths", "ravine"],
  },
  {
    at: { col: 29, row: 18 },
    icon: "map-icon-home-city",
    id: "home-city",
    stages: ["city-outskirts", "familiar-neighbourhood"],
  },
  {
    at: { col: 10, row: 18 },
    icon: "map-icon-apartment",
    id: "apartment",
    stages: ["entrance-and-lobby", "climb-to-apartment"],
  },
];

// Only built stages have playable keys; unbuilt catalogue entries remain unavailable.
const BUILT_STAGES: Readonly<Record<string, string>> = {
  "city-boundary": "city-boundary",
  "freight-terminal": "freight-terminal",
  street: "street",
  "warehouse-district": "warehouse-district",
};
const STAGES = DESTINATIONS.flatMap(({ stages }) => stages);
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
  edges: STAGES.flatMap((from, index) => {
    const to = STAGES[index + 1];
    return to === undefined
      ? []
      : [{ built: from in BUILT_STAGES && to in BUILT_STAGES, from, to }];
  }),
  finish: "climb-to-apartment",
  nodes: DESTINATIONS.flatMap(({ at, stages }) =>
    stages.map((id) => {
      const zone = BUILT_STAGES[id];
      return { at, id, kind: "zone" as const, ...(zone === undefined ? {} : { zone }) };
    }),
  ),
  start: "street",
};
