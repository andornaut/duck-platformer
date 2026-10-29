import type { FloorLayout } from "./types";

// PLACEHOLDER: a test floor for movement, until gameplay designs the real floors. Ground with
// a gap, steps up, a hazard strip and the exit at the right end.
export const TEST_FLOOR: FloorLayout = {
  exit: { height: 48, width: 24, x: 1240, y: 264 },
  hazards: [{ height: 8, width: 64, x: 760, y: 304 }],
  height: 360,
  solids: [
    { height: 48, width: 400, x: 0, y: 312 },
    { height: 48, width: 360, x: 480, y: 312 },
    { height: 16, width: 96, x: 560, y: 248 },
    { height: 16, width: 96, x: 680, y: 192 },
    { height: 48, width: 400, x: 900, y: 312 },
  ],
  start: { x: 48, y: 312 },
  width: 1300,
};
