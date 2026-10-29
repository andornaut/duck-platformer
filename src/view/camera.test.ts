import { describe, expect, it } from "vitest";

import { cameraScroll, GROUND_SPOT } from "./camera";

const SCREEN = { height: 360, width: 720 };
// Three screens tall and wide, its ground's top at 600 and 200 thick, room for the view to sit
// her two thirds down.
const AREA = { height: 1080, solids: [{ height: 200, width: 2160, x: 0, y: 600 }], width: 2160 };
// The same with the ground only 48 thick, so the view's bottom stops at the ground's bottom.
const THIN = { ...AREA, solids: [{ height: 48, width: 2160, x: 0, y: 600 }] };
const rest = 600 - GROUND_SPOT * SCREEN.height;

describe("cameraScroll", () => {
  it.each([
    ["on the ground, two thirds down the screen", AREA, { x: 1000, y: 600 }, { x: 640, y: rest }],
    ["a little above the ground, the view still", AREA, { x: 1000, y: 560 }, { x: 640, y: rest }],
    [
      "above the middle, the view risen to keep her there",
      AREA,
      { x: 1000, y: 300 },
      { x: 640, y: 120 },
    ],
    ["at the area's top, the view at its top", AREA, { x: 1000, y: 40 }, { x: 640, y: 0 }],
    [
      "on thin ground, the view's bottom at the ground's",
      THIN,
      { x: 1000, y: 600 },
      { x: 640, y: 288 },
    ],
    ["near the left end, the view at the area's left", AREA, { x: 100, y: 600 }, { x: 0, y: rest }],
    [
      "near the right end, the view at the area's right",
      AREA,
      { x: 2100, y: 600 },
      { x: 1440, y: rest },
    ],
  ])("puts her %s", (_, area, feet, scroll) => {
    expect(cameraScroll(SCREEN, area, feet)).toEqual(scroll);
  });

  it.each([
    ["an area no wider than the screen", { height: 360, solids: [], width: 720 }, { x: 0, y: 0 }],
    ["an area with no terrain", { height: 720, solids: [], width: 2160 }, { x: 640, y: 0 }],
  ])("keeps the view inside %s", (_, area, scroll) => {
    expect(cameraScroll(SCREEN, area, { x: 1000, y: 300 })).toEqual(scroll);
  });
});
