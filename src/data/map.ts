import type { ZoneMap } from "./types";

// PLACEHOLDER: the map, until the V1 zones are named. The built path runs from the street through
// the corner to the park, then home. The alley, the corner's other way, is not built yet and
// shows dotted.
export const ZONE_MAP: ZoneMap = {
  decorations: [
    { art: "map-hill", at: { x: 36, y: 236 } },
    { art: "map-hill", at: { x: 70, y: 252 } },
    { art: "map-hill", at: { x: 120, y: 34 } },
    { art: "map-hill", at: { x: 136, y: 268 } },
    { art: "map-hill", at: { x: 252, y: 40 } },
    { art: "map-wave", at: { x: 576, y: 236 } },
    { art: "map-wave", at: { x: 612, y: 252 } },
    { art: "map-wave", at: { x: 580, y: 270 } },
    { art: "map-compass", at: { x: 652, y: 30 } },
  ],
  edges: [
    { built: true, from: "street", to: "corner" },
    { built: true, from: "corner", to: "park" },
    { built: false, from: "corner", to: "alley" },
    { built: true, from: "park", to: "home" },
    { built: false, from: "alley", to: "home" },
  ],
  finish: "home",
  nodes: [
    { at: { col: 6, row: 11 }, id: "street", kind: "zone", zone: "street" },
    { at: { col: 20, row: 12 }, id: "corner", kind: "fork" },
    { at: { col: 37, row: 17 }, id: "park", kind: "zone", zone: "park" },
    { at: { col: 37, row: 7 }, id: "alley", kind: "zone" },
    { at: { col: 53, row: 11 }, id: "home", kind: "fork" },
  ],
  start: "street",
};
