import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { LevelLayout, MoverLayout } from "../data/types";
import type { DuckInput } from "./duck";
import { type LevelState, standsOn, startLevel, stepLevel } from "./level";
import { moverRect } from "./movers";
import { STEP_SECONDS } from "./step";

const STEP = STEP_SECONDS;
const GROUND = { height: 40, width: 200, x: 0, y: 300 };
const LEVEL: LevelLayout = {
  exit: { height: 40, width: 20, x: 1000, y: 260 },
  hazards: [],
  height: 360,
  ledges: [],
  movers: [],
  movingHazards: [],
  solids: [GROUND],
  start: { x: 100, y: GROUND.y },
  width: 1100,
};
const RIGHT: DuckInput = { jumpHeld: false, move: 1 };

function run(
  layout: LevelLayout,
  steps: number,
  input: DuckInput | ((step: number) => DuckInput),
): LevelState[] {
  let level = startLevel(DUCK, layout);
  const states = [level];
  for (let step = 0; step < steps; step++) {
    level = stepLevel(DUCK, layout, STEP, typeof input === "function" ? input(step) : input, level);
    states.push(level);
  }
  return states;
}

describe("stepLevel", () => {
  it.each([
    ["falling below the level", LEVEL],
    [
      "touching a hazard",
      { ...LEVEL, hazards: [{ height: 8, width: 20, x: 150, y: GROUND.y - 8 }] },
    ],
  ])("restarts at the start after %s", (_name, layout) => {
    const states = run(layout, 300, RIGHT);
    const restart = states.findIndex((state) => state.restarts === 1);
    expect(restart).toBeGreaterThan(0);
    expect(states[restart]?.duck).toEqual(startLevel(DUCK, layout).duck);
  });

  it("clears at the exit and then holds", () => {
    const layout = { ...LEVEL, solids: [{ ...GROUND, width: 1100 }] };
    const states = run(layout, 600, RIGHT);
    const cleared = states.findIndex((state) => state.cleared);
    expect(cleared).toBeGreaterThan(0);
    expect(states.slice(cleared).every((state) => state === states[cleared])).toBe(true);
    expect(states[cleared]?.restarts).toBe(0);
  });
});

// A wide floor to stand on, and a platform standing still just above it to the right.
const WIDE = { ...LEVEL, solids: [{ ...GROUND, width: 1100 }] };
const STILL = { jumpHeld: false, move: 0 } as const;
const PLATFORM: MoverLayout = {
  from: { x: 60, y: GROUND.y - 24 },
  height: 12,
  pause: 0,
  phase: 0,
  speed: 0,
  to: { x: 60, y: GROUND.y - 24 },
  width: 96,
};
const bottomOf = (state: LevelState | undefined) => (state?.duck.y ?? 0) + DUCK.height;

describe("ledges", () => {
  const ledge = { height: 12, width: 200, x: 0, y: GROUND.y - 60 };
  it.each([
    ["jumps up through from below and lands on top", true, ledge.y],
    ["stands on the ground while never jumping", false, GROUND.y],
  ])("she %s", (_, jumps, top) => {
    const layout = { ...WIDE, ledges: [ledge] };
    const states = run(layout, 240, (step) => ({ jumpHeld: jumps && step < 30, move: 0 }));
    expect(bottomOf(states.at(-1))).toBe(top);
  });
});

describe("moving platforms", () => {
  // She starts on a platform 2 tiles' worth above the floor, so the first steps settle her on it.
  const onPlatform = (mover: MoverLayout): LevelLayout => ({
    ...WIDE,
    movers: [mover],
    start: { x: mover.from.x + mover.width / 2, y: mover.from.y },
  });
  const sideways = { ...PLATFORM, speed: 30, to: { x: 300, y: PLATFORM.from.y } };
  const upward = { ...PLATFORM, speed: 30, to: { x: PLATFORM.from.x, y: PLATFORM.from.y - 60 } };

  it.each([
    ["sideways", sideways],
    ["upward", upward],
  ])("carries her %s while she stands on it", (_, mover) => {
    const layout = onPlatform(mover);
    const states = run(layout, 90, STILL);
    const last = states.at(-1);
    expect(last && standsOn(DUCK, last.duck, moverRect(mover, last.seconds))).toBe(true);
  });

  it("keeps its speed along x when she jumps off, until she lands", () => {
    const layout = onPlatform(sideways);
    const states = run(layout, 200, (step) => ({ jumpHeld: step >= 30 && step < 34, move: 0 }));
    const airborne = states.filter((state) => !state.duck.grounded && state.steps > 30);
    expect(airborne.length).toBeGreaterThan(0);
    for (const state of airborne) {
      expect(state.duck.carryVx).toBeCloseTo(sideways.speed, 9);
    }
    expect(states.at(-1)?.duck.carryVx).toBe(0);
  });

  it("replays the same timing after a restart", () => {
    const faraway = { ...sideways, from: { x: 800, y: 100 }, to: { x: 900, y: 100 } };
    const layout = { ...LEVEL, movers: [faraway] };
    const states = run(layout, 300, RIGHT);
    const restart = states.findIndex((state) => state.restarts === 1);
    expect(restart).toBeGreaterThan(0);
    expect(states[restart]?.seconds).toBe(0);
  });
});

describe("moving hazards", () => {
  // A 12 px block rolling along the ground toward where she stands still, and back.
  const rolling: MoverLayout = {
    from: { x: 400, y: GROUND.y - 12 },
    height: 12,
    pause: 0,
    phase: 0,
    speed: 120,
    to: { x: 0, y: GROUND.y - 12 },
    width: 24,
  };
  it.each([
    ["restarts the level when one reaches her", rolling, 1],
    [
      "leaves her be when one turns back short of her",
      { ...rolling, to: { x: 200, y: GROUND.y - 12 } },
      0,
    ],
    [
      "passes over her head without touching",
      { ...rolling, from: { x: 400, y: 100 }, to: { x: 0, y: 100 } },
      0,
    ],
  ])("%s", (_, hazard, restarts) => {
    const states = run({ ...WIDE, movingHazards: [hazard] }, Math.round(3 / STEP), STILL);
    expect(states.at(-1)?.restarts).toBe(restarts);
  });

  it("never blocks her", () => {
    const states = run({ ...WIDE, movingHazards: [{ ...rolling, speed: 0 }] }, 300, RIGHT);
    expect(states.some((state) => state.restarts > 0)).toBe(true);
  });
});
