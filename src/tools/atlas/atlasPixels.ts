import { clampIndex } from "@andornaut/game-kit/arrays";
import type { Point } from "@andornaut/game-kit/rect";

// Pixels as RGBA bytes, row by row from the top-left.
export interface RgbaImage {
  readonly data: Uint8Array;
  readonly height: number;
  readonly width: number;
}

export function blankImage(width: number, height: number): RgbaImage {
  return { data: new Uint8Array(width * height * 4), height, width };
}

// Copies all of source to target with its top-left at, and extrude pixels around it on every
// side that repeat source's edge pixels, so a frame sampled just past its edge reads its own
// colour rather than a neighbour's.
export function blitExtruded(
  source: RgbaImage,
  extrude: number,
  target: RgbaImage,
  at: Point,
): void {
  for (let dy = -extrude; dy < source.height + extrude; dy++) {
    const sourceY = clampIndex(source.height, dy);
    for (let dx = -extrude; dx < source.width + extrude; dx++) {
      const read = (sourceY * source.width + clampIndex(source.width, dx)) * 4;
      const write = ((at.y + dy) * target.width + at.x + dx) * 4;
      target.data.set(source.data.subarray(read, read + 4), write);
    }
  }
}
