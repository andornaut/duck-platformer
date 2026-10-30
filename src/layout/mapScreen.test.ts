import { describe, expect, it } from "vitest";

import { mapLabel } from "./mapScreen";

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
