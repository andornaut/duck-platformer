import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { Archetype, Character, Charge, ObjectLayout, Rect } from "../data/types";
import { chargePose } from "../view/charge";
import {
  chargeCanTrigger,
  chargeContactBox,
  startCharge,
  stepCharge,
  sweptContact,
} from "./charge";
import { startDuck } from "./duck";
import { objectLayout } from "./tiles";

const CHARGE: Charge = {
  crouchSeconds: 0.25,
  groundTolerance: 1,
  restSeconds: 0.25,
  rushSeconds: 0.5,
  rushSpeed: 300,
  triggerRange: 80,
};
const PATROL: Archetype = {
  collision: "hazard",
  interaction: { kind: "none", range: 0 },
  motion: {
    algorithm: "linear",
    direction: "right",
    distance: 100,
    hopHeight: 0,
    pause: 0,
    speed: 20,
    variance: 0,
  },
  reaction: { kind: "none", range: 0, speed: 0 },
};
const CHARACTER: Character = {
  archetype: "patrol",
  art: "placeholder-patrol",
  charge: CHARGE,
  cols: 40,
  rows: 20,
};
const AT = { x: 150, y: 280 };
const duck = (x = 120, y = 300) => ({ ...startDuck(DUCK, { x, y }), grounded: true });
const resolve = (character = CHARACTER, archetype = PATROL, tile = 1) =>
  objectLayout(
    tile,
    { archetypes: { patrol: archetype }, characters: { patrol: character } },
    {},
    undefined,
    { character: "patrol", col: 100, row: 280 },
  );
const OBJECT = resolve();

describe("charge tuning", () => {
  it("scales spatial values into pixels, keeping phase timing in seconds", () => {
    expect(resolve(CHARACTER, PATROL, 12).charge).toEqual({
      ...CHARGE,
      groundTolerance: CHARGE.groundTolerance * 12,
      rushSpeed: CHARGE.rushSpeed * 12,
      triggerRange: CHARGE.triggerRange * 12,
    });
  });

  it.each([
    { character: { ...CHARACTER, charge: { ...CHARGE, rushSeconds: 0 } } },
    { character: { ...CHARACTER, charge: { ...CHARGE, triggerRange: Infinity } } },
    { archetype: { ...PATROL, collision: "none" as const } },
    { archetype: { ...PATROL, motion: { ...PATROL.motion, direction: "up" as const } } },
    { archetype: { ...PATROL, motion: { ...PATROL.motion, variance: 0.5 } } },
  ])("refuses an invalid charge or patrol %j", ({ archetype, character }) => {
    expect(() => resolve(character, archetype)).toThrow("Invalid charge patrol");
  });
});

describe("charge patrol", () => {
  it.each([
    { grounded: true, triggers: true, x: 120, y: 300 },
    { grounded: false, triggers: false, x: 120, y: 300 },
    { grounded: true, triggers: false, x: 120, y: 250 },
    { grounded: true, triggers: false, x: 300, y: 300 },
  ])("triggers only near the same ground: %j", ({ grounded, triggers, x, y }) => {
    expect(chargeCanTrigger(DUCK, OBJECT, { ...duck(x, y), grounded }, AT)).toBe(triggers);
  });

  it.each([
    [0.125, "crouch", 150],
    [0.25, "rush", 150],
    [0.5, "rush", 100],
    [0.75, "rest", 100],
    [1, "patrol", 100],
  ])("after %s seconds is %s at x%s, including early boundary stops", (seconds, phase, x) => {
    const result = stepCharge(DUCK, OBJECT, [], seconds, duck(), AT, startCharge(OBJECT));
    expect({ phase: result.state.phase, x: result.at.x }).toEqual({ phase, x });
    expect(result.state.facing).toBe(-1);
  });

  it("retains its crouch direction when the duck moves behind it", () => {
    const first = stepCharge(DUCK, OBJECT, [], 0.125, duck(), AT, startCharge(OBJECT));
    const rush = stepCharge(DUCK, OBJECT, [], 0.5, duck(240), first.at, first.state);
    expect({ facing: rush.state.facing, phase: rush.state.phase, x: rush.at.x }).toEqual({
      facing: -1,
      phase: "rush",
      x: 100,
    });
  });

  it("patrols back and forth inside its bounds without accumulating drift", () => {
    const result = stepCharge(
      DUCK,
      OBJECT,
      [],
      12.5,
      duck(1000),
      OBJECT.origin,
      startCharge(OBJECT),
    );
    expect(result.at.x).toBe(150);
    expect(result.state.facing).toBe(1);
  });

  it("turns its patrol at a terrain wall without entering it", () => {
    const wall: Rect = { height: 60, width: 20, x: 180, y: 250 };
    const result = stepCharge(
      DUCK,
      OBJECT,
      [wall],
      3,
      duck(1000),
      OBJECT.origin,
      startCharge(OBJECT),
    );
    expect(result.at.x).toBe(120);
    expect(result.state.facing).toBe(-1);
  });

  it("holds a scene-gated patrol still and idle before activation", () => {
    const object = { ...OBJECT, scene: "conversation" };
    const result = stepCharge(DUCK, object, [], 2, duck(), AT, startCharge(object));
    expect(result.at).toEqual(AT);
    expect(result.state.active).toBe(false);
    expect(chargePose(result.state).state).toBe("idle");
  });

  it("uses one mirrored hit box for the contact outline and collision", () => {
    const object: ObjectLayout = { ...OBJECT, hitbox: { height: 12, width: 10, x: 2, y: 3 } };
    expect([1, -1].map((facing) => chargeContactBox(object, AT, facing as -1 | 1).x)).toEqual([
      152, 178,
    ]);
  });
});

describe("swept contact", () => {
  const box: Rect = { height: 10, width: 10, x: 0, y: 0 };
  it.each([
    { end: { x: 30, y: 0 }, other: { height: 10, width: 5, x: 20, y: 0 }, touches: true },
    { end: { x: 30, y: 0 }, other: { height: 10, width: 5, x: 20, y: 10 }, touches: false },
    { end: { x: 10, y: 0 }, other: { height: 10, width: 5, x: 20, y: 0 }, touches: false },
    { end: { x: 30, y: 30 }, other: { height: 5, width: 5, x: 20, y: 0 }, touches: false },
  ])("detects contact along the actual movement path: %j", ({ end, other, touches }) => {
    expect(sweptContact(box, end, other, other)).toBe(touches);
  });
});
