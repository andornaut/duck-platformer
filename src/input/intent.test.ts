import { describe, expect, it } from "vitest";

import { KNOB_TRAVEL, MOVE_DEAD_ZONE, TOUCH_CONTROLS } from "../layout/touchControls";
import {
  combineIntents,
  controlAt,
  type Intent,
  keyIntent,
  knobOffset,
  moveFromOffset,
  touchIntent,
} from "./intent";

const NONE: Intent = { interact: false, jump: false, move: 0 };

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
    [["KeyE"], { ...NONE, interact: true }],
    [["ArrowRight", "Space"], { ...NONE, jump: true, move: 1 }],
  ])("maps %j", (keys, intent) => {
    expect(keyIntent(new Set(keys))).toEqual(intent);
  });
});

describe("controlAt", () => {
  const { interact, jump, move } = TOUCH_CONTROLS;
  it.each([
    [move.centre, "move"],
    [{ x: move.hit.x, y: move.hit.y }, "move"],
    [interact.centre, "interact"],
    [jump.centre, "jump"],
    [{ x: jump.hit.x + jump.hit.width - 1, y: jump.hit.y + jump.hit.height - 1 }, "jump"],
    [{ x: 320, y: 180 }, undefined],
    [{ x: move.hit.x + move.hit.width, y: move.centre.y }, undefined],
    [{ x: move.centre.x, y: move.hit.y - 1 }, undefined],
  ])("takes %j as %s", (point, control) => {
    expect(controlAt(point)).toBe(control);
  });
});

describe("moveFromOffset", () => {
  it.each([
    [0, 0],
    [MOVE_DEAD_ZONE, 0],
    [-MOVE_DEAD_ZONE, 0],
    [MOVE_DEAD_ZONE + 1, 1],
    [-MOVE_DEAD_ZONE - 1, -1],
    [100, 1],
  ])("moves %i as %i", (dx, move) => {
    expect(moveFromOffset(dx)).toBe(move);
  });
});

describe("knobOffset", () => {
  it.each([
    [0, 0],
    [KNOB_TRAVEL - 1, KNOB_TRAVEL - 1],
    [KNOB_TRAVEL + 20, KNOB_TRAVEL],
    [-KNOB_TRAVEL - 20, -KNOB_TRAVEL],
  ])("shows %i as %i", (dx, offset) => {
    expect(knobOffset(dx)).toBe(offset);
  });
});

describe("touchIntent", () => {
  const centre = TOUCH_CONTROLS.move.centre.x;
  it.each([
    [[], NONE],
    [[{ control: "move", x: centre + 40 }], { ...NONE, move: 1 }],
    [[{ control: "move", x: centre - 40 }], { ...NONE, move: -1 }],
    [[{ control: "move", x: centre }], NONE],
    [
      [
        { control: "move", x: centre - 40 },
        { control: "jump", x: 600 },
      ],
      { ...NONE, jump: true, move: -1 },
    ],
    [[{ control: "interact", x: 528 }], { ...NONE, interact: true }],
  ] as const)("reads %j", (touches, intent) => {
    expect(touchIntent(touches)).toEqual(intent);
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
    [{ ...NONE, interact: true }, NONE, { ...NONE, interact: true }],
  ] as const)("combines %j and %j", (a, b, intent) => {
    expect(combineIntents(a, b)).toEqual(intent);
  });
});
