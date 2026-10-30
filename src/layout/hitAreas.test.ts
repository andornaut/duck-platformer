import { describe, expect, it } from "vitest";

import { HIT_MARGINS, hitAround, MIN_TARGET, pressArea, pressedArea } from "./hitAreas";

describe("hitAround", () => {
  const BIG = { height: 60, width: 100, x: 200, y: 100 };
  const SMALL = { height: 24, width: 24, x: 500, y: 90 };
  it.each([
    ["a big button by the margin", BIG, { height: 72, width: 112, x: 194, y: 94 }],
    [
      "a small one to the least size about its centre",
      SMALL,
      { height: MIN_TARGET, width: MIN_TARGET, x: 490, y: 80 },
    ],
  ])("grows %s", (_, art, hit) => {
    expect(hitAround(HIT_MARGINS.button, art)).toEqual(hit);
  });
});

describe("pressedArea", () => {
  // Two buttons 50 apart whose grown areas overlap by 12 between them.
  const LEFT = pressArea("left", 6, { height: 40, width: 50, x: 0, y: 0 });
  const RIGHT = pressArea("right", 6, { height: 40, width: 50, x: 50, y: 0 });
  it.each([
    ["inside the left margin", { x: -6, y: 20 }, "left"],
    ["just outside the left margin", { x: -7, y: 20 }, undefined],
    ["in the overlap, nearer the left button", { x: 49, y: 20 }, "left"],
    ["in the overlap, nearer the right button", { x: 51, y: 20 }, "right"],
    ["just outside the bottom margin", { x: 25, y: 46 }, undefined],
  ])("takes a press %s as %s", (_, point, key) => {
    expect(pressedArea([LEFT, RIGHT], point)).toBe(key);
  });
});
