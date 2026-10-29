import type { Point, Rect, Size } from "../data/types";

// Where she sits on the screen while she stands on the ground line, as a fraction of its height
// from the top.
export const GROUND_SPOT = 2 / 3;

// In an assembled area, the ground line eases from one chunk's to the next's over this fraction
// of the screen's width, centred on the seam.
export const SEAM_EASE = 1 / 2;

// What the camera reads of an area: its size, its terrain, and in an assembled area its chunks,
// left to right (none in a hand-built one).
export interface CameraArea {
  readonly chunks?: readonly { readonly width: number; readonly x: number }[];
  readonly height: number;
  readonly solids: readonly Rect[];
  readonly width: number;
}

// The top of the lowest terrain with a part between left and right, or undefined for none.
function lowestTop(solids: readonly Rect[], left: number, right: number): number | undefined {
  const tops = solids
    .filter((solid) => solid.x < right && solid.x + solid.width > left)
    .map((solid) => solid.y);
  return tops.length > 0 ? Math.max(...tops) : undefined;
}

// The ground line at x: the top of the area's lowest ground; in an assembled area, of the lowest
// ground in the chunk x is in (or the area's, in a chunk without terrain), eased smoothly into
// the next chunk's over SEAM_EASE of the screen around each seam. Never below the area's lowest
// ground.
export function groundLine(screen: Size, area: CameraArea, x: number): number {
  const lowest = Math.max(0, ...area.solids.map((solid) => solid.y));
  const chunks = area.chunks ?? [];
  const groundOf = (index: number) => {
    const chunk = chunks[index];
    const top = chunk && lowestTop(area.solids, chunk.x, chunk.x + chunk.width);
    return Math.min(top ?? lowest, lowest);
  };
  if (chunks.length === 0) {
    return lowest;
  }
  const half = (SEAM_EASE * screen.width) / 2;
  for (let index = 1; index < chunks.length; index++) {
    const seam = chunks[index]?.x ?? 0;
    if (Math.abs(x - seam) < half) {
      const t = (x - seam + half) / (2 * half);
      const eased = t * t * (3 - 2 * t);
      return groundOf(index - 1) + (groundOf(index) - groundOf(index - 1)) * eased;
    }
  }
  const within = chunks.reduce((found, chunk, index) => (chunk.x <= x ? index : found), 0);
  return groundOf(within);
}

// The camera's scroll (its view's top-left corner in the area) for her feet at feet: centred on
// her along x; along y, her feet GROUND_SPOT down the screen while she is on the ground line,
// the view rising only once her feet climb above its middle, which then keeps them there. The
// view stays inside the area and never shows below the bottom of its lowest solid. Whole pixels.
export function cameraScroll(screen: Size, area: CameraArea, feet: Point): Point {
  const lowest = Math.max(screen.height, ...area.solids.map((solid) => solid.y + solid.height));
  const rest = groundLine(screen, area, feet.x) - GROUND_SPOT * screen.height;
  const y = Math.min(rest, feet.y - screen.height / 2);
  const clamp = (value: number, max: number) => Math.round(Math.min(Math.max(value, 0), max));
  return {
    x: clamp(feet.x - screen.width / 2, area.width - screen.width),
    y: clamp(y, Math.min(area.height, lowest) - screen.height),
  };
}
