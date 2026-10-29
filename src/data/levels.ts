import type { LevelPlan } from "./types";

// PLACEHOLDER: parkour test levels, until gameplay designs the real levels.
//
// Every level is 60 rows, starts on the ground at the bottom left and exits in the upper screen
// on the right. Each solid runs down to the bottom row, so every gap is a pit she falls out of.
// Rises and gaps are in tiles, from the top of the ground she leaves to the top of the ledge she
// lands on. Every mover's path is 2 tiles from every solid and every other mover's path, so a
// mover never meets her box where she stands at an edge. Gaps a mover crosses are 28 wide, past
// the running jump's 22.
export const TEST_LEVELS: readonly LevelPlan[] = [
  // Ledges.
  {
    areas: {
      main: {
        cols: 140,
        entries: { start: { col: 3, row: 56 } },
        objects: [{ col: 134, cols: 2, row: 18, rows: 4, type: "test-exit" }],
        rows: 60,
        solids: [
          // Hop steps: up 2, then up 3 (the hop's reach).
          { col: 0, cols: 12, row: 56, rows: 4 },
          { col: 12, cols: 6, row: 54, rows: 6 },
          { col: 18, cols: 6, row: 51, rows: 9 },
          // Full jump steps: up 5, then up 8 (the jump's reach).
          { col: 24, cols: 6, row: 46, rows: 14 },
          { col: 30, cols: 10, row: 38, rows: 22 },
          // Gaps at the same height: 6, 14, then 22.
          { col: 46, cols: 10, row: 38, rows: 22 },
          { col: 70, cols: 10, row: 38, rows: 22 },
          // GAP_LIMIT: a gap of 22, the running jump's reach.
          { col: 102, cols: 10, row: 38, rows: 22 },
          // Climb to the upper screen: two full jumps of 8.
          { col: 112, cols: 6, row: 30, rows: 30 },
          { col: 118, cols: 22, row: 22, rows: 38 },
        ],
      },
    },
    start: { area: "main", entry: "start" },
  },
  // Hazards.
  {
    areas: {
      main: {
        cols: 196,
        entries: { start: { col: 3, row: 56 } },
        objects: [
          // Hazard strips on the ground under gaps of 8 and 16.
          { col: 18, cols: 8, row: 55, rows: 1, type: "test-hazard" },
          { col: 32, cols: 16, row: 55, rows: 1, type: "test-hazard" },
          // Hazard blocks on a ledge to jump over: 3 tall, then 5 tall.
          { col: 54, cols: 2, row: 49, rows: 3, type: "test-hazard" },
          { col: 66, cols: 2, row: 47, rows: 5, type: "test-hazard" },
          // A hazard post in a gap of 14, 3 above the ledges either side.
          { col: 86, cols: 2, row: 49, rows: 11, type: "test-hazard" },
          // A narrow landing, 4 wide, between two hazard posts 2 above it.
          { col: 112, cols: 2, row: 50, rows: 10, type: "test-hazard" },
          { col: 118, cols: 2, row: 50, rows: 10, type: "test-hazard" },
          // Hazard ceilings 8 above each step: a hop clears them and a full jump touches them.
          { col: 134, cols: 4, row: 42, rows: 2, type: "test-hazard" },
          { col: 138, cols: 6, row: 40, rows: 2, type: "test-hazard" },
          { col: 144, cols: 6, row: 38, rows: 2, type: "test-hazard" },
          { col: 150, cols: 6, row: 36, rows: 2, type: "test-hazard" },
          { col: 190, cols: 2, row: 18, rows: 4, type: "test-exit" },
        ],
        rows: 60,
        solids: [
          { col: 0, cols: 12, row: 56, rows: 4 },
          // Gaps of 8 and 16 at the same height over hazard strips.
          { col: 12, cols: 6, row: 52, rows: 8 },
          { col: 18, cols: 8, row: 56, rows: 4 },
          { col: 26, cols: 6, row: 52, rows: 8 },
          { col: 32, cols: 16, row: 56, rows: 4 },
          // The ledge with hazard blocks, then a gap of 14 over a hazard post.
          { col: 48, cols: 32, row: 52, rows: 8 },
          { col: 94, cols: 10, row: 52, rows: 8 },
          // The narrow landing: gaps of 10 to it and from it, 24 in all, so she can't jump past it.
          { col: 114, cols: 4, row: 52, rows: 8 },
          // Hops up 2 under the hazard ceilings.
          { col: 128, cols: 10, row: 52, rows: 8 },
          { col: 138, cols: 6, row: 50, rows: 10 },
          { col: 144, cols: 6, row: 48, rows: 12 },
          { col: 150, cols: 12, row: 46, rows: 14 },
          // Climb to the upper screen: three full jumps of 8.
          { col: 162, cols: 6, row: 38, rows: 22 },
          { col: 168, cols: 6, row: 30, rows: 30 },
          { col: 174, cols: 22, row: 22, rows: 38 },
        ],
      },
    },
    start: { area: "main", entry: "start" },
  },
  // Single movers, each between two solid ledges.
  {
    areas: {
      main: {
        cols: 132,
        entries: { start: { col: 3, row: 56 } },
        objects: [
          // A vertical mover lifts her 14, from the ground to a ledge.
          {
            col: 14,
            cols: 4,
            overrides: { motion: { direction: "up", distance: 14, pause: 1, speed: 3.5 } },
            phase: 0,
            row: 56,
            rows: 1,
            type: "test-mover",
          },
          // A horizontal mover 6 above the ledges across a gap of 28: she can jump up onto it only
          // while it is near.
          {
            col: 34,
            cols: 6,
            overrides: { motion: { direction: "right", distance: 16, pause: 1, speed: 4 } },
            phase: 0,
            row: 36,
            rows: 1,
            type: "test-mover",
          },
          // A vertical mover lifts her 16, into the upper screen.
          {
            col: 70,
            cols: 4,
            overrides: { motion: { direction: "up", distance: 16, pause: 1, speed: 4 } },
            phase: 0,
            row: 42,
            rows: 1,
            type: "test-mover",
          },
          // A horizontal mover level with the ledges across a gap of 28, to the exit.
          {
            col: 88,
            cols: 6,
            overrides: { motion: { direction: "right", distance: 18, pause: 1, speed: 4.5 } },
            phase: 0,
            row: 26,
            rows: 1,
            type: "test-mover",
          },
          { col: 126, cols: 2, row: 22, rows: 4, type: "test-exit" },
        ],
        rows: 60,
        solids: [
          { col: 0, cols: 12, row: 56, rows: 4 },
          { col: 20, cols: 10, row: 42, rows: 18 },
          { col: 58, cols: 10, row: 42, rows: 18 },
          { col: 76, cols: 10, row: 26, rows: 34 },
          { col: 114, cols: 18, row: 26, rows: 34 },
        ],
      },
    },
    start: { area: "main", entry: "start" },
  },
  // Mover to mover transfers, with no solid ledge between them, easiest first. The movers in each
  // chain share a round trip (8 s for the lifts' chain, 5 s for the last pair), so each meeting
  // comes round once a cycle, and she waits for it by riding.
  {
    areas: {
      main: {
        cols: 140,
        entries: { start: { col: 3, row: 56 } },
        objects: [
          // Vertical to horizontal: the lift pauses at its top as the horizontal mover, 2 higher and
          // 2 across, pauses at its near end.
          {
            col: 14,
            cols: 4,
            overrides: { motion: { direction: "up", distance: 12, pause: 1, speed: 4 } },
            phase: 0.375,
            row: 56,
            rows: 1,
            type: "test-mover",
          },
          {
            col: 20,
            cols: 6,
            overrides: { motion: { direction: "right", distance: 18, pause: 1, speed: 6 } },
            phase: 0.875,
            row: 42,
            rows: 1,
            type: "test-mover",
          },
          // Horizontal to vertical: the next lift reaches its bottom, level with the horizontal
          // mover and 2 across, as that mover ends its pause at its far end.
          {
            col: 46,
            cols: 4,
            overrides: { motion: { direction: "up", distance: 12, pause: 1, speed: 4 } },
            phase: 0.25,
            row: 42,
            rows: 1,
            type: "test-mover",
          },
          // Vertical to vertical: a second lift 2 across, without pauses, moves opposite to the
          // first, from 2 below the first's top to 4 below the ledge. She jumps up 4 from its top to
          // the ledge.
          {
            col: 52,
            cols: 4,
            overrides: { motion: { direction: "up", distance: 12, pause: 0, speed: 3 } },
            phase: 0.8125,
            row: 32,
            rows: 1,
            type: "test-mover",
          },
          // Horizontal to horizontal, opposite directions, fastest: the second, 4 higher and 2
          // across, pauses at its near end as the first pauses at its far end, then carries her to
          // the exit ledge. Their round trip is 5 s.
          {
            col: 72,
            cols: 6,
            overrides: { motion: { direction: "right", distance: 16, pause: 0.5, speed: 8 } },
            phase: 0.4,
            row: 16,
            rows: 1,
            type: "test-mover",
          },
          {
            col: 96,
            cols: 6,
            overrides: { motion: { direction: "right", distance: 16, pause: 0.5, speed: 8 } },
            phase: 0.9,
            row: 12,
            rows: 1,
            type: "test-mover",
          },
          { col: 134, cols: 2, row: 8, rows: 4, type: "test-exit" },
        ],
        rows: 60,
        solids: [
          { col: 0, cols: 12, row: 56, rows: 4 },
          { col: 58, cols: 12, row: 16, rows: 44 },
          { col: 120, cols: 20, row: 12, rows: 48 },
        ],
      },
    },
    start: { area: "main", entry: "start" },
  },
  // Two areas joined by a door: a street 4 screens wide, with a pigeon that hops about and flies
  // from her and a door at its right end, then a lobby 6 screens wide with a cart wandering its
  // floor, and the exit at its right end.
  {
    areas: {
      lobby: {
        cols: 360,
        entries: { door: { col: 4, row: 56 } },
        objects: [
          { col: 40, row: 54, type: "test-cart" },
          { col: 354, cols: 2, row: 52, rows: 4, type: "test-exit" },
        ],
        rows: 60,
        solids: [{ col: 0, cols: 360, row: 56, rows: 4 }],
      },
      street: {
        cols: 240,
        entries: { start: { col: 3, row: 56 } },
        objects: [
          { col: 30, row: 54, type: "test-pigeon" },
          { col: 228, row: 52, to: { area: "lobby", entry: "door" }, type: "test-door" },
        ],
        rows: 60,
        solids: [{ col: 0, cols: 240, row: 56, rows: 4 }],
      },
    },
    start: { area: "street", entry: "start" },
  },
];
