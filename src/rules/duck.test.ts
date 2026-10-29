import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { Rect } from "../data/types";
import { type DuckInput, type DuckState, startDuck, stepDuck } from "./duck";

const STEP = 1 / 60;
const GROUND: Rect = { height: 40, width: 2000, x: -1000, y: 300 };
const IDLE: DuckInput = { jumpHeld: false, move: 0 };

// Steps her from a standing start on GROUND, with input(step) each step; returns every state.
function run(steps: number, input: (step: number) => DuckInput, solids = [GROUND]): DuckState[] {
  let duck = stepDuck(DUCK, solids, STEP, IDLE, startDuck(DUCK, { x: 0, y: GROUND.y }));
  const states = [duck];
  for (let step = 0; step < steps; step++) {
    duck = stepDuck(DUCK, solids, STEP, input(step), duck);
    states.push(duck);
  }
  return states;
}

const last = (states: DuckState[]) => states[states.length - 1] as DuckState;
const lowestY = (states: DuckState[]) => Math.min(...states.map((state) => state.y));
const startY = GROUND.y - DUCK.height;

describe("stepDuck", () => {
  it("stands on the ground", () => {
    const states = run(120, () => IDLE);
    expect(states.every((state) => state.grounded && state.y === startY)).toBe(true);
  });

  it.each([1, -1] as const)("walks toward %i at walk speed", (move) => {
    const states = run(60, () => ({ jumpHeld: false, move }));
    expect(last(states).vx).toBe(move * DUCK.walkSpeed);
    expect(last(states).facing).toBe(move);
  });

  it("rises to the height the jump speed and gravity give, within a step", () => {
    const states = run(120, () => ({ jumpHeld: true, move: 0 }));
    const apex = DUCK.jumpSpeed ** 2 / (2 * DUCK.gravity);
    expect(startY - lowestY(states)).toBeCloseTo(apex, -1);
  });

  it("never falls faster than the flutter after a jump", () => {
    const states = run(240, (step) => ({ jumpHeld: step < 2, move: 0 }));
    const falling = states.filter((state) => state.vy > 0 && !state.grounded);
    expect(falling.length).toBeGreaterThan(0);
    expect(Math.max(...falling.map((state) => state.vy))).toBe(DUCK.flutterFallSpeed);
  });

  it("falls faster than the flutter after walking off a ledge", () => {
    const ledge: Rect = { height: 40, width: 40, x: -20, y: 300 };
    const states = run(120, () => ({ jumpHeld: false, move: 1 }), [ledge]);
    expect(Math.max(...states.map((state) => state.vy))).toBeGreaterThan(DUCK.flutterFallSpeed);
  });

  it("hops lower when Jump is released early", () => {
    const held = run(120, () => ({ jumpHeld: true, move: 0 }));
    const tapped = run(120, (step) => ({ jumpHeld: step < 4, move: 0 }));
    expect(lowestY(tapped)).toBeGreaterThan(lowestY(held));
  });

  it("lands and stops fluttering", () => {
    const states = run(600, (step) => ({ jumpHeld: step < 2, move: 0 }));
    expect(last(states)).toMatchObject({ fluttering: false, grounded: true, y: startY });
  });

  it.each([
    [
      1,
      { height: 100, width: 20, x: 40, y: 200 },
      (x: number, wall: Rect) => x + DUCK.width <= wall.x,
    ],
    [
      -1,
      { height: 100, width: 20, x: -60, y: 200 },
      (x: number, wall: Rect) => x >= wall.x + wall.width,
    ],
  ] as const)("stops at a wall moving %i", (move, wall, clear) => {
    const states = run(120, () => ({ jumpHeld: false, move }), [GROUND, wall]);
    expect(states.every((state) => clear(state.x, wall))).toBe(true);
    expect(last(states).vx).toBe(0);
  });

  it("stops rising at a ceiling", () => {
    const ceiling: Rect = { height: 10, width: 200, x: -100, y: startY - 30 };
    const states = run(60, () => ({ jumpHeld: true, move: 0 }), [GROUND, ceiling]);
    expect(lowestY(states)).toBe(ceiling.y + ceiling.height);
  });
});
