import type { ZoneMap } from "./types";

// PLACEHOLDER: the map, until gameplay lays it out. One built path: the street, then home. A
// second path through a park and an alley, not built yet, shows dotted.
export const ZONE_MAP: ZoneMap = {
  decorations: [],
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
    { at: { col: 8, row: 15 }, id: "street", kind: "zone", zone: "street" },
    { at: { col: 22, row: 18 }, id: "corner", kind: "fork" },
    { at: { col: 34, row: 21 }, id: "park", kind: "zone" },
    { at: { col: 34, row: 12 }, id: "alley", kind: "zone" },
    { at: { col: 50, row: 15 }, id: "home", kind: "fork" },
  ],
  start: "street",
};
