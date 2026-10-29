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
    cols: 140,
    exit: { col: 134, cols: 2, row: 18, rows: 4 },
    hazards: [],
    ledges: [],
    movers: [],
    movingHazards: [],
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
    start: { col: 3, row: 56 },
  },
  // Hazards.
  {
    cols: 196,
    exit: { col: 190, cols: 2, row: 18, rows: 4 },
    hazards: [
      // Hazard strips on the ground under gaps of 8 and 16.
      { col: 18, cols: 8, row: 55, rows: 1 },
      { col: 32, cols: 16, row: 55, rows: 1 },
      // Hazard blocks on a ledge to jump over: 3 tall, then 5 tall.
      { col: 54, cols: 2, row: 49, rows: 3 },
      { col: 66, cols: 2, row: 47, rows: 5 },
      // A hazard post in a gap of 14, 3 above the ledges either side.
      { col: 86, cols: 2, row: 49, rows: 11 },
      // A narrow landing, 4 wide, between two hazard posts 2 above it.
      { col: 112, cols: 2, row: 50, rows: 10 },
      { col: 118, cols: 2, row: 50, rows: 10 },
      // Hazard ceilings 8 above each step: a hop clears them and a full jump touches them.
      { col: 134, cols: 4, row: 42, rows: 2 },
      { col: 138, cols: 6, row: 40, rows: 2 },
      { col: 144, cols: 6, row: 38, rows: 2 },
      { col: 150, cols: 6, row: 36, rows: 2 },
    ],
    ledges: [],
    movers: [],
    movingHazards: [],
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
    start: { col: 3, row: 56 },
  },
  // Single movers, each between two solid ledges.
  {
    cols: 132,
    exit: { col: 126, cols: 2, row: 22, rows: 4 },
    hazards: [],
    ledges: [],
    movers: [
      // A vertical mover lifts her 14, from the ground to a ledge.
      {
        cols: 4,
        from: { col: 14, row: 56 },
        pause: 1,
        phase: 0,
        rows: 1,
        speed: 3.5,
        to: { col: 14, row: 42 },
      },
      // A horizontal mover 6 above the ledges across a gap of 28: she can jump up onto it only
      // while it is near.
      {
        cols: 6,
        from: { col: 34, row: 36 },
        pause: 1,
        phase: 0,
        rows: 1,
        speed: 4,
        to: { col: 50, row: 36 },
      },
      // A vertical mover lifts her 16, into the upper screen.
      {
        cols: 4,
        from: { col: 70, row: 42 },
        pause: 1,
        phase: 0,
        rows: 1,
        speed: 4,
        to: { col: 70, row: 26 },
      },
      // A horizontal mover level with the ledges across a gap of 28, to the exit.
      {
        cols: 6,
        from: { col: 88, row: 26 },
        pause: 1,
        phase: 0,
        rows: 1,
        speed: 4.5,
        to: { col: 106, row: 26 },
      },
    ],
    movingHazards: [],
    rows: 60,
    solids: [
      { col: 0, cols: 12, row: 56, rows: 4 },
      { col: 20, cols: 10, row: 42, rows: 18 },
      { col: 58, cols: 10, row: 42, rows: 18 },
      { col: 76, cols: 10, row: 26, rows: 34 },
      { col: 114, cols: 18, row: 26, rows: 34 },
    ],
    start: { col: 3, row: 56 },
  },
  // Mover to mover transfers, with no solid ledge between them, easiest first. The movers in each
  // chain share a round trip (8 s for the lifts' chain, 5 s for the last pair), so each meeting
  // comes round once a cycle, and she waits for it by riding.
  {
    cols: 140,
    exit: { col: 134, cols: 2, row: 8, rows: 4 },
    hazards: [],
    ledges: [],
    movers: [
      // Vertical to horizontal: the lift pauses at its top as the horizontal mover, 2 higher and
      // 2 across, pauses at its near end.
      {
        cols: 4,
        from: { col: 14, row: 56 },
        pause: 1,
        phase: 0.375,
        rows: 1,
        speed: 4,
        to: { col: 14, row: 44 },
      },
      {
        cols: 6,
        from: { col: 20, row: 42 },
        pause: 1,
        phase: 0.875,
        rows: 1,
        speed: 6,
        to: { col: 38, row: 42 },
      },
      // Horizontal to vertical: the next lift reaches its bottom, level with the horizontal
      // mover and 2 across, as that mover ends its pause at its far end.
      {
        cols: 4,
        from: { col: 46, row: 42 },
        pause: 1,
        phase: 0.25,
        rows: 1,
        speed: 4,
        to: { col: 46, row: 30 },
      },
      // Vertical to vertical: a second lift 2 across, without pauses, moves opposite to the
      // first, from 2 below the first's top to 4 below the ledge. She jumps up 4 from its top to
      // the ledge.
      {
        cols: 4,
        from: { col: 52, row: 32 },
        pause: 0,
        phase: 0.8125,
        rows: 1,
        speed: 3,
        to: { col: 52, row: 20 },
      },
      // Horizontal to horizontal, opposite directions, fastest: the second, 4 higher and 2
      // across, pauses at its near end as the first pauses at its far end, then carries her to
      // the exit ledge. Their round trip is 5 s.
      {
        cols: 6,
        from: { col: 72, row: 16 },
        pause: 0.5,
        phase: 0.4,
        rows: 1,
        speed: 8,
        to: { col: 88, row: 16 },
      },
      {
        cols: 6,
        from: { col: 96, row: 12 },
        pause: 0.5,
        phase: 0.9,
        rows: 1,
        speed: 8,
        to: { col: 112, row: 12 },
      },
    ],
    movingHazards: [],
    rows: 60,
    solids: [
      { col: 0, cols: 12, row: 56, rows: 4 },
      { col: 58, cols: 12, row: 16, rows: 44 },
      { col: 120, cols: 20, row: 12, rows: 48 },
    ],
    start: { col: 3, row: 56 },
  },
];
