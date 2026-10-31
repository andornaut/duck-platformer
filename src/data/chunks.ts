import type { ChunkPlan, ChunkRules, ElementBinding, ThemePlan } from "./types";
import { STREET_CHUNKS } from "./zone1";

// The rows a chunk's entry and exit stand on.
export const SEAM_ROWS = [30, 40, 50] as const;

export const CHUNK_RULES: ChunkRules = {
  cols: { max: 120, min: 60 },
  footing: 4,
  headroom: 6,
};

const COMMON_BINDINGS: Readonly<Record<string, ElementBinding>> = {
  "edge-bottom": { character: "red-edge-bottom" },
  "edge-left": { character: "red-edge-left" },
  "edge-right": { character: "red-edge-right" },
  "edge-top": { character: "red-edge-top" },
  ledge: { character: "platform-ledge" },
  lift: { character: "city-lift" },
  "moving-hazard": { character: "city-ground-hazard" },
  shuttle: { character: "city-shuttle" },
  support: { character: "red-edge-support" },
};

const CITY_THEME: ThemePlan = {
  backdrops: [
    { character: "street-sky", parallax: { x: 0, y: 0 }, role: "sky", row: 0 },
    {
      character: "street-city-far",
      parallax: { x: 0.15, y: 0.05 },
      role: "far-background",
      row: 0,
    },
    { character: "street-city-mid", parallax: { x: 0.4, y: 0.15 }, role: "mid-background", row: 0 },
  ],
  bindings: {
    ...COMMON_BINDINGS,
    antagonist: { character: "dog-antagonist" },
    canopy: { character: "canopy" },
    "depot-wall": { character: "depot-wall" },
    door: { character: "street-door" },
    "far-background": { character: "street-city-far" },
    "fire-escape-railing": { character: "fire-escape-railing" },
    "loading-bay": { character: "depot-loading-bay" },
    "mid-background": { character: "street-city-mid" },
    "near-wall": { character: "facade-one-storey" },
    parcel: { character: "parcel-open" },
    roofline: { character: "roofline-brownstone" },
    signal: { character: "walk-signal" },
    sky: { character: "street-sky" },
    storefront: { character: "storefront-noodle-bar" },
    "tall-wall": { character: "facade-brownstone" },
  },
  door: "door",
  looks: { ground: "sidewalk", raised: "sidewalk" },
  tileset: "tiles-street",
};

// The themes chunks are drawn in, by key.
export const THEMES: Readonly<Record<string, ThemePlan>> = {
  "city-boundary": CITY_THEME,
  // The park, outdoors in autumn. Chunks name two looks, ground (the lawn, its top at row 50)
  // and raised (the terraces above it), both drawn as art's grass top over turf over soil. Its
  // backdrops, back to front: the sky, the clouds, the city, the far trees and the treetops,
  // each standing where art puts its bottom edge.
  park: {
    backdrops: [
      { character: "park-sky", parallax: { x: 0, y: 0 }, role: "sky", row: 0 },
      { character: "park-clouds", role: "clouds", row: 3 },
      { character: "park-city", parallax: { x: 0.15, y: 0.05 }, role: "far-background", row: 28 },
      { character: "park-far-trees", role: "distant-trees", row: 40 },
      {
        character: "park-treetops",
        parallax: { x: 0.4, y: 0.15 },
        role: "mid-background",
        row: 15,
      },
    ],
    bindings: {
      ...COMMON_BINDINGS,
      bandstand: { character: "park-bandstand" },
      bench: { character: "park-bench" },
      "bench-frame": { character: "park-bench-frame" },
      branch: { character: "park-branch" },
      clouds: { character: "park-clouds" },
      "distant-trees": { character: "park-far-trees" },
      door: { character: "park-gate" },
      "far-background": { character: "park-city" },
      lamp: { character: "park-lamp" },
      "mid-background": { character: "park-treetops" },
      "roof-ledge": { character: "park-bandstand-roof" },
      shuttle: { character: "park-boat" },
      sky: { character: "park-sky" },
      tree: { character: "park-tree" },
    },
    door: "door",
    looks: { ground: "grass", raised: "grass" },
    tileset: "tiles-park",
  },
  street: CITY_THEME,
};

