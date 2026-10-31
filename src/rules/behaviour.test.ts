import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import type { Archetype, BehaviourPlan, Character, ObjectLayout, Rect } from "../data/types";
import { TEST_PURSUER, TEST_SHUTTLE } from "../testing/behaviours";
import { behaviourPose } from "../view/behaviour";
import {
  contactBox,
  layoutBehaviour,
  startBehaviour,
  stepBehaviour,
  sweptContact,
} from "./behaviour";
import { startDuck } from "./duck";
import { objectLayout } from "./tiles";

const ACTOR: Archetype = {
  collision: "hazard",
  interaction: { kind: "none", range: 0 },
  motion: {
    algorithm: "static",
    direction: "right",
    distance: 0,
    hopHeight: 0,
    pause: 0,
    speed: 0,
    variance: 0,
  },
  reaction: { kind: "none", range: 0, speed: 0 },
};
const CHARACTER: Character = {
  archetype: "actor",
  art: "placeholder-actor",
  behaviour: TEST_PURSUER,
  cols: 40,
  rows: 20,
};
const AT = { x: 150, y: 280 };
const duck = (x = 120, y = 300) => ({ ...startDuck(DUCK, { x, y }), grounded: true });
const resolve = (character = CHARACTER, archetype = ACTOR, tile = 1, behaviour?: BehaviourPlan) =>
  objectLayout(
    tile,
    { archetypes: { actor: archetype }, characters: { actor: character } },
    {},
    undefined,
    { ...(behaviour && { behaviour }), character: "actor", col: 100, row: 280 },
  );
const OBJECT = resolve();
const initial = (object = OBJECT) => startBehaviour(DUCK, object, duck());

describe("behaviour plans", () => {
  it.each([null, "walk"])("moves art with animation %j", (animation) => {
    const plan = {
      ...TEST_SHUTTLE,
      states: Object.fromEntries(
        Object.entries(TEST_SHUTTLE.states).map(([key, node]) => [key, { ...node, animation }]),
      ),
    };
    const object = resolve(CHARACTER, ACTOR, 1, plan);
    const result = stepBehaviour(DUCK, object, [], 0.1, duck(), object.origin, initial(object));
    expect(result.at.y).toBeLessThan(object.origin.y);
    expect(behaviourPose(object, result.state).animation).toBe(animation ?? undefined);
  });

  it("converts signed extent, speeds and spatial conditions without changing time or graph keys", () => {
    const plan = resolve(CHARACTER, ACTOR, 12).behaviour;
    const node = plan?.states.watchRight;
    expect({
      distance: plan?.distance,
      motion: node?.motion,
      when: node?.transitions[0]?.when,
    }).toEqual({
      distance: 1200,
      motion: { direction: 1, kind: "move", speed: 240 },
      when: [
        { kind: "nearby", range: 960 },
        { kind: "same-ground", tolerance: 12 },
      ],
    });
    expect(plan?.states.brace?.transitions[0]?.when).toEqual([{ kind: "elapsed", seconds: 0.25 }]);
  });

  it("takes a composed instance plan over its character's default", () => {
    expect(resolve(CHARACTER, ACTOR, 1, { ...TEST_SHUTTLE, distance: -90 }).behaviour).toEqual({
      ...TEST_SHUTTLE,
      distance: -90,
    });
  });

  it.each<BehaviourPlan>([
    { ...TEST_PURSUER, initial: "absent" },
    { ...TEST_PURSUER, distance: Infinity },
    {
      ...TEST_PURSUER,
      states: {
        ...TEST_PURSUER.states,
        brace: {
          animation: "crouch",
          motion: { kind: "wait" },
          transitions: [{ to: "absent", when: [{ kind: "elapsed", seconds: 1 }] }],
        },
      },
    },
    {
      ...TEST_PURSUER,
      states: {
        ...TEST_PURSUER.states,
        brace: {
          animation: "crouch",
          motion: { kind: "wait" },
          transitions: [{ to: "burst", when: [{ kind: "elapsed", seconds: -1 }] }],
        },
      },
    },
  ])("refuses invalid graph data %j", (plan) => {
    expect(() => layoutBehaviour(1, plan)).toThrow("Invalid behaviour");
  });
});

