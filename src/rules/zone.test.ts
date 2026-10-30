import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { AreaLayout, Motion, ObjectLayout, Point, ZoneLayout } from "../data/types";
import { startDuck } from "./duck";
import { STEP_SECONDS } from "./step";
import {
  enterArea,
  leaveRoom,
  objectStep,
  standsOn,
  startZone,
  stepZone,
  type ZoneInput,
  type ZoneState,
} from "./zone";

const STEP = STEP_SECONDS;
const SEED = 42;
const GROUND = { height: 40, width: 1100, x: 0, y: 300 };
const STILL: ZoneInput = { jumpHeld: false, move: 0, useHeld: false };
const RIGHT: ZoneInput = { ...STILL, move: 1 };
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
    animations: { idle: undefined, move: undefined, react: undefined, talk: undefined },
    art: "block",
    character: "block",
    collision: "solid",
    height: 12,
    hitbox: undefined,
    interaction: { kind: "none", range: 0 },
    lines: [],
    motion: STATIC,
    phase: 0,
    quips: [],
    quirks: [],
    reaction: { kind: "none", range: 0, speed: 0 },
    room: undefined,
    scene: undefined,
    width: 48,
    ...fields,
  };
}

function area(objects: readonly ObjectLayout[], fields: Partial<AreaLayout> = {}): AreaLayout {
  return {
    chunks: [],
    entries: { start: { x: 100, y: GROUND.y } },
    exitX: GROUND.width - 12,
    height: 360,
    objects,
    solids: [GROUND],
    terrain: [],
    tileset: undefined,
    width: 1100,
    ...fields,
  };
}

const zone = (main: AreaLayout, others: Record<string, AreaLayout> = {}): ZoneLayout => ({
  areas: { main, ...others },
  start: { area: "main", entry: "start" },
});

function run(
  layout: ZoneLayout,
  seconds: number,
  input: ZoneInput | ((step: number) => ZoneInput),
): ZoneState[] {
  let state = startZone(DUCK, layout, SEED);
  const states = [state];
  for (let step = 0; step < Math.round(seconds / STEP); step++) {
    state = stepZone(DUCK, layout, STEP, typeof input === "function" ? input(step) : input, state);
    states.push(state);
  }
  return states;
}

const bottomOf = (state: ZoneState | undefined) => (state?.duck.y ?? 0) + DUCK.height;

describe("restarts", () => {
  const narrow = area([], { solids: [{ ...GROUND, width: 200 }] });
  const hazard = object({
    collision: "hazard",
    height: 8,
    origin: { x: 150, y: GROUND.y - 8 },
    width: 20,
  });
  it.each([
    ["falling out of the area", zone(narrow)],
    ["touching a hazard", zone(area([hazard]))],
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
  ])("standing in %s restarts the zone: %s", (_, x, restarts) => {
    const layout = zone(area([boxed], { entries: { start: { x, y: GROUND.y } } }));
    expect(run(layout, 0.1, STILL).some((state) => state.restarts > 0)).toBe(restarts);
  });
});

