import { describe, expect, it } from "vitest";

import { TOUCH } from "../data/touch";
import { TOUCH_CONTROLS } from "../layout/touchControls";
import {
  combineIntents,
  type HeldTouch,
  type Intent,
  keyIntent,
  moveFromOffset,
  touchIntent,
  touchRoleAt,
} from "./intent";

const NONE: Intent = { jump: false, move: 0, use: false };

describe("keyIntent", () => {
  it.each([
    [[], NONE],
    [["ArrowLeft"], { ...NONE, move: -1 }],
    [["KeyA"], { ...NONE, move: -1 }],
    [["ArrowRight"], { ...NONE, move: 1 }],
    [["KeyD"], { ...NONE, move: 1 }],
    [["KeyA", "KeyD"], NONE],
    [["Space"], { ...NONE, jump: true }],
    [["ArrowUp"], { ...NONE, jump: true }],
    [["KeyW"], { ...NONE, jump: true }],
    [["KeyE"], { ...NONE, use: true }],
    [["ArrowRight", "Space"], { ...NONE, jump: true, move: 1 }],
  ])("maps %j", (keys, intent) => {
    expect(keyIntent(new Set(keys))).toEqual(intent);
  });
});

describe("touchRoleAt", () => {
  const { jump, use } = TOUCH_CONTROLS;
  it.each([
    [use.centre, "use"],
    [{ x: use.hit.x, y: use.hit.y }, "use"],
    [jump.centre, "jump"],
    [{ x: jump.hit.x + jump.hit.width - 1, y: jump.hit.y + jump.hit.height - 1 }, "jump"],
    [{ x: 72, y: 300 }, "move"],
    [{ x: 320, y: 180 }, "move"],
    [{ x: jump.hit.x, y: jump.hit.y - 1 }, "move"],
    [{ x: use.hit.x - 1, y: use.centre.y }, "move"],
  ])("takes %j as %s", (point, role) => {
    expect(touchRoleAt(point)).toBe(role);
  });
});

describe("moveFromOffset", () => {
  const dead = TOUCH.moveDeadZone;
  it.each([
    [0, 0],
    [dead, 0],
    [-dead, 0],
    [dead + 1, 1],
    [-dead - 1, -1],
    [dead + 100, 1],
    [-dead - 100, -1],
  ])("moves %i as %i", (dx, move) => {
    expect(moveFromOffset(TOUCH, dx)).toBe(move);
  });
});

describe("touchIntent", () => {
  const beyond = TOUCH.moveDeadZone + 1;
  const move = (startX: number, x: number): HeldTouch => ({ role: "move", startX, x });
  const JUMP: HeldTouch = { role: "jump", startX: 600, x: 600 };
  it.each([
    ["nothing", [], NONE],
    ["a drag right", [move(300, 300 + beyond)], { ...NONE, move: 1 }],
    ["a drag left", [move(100, 100 - beyond)], { ...NONE, move: -1 }],
    ["a drag back to its start", [move(300, 300)], NONE],
    ["a drag inside the dead zone", [move(300, 300 + TOUCH.moveDeadZone)], NONE],
    ["a drag left with Jump", [move(300, 300 - beyond), JUMP], { ...NONE, jump: true, move: -1 }],
    [
      "the later of two moves",
      [move(100, 100 - beyond), move(400, 400 + beyond)],
      { ...NONE, move: 1 },
    ],
    ["the later move, still", [move(100, 100 - beyond), move(400, 400)], NONE],
    ["Use", [{ role: "use", startX: 528, x: 528 }], { ...NONE, use: true }],
  ] as const)("reads %s", (_, touches, intent) => {
    expect(touchIntent(TOUCH, touches)).toEqual(intent);
  });
});

describe("combineIntents", () => {
  it.each([
    [NONE, NONE, NONE],
    [{ ...NONE, move: 1 }, NONE, { ...NONE, move: 1 }],
    [{ ...NONE, move: 1 }, { ...NONE, move: -1 }, NONE],
    [
      { ...NONE, move: -1 },
      { ...NONE, jump: true, move: -1 },
      { ...NONE, jump: true, move: -1 },
    ],
    [{ ...NONE, use: true }, NONE, { ...NONE, use: true }],
  ] as const)("combines %j and %j", (a, b, intent) => {
    expect(combineIntents(a, b)).toEqual(intent);
  });
});
