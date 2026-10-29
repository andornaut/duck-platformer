import type { Point, Rect, Size } from "../data/types";

// Where she sits on the screen while she stands on the area's lowest ground, as a fraction of its
// height from the top.
export const GROUND_SPOT = 2 / 3;

// The camera's scroll (its view's top-left corner in the area) for her feet at feet: centred on
// her along x; along y, her feet GROUND_SPOT down the screen while she is on the lowest ground,
// the view rising only once her feet climb above its middle, which then keeps them there. The
// view stays inside the area and never shows below the bottom of its lowest solid. Whole pixels.
export function cameraScroll(
  screen: Size,
  area: { readonly height: number; readonly solids: readonly Rect[]; readonly width: number },
  feet: Point,
): Point {
  const groundTop = Math.max(0, ...area.solids.map((solid) => solid.y));
  const lowest = Math.max(screen.height, ...area.solids.map((solid) => solid.y + solid.height));
  const rest = groundTop - GROUND_SPOT * screen.height;
  const y = Math.min(rest, feet.y - screen.height / 2);
  const clamp = (value: number, max: number) => Math.round(Math.min(Math.max(value, 0), max));
  return {
    x: clamp(feet.x - screen.width / 2, area.width - screen.width),
    y: clamp(y, Math.min(area.height, lowest) - screen.height),
  };
}
