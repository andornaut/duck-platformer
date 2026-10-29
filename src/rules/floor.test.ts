import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { FloorLayout } from "../data/types";
import type { DuckInput } from "./duck";
import { type FloorState, startFloor, stepFloor } from "./floor";

const STEP = 1 / 60;
const GROUND = { height: 40, width: 200, x: 0, y: 300 };
const FLOOR: FloorLayout = {
  exit: { height: 40, width: 20, x: 1000, y: 260 },
  hazards: [],
  height: 360,
  solids: [GROUND],
  start: { x: 100, y: GROUND.y },
  width: 1100,
};
const RIGHT: DuckInput = { jumpHeld: false, move: 1 };

function run(layout: FloorLayout, steps: number, input: DuckInput): FloorState[] {
  let floor = startFloor(DUCK, layout);
  const states = [floor];
  for (let step = 0; step < steps; step++) {
    floor = stepFloor(DUCK, layout, STEP, input, floor);
    states.push(floor);
  }
  return states;
}

describe("stepFloor", () => {
  it.each([
    ["falling below the floor", FLOOR],
    [
      "touching a hazard",
      { ...FLOOR, hazards: [{ height: 8, width: 20, x: 150, y: GROUND.y - 8 }] },
    ],
  ])("restarts at the start after %s", (_name, layout) => {
    const states = run(layout, 300, RIGHT);
    const restart = states.findIndex((state) => state.restarts === 1);
    expect(restart).toBeGreaterThan(0);
    expect(states[restart]?.duck).toEqual(startFloor(DUCK, layout).duck);
  });

  it("clears at the exit and then holds", () => {
    const layout = { ...FLOOR, solids: [{ ...GROUND, width: 1100 }] };
    const states = run(layout, 600, RIGHT);
    const cleared = states.findIndex((state) => state.cleared);
    expect(cleared).toBeGreaterThan(0);
    expect(states.slice(cleared).every((state) => state === states[cleared])).toBe(true);
    expect(states[cleared]?.restarts).toBe(0);
  });
});
