import { describe, expect, it } from "vitest";

import type { MoverLayout } from "../data/types";
import { moverAt } from "./movers";

// 100 px right at 50 px/s: 2 s each way, with 1 s pauses, a 6 s round trip.
const MOVER: MoverLayout = {
  from: { x: 0, y: 40 },
  height: 12,
  pause: 1,
  phase: 0,
  speed: 50,
  to: { x: 100, y: 40 },
  width: 48,
};

describe("moverAt", () => {
  it.each([
    ["at from, setting off", MOVER, 0, { x: 0, y: 40 }],
    ["halfway out", MOVER, 1, { x: 50, y: 40 }],
    ["arriving at to", MOVER, 2, { x: 100, y: 40 }],
    ["pausing at to", MOVER, 2.5, { x: 100, y: 40 }],
    ["halfway back", MOVER, 4, { x: 50, y: 40 }],
    ["pausing at from", MOVER, 5.5, { x: 0, y: 40 }],
    ["a round trip later", MOVER, 7, { x: 50, y: 40 }],
    ["at phase 0.5, at to heading back", { ...MOVER, phase: 0.5 }, 0, { x: 100, y: 40 }],
    ["at phase 0.5, a second on", { ...MOVER, phase: 0.5 }, 1, { x: 50, y: 40 }],
    ["with no pause", { ...MOVER, pause: 0 }, 3, { x: 50, y: 40 }],
    ["moving up", { ...MOVER, to: { x: 0, y: -60 } }, 1, { x: 0, y: -10 }],
    ["with nowhere to go", { ...MOVER, to: MOVER.from }, 3, { x: 0, y: 40 }],
    ["with no speed", { ...MOVER, speed: 0 }, 3, { x: 0, y: 40 }],
  ])("is %s", (_, mover, seconds, at) => {
    const point = moverAt(mover, seconds);
    expect(point.x).toBeCloseTo(at.x, 9);
    expect(point.y).toBeCloseTo(at.y, 9);
  });
});
