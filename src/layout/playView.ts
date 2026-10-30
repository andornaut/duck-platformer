import { SCREEN } from "../data/screen";
import type { Point, Rect, Size } from "../data/types";

// The canvas fills the page's play area (#game) at the game's scale, so where the play area is
// wider or taller than 2:1, the canvas is too. The game's SCREEN-sized view sits at the canvas's
// top, centred across, and the bars beside or below it are the canvas's own. Sizes are in base
// pixels, whole.

// The game's view in a canvas canvasSize big.
export function playView(canvasSize: Size): Rect {
  return {
    height: SCREEN.height,
    width: SCREEN.width,
    x: Math.floor((Math.floor(canvasSize.width) - SCREEN.width) / 2),
    y: 0,
  };
}

// How far a control anchored to the canvas's bottom-right corner (Jump and Use) moves from where
// it sits in a canvas the game's own size, so that in a wider or taller canvas it moves into the
// bars. A control anchored to the top-left corner (the pause button) stays where it is.
export function bottomRightShift(canvasSize: Size): Point {
  return {
    x: Math.floor(canvasSize.width) - SCREEN.width,
    y: Math.floor(canvasSize.height) - SCREEN.height,
  };
}

// A point moved by shift, or back by it with sign -1.
export function shifted(shift: Point, point: Point, sign: 1 | -1 = 1): Point {
  return { x: point.x + sign * shift.x, y: point.y + sign * shift.y };
}