describe("data-defined pursuit", () => {
  it.each([
    { grounded: true, triggered: true, x: 120, y: 300 },
    { grounded: false, triggered: false, x: 120, y: 300 },
    { grounded: true, triggered: false, x: 120, y: 250 },
    { grounded: true, triggered: false, x: 300, y: 300 },
  ])("combines nearby and same-ground conditions: %j", ({ grounded, triggered, x, y }) => {
    const result = stepBehaviour(
      DUCK,
      OBJECT,
      [],
      0.125,
      { ...duck(x, y), grounded },
      AT,
      initial(),
    );
    expect(result.state.stateKey === "brace").toBe(triggered);
  });

  it.each([
    [0.125, "brace", 150],
    [0.25, "burst", 150],
    [0.5, "burst", 100],
    [0.75, "recover", 100],
  ])("after %s seconds is %s at x%s, preserving elapsed timing at the bound", (seconds, key, x) => {
    const result = stepBehaviour(DUCK, OBJECT, [], seconds, duck(), AT, initial());
    expect({ key: result.state.stateKey, x: result.at.x }).toEqual({ key, x });
    expect(result.state.facing).toBe(-1);
  });

  it("keeps an entry-captured heading when the target moves behind it", () => {
    const first = stepBehaviour(DUCK, OBJECT, [], 0.125, duck(), AT, initial());
    const burst = stepBehaviour(DUCK, OBJECT, [], 0.5, duck(240), first.at, first.state);
    expect({ facing: burst.state.facing, key: burst.state.stateKey, x: burst.at.x }).toEqual({
      facing: -1,
      key: "burst",
      x: 100,
    });
  });

  it("stays still and uses its inactive animation until explicitly activated", () => {
    const object = { ...OBJECT, scene: "conversation" };
    const result = stepBehaviour(DUCK, object, [], 2, duck(), AT, initial(object));
    expect(result.at).toEqual(AT);
    expect(result.state.active).toBe(false);
    expect(behaviourPose(object, result.state).animation).toBe(TEST_PURSUER.inactiveAnimation);
  });

  it("rejects an instantaneous transition cycle instead of hanging a frame", () => {
    const node = {
      animation: "idle",
      motion: { kind: "wait" as const },
      transitions: [{ to: "again", when: [{ kind: "elapsed" as const, seconds: 0 }] }],
    };
    const object = {
      ...OBJECT,
      behaviour: { ...TEST_PURSUER, initial: "again", states: { again: node } },
    };
    expect(() => stepBehaviour(DUCK, object, [], 1, duck(), AT, initial(object))).toThrow(
      "Instant behaviour transition cycle",
    );
  });
});

describe("shared shuttle primitive", () => {
  it.each(["x", "y"] as const)(
    "moves, waits and returns along %s for a solid inanimate actor",
    (axis) => {
      const object = resolve(
        { ...CHARACTER, behaviour: { ...TEST_SHUTTLE, axis } },
        { ...ACTOR, collision: "solid" },
      );
      const result = stepBehaviour(
        DUCK,
        object,
        [],
        3.5,
        duck(1000),
        object.origin,
        initial(object),
      );
      expect(result.at[axis]).toBe(object.origin[axis] - 30);
      expect(result.state.stateKey).toBe("homebound");
      expect(result.state.facing).toBe(1);
    },
  );

  it("tests a boundary in the current travel direction, not the starting endpoint", () => {
    const object = resolve({ ...CHARACTER, behaviour: TEST_SHUTTLE });
    const result = stepBehaviour(DUCK, object, [], 0.5, duck(1000), object.origin, initial(object));
    expect(result.at.y).toBe(object.origin.y - 15);
    expect(result.state.stateKey).toBe("outbound");
  });

  it.each(["x", "y"] as const)("uses a facing-adjusted contact box for a %s-axis actor", (axis) => {
    const object: ObjectLayout = {
      ...OBJECT,
      behaviour: { ...TEST_PURSUER, axis },
      hitbox: { height: 12, width: 10, x: 2, y: 3 },
    };
    expect(contactBox(object, AT, -1).x).toBe(axis === "x" ? 178 : 152);
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
