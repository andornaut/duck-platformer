import { describe, expect, it } from "vitest";

import palette from "../../public/art/palette.json";
import { dimColour } from "./dim";

const rgb = (hex: string) => Number.parseInt(hex.slice(1), 16);
const dim = dimColour(palette);

describe("dimColour", () => {
  it("maps every palette colour to its dim2 entry", () => {
    const wrong = Object.entries(palette.dim2).filter(([from, to]) => dim(rgb(from)) !== rgb(to));
    expect(wrong).toEqual([]);
  });

  it.each(Object.entries(palette.colours))(
    "maps %s, one off the palette, as the colour itself",
    (_, hex) => {
      expect(dim(rgb(hex) ^ 0x010101)).toBe(dim(rgb(hex)));
    },
  );
});
