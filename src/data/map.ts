import type { ZoneMap } from "./types";

// V1's linear route: six themed destinations, each containing two levels.
// Only the parcel depot and streets are built; the other levels remain unavailable.
export const ZONE_MAP: ZoneMap = {
  decorations: [
    { art: "map-region-blue-cityscape", at: { x: 66, y: 54 } },
    { art: "map-region-industrial", at: { x: 294, y: 54 } },
    { art: "map-region-countryside", at: { x: 522, y: 54 } },
    { art: "map-region-woodland", at: { x: 522, y: 186 } },
    { art: "map-region-home-city", at: { x: 294, y: 186 } },
    { art: "map-region-apartment", at: { x: 66, y: 186 } },
  ],
  destinations: [
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
  ],
  edges: [
    { built: false, from: "street", to: "city-boundary" },
    { built: false, from: "city-boundary", to: "warehouse-district" },
    { built: false, from: "warehouse-district", to: "freight-terminal" },
    { built: false, from: "freight-terminal", to: "farmland" },
    { built: false, from: "farmland", to: "river-crossing" },
    { built: false, from: "river-crossing", to: "forest-paths" },
    { built: false, from: "forest-paths", to: "ravine" },
    { built: false, from: "ravine", to: "city-outskirts" },
    { built: false, from: "city-outskirts", to: "familiar-neighbourhood" },
    { built: false, from: "familiar-neighbourhood", to: "entrance-and-lobby" },
    { built: false, from: "entrance-and-lobby", to: "climb-to-apartment" },
  ],
  finish: "climb-to-apartment",
  nodes: [
    { at: { col: 10, row: 7 }, id: "street", kind: "zone", zone: "street" },
    { at: { col: 10, row: 7 }, id: "city-boundary", kind: "zone" },
    { at: { col: 29, row: 7 }, id: "warehouse-district", kind: "zone" },
    { at: { col: 29, row: 7 }, id: "freight-terminal", kind: "zone" },
    { at: { col: 48, row: 7 }, id: "farmland", kind: "zone" },
    { at: { col: 48, row: 7 }, id: "river-crossing", kind: "zone" },
    { at: { col: 48, row: 18 }, id: "forest-paths", kind: "zone" },
    { at: { col: 48, row: 18 }, id: "ravine", kind: "zone" },
    { at: { col: 29, row: 18 }, id: "city-outskirts", kind: "zone" },
    { at: { col: 29, row: 18 }, id: "familiar-neighbourhood", kind: "zone" },
    { at: { col: 10, row: 18 }, id: "entrance-and-lobby", kind: "zone" },
    { at: { col: 10, row: 18 }, id: "climb-to-apartment", kind: "zone" },
  ],
  start: "street",
};