describe("ledges", () => {
  const ledge = object({ collision: "ledge", origin: { x: 0, y: GROUND.y - 60 }, width: 200 });
  it.each([
    ["jumps up through from below and lands on top", true, ledge.origin.y],
    ["stands on the ground while never jumping", false, GROUND.y],
  ])("she %s", (_, jumps, top) => {
    const states = run(zone(area([ledge])), 2, (step) => ({
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
    zone(
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

describe("pushes", () => {
  // A block 48 wide on the ground, level with her side; she starts at x 100 (her box 88 to 112).
  const block = (x: number, direction?: Motion["direction"]) =>
    object({
      height: 24,
      motion: direction
        ? { ...STATIC, algorithm: "linear", direction, distance: 200, speed: 60 }
        : STATIC,
      origin: { x, y: GROUND.y - 24 },
    });
  const wall = { height: 100, width: 40, x: 20, y: GROUND.y - 100 };
  const leftEdge = (state: ZoneState) => state.objects[0]?.x ?? 0;
  const rightEdge = (state: ZoneState) => leftEdge(state) + 48;

  it.each([
    [
      "standing still, hit from the left by a block moving right, ahead of it",
      block(20, "right"),
      STILL,
      (state: ZoneState) => state.duck.x - rightEdge(state),
    ],
    [
      "standing still, hit from the right by a block moving left, ahead of it",
      block(140, "left"),
      STILL,
      (state: ZoneState) => state.duck.x + DUCK.width - leftEdge(state),
    ],
    [
      "running right into a still block, stopped at its side",
      block(140),
      RIGHT,
      (state: ZoneState) => state.duck.x + DUCK.width - leftEdge(state),
    ],
    [
      "running right into a block moving left toward her, at its side",
      block(200, "left"),
      RIGHT,
      (state: ZoneState) => state.duck.x + DUCK.width - leftEdge(state),
    ],
  ])("ends %s", (_, mover, input, gap) => {
    const states = run(zone(area([mover])), 1.5, input);
    expect(states.every((state) => state.restarts === 0)).toBe(true);
    expect(gap(states.at(-1) as ZoneState)).toBeCloseTo(0, 9);
  });

  it("restarts the zone when a block pushes her into a wall", () => {
    const layout = zone(area([block(140, "left")], { solids: [GROUND, wall] }));
    expect(run(layout, 3, STILL).some((state) => state.restarts > 0)).toBe(true);
  });
});

describe("clearing", () => {
  // Her box's right edge at x, standing on the ground.
  const at = (x: number) => {
    const start = startZone(DUCK, zone(area([])), SEED);
    return { ...start, duck: { ...start.duck, x: x - DUCK.width } };
  };
  const exitX = GROUND.width - 12;
  it.each([
    ["her box reaching past the last column's left edge", exitX + 1, true],
    ["her box ending at the last column's left edge", exitX, false],
  ])("standing still with %s: cleared %s", (_, right, cleared) => {
    const layout = zone(area([]));
    expect(stepZone(DUCK, layout, STEP, STILL, at(right)).cleared).toBe(cleared);
  });

  it("clears at any height, in the air above the last column", () => {
    const layout = zone(area([]));
    const high = at(exitX + 1);
    const state = { ...high, duck: { ...high.duck, grounded: false, y: 20 } };
    expect(stepZone(DUCK, layout, STEP, STILL, state).cleared).toBe(true);
  });

  it("runs right to the edge, clears, and then holds still", () => {
    const states = run(zone(area([])), 6, RIGHT);
    const first = states.findIndex((state) => state.cleared);
    expect(first).toBeGreaterThan(0);
    expect(states.at(-1)).toBe(states[first]);
  });
});

describe("doors", () => {
  const door = object({
    collision: "use",
    height: 48,
    origin: { x: 80, y: GROUND.y - 48 },
    room: "parlour",
    width: 24,
  });
  const press = (step: number) => ({ ...STILL, useHeld: step >= 10 });

  it.each([
    ["Use at a door opens its room", [door], press, "parlour"],
    [
      "Use away from every door does nothing",
      [{ ...door, origin: { x: 400, y: 252 } }],
      press,
      undefined,
    ],
    [
      "Use held since before she arrived does nothing",
      [door],
      () => ({ ...STILL, useHeld: true }),
      undefined,
    ],
  ])("%s", (_, objects, input, room) => {
    expect(run(zone(area(objects)), 0.5, input).at(-1)?.room).toBe(room);
  });

  it("holds the zone still while the room shows", () => {
    const states = run(zone(area([door])), 0.5, press);
    const opened = states.findIndex((state) => state.room !== undefined);
    expect(states.at(-1)).toBe(states[opened]);
  });

  it("leaves the room with her where she was, and steps on from there", () => {
    const layout = zone(area([door]));
    const inside = run(layout, 0.5, press).at(-1) as ZoneState;
    const back = leaveRoom(inside);
    expect([back.room, back.duck, back.objects, back.seconds]).toEqual([
      undefined,
      inside.duck,
      inside.objects,
      inside.seconds,
    ]);
    const next = stepZone(DUCK, layout, STEP, { ...STILL, useHeld: true }, back);
    expect([next.room, next.seconds]).toEqual([undefined, inside.seconds + STEP]);
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
  const layout = zone(area([cart]));
  const pathOf = (attempt: number, seed = SEED) => {
    let state = enterArea(DUCK, layout, layout.start, {
      attempt,
      restarts: attempt,
      seed,
      steps: 0,
    });
    const xs: number[] = [];
    for (let step = 0; step < 600; step++) {
      state = stepZone(DUCK, layout, STEP, STILL, state);
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
