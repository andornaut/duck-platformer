import type { FloorPlan } from "./types";

// PLACEHOLDER: a test floor for movement, until gameplay designs the real floors. Ground with
// a gap, steps up, a hazard strip and the exit at the right end.
export const TEST_FLOOR: FloorPlan = {
  cols: 109,
  exit: { col: 103, cols: 2, row: 22, rows: 4 },
  hazards: [{ col: 63, cols: 5, row: 25, rows: 1 }],
  rows: 30,
  solids: [
    { col: 0, cols: 34, row: 26, rows: 4 },
    { col: 40, cols: 30, row: 26, rows: 4 },
    { col: 47, cols: 8, row: 21, rows: 2 },
    { col: 57, cols: 8, row: 16, rows: 2 },
    { col: 75, cols: 34, row: 26, rows: 4 },
  ],
  start: { col: 4, row: 26 },
};
