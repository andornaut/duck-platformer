import { describe, expect, it } from "vitest";

import { HIT_MARGINS, hitAround } from "./hitAreas";
import { forkChoiceRects, MAP_SCREEN, mapLabel } from "./mapScreen";

describe("mapLabel", () => {
  it.each([38, 48, 56, 64, 91])("centres a name %i px in advance under its marker", (advance) => {
    const centre = { x: 300, y: 150 };
    const { knockout, origin } = mapLabel(advance, centre);
    // The name's ink is 4 px narrower than its advance, starting 2 px right of its origin.
    const ink = { left: origin.x + 2, right: origin.x + advance - 2 };
    expect(Math.abs((ink.left + ink.right) / 2 - centre.x)).toBeLessThanOrEqual(1);
    expect(knockout.x).toBeLessThan(ink.left);
    expect(knockout.x + knockout.width).toBeGreaterThan(ink.right);
  });
});

describe("forkChoiceRects", () => {
  const { gap, middle } = MAP_SCREEN.forkChoice;

  it.each([1, 2, 3])("centres %i buttons, gap apart, each inside its press area", (count) => {
    const rects = forkChoiceRects(count);
    const left = rects[0]?.art.x ?? 0;
    const last = rects.at(-1)?.art;
    expect(left + ((last?.x ?? 0) + (last?.width ?? 0) - left) / 2).toBe(middle);
    rects.slice(1).forEach(({ art }, i) => {
      const before = rects[i]?.art;
      expect(art.x - ((before?.x ?? 0) + (before?.width ?? 0))).toBe(gap);
    });
    for (const { art, hit } of rects) {
      expect(hit).toEqual(hitAround(HIT_MARGINS.button, art));
    }
  });
});
