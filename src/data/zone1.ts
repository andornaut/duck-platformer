import type { ChunkPlan } from "./types";

// The street's fixed boundary sections surround a newly assembled middle on every entry.
export const STREET_CHUNKS: Readonly<Record<string, ChunkPlan>> = {
  "street-finish": {
    backdrops: [
      { character: "facade-one-storey", col: 0, cols: 40, row: 34 },
      { character: "facade-brownstone", col: 40, cols: 44, row: 24 },
      { character: "roofline-brownstone", col: 40, cols: 44, row: 20 },
      { character: "storefront-noodle-bar", col: 2, row: 40 },
    ],
    cols: 84,
    difficulty: 3,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [
      { character: "red-edge-bottom", col: 16, cols: 18, row: 41 },
      { character: "red-edge-left", col: 15, row: 39, rows: 2 },
      { character: "red-edge-right", col: 34, row: 39, rows: 2 },
      { character: "red-edge-top", col: 16, cols: 18, row: 38 },
      { character: "red-edge-support", col: 16, cols: 18, row: 39, rows: 2 },
      { character: "red-edge-top", col: 56, cols: 4, row: 49 },
      { character: "red-edge-support", col: 56, cols: 4, row: 50, rows: 10 },
      { character: "canopy", col: 62, cols: 12, row: 44 },
    ],
    solids: [
      { col: 0, cols: 24, look: "ground", row: 50, rows: 10 },
      { col: 24, cols: 6, look: "raised", row: 49, rows: 11 },
      { col: 30, cols: 26, look: "ground", row: 50, rows: 10 },
      { col: 60, cols: 24, look: "ground", row: 50, rows: 10 },
    ],
    theme: "street",
  },
  // The depot lessons, dog introduction and refuge positions are identical on every entry.
  "street-start": {
    backdrops: [
      { character: "depot-wall", col: 0, cols: 60, row: 35 },
      { character: "depot-loading-bay", col: 30, row: 40 },
      { character: "parcel-open", col: 2, row: 47 },
      { character: "facade-one-storey", col: 60, cols: 4, row: 34 },
      { character: "facade-one-storey", col: 108, cols: 8, row: 34 },
      { character: "walk-signal", col: 110, row: 43 },
    ],
    cols: 120,
    difficulty: 3,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [
      { character: "platform-ledge", col: 68, cols: 6, row: 46 },
      { character: "dog-antagonist", col: 91, row: 46, scene: "depot-dog-intro" },
      { character: "platform-ledge", col: 102, cols: 6, row: 46 },
      { character: "red-edge-top", col: 56, cols: 6, row: 54 },
      { character: "red-edge-support", col: 56, cols: 6, row: 55, rows: 5 },
    ],
    slots: [{ area: { col: 110, cols: 4, row: 46, rows: 4 }, id: "depot-room", kind: "door" }],
    solids: [
      { col: 0, cols: 20, look: "ground", row: 50, rows: 10 },
      { col: 20, cols: 4, look: "raised", row: 47, rows: 13 },
      { col: 24, cols: 16, look: "ground", row: 50, rows: 10 },
      { col: 40, cols: 6, look: "raised", row: 44, rows: 16 },
      { col: 46, cols: 10, look: "ground", row: 50, rows: 10 },
      { col: 62, cols: 58, look: "ground", row: 50, rows: 10 },
    ],
    theme: "street",
  },
};
