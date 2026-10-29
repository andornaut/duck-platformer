import { remapRgb } from "@andornaut/game-kit/rgba";

// Art's palette (public/art/palette.json): each colour by name, and dim2, each colour two steps
// down its ramp, the pause card's dim.
export interface Palette {
  readonly colours: Readonly<Record<string, string>>;
  readonly dim2: Readonly<Record<string, string>>;
}

function rgb(hex: string): number {
  return Number.parseInt(hex.slice(1), 16);
}

function distance(a: number, b: number): number {
  const red = ((a >> 16) & 0xff) - ((b >> 16) & 0xff);
  const green = ((a >> 8) & 0xff) - ((b >> 8) & 0xff);
  const blue = (a & 0xff) - (b & 0xff);
  return red * red + green * green + blue * blue;
}

// Maps a colour (0xRRGGBB) two steps down its ramp, after snapping it to the nearest palette
// colour, so a colour off the palette still lands on a ramp. Never blends with black.
export function dimColour(palette: Palette): (colour: number) => number {
  const steps = new Map(Object.entries(palette.dim2).map(([from, to]) => [rgb(from), rgb(to)]));
  const colours = [...steps.keys()];
  return (colour) => {
    const nearest = colours.reduce((best, candidate) =>
      distance(candidate, colour) < distance(best, colour) ? candidate : best,
    );
    return steps.get(nearest) ?? nearest;
  };
}

// Dims RGBA pixel data in place, leaving alpha alone.
export function dimPixels(palette: Palette, pixels: Uint8ClampedArray): void {
  remapRgb(dimColour(palette), pixels);
}
