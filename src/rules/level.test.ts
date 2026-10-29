import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { AreaLayout, LevelLayout, Motion, ObjectLayout, Point } from "../data/types";
import { startDuck } from "./duck";
import {
  enterArea,
  type LevelInput,
  type LevelState,
  objectStep,
  standsOn,
  startLevel,
  stepLevel,
} from "./level";
import { STEP_SECONDS } from "./step";

const STEP = STEP_SECONDS;
const SEED = 42;
const GROUND = { height: 40, width: 1100, x: 0, y: 300 };
const STILL: LevelInput = { jumpHeld: false, move: 0, useHeld: false };
const RIGHT: LevelInput = { ...STILL, move: 1 };
const STATIC: Motion = {
  algorithm: "static",
  direction: "right",
  distance: 0,
  hopHeight: 0,
  pause: 0,
  speed: 0,
  variance: 0,
};

function object(fields: Partial<ObjectLayout> & { origin: Point }): ObjectLayout {
  return {
    art: "block",
    collision: "solid",
    height: 12,
    hitbox: undefined,
    motion: STATIC,
    phase: 0,
    reaction: { kind: "none", range: 0, speed: 0 },
    to: undefined,
    width: 48,
    ...fields,
  };
}

function area(objects: readonly ObjectLayout[], fields: Partial<AreaLayout> = {}): AreaLayout {
  return {
    entries: { start: { x: 100, y: GROUND.y } },
    height: 360,
    objects,
    solids: [GROUND],
    terrain: [],
    tileset: undefined,
    width: 1100,
    ...fields,
  };
}

const level = (main: AreaLayout, others: Record<string, AreaLayout> = {}): LevelLayout => ({
  areas: { main, ...others },
  start: { area: "main", entry: "start" },
});

function run(
  layout: LevelLayout,
  seconds: number,
  input: LevelInput | ((step: number) => LevelInput),
): LevelState[] {
  let state = startLevel(DUCK, layout, SEED);
  const states = [state];
  for (let step = 0; step < Math.round(seconds / STEP); step++) {
    state = stepLevel(DUCK, layout, STEP, typeof input === "function" ? input(step) : input, state);
    states.push(state);
  }
  return states;
}

const bottomOf = (state: LevelState | undefined) => (state?.duck.y ?? 0) + DUCK.height;

describe("restarts", () => {
  const narrow = area([], { solids: [{ ...GROUND, width: 200 }] });
  const hazard = object({
    collision: "hazard",
    height: 8,
    origin: { x: 150, y: GROUND.y - 8 },
    width: 20,
  });
  it.each([
    ["falling out of the area", level(narrow)],
    ["touching a hazard", level(area([hazard]))],
  ])("after %s, puts her back at the start for the next attempt", (_, layout) => {
    const states = run(layout, 3, RIGHT);
    const restart = states.find((state) => state.restarts === 1);
    expect(restart?.duck).toEqual(startDuck(DUCK, { x: 100, y: GROUND.y }));
    expect([restart?.attempt, restart?.seconds]).toEqual([1, 0]);
  });

  // A hazard drawn 48 wide whose art touches only its middle 8, from x 150 to 158.
  const boxed = object({
    collision: "hazard",
    height: 24,
    hitbox: { height: 24, width: 8, x: 20, y: 0 },
    origin: { x: 130, y: GROUND.y - 24 },
  });
  it.each([
    ["its rectangle but not its hit box", 128, false],
    ["its hit box", 154, true],
  ])("standing in %s restarts the level: %s", (_, x, restarts) => {
    const layout = level(area([boxed], { entries: { start: { x, y: GROUND.y } } }));
    expect(run(layout, 0.1, STILL).some((state) => state.restarts > 0)).toBe(restarts);
  });
});

describe("ledges", () => {
  const ledge = object({ collision: "ledge", origin: { x: 0, y: GROUND.y - 60 }, width: 200 });
  it.each([
    ["jumps up through from below and lands on top", true, ledge.origin.y],
    ["stands on the ground while never jumping", false, GROUND.y],
  ])("she %s", (_, jumps, top) => {
    const states = run(level(area([ledge])), 2, (step) => ({
      ...STILL,
      jumpHeld: jumps && step < 30,
    }));
    expect(bottomOf(states.at(-1))).toBe(top);
  });
});

