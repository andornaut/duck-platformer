import type { FloorPlan } from "./types";

// PLACEHOLDER: a test floor for movement, until gameplay designs the real floors. Ground with
// a gap, steps up, a hazard strip and the exit at the right end.
export const TEST_FLOOR: FloorPlan = {
  cols: 130,
  exit: { col: 124, cols: 2, row: 26, rows: 5 },
  hazards: [{ col: 76, cols: 6, row: 30, rows: 1 }],
  rows: 36,
  solids: [
    { col: 0, cols: 40, row: 31, rows: 5 },
    { col: 48, cols: 36, row: 31, rows: 5 },
    { col: 56, cols: 10, row: 25, rows: 2 },
    { col: 68, cols: 10, row: 19, rows: 2 },
    { col: 90, cols: 40, row: 31, rows: 5 },
  ],
  start: { col: 5, row: 31 },
};
