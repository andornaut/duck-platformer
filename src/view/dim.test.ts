import { describe, expect, it } from "vitest";

import palette from "../../public/art/palette.json";
import { dimColour, dimPixels } from "./dim";

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

describe("dimPixels", () => {
  it("replaces each pixel's colour and keeps its alpha", () => {
    const { cream, white } = palette.colours;
    const pixels = new Uint8ClampedArray([
      ...[rgb(cream) >> 16, (rgb(cream) >> 8) & 0xff, rgb(cream) & 0xff, 0x80],
      ...[rgb(white) >> 16, (rgb(white) >> 8) & 0xff, rgb(white) & 0xff, 0xff],
    ]);
    dimPixels(palette, pixels);
    const pixel = (i: number) =>
      ((pixels[i] ?? 0) << 16) | ((pixels[i + 1] ?? 0) << 8) | (pixels[i + 2] ?? 0);
    expect([pixel(0), pixels[3], pixel(4), pixels[7]]).toEqual([
      rgb(palette.dim2[cream as keyof typeof palette.dim2]),
      0x80,
      rgb(palette.dim2[white as keyof typeof palette.dim2]),
      0xff,
    ]);
  });
});