// The chunks zones are assembled from, by id. Rows are the chunk's own: seams at 50 (the lawn), 40
// and 30 (the terraces). Every required rise is at most 6 and every required gap at most 16, and
// the boat and shuttle crossings are 40 across, beyond the running jump's reach of 19.
export const CHUNKS: Readonly<Record<string, ChunkPlan>> = {
  "city-boundary-climb-yard": {
    backdrops: [
      { character: "facade-one-storey", col: 4, cols: 12, role: "near-wall", row: 34 },
      { character: "facade-one-storey", col: 42, cols: 16, role: "near-wall", row: 24 },
    ],
    cols: 96,
    difficulty: 4,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [
      { character: "platform-ledge", col: 36, cols: 6, role: "ledge", row: 36 },
      { character: "dog-antagonist", col: 59, role: "antagonist", row: 36 },
      { character: "platform-ledge", col: 70, cols: 6, role: "ledge", row: 36 },
    ],
    solids: [
      { col: 0, cols: 18, look: "ground", row: 50, rows: 10 },
      { col: 18, cols: 12, look: "raised", row: 45, rows: 15 },
      { col: 30, cols: 66, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
    weight: 2,
  },
  "city-boundary-dog-high": {
    backdrops: [{ character: "facade-one-storey", col: 8, cols: 16, role: "near-wall", row: 14 }],
    cols: 84,
    difficulty: 4,
    entry: { row: 30 },
    exit: { row: 30 },
    objects: [
      { character: "platform-ledge", col: 12, cols: 6, role: "ledge", row: 26 },
      { character: "dog-antagonist", col: 35, role: "antagonist", row: 26 },
      { character: "platform-ledge", col: 46, cols: 6, role: "ledge", row: 26 },
    ],
    solids: [{ col: 0, cols: 84, look: "raised", row: 30, rows: 30 }],
    theme: ["city-boundary", "street"],
    weight: 2,
  },
  "city-boundary-dog-terrace": {
    backdrops: [{ character: "facade-one-storey", col: 8, cols: 16, role: "near-wall", row: 24 }],
    cols: 84,
    difficulty: 4,
    entry: { row: 40 },
    exit: { row: 40 },
    objects: [
      { character: "platform-ledge", col: 12, cols: 6, role: "ledge", row: 36 },
      { character: "dog-antagonist", col: 35, role: "antagonist", row: 36 },
      { character: "platform-ledge", col: 46, cols: 6, role: "ledge", row: 36 },
    ],
    solids: [{ col: 0, cols: 84, look: "raised", row: 40, rows: 20 }],
    theme: ["city-boundary", "street"],
    weight: 2,
  },
  "city-boundary-edge-yard": {
    backdrops: [{ character: "facade-one-storey", col: 8, cols: 12, role: "near-wall", row: 34 }],
    cols: 84,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [
      { character: "platform-ledge", col: 16, cols: 8, role: "ledge", row: 45 },
      { character: "red-edge-top", col: 24, cols: 4, role: "edge-top", row: 49 },
      { character: "red-edge-support", col: 24, cols: 4, role: "support", row: 50, rows: 10 },
      { character: "platform-ledge", col: 36, cols: 8, role: "ledge", row: 44 },
      { character: "red-edge-top", col: 52, cols: 4, role: "edge-top", row: 49 },
      { character: "red-edge-support", col: 52, cols: 4, role: "support", row: 50, rows: 10 },
    ],
    solids: [
      { col: 0, cols: 24, look: "ground", row: 50, rows: 10 },
      { col: 28, cols: 24, look: "ground", row: 50, rows: 10 },
      { col: 56, cols: 4, look: "ground", row: 50, rows: 10 },
      { col: 60, cols: 12, look: "raised", row: 45, rows: 15 },
      { col: 72, cols: 12, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-finish": {
    backdrops: [
      { character: "facade-one-storey", col: 6, cols: 8, role: "near-wall", row: 34 },
      { character: "fire-escape-railing", col: 8, cols: 6, role: "fire-escape-railing", row: 44 },
      { character: "fire-escape-railing", col: 42, cols: 6, role: "fire-escape-railing", row: 44 },
    ],
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [
      { character: "platform-ledge", col: 8, cols: 6, role: "ledge", row: 46 },
      { character: "dog-antagonist", col: 31, role: "antagonist", row: 46 },
      { character: "platform-ledge", col: 42, cols: 6, role: "ledge", row: 46 },
    ],
    solids: [{ col: 0, cols: 60, look: "ground", row: 50, rows: 10 }],
    theme: "city-boundary",
  },
  "city-boundary-gaps": {
    backdrops: [{ character: "facade-one-storey", col: 4, cols: 12, role: "near-wall", row: 34 }],
    cols: 84,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [
      { character: "red-edge-top", col: 20, cols: 12, role: "edge-top", row: 54 },
      { character: "red-edge-support", col: 20, cols: 12, role: "support", row: 55, rows: 5 },
      { character: "red-edge-top", col: 48, cols: 16, role: "edge-top", row: 54 },
      { character: "red-edge-support", col: 48, cols: 16, role: "support", row: 55, rows: 5 },
    ],
    solids: [
      { col: 0, cols: 20, look: "ground", row: 50, rows: 10 },
      { col: 32, cols: 16, look: "ground", row: 50, rows: 10 },
      { col: 64, cols: 8, look: "ground", row: 50, rows: 10 },
      { col: 72, cols: 6, look: "raised", row: 45, rows: 15 },
      { col: 78, cols: 6, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-ground-hazard": {
    backdrops: [{ character: "facade-one-storey", col: 8, cols: 12, role: "near-wall", row: 24 }],
    cols: 84,
    difficulty: 4,
    entry: { row: 40 },
    exit: { row: 40 },
    objects: [
      { character: "platform-ledge", col: 16, cols: 8, role: "ledge", row: 35 },
      { character: "city-ground-hazard", col: 30, role: "moving-hazard", row: 39 },
      { character: "platform-ledge", col: 44, cols: 8, role: "ledge", row: 35 },
    ],
    solids: [{ col: 0, cols: 84, look: "raised", row: 40, rows: 20 }],
    theme: ["city-boundary", "street"],
    weight: 2,
  },
  "city-boundary-jumps": {
    backdrops: [{ character: "facade-one-storey", col: 12, cols: 12, role: "near-wall", row: 34 }],
    cols: 72,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [],
    solids: [
      { col: 0, cols: 20, look: "ground", row: 50, rows: 10 },
      { col: 20, cols: 10, look: "raised", row: 44, rows: 16 },
      { col: 30, cols: 14, look: "raised", row: 48, rows: 12 },
      { col: 44, cols: 10, look: "raised", row: 44, rows: 16 },
      { col: 54, cols: 18, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-lift": {
    backdrops: [{ character: "facade-one-storey", col: 48, cols: 16, role: "near-wall", row: 14 }],
    cols: 84,
    difficulty: 3,
    entry: { row: 40 },
    exit: { row: 30 },
    objects: [
      { character: "city-lift", col: 22, role: "lift", row: 40 },
      { character: "red-edge-top", col: 18, cols: 16, role: "edge-top", row: 46 },
      { character: "red-edge-support", col: 18, cols: 16, role: "support", row: 47, rows: 13 },
    ],
    solids: [
      { col: 0, cols: 18, look: "raised", row: 40, rows: 20 },
      { col: 34, cols: 50, look: "raised", row: 30, rows: 30 },
    ],
    theme: ["city-boundary", "street"],
    weight: 2,
  },
  // The red ceiling leaves room for a short hop over the step, but not a full held jump.
  "city-boundary-low-ceiling": {
    cols: 72,
    difficulty: 3,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [
      { character: "red-edge-bottom", col: 20, cols: 18, role: "edge-bottom", row: 42 },
      { character: "red-edge-left", col: 19, role: "edge-left", row: 40, rows: 2 },
      { character: "red-edge-right", col: 38, role: "edge-right", row: 40, rows: 2 },
      { character: "red-edge-top", col: 20, cols: 18, role: "edge-top", row: 39 },
      { character: "red-edge-support", col: 20, cols: 18, role: "support", row: 40, rows: 2 },
    ],
    solids: [
      { col: 0, cols: 26, look: "ground", row: 50, rows: 10 },
      { col: 26, cols: 6, look: "raised", row: 49, rows: 11 },
      { col: 32, cols: 12, look: "ground", row: 50, rows: 10 },
      { col: 44, cols: 14, look: "raised", row: 45, rows: 15 },
      { col: 58, cols: 14, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-return-high": {
    cols: 72,
    difficulty: 2,
    entry: { row: 30 },
    exit: { row: 50 },
    objects: [],
    solids: [
      { col: 0, cols: 18, look: "raised", row: 30, rows: 30 },
      { col: 18, cols: 12, look: "raised", row: 35, rows: 25 },
      { col: 30, cols: 12, look: "raised", row: 40, rows: 20 },
      { col: 42, cols: 12, look: "raised", row: 45, rows: 15 },
      { col: 54, cols: 18, look: "ground", row: 50, rows: 10 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-return-terrace": {
    cols: 60,
    difficulty: 2,
    entry: { row: 40 },
    exit: { row: 50 },
    objects: [],
    solids: [
      { col: 0, cols: 20, look: "raised", row: 40, rows: 20 },
      { col: 20, cols: 14, look: "raised", row: 45, rows: 15 },
      { col: 34, cols: 26, look: "ground", row: 50, rows: 10 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-shuttle": {
    backdrops: [{ character: "facade-one-storey", col: 64, cols: 16, role: "near-wall", row: 24 }],
    cols: 96,
    difficulty: 3,
    entry: { row: 40 },
    exit: { row: 40 },
    objects: [
      { character: "city-shuttle", col: 20, role: "shuttle", row: 40 },
      { character: "red-edge-top", col: 18, cols: 40, role: "edge-top", row: 46 },
      { character: "red-edge-support", col: 18, cols: 40, role: "support", row: 47, rows: 13 },
    ],
    solids: [
      { col: 0, cols: 18, look: "raised", row: 40, rows: 20 },
      { col: 58, cols: 38, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
    weight: 2,
  },
  "city-boundary-start": {
    backdrops: [{ character: "facade-one-storey", col: 8, cols: 16, role: "near-wall", row: 34 }],
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [],
    slots: [{ area: { col: 18, cols: 4, row: 46, rows: 4 }, id: "street-room", kind: "door" }],
    solids: [{ col: 0, cols: 60, look: "ground", row: 50, rows: 10 }],
    theme: "city-boundary",
  },
  "city-boundary-steps": {
    backdrops: [{ character: "facade-one-storey", col: 4, cols: 16, role: "near-wall", row: 34 }],
    cols: 72,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [],
    solids: [
      { col: 0, cols: 20, look: "ground", row: 50, rows: 10 },
      { col: 20, cols: 6, look: "raised", row: 47, rows: 13 },
      { col: 26, cols: 6, look: "raised", row: 44, rows: 16 },
      { col: 32, cols: 6, look: "raised", row: 41, rows: 19 },
      { col: 38, cols: 34, look: "raised", row: 40, rows: 20 },
    ],
    theme: ["city-boundary", "street"],
  },
  "city-boundary-upper-climb": {
    backdrops: [{ character: "facade-one-storey", col: 42, cols: 12, role: "near-wall", row: 14 }],
    cols: 72,
    difficulty: 2,
    entry: { row: 40 },
    exit: { row: 30 },
    objects: [{ character: "platform-ledge", col: 40, cols: 8, role: "ledge", row: 24 }],
    solids: [
      { col: 0, cols: 18, look: "raised", row: 40, rows: 20 },
      { col: 18, cols: 12, look: "raised", row: 35, rows: 25 },
      { col: 30, cols: 42, look: "raised", row: 30, rows: 30 },
    ],
    theme: ["city-boundary", "street"],
  },
  // Difficulty 2, up from the lawn (50) to the high terrace (30): a bench (up 2), a terrace (up 4),
  // a bench on it (up 2), the bandstand's roof (up 4, 6 above its base), a step (up 4) and the
  // high terrace (up 4). An event slot on the lawn.
  "park-bandstand": {
    backdrops: [
      { character: "park-bench-frame", col: 25, role: "bench-frame", row: 48 },
      { character: "park-bench-frame", col: 30, role: "bench-frame", row: 42 },
      { character: "park-bandstand", col: 34, role: "bandstand", row: 37 },
      { character: "park-tree", col: 70, role: "tree", row: 17 },
    ],
    cols: 96,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 30 },
    objects: [
      { character: "park-bench", col: 25, role: "bench", row: 48 },
      { character: "park-bench", col: 30, role: "bench", row: 42 },
      { character: "park-bandstand-roof", col: 34, role: "roof-ledge", row: 38 },
    ],
    slots: [{ area: { col: 8, cols: 6, row: 44, rows: 6 }, id: "lawn", kind: "event" }],
    solids: [
      { col: 0, cols: 28, look: "ground", row: 50, rows: 10 },
      { col: 28, cols: 18, look: "raised", row: 44, rows: 16 },
      { col: 46, cols: 6, look: "raised", row: 34, rows: 26 },
      { col: 52, cols: 44, look: "raised", row: 30, rows: 30 },
    ],
    theme: "park",
  },
  // Difficulty 1, the zone's end: a lawn with a bench.
  "park-finish": {
    backdrops: [
      { character: "park-bench-frame", col: 22, role: "bench-frame", row: 48 },
      { character: "park-tree", col: 10, role: "tree", row: 37 },
      { character: "park-lamp", col: 44, role: "lamp", row: 43 },
    ],
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 22, role: "bench", row: 48 }],
    solids: [{ col: 0, cols: 60, look: "ground", row: 50, rows: 10 }],
    theme: "park",
  },
  // Difficulty 3, along the high terrace (30): gaps of 12 and 16, with red edges below the gaps.
  "park-high-walk": {
    backdrops: [
      { character: "park-lamp", col: 8, role: "lamp", row: 23 },
      { character: "park-tree", col: 70, role: "tree", row: 17 },
    ],
    cols: 90,
    difficulty: 3,
    entry: { row: 30 },
    exit: { row: 30 },
    objects: [
      { character: "red-edge-top", col: 20, cols: 12, role: "edge-top", row: 34 },
      { character: "red-edge-support", col: 20, cols: 12, role: "support", row: 35, rows: 25 },
      { character: "red-edge-top", col: 46, cols: 16, role: "edge-top", row: 34 },
      { character: "red-edge-support", col: 46, cols: 16, role: "support", row: 35, rows: 25 },
    ],
    solids: [
      { col: 0, cols: 20, look: "raised", row: 30, rows: 30 },
      { col: 32, cols: 14, look: "raised", row: 30, rows: 30 },
      { col: 62, cols: 28, look: "raised", row: 30, rows: 30 },
    ],
    theme: "park",
  },
  // Difficulty 1, along the lawn (50): taps up 1, up 1, then down 1 and 1, past a bench. A door
  // slot by the far tree.
  "park-lawn": {
    backdrops: [
      { character: "park-bench-frame", col: 44, role: "bench-frame", row: 48 },
      { character: "park-tree", col: 4, role: "tree", row: 37 },
      { character: "park-lamp", col: 52, role: "lamp", row: 43 },
      { character: "park-tree", col: 62, role: "tree", row: 37 },
    ],
    cols: 72,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 44, role: "bench", row: 48 }],
    slots: [{ area: { col: 56, cols: 4, row: 45, rows: 5 }, id: "by-the-tree", kind: "door" }],
    solids: [
      { col: 0, cols: 20, look: "ground", row: 50, rows: 10 },
      { col: 20, cols: 6, look: "raised", row: 49, rows: 11 },
      { col: 26, cols: 6, look: "raised", row: 48, rows: 12 },
      { col: 32, cols: 8, look: "raised", row: 49, rows: 11 },
      { col: 40, cols: 32, look: "ground", row: 50, rows: 10 },
    ],
    theme: "park",
  },
  // A short press clears the one-tile step beneath the red ceiling; a full jump hits it.
  // The overhead block is eleven tiles above the lawn, beyond the full jump's reach.
  "park-low-ceiling": {
    cols: 72,
    difficulty: 3,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [
      { character: "red-edge-bottom", col: 20, cols: 18, role: "edge-bottom", row: 41 },
      { character: "red-edge-left", col: 19, role: "edge-left", row: 39, rows: 2 },
      { character: "red-edge-right", col: 38, role: "edge-right", row: 39, rows: 2 },
      { character: "red-edge-top", col: 20, cols: 18, role: "edge-top", row: 38 },
      { character: "red-edge-support", col: 20, cols: 18, role: "support", row: 39, rows: 2 },
    ],
    solids: [
      { col: 0, cols: 26, look: "ground", row: 50, rows: 10 },
      { col: 26, cols: 6, look: "raised", row: 49, rows: 11 },
      { col: 32, cols: 40, look: "ground", row: 50, rows: 10 },
    ],
    theme: "park",
  },
  // Difficulty 3, across the pond on the middle terrace (40): the banks are 40 apart, so she rides
  // a boat that crosses between them, 2 from each bank. A door slot on the far bank.
  "park-pond": {
    backdrops: [{ character: "park-tree", col: 84, role: "tree", row: 27 }],
    cols: 100,
    difficulty: 3,
    entry: { row: 40 },
    exit: { row: 40 },
    noCross: [{ from: { col: 10, row: 40 }, to: { col: 80, row: 40 } }],
    objects: [
      { character: "red-edge-top", col: 20, cols: 40, role: "edge-top", row: 45 },
      { character: "red-edge-support", col: 20, cols: 40, role: "support", row: 46, rows: 14 },
      {
        character: "park-boat",
        col: 22,
        phase: 0,
        role: "shuttle",
        row: 40,
      },
    ],
    slots: [{ area: { col: 80, cols: 4, row: 35, rows: 5 }, id: "far-bank", kind: "door" }],
    solids: [
      { col: 0, cols: 20, look: "raised", row: 40, rows: 20 },
      { col: 60, cols: 40, look: "raised", row: 40, rows: 20 },
    ],
    theme: "park",
  },
  // Difficulty 2, down from the high terrace (30) to the lawn (50) in drops of 6, 7 and 7, then a
  // red edge to jump.
  "park-slope-down": {
    backdrops: [{ character: "park-lamp", col: 24, role: "lamp", row: 29 }],
    cols: 80,
    difficulty: 2,
    entry: { row: 30 },
    exit: { row: 50 },
    objects: [
      { character: "red-edge-top", col: 60, cols: 3, role: "edge-top", row: 49 },
      { character: "red-edge-support", col: 60, cols: 3, role: "support", row: 50, rows: 10 },
    ],
    solids: [
      { col: 0, cols: 20, look: "raised", row: 30, rows: 30 },
      { col: 20, cols: 14, look: "raised", row: 36, rows: 24 },
      { col: 34, cols: 14, look: "raised", row: 43, rows: 17 },
      { col: 48, cols: 12, look: "ground", row: 50, rows: 10 },
      { col: 63, cols: 17, look: "ground", row: 50, rows: 10 },
    ],
    theme: "park",
  },
  // Difficulty 1, the zone's start: a lawn (50) with a tap up 1 and down, a bench, and an event
  // slot.
  "park-start": {
    backdrops: [
      { character: "park-bench-frame", col: 40, role: "bench-frame", row: 48 },
      { character: "park-tree", col: 6, role: "tree", row: 37 },
      { character: "park-lamp", col: 20, role: "lamp", row: 43 },
    ],
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 40, role: "bench", row: 48 }],
    slots: [{ area: { col: 46, cols: 6, row: 44, rows: 6 }, id: "lawn", kind: "event" }],
    solids: [
      { col: 0, cols: 24, look: "ground", row: 50, rows: 10 },
      { col: 24, cols: 8, look: "raised", row: 49, rows: 11 },
      { col: 32, cols: 28, look: "ground", row: 50, rows: 10 },
    ],
    theme: "park",
  },
  // Difficulty 2, down from the high terrace (30) to the middle terrace (40), then two red
  // edges to jump.
  "park-steps-down": {
    backdrops: [{ character: "park-tree", col: 4, role: "tree", row: 17 }],
    cols: 70,
    difficulty: 2,
    entry: { row: 30 },
    exit: { row: 40 },
    objects: [
      { character: "red-edge-top", col: 36, cols: 3, role: "edge-top", row: 39 },
      { character: "red-edge-support", col: 36, cols: 3, role: "support", row: 40, rows: 20 },
      { character: "red-edge-top", col: 52, cols: 2, role: "edge-top", row: 39 },
      { character: "red-edge-support", col: 52, cols: 2, role: "support", row: 40, rows: 20 },
    ],
    solids: [
      { col: 0, cols: 22, look: "raised", row: 30, rows: 30 },
      { col: 22, cols: 14, look: "raised", row: 40, rows: 20 },
      { col: 39, cols: 13, look: "raised", row: 40, rows: 20 },
      { col: 54, cols: 16, look: "raised", row: 40, rows: 20 },
    ],
    theme: "park",
  },
  // Difficulty 1, down from the middle terrace (40) to the lawn (50) in two steps of 5. An event
  // slot on the lawn.
  "park-terrace-down": {
    backdrops: [
      { character: "park-bench-frame", col: 36, role: "bench-frame", row: 48 },
      { character: "park-tree", col: 50, role: "tree", row: 37 },
    ],
    cols: 64,
    difficulty: 1,
    entry: { row: 40 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 36, role: "bench", row: 48 }],
    slots: [{ area: { col: 40, cols: 6, row: 44, rows: 6 }, id: "lawn", kind: "event" }],
    solids: [
      { col: 0, cols: 20, look: "raised", row: 40, rows: 20 },
      { col: 20, cols: 12, look: "raised", row: 45, rows: 15 },
      { col: 32, cols: 32, look: "ground", row: 50, rows: 10 },
    ],
    theme: "park",
  },
  // Difficulty 2, up from the lawn (50) to the middle terrace (40): a red edge to jump, then
  // two rises of 5.
  "park-terrace-up": {
    backdrops: [
      { character: "park-bench-frame", col: 50, role: "bench-frame", row: 38 },
      { character: "park-tree", col: 60, role: "tree", row: 27 },
    ],
    cols: 80,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [
      { character: "red-edge-top", col: 12, cols: 3, role: "edge-top", row: 49 },
      { character: "red-edge-support", col: 12, cols: 3, role: "support", row: 50, rows: 10 },
      { character: "park-bench", col: 50, role: "bench", row: 38 },
    ],
    solids: [
      { col: 0, cols: 12, look: "ground", row: 50, rows: 10 },
      { col: 15, cols: 9, look: "ground", row: 50, rows: 10 },
      { col: 24, cols: 16, look: "raised", row: 45, rows: 15 },
      { col: 40, cols: 40, look: "raised", row: 40, rows: 20 },
    ],
    theme: "park",
  },
  // Difficulty 2, up from the middle terrace (40) to the high terrace (30): a red edge to jump,
  // then two rises of 5. A tree's branch over the high terrace, 6 up, for a look out.
  "park-upper-terrace": {
    backdrops: [{ character: "park-tree", col: 46, role: "tree", row: 17 }],
    cols: 80,
    difficulty: 2,
    entry: { row: 40 },
    exit: { row: 30 },
    objects: [
      { character: "red-edge-top", col: 12, cols: 3, role: "edge-top", row: 39 },
      { character: "red-edge-support", col: 12, cols: 3, role: "support", row: 40, rows: 20 },
      { character: "park-branch", col: 48, role: "branch", row: 24 },
    ],
    solids: [
      { col: 0, cols: 12, look: "raised", row: 40, rows: 20 },
      { col: 15, cols: 11, look: "raised", row: 40, rows: 20 },
      { col: 26, cols: 10, look: "raised", row: 35, rows: 25 },
      { col: 36, cols: 44, look: "raised", row: 30, rows: 30 },
    ],
    theme: "park",
  },
  ...STREET_CHUNKS,
};