describe("moving platforms", () => {
  const platform = (direction: Motion["direction"]) =>
    object({
      motion: { ...STATIC, algorithm: "linear", direction, distance: 200, speed: 30 },
      origin: { x: 60, y: GROUND.y - 24 },
      width: 96,
    });
  const onPlatform = (mover: ObjectLayout) =>
    level(
      area([mover], {
        entries: { start: { x: mover.origin.x + mover.width / 2, y: mover.origin.y } },
      }),
    );

  it.each(["right", "up"] as const)("carries her %s while she stands on it", (direction) => {
    const states = run(onPlatform(platform(direction)), 1.5, STILL);
    const last = states.at(-1);
    const at = last?.objects[0];
    expect(last && at && standsOn(DUCK, last.duck, { ...at, height: 12, width: 96 })).toBe(true);
  });

  it("keeps its speed along x when she jumps off, until she lands", () => {
    const states = run(onPlatform(platform("right")), 3, (step) => ({
      ...STILL,
      jumpHeld: step >= 60 && step < 64,
    }));
    const airborne = states.filter((state) => !state.duck.grounded && state.steps > 60);
    expect(airborne.length).toBeGreaterThan(0);
    for (const state of airborne) {
      expect(state.duck.carryVx).toBeCloseTo(30, 9);
    }
    expect(states.at(-1)?.duck.carryVx).toBe(0);
  });
});

describe("use zones", () => {
  const exit = object({
    collision: "use",
    height: 48,
    origin: { x: 80, y: GROUND.y - 48 },
    width: 24,
  });
  const door = { ...exit, to: { area: "hall", entry: "in" } };
  const hall = area([], { entries: { in: { x: 500, y: GROUND.y } } });
  const press = (step: number) => ({ ...STILL, useHeld: step >= 10 });

  it.each([
    ["Use at the exit clears the level", level(area([exit])), press, true],
    [
      "Use away from the exit does nothing",
      level(area([{ ...exit, origin: { x: 400, y: 252 } }])),
      press,
      false,
    ],
    [
      "Use held since before she arrived does nothing",
      level(area([exit])),
      () => ({ ...STILL, useHeld: true }),
      false,
    ],
  ])("%s", (_, layout, input, cleared) => {
    expect(run(layout, 0.5, input).at(-1)?.cleared).toBe(cleared);
  });

  it("Use at a door holds the level still at the door until enterArea takes her through", () => {
    const layout = level(area([door]), { hall });
    const states = run(layout, 0.5, press);
    const at = states.findIndex((state) => state.using !== undefined);
    expect(states.at(-1)?.using).toEqual(door.to);
    expect(states.at(-1)).toBe(states[at]);
    const through = enterArea(DUCK, layout, door.to, states.at(-1) as LevelState);
    expect([through.area, through.duck, through.using]).toEqual([
      "hall",
      startDuck(DUCK, { x: 500, y: GROUND.y }),
      undefined,
    ]);
  });
});

describe("objectStep", () => {
  const duck = startDuck(DUCK, { x: 100, y: GROUND.y });
  // A 24 px block whose path is at x 150 on the ground, 50 px right of her centre.
  const at = { x: 138, y: GROUND.y - 24 };
  const critter = (kind: "approach" | "avoid" | "none", range: number) =>
    object({ height: 24, origin: at, reaction: { kind, range, speed: 120 }, width: 24 });
  it.each([
    [
      "without a reaction, follows its path",
      critter("none", 0),
      { x: 200, y: at.y },
      { x: 200, y: at.y },
    ],
    ["avoiding her in range, moves away", critter("avoid", 80), at, { x: at.x + 1, y: at.y }],
    [
      "approaching her in range, moves toward her",
      critter("approach", 80),
      at,
      { x: at.x - 1, y: at.y },
    ],
    [
      "out of range, heads back to its path",
      critter("avoid", 20),
      { x: 160, y: at.y },
      { x: at.x + 1, y: at.y },
    ],
    [
      "out of range and near its path, rejoins it",
      critter("avoid", 20),
      { x: at.x + 0.5, y: at.y },
      { x: at.x + 0.5, y: at.y },
    ],
  ])("%s", (_, critterLayout, path, next) => {
    const moved = objectStep(DUCK, critterLayout, 1 / 120, path, duck, at);
    expect(moved.x).toBeCloseTo(next.x, 9);
    expect(moved.y).toBeCloseTo(next.y, 9);
  });
});

describe("random motion", () => {
  const cart = object({
    collision: "none",
    motion: {
      ...STATIC,
      algorithm: "wander",
      distance: 400,
      pause: 0.2,
      speed: 100,
      variance: 0.5,
    },
    origin: { x: 300, y: 200 },
  });
  const layout = level(area([cart]));
  const pathOf = (attempt: number, seed = SEED) => {
    let state = enterArea(DUCK, layout, layout.start, {
      attempt,
      restarts: attempt,
      seed,
      steps: 0,
    });
    const xs: number[] = [];
    for (let step = 0; step < 600; step++) {
      state = stepLevel(DUCK, layout, STEP, STILL, state);
      xs.push(state.objects[0]?.x ?? 0);
    }
    return xs;
  };
  it.each([
    ["the same seed and attempt", 0, SEED, true],
    ["the next attempt", 1, SEED, false],
    ["another seed", 0, SEED + 100, false],
  ])("on %s, repeats the first attempt's path: %s", (_, attempt, seed, same) => {
    expect(JSON.stringify(pathOf(attempt, seed)) === JSON.stringify(pathOf(0))).toBe(same);
  });
});
