import { describe, expect, it } from "vitest";

import {
  HIT_RULE,
  hitAround,
  hitMargin,
  pressArea,
  pressedArea,
  TOUCH_CIRCLE_RADIUS,
  touchRadius,
} from "./hitAreas";
import { MAP_SCREEN } from "./mapScreen";
import { PAUSE_BUTTON, PAUSE_CARD } from "./pauseCard";
import { SETTINGS_CARD } from "./settingsCard";
import { startScreenLayout } from "./startScreen";
import { TOUCH_CONTROLS } from "./touchControls";

const square = (side: number) => ({ height: side, width: side, x: 100, y: 100 });

describe("hitMargin", () => {
  it.each([
    ["a quarter of a mid-sized button's shorter side", { height: 40, width: 200, x: 0, y: 0 }, 10],
    ["no less than the least margin", square(16), HIT_RULE.leastMargin],
    ["no more than the most margin", square(200), HIT_RULE.mostMargin],
  ])("is %s", (_, art, margin) => {
    expect(hitMargin(art)).toBe(margin);
  });
});

describe("hitAround", () => {
  // Each button's press area, by the rule, from its drawn size.
  const { start } = startScreenLayout(true);
  it.each<[string, { height: number; width: number }, { height: number; width: number }]>([
    ["the pause button, a 35 px frame", PAUSE_BUTTON.art, { height: 52.5, width: 52.5 }],
    ["the close X, at the least size", PAUSE_CARD.close.art, { height: 48, width: 48 }],
    ["a 16 px icon, at the least size", square(16), { height: 48, width: 48 }],
    ["a card row", SETTINGS_CARD.touchControls.row, { height: 72, width: 376 }],
    ["Resume", PAUSE_CARD.resume.art, { height: 66, width: 182 }],
    ["Start", start.button, { height: 78, width: 218 }],
    ["a nav icon button", startScreenLayout(true).settings.art, { height: 54, width: 54 }],
    ["a map zone marker", square(35), MAP_SCREEN.nodeHit],
  ])("grows %s", (_, art, size) => {
    const hit = hitAround({ ...art, x: 0, y: 0 });
    expect({ height: hit.height, width: hit.width }).toEqual(size);
  });

  it("grows a small button evenly about its centre to the least size", () => {
    const art = square(16);
    const hit = hitAround(art);
    expect({
      centre: { x: hit.x + hit.width / 2, y: hit.y + hit.height / 2 },
      size: hit.width,
    }).toEqual({ centre: { x: 108, y: 108 }, size: HIT_RULE.minTarget });
  });

  it("takes in a nav icon button's map marker size", () => {
    expect(MAP_SCREEN.nodeHit).toEqual({ height: 52.5, width: 52.5 });
  });
});

describe("pressedArea", () => {
  // Two 40 px tall buttons side by side, each grown by 10 (a quarter of 40), overlapping by 20.
  const LEFT = pressArea("left", { height: 40, width: 50, x: 0, y: 0 });
  const RIGHT = pressArea("right", { height: 40, width: 50, x: 50, y: 0 });
  it.each([
    ["just inside the left margin", { x: -10, y: 20 }, "left"],
    ["just outside the left margin", { x: -11, y: 20 }, undefined],
    ["just inside the top margin", { x: 25, y: -10 }, "left"],
    ["just outside the top margin", { x: 25, y: -11 }, undefined],
    ["just inside the bottom margin", { x: 25, y: 49 }, "left"],
    ["just outside the bottom margin", { x: 25, y: 50 }, undefined],
    ["just inside the right margin", { x: 109, y: 20 }, "right"],
    ["just outside the right margin", { x: 110, y: 20 }, undefined],
    ["in the overlap, nearer the left button", { x: 49, y: 20 }, "left"],
    ["in the overlap, nearer the right button", { x: 51, y: 20 }, "right"],
  ])("takes a press %s as %s", (_, point, key) => {
    expect(pressedArea([LEFT, RIGHT], point)).toBe(key);
  });

  it("keeps the screen's bottom-right corner in Jump's area", () => {
    expect(pressedArea([{ ...TOUCH_CONTROLS.jump, key: "jump" }], { x: 719, y: 359 })).toBe("jump");
  });
});

describe("touchRadius", () => {
  // Buttons the drawn distance apart, and with one anchor moved closer, where the circles shrink
  // to half the distance so they still never overlap.
  it.each<[string, { x: number; y: number }, number]>([
    ["far apart", { x: 200, y: 0 }, TOUCH_CIRCLE_RADIUS],
    ["exactly two radii apart", { x: 2 * TOUCH_CIRCLE_RADIUS, y: 0 }, TOUCH_CIRCLE_RADIUS],
    ["moved closer", { x: 60, y: 80 }, 50],
  ])("keeps circles %s at radius %d", (_, other, radius) => {
    expect(touchRadius({ x: 0, y: 0 }, other)).toBe(radius);
  });

  it("leaves a press halfway between moved-closer buttons to neither", () => {
    const a = { x: 0, y: 0 };
    const b = { x: 60, y: 80 };
    const radius = touchRadius(a, b);
    const art = { height: 1, width: 1, x: 0, y: 0 };
    const areas = [
      { art, hit: { centre: a, radius }, key: "a" },
      { art: { ...art, x: 60, y: 80 }, hit: { centre: b, radius }, key: "b" },
    ];
    expect(pressedArea(areas, { x: 30, y: 40 })).toBeUndefined();
  });
});
