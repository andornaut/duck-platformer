import type { LevelPlan } from "./types";

// PLACEHOLDER: test levels for movement, until gameplay designs the real ones. Played in order;
// clearing the last starts the first again.
export const TEST_LEVELS: readonly LevelPlan[] = [
  // Ground with a block rolling back and forth on it, a gap, steps up to a one-way ledge, a hazard
  // strip, a platform riding up and down beside the steps, a platform across the second gap, and
  // the exit at the right end.
  {
    cols: 109,
    exit: { col: 103, cols: 2, row: 52, rows: 4 },
    hazards: [{ col: 63, cols: 5, row: 55, rows: 1 }],
    ledges: [{ col: 56, cols: 10, row: 40, rows: 1 }],
    movers: [
      {
        cols: 4,
        from: { col: 69, row: 52 },
        pause: 1,
        phase: 0,
        rows: 1,
        speed: 3,
        to: { col: 69, row: 38 },
      },
      {
        cols: 4,
        from: { col: 70, row: 56 },
        pause: 0.5,
        phase: 0.25,
        rows: 1,
        speed: 2,
        to: { col: 71, row: 56 },
      },
    ],
    movingHazards: [
      {
        cols: 2,
        from: { col: 12, row: 55 },
        pause: 0,
        phase: 0,
        rows: 1,
        speed: 6,
        to: { col: 30, row: 55 },
      },
    ],
    rows: 60,
    solids: [
      { col: 0, cols: 34, row: 56, rows: 4 },
      { col: 40, cols: 30, row: 56, rows: 4 },
      { col: 47, cols: 8, row: 51, rows: 2 },
      { col: 57, cols: 8, row: 46, rows: 2 },
      { col: 75, cols: 34, row: 56, rows: 4 },
    ],
    start: { col: 4, row: 56 },
  },
  // A wide gap crossed on a moving platform level with the ground, one-way ledges overhead, and
  // the exit at the right end.
  {
    cols: 90,
    exit: { col: 86, cols: 2, row: 52, rows: 4 },
    hazards: [{ col: 21, cols: 37, row: 59, rows: 1 }],
    ledges: [
      { col: 64, cols: 8, row: 50, rows: 1 },
      { col: 74, cols: 8, row: 44, rows: 1 },
      { col: 82, cols: 8, row: 44, rows: 1 },
    ],
    movers: [
      {
        cols: 6,
        from: { col: 21, row: 56 },
        pause: 1,
        phase: 0,
        rows: 1,
        speed: 4,
        to: { col: 52, row: 56 },
      },
    ],
    movingHazards: [],
    rows: 60,
    solids: [
      { col: 0, cols: 21, row: 56, rows: 4 },
      { col: 58, cols: 32, row: 56, rows: 4 },
    ],
    start: { col: 18, row: 56 },
  },
];
