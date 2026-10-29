import type { ZoneMap } from "./types";

// PLACEHOLDER: the map, until gameplay lays it out. One built path: the street, then home. A
// second path through a park and an alley, not built yet, shows dotted.
export const ZONE_MAP: ZoneMap = {
  decorations: [
    { art: "map-hill", at: { x: 36, y: 236 } },
    { art: "map-hill", at: { x: 70, y: 252 } },
    { art: "map-hill", at: { x: 120, y: 34 } },
    { art: "map-hill", at: { x: 136, y: 268 } },
    { art: "map-wave", at: { x: 560, y: 214 } },
    { art: "map-wave", at: { x: 590, y: 232 } },
    { art: "map-wave", at: { x: 562, y: 250 } },
    { art: "map-compass", at: { x: 650, y: 280 } },
  ],
  edges: [
    { built: true, from: "street", to: "home" },
    { built: false, from: "street", to: "corner" },
    { built: false, from: "corner", to: "park" },
    { built: false, from: "corner", to: "alley" },
    { built: false, from: "park", to: "home" },
    { built: false, from: "alley", to: "home" },
  ],
  finish: "home",
  nodes: [
    { at: { col: 5, row: 11 }, id: "street", kind: "zone", zone: "street" },
    { at: { col: 21, row: 13 }, id: "corner", kind: "fork" },
    { at: { col: 36, row: 13 }, id: "park", kind: "zone" },
    { at: { col: 36, row: 19 }, id: "alley", kind: "zone" },
    { at: { col: 53, row: 4 }, id: "home", kind: "fork" },
  ],
  start: "street",
};
