import type { ChunkPlan, ChunkRules, ThemePlan } from "./types";

// The rows a chunk's entry and exit stand on.
export const SEAM_ROWS = [30, 40, 50] as const;

export const CHUNK_RULES: ChunkRules = {
  cols: { max: 120, min: 60 },
  footing: 4,
  headroom: 6,
};

// The themes chunks are drawn in, by key.
export const THEMES: Readonly<Record<string, ThemePlan>> = {
  // The park, outdoors in autumn. Chunks name two looks, ground (the lawn, its top at row 50)
  // and raised (the terraces above it), both drawn as art's grass top over turf over soil. Its
  // backdrops, back to front: the sky, the clouds, the city, the far trees and the treetops,
  // each standing where art puts its bottom edge.
  park: {
    backdrops: [
      { character: "park-sky", parallax: { x: 0, y: 0 }, row: 0 },
      { character: "park-clouds", row: 3 },
      { character: "park-city", parallax: { x: 0.15, y: 0.05 }, row: 28 },
      { character: "park-far-trees", row: 40 },
      { character: "park-treetops", parallax: { x: 0.4, y: 0.15 }, row: 15 },
    ],
    door: "park-gate",
    looks: { ground: "grass", raised: "grass" },
    tileset: "tiles-park",
  },
};

