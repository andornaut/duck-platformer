import { parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { overflowingTexts } from "@andornaut/game-kit/text/overflow";
import { bitmapMeasure } from "@andornaut/game-kit/text/textFit";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { TEXT } from "../data/text";
import type { HeldTouch } from "../input/intent";
import { LABEL_SCALE, TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import type { TagFrame } from "./aseprite";
import {
  buttonHeld,
  centredAt,
  controlTag,
  labelAt,
  labelColour,
  trackPress,
} from "./touchControls";

const JUMP: HeldTouch = { role: "jump", startX: 600, x: 600 };
const MOVE: HeldTouch = { role: "move", startX: 100, x: 140 };

describe("buttonHeld", () => {
  it.each([
    ["jump", [], false],
    ["jump", [JUMP], true],
    ["jump", [MOVE], false],
    ["use", [JUMP, MOVE], false],
  ] as const)("holds %s with %j: %s", (control, touches, held) => {
    expect(buttonHeld(control, touches)).toBe(held);
  });
});

describe("trackPress", () => {
  it.each([
    [false, undefined, undefined],
    [false, 100, undefined],
    [true, undefined, 500],
    [true, 100, 100],
  ])("held %s since %j tracks as %j", (held, sinceMs, tracked) => {
    expect(trackPress(500, held, sinceMs)).toBe(tracked);
  });
});

describe("controlTag", () => {
  const frames = (...ms: number[]): TagFrame[] => ms.map((each) => ({ frame: "", ms: each }));
  const tags = new Map([["press", frames(60, 60)]]);
  it.each([
    [0, undefined, "rest"],
    [1000, 1000, "press"],
    [1119, 1000, "press"],
    [1120, 1000, "held"],
  ])("at %i ms, pressed since %j, shows %s", (nowMs, sinceMs, tag) => {
    expect(controlTag(tags, nowMs, sinceMs)).toBe(tag);
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

const FONT = parseBitmapFont(fontBody);

describe("labelAt", () => {
  it.each([
    ["jump", TEXT.buttons.jump, { x: 579, y: 313 }],
    ["use", TEXT.buttons.use, { x: 524, y: 241 }],
  ] as const)("sets the %s label, %s, where art places it", (control, label, at) => {
    expect(labelAt(FONT, TOUCH_CONTROLS[control].centre, label)).toEqual(at);
  });
});

describe("button labels", () => {
  it("fit their rooms", () => {
    const roles = (Object.keys(TOUCH_CONTROLS) as TouchControl[]).map((control) => ({
      name: `${control} label`,
      room: TOUCH_CONTROLS[control].labelRoom,
      style: { scale: LABEL_SCALE },
      texts: [TEXT.buttons[control]],
    }));
    expect(overflowingTexts(bitmapMeasure(FONT), roles)).toEqual([]);
  });
});

describe("labelColour", () => {
  const colours = { cream: "#ead4aa", white: "#ffffff" };
  it.each([
    ["rest", 0xead4aa],
    ["press", 0xffffff],
    ["held", 0xffffff],
  ])("colours a %s label %i", (tag, colour) => {
    expect(labelColour(colours, tag)).toBe(colour);
  });
});

describe("centredAt, on art's buttons", () => {
  it.each([
    ["jump", 57, { x: 568, y: 288 }],
    ["use", 51, { x: 511, y: 219 }],
  ] as const)("puts the %s frame, %i square, at art's top-left", (control, size, at) => {
    expect(centredAt(TOUCH_CONTROLS[control].centre, { height: size, width: size })).toEqual(at);
  });
});
