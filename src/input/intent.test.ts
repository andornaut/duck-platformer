import { describe, expect, it } from "vitest";

import { SCREEN } from "../data/screen";
import { TOUCH } from "../data/touch";
import { hitMargin } from "../layout/hitAreas";
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
  const useMargin = hitMargin(use.art);
  const jumpMargin = hitMargin(jump.art);
  const right = (rect: { width: number; x: number }) => rect.x + rect.width;
  const bottom = (rect: { height: number; y: number }) => rect.y + rect.height;
  it.each<[string, { x: number; y: number }, string]>([
    ["Use's centre", use.centre, "use"],
    ["just inside Use's left margin", { x: use.art.x - useMargin, y: use.centre.y }, "use"],
    ["just outside Use's left margin", { x: use.art.x - useMargin - 1, y: use.centre.y }, "move"],
    ["just inside Use's top margin", { x: use.centre.x, y: use.art.y - useMargin }, "use"],
    ["just outside Use's top margin", { x: use.centre.x, y: use.art.y - useMargin - 1 }, "move"],
    ["just outside Use's right margin", { x: right(use.art) + useMargin, y: use.centre.y }, "move"],
    ["Jump's centre", jump.centre, "jump"],
    ["just inside Jump's left reach", { x: jump.art.x - jumpMargin, y: jump.centre.y }, "jump"],
    [
      "just outside Jump's left reach",
      { x: jump.art.x - jumpMargin - 1, y: jump.centre.y },
      "move",
    ],
    ["the screen's bottom-right corner", { x: SCREEN.width - 1, y: SCREEN.height - 1 }, "jump"],
    // Above Jump's area and right of Use's.
    ["just above Jump's reach", { x: jump.centre.x, y: jump.art.y - jumpMargin - 1 }, "move"],
    [
      "in both areas, nearer Use",
      { x: jump.art.x - jumpMargin, y: bottom(use.art) + useMargin - 1 },
      "use",
    ],
    [
      "in both areas, nearer Jump",
      { x: right(use.art) + useMargin - 1, y: jump.art.y - jumpMargin },
      "jump",
    ],
    ["the open middle", { x: 320, y: 180 }, "move"],
  ])("takes %s as %s", (_, point, role) => {
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
