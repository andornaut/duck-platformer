import { describe, expect, it } from "vitest";

import type { HeldTouch } from "../input/intent";
import { KNOB_TRAVEL, MOVE_DEAD_ZONE, TOUCH_CONTROLS } from "../layout/touchControls";
import type { TagFrame } from "./aseprite";
import {
  centredAt,
  controlTag,
  knobAt,
  knobTag,
  type Press,
  pressSuffix,
  trackPress,
} from "./touchControls";

const MOVE_X = TOUCH_CONTROLS.move.centre.x;
const LEFT: HeldTouch = { control: "move", x: MOVE_X - MOVE_DEAD_ZONE - 1 };
const RIGHT: HeldTouch = { control: "move", x: MOVE_X + MOVE_DEAD_ZONE + 1 };
const DEAD: HeldTouch = { control: "move", x: MOVE_X + MOVE_DEAD_ZONE };
const JUMP: HeldTouch = { control: "jump", x: TOUCH_CONTROLS.jump.centre.x };

describe("pressSuffix", () => {
  it.each([
    ["jump", [], undefined],
    ["jump", [JUMP], ""],
    ["interact", [JUMP], undefined],
    ["move", [LEFT], "-left"],
    ["move", [RIGHT], "-right"],
    ["move", [DEAD], undefined],
    ["move", [JUMP], undefined],
  ] as const)("presses %s with %j as %j", (control, touches, suffix) => {
    expect(pressSuffix(control, touches)).toBe(suffix);
  });
});

describe("trackPress", () => {
  const pressed: Press = { sinceMs: 100, suffix: "-left" };
  it.each([
    [undefined, undefined, undefined],
    [undefined, pressed, undefined],
    ["-left", undefined, { sinceMs: 500, suffix: "-left" }],
    ["-left", pressed, pressed],
    ["-right", pressed, { sinceMs: 500, suffix: "-right" }],
  ])("tracks %j over %j", (suffix, press, tracked) => {
    expect(trackPress(500, suffix, press)).toEqual(tracked);
  });
});

describe("controlTag", () => {
  const frames = (...ms: number[]): TagFrame[] => ms.map((each) => ({ frame: "", ms: each }));
  const tags = new Map([
    ["press", frames(60, 60)],
    ["press-left", frames(60)],
  ]);
  it.each([
    [0, undefined, "rest"],
    [1000, { sinceMs: 1000, suffix: "" }, "press"],
    [1119, { sinceMs: 1000, suffix: "" }, "press"],
    [1120, { sinceMs: 1000, suffix: "" }, "held"],
    [1059, { sinceMs: 1000, suffix: "-left" }, "press-left"],
    [1060, { sinceMs: 1000, suffix: "-left" }, "held-left"],
  ])("at %i ms shows %j as %s", (nowMs, press, tag) => {
    expect(controlTag(tags, nowMs, press)).toBe(tag);
  });
});

describe("knobTag", () => {
  it.each([
    [[], "rest"],
    [[JUMP], "rest"],
    [[DEAD], "held"],
    [[LEFT, JUMP], "held"],
  ])("shows %j as %s", (touches, tag) => {
    expect(knobTag(touches as HeldTouch[])).toBe(tag);
  });
});

describe("centredAt", () => {
  it.each([
    [1, 1, { x: 100, y: 200 }],
    [11, 11, { x: 95, y: 195 }],
    [77, 67, { x: 62, y: 167 }],
  ])("puts a %ix%i frame's centre pixel on 100,200", (width, height, at) => {
    expect(centredAt({ x: 100, y: 200 }, { height, width })).toEqual(at);
  });
});

describe("knobAt", () => {
  const frame = { height: 11, width: 11 };
  const rest = centredAt(TOUCH_CONTROLS.move.centre, frame);
  it.each([
    [[], 0],
    [[{ control: "move", x: MOVE_X + 3.4 }], 3],
    [[{ control: "move", x: MOVE_X - KNOB_TRAVEL - 20 }], -KNOB_TRAVEL],
    [[{ control: "move", x: MOVE_X + KNOB_TRAVEL + 20 }], KNOB_TRAVEL],
  ])("shifts the knob for %j by %i", (touches, dx) => {
    expect(knobAt(frame, touches as HeldTouch[])).toEqual({ x: rest.x + dx, y: rest.y });
  });
});