// The chunks zones are assembled from, by id. Rows are the chunk's own: seams at 50 (the lawn), 40
// and 30 (the terraces). Every required rise is at most 6 and every required gap at most 16, and
// every gap she must not cross is 21 or more, so the chunks hold for a jump of 6 and a gap of 18
// or 19.
export const CHUNKS: Readonly<Record<string, ChunkPlan>> = {
  // Difficulty 2, up from the lawn (50) to the high terrace (30): a bench (up 2), a terrace (up 4),
  // a bench on it (up 2), the bandstand's roof (up 4, 6 above its base), a step (up 4) and the
  // high terrace (up 4). An event slot on the lawn.
  "park-bandstand": {
    backdrops: [
      { character: "park-bench-frame", col: 25, row: 48 },
      { character: "park-bench-frame", col: 30, row: 42 },
      { character: "park-bandstand", col: 34, row: 37 },
      { character: "park-tree", col: 70, row: 17 },
    ],
    cols: 96,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 30 },
    objects: [
      { character: "park-bench", col: 25, row: 48 },
      { character: "park-bench", col: 30, row: 42 },
      { character: "park-bandstand-roof", col: 34, row: 38 },
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
      { character: "park-bench-frame", col: 22, row: 48 },
      { character: "park-tree", col: 10, row: 37 },
      { character: "park-lamp", col: 44, row: 43 },
    ],
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 22, row: 48 }],
    solids: [{ col: 0, cols: 60, look: "ground", row: 50, rows: 10 }],
    theme: "park",
  },
  // Difficulty 3, along the high terrace (30): gaps of 12 and 16, with red edges below the gaps.
  "park-high-walk": {
    backdrops: [
      { character: "park-lamp", col: 8, row: 23 },
      { character: "park-tree", col: 70, row: 17 },
    ],
    cols: 90,
    difficulty: 3,
    entry: { row: 30 },
    exit: { row: 30 },
    objects: [
      { character: "red-edge-top", col: 20, cols: 12, row: 34 },
      { character: "red-edge-support", col: 20, cols: 12, row: 35, rows: 25 },
      { character: "red-edge-top", col: 46, cols: 16, row: 34 },
      { character: "red-edge-support", col: 46, cols: 16, row: 35, rows: 25 },
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
      { character: "park-bench-frame", col: 44, row: 48 },
      { character: "park-tree", col: 4, row: 37 },
      { character: "park-lamp", col: 52, row: 43 },
      { character: "park-tree", col: 62, row: 37 },
    ],
    cols: 72,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 44, row: 48 }],
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
  // The overhead block is seven tiles above the lawn, beyond the full jump's reach.
  "park-low-ceiling": {
    cols: 72,
    difficulty: 3,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [
      { character: "red-edge-bottom", col: 20, cols: 18, row: 45 },
      { character: "red-edge-left", col: 19, row: 43, rows: 2 },
      { character: "red-edge-right", col: 38, row: 43, rows: 2 },
      { character: "red-edge-top", col: 20, cols: 18, row: 42 },
      { character: "red-edge-support", col: 20, cols: 18, row: 43, rows: 2 },
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
    backdrops: [{ character: "park-tree", col: 84, row: 27 }],
    cols: 100,
    difficulty: 3,
    entry: { row: 40 },
    exit: { row: 40 },
    noCross: [{ from: { col: 10, row: 40 }, to: { col: 80, row: 40 } }],
    objects: [
      { character: "red-edge-top", col: 20, cols: 40, row: 45 },
      { character: "red-edge-support", col: 20, cols: 40, row: 46, rows: 14 },
      {
        character: "park-boat",
        col: 22,
        overrides: { motion: { direction: "right", distance: 30, pause: 1, speed: 6 } },
        phase: 0,
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
    backdrops: [{ character: "park-lamp", col: 24, row: 29 }],
    cols: 80,
    difficulty: 2,
    entry: { row: 30 },
    exit: { row: 50 },
    objects: [
      { character: "red-edge-top", col: 60, cols: 3, row: 49 },
      { character: "red-edge-support", col: 60, cols: 3, row: 50, rows: 10 },
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
      { character: "park-bench-frame", col: 40, row: 48 },
      { character: "park-tree", col: 6, row: 37 },
      { character: "park-lamp", col: 20, row: 43 },
    ],
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 40, row: 48 }],
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
    backdrops: [{ character: "park-tree", col: 4, row: 17 }],
    cols: 70,
    difficulty: 2,
    entry: { row: 30 },
    exit: { row: 40 },
    objects: [
      { character: "red-edge-top", col: 36, cols: 3, row: 39 },
      { character: "red-edge-support", col: 36, cols: 3, row: 40, rows: 20 },
      { character: "red-edge-top", col: 52, cols: 2, row: 39 },
      { character: "red-edge-support", col: 52, cols: 2, row: 40, rows: 20 },
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
      { character: "park-bench-frame", col: 36, row: 48 },
      { character: "park-tree", col: 50, row: 37 },
    ],
    cols: 64,
    difficulty: 1,
    entry: { row: 40 },
    exit: { row: 50 },
    objects: [{ character: "park-bench", col: 36, row: 48 }],
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
      { character: "park-bench-frame", col: 50, row: 38 },
      { character: "park-tree", col: 60, row: 27 },
    ],
    cols: 80,
    difficulty: 2,
    entry: { row: 50 },
    exit: { row: 40 },
    objects: [
      { character: "red-edge-top", col: 12, cols: 3, row: 49 },
      { character: "red-edge-support", col: 12, cols: 3, row: 50, rows: 10 },
      { character: "park-bench", col: 50, row: 38 },
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
    backdrops: [{ character: "park-tree", col: 46, row: 17 }],
    cols: 80,
    difficulty: 2,
    entry: { row: 40 },
    exit: { row: 30 },
    objects: [
      { character: "red-edge-top", col: 12, cols: 3, row: 39 },
      { character: "red-edge-support", col: 12, cols: 3, row: 40, rows: 20 },
      { character: "park-branch", col: 48, row: 24 },
    ],
    solids: [
      { col: 0, cols: 12, look: "raised", row: 40, rows: 20 },
      { col: 15, cols: 11, look: "raised", row: 40, rows: 20 },
      { col: 26, cols: 10, look: "raised", row: 35, rows: 25 },
      { col: 36, cols: 44, look: "raised", row: 30, rows: 30 },
    ],
    theme: "park",
  },
};
