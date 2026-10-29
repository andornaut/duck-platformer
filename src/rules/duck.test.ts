import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { Rect } from "../data/types";
import { type DuckInput, type DuckState, startDuck, stepDuck } from "./duck";
import { STEP_SECONDS } from "./step";

const STEP = STEP_SECONDS;
const GROUND: Rect = { height: 40, width: 2000, x: -1000, y: 300 };
const IDLE: DuckInput = { jumpHeld: false, move: 0 };

// Steps her from a standing start on GROUND, with input(step) each step; returns every state.
function run(
  steps: number,
  input: (step: number) => DuckInput,
  solids = [GROUND],
  tuning = DUCK,
): DuckState[] {
  let duck = stepDuck(tuning, solids, [], STEP, IDLE, startDuck(tuning, { x: 0, y: GROUND.y }));
  const states = [duck];
  for (let step = 0; step < steps; step++) {
    duck = stepDuck(tuning, solids, [], STEP, input(step), duck);
    states.push(duck);
  }
  return states;
}

// A short jump from the ground, and optionally a second press on pressStep.
function hop(pressStep?: number): DuckState[] {
  return run(600, (step) => ({ jumpHeld: step < 2 || step === pressStep, move: 0 }));
}

// Walking right off a narrow ledge, and optionally a jump press on jumpStep.
const LEDGE: Rect = { height: 40, width: 40, x: -20, y: 300 };
function walkOff(jumpStep?: number): DuckState[] {
  return run(120, (step) => ({ jumpHeld: step === jumpStep, move: 1 }), [LEDGE]);
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

  // Jump held for a press's seconds from a standing start: how high she rises.
  const rise = (tuning: typeof DUCK, seconds: number) =>
    startY -
    lowestY(run(240, (step) => ({ jumpHeld: step * STEP < seconds, move: 0 }), [GROUND], tuning));
  const { gravity, jumpHoldTime, jumpSpeed, jumpTapWindow } = DUCK;
  // The launch alone, and the most a hold adds: the hold time at jumpSpeed, from where the hop
  // is at the end of the tap window.
  const hopHeight = jumpSpeed ** 2 / (2 * gravity);
  const fullHeight = rise(DUCK, 10);
  const within = jumpSpeed * STEP;

  it.each([
    ["a one-step tap", STEP],
    ["half the tap window", jumpTapWindow / 2],
    ["a step short of the tap window", jumpTapWindow - STEP],
  ])("hops the launch alone for %s", (_name, seconds) => {
    expect(Math.abs(rise(DUCK, seconds) - hopHeight)).toBeLessThanOrEqual(within);
  });

  it("rises no higher than the hop for a press of the tap window", () => {
    expect(rise(DUCK, jumpTapWindow)).toBeLessThanOrEqual(hopHeight + within);
  });

  it.each([
    ["a third of the hold", 1 / 3],
    ["half the hold", 1 / 2],
    ["two thirds of the hold", 2 / 3],
  ])("rises between the hop and the full jump for %s past the tap window", (_name, share) => {
    const height = rise(DUCK, jumpTapWindow + STEP + share * jumpHoldTime);
    expect(height).toBeGreaterThan(hopHeight + within);
    expect(height).toBeLessThan(fullHeight - within);
  });

  it.each([
    ["the whole hold", jumpTapWindow + STEP + jumpHoldTime + 0.2],
    ["twice as long", 2 * (jumpTapWindow + jumpHoldTime + 0.2)],
  ])("rises the full jump for %s", (_name, seconds) => {
    expect(rise(DUCK, seconds)).toBe(fullHeight);
  });

  it("rises higher for a longer press, past the tap window", () => {
    const heights = Array.from({ length: 30 }, (_, step) =>
      rise(DUCK, jumpTapWindow + step * STEP),
    );
    expect(heights.every((height, i) => i === 0 || height >= (heights[i - 1] ?? 0))).toBe(true);
  });

  it.each([0.25, 0.5, 0.75])(
    "stops climbing sooner when let go mid-hold, keeping %d of her speed",
    (cut) => {
      const press = jumpTapWindow + STEP + jumpHoldTime / 2;
      const kept = rise({ ...DUCK, jumpReleaseCut: 1 }, press);
      expect(rise({ ...DUCK, jumpReleaseCut: cut }, press)).toBeLessThan(kept - within);
    },
  );

  it("hops when a buffered jump's button was already released", () => {
    const land = hop().findIndex((state, i) => i > 2 && state.grounded);
    const press = land - 3;
    const states = run(600, (step) => ({ jumpHeld: step < 2 || step === press, move: 0 }));
    const after = states.slice(land);
    const hopApex = DUCK.jumpSpeed ** 2 / (2 * DUCK.gravity);
    expect(Math.abs(startY - lowestY(after) - hopApex)).toBeLessThanOrEqual(DUCK.jumpSpeed * STEP);
  });

  it.each([
    ["after a jump", hop()],
    ["off a ledge", walkOff()],
  ])("falls at the flutter speed at most %s", (_name, states) => {
    const falling = states.filter((state) => state.vy > 0 && !state.grounded);
    expect(falling.length).toBeGreaterThan(0);
    expect(Math.max(...falling.map((state) => state.vy))).toBe(DUCK.flutterFallSpeed);
  });

  // A press on step s acts on the state after step s - 1; that state's coyote time has run
  // for (s - leave) steps since states[leave], the first one in the air.
  it.each([
    ["within coyote time", Math.floor(DUCK.coyoteTime / STEP) - 1, true],
    ["after coyote time", Math.ceil(DUCK.coyoteTime / STEP) + 1, false],
  ])("jumps when pressed %s after leaving a ledge", (_name, after, jumps) => {
    const leave = walkOff().findIndex((state) => !state.grounded);
    const states = walkOff(leave - 1 + after);
    expect(states.some((state) => state.vy < 0)).toBe(jumps);
  });

  // A press kept in the buffer starts a jump on the step after she lands, so the buffer must
  // outlast the steps to landing plus one.
  it.each([
    ["within the buffer", Math.floor(DUCK.jumpBuffer / STEP) - 2, true],
    ["before the buffer", Math.ceil(DUCK.jumpBuffer / STEP) + 1, false],
  ])("jumps as she lands when pressed %s", (_name, before, jumps) => {
    const land = hop().findIndex((state, i) => i > 2 && state.grounded);
    const states = hop(land - 1 - before);
    expect(states.slice(land).some((state) => state.vy < 0)).toBe(jumps);
  });

  it("hops lower when Jump is released early", () => {
    const held = run(120, () => ({ jumpHeld: true, move: 0 }));
    const tapped = run(120, (step) => ({ jumpHeld: step < 4, move: 0 }));
    expect(lowestY(tapped)).toBeGreaterThan(lowestY(held));
  });

  it("lands after a jump", () => {
    expect(last(hop())).toMatchObject({ grounded: true, vy: 0, y: startY });
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
