import type { Point, Rect } from "../data/types";

export type TouchControl = "interact" | "jump" | "move";

// Art's touch layout, in base pixels: each control's ring centre and the area a touch must
// start in to take it.
export const TOUCH_CONTROLS: Readonly<Record<TouchControl, { centre: Point; hit: Rect }>> = {
  interact: { centre: { x: 528, y: 268 }, hit: { height: 136, width: 76, x: 488, y: 224 } },
  jump: { centre: { x: 600, y: 304 }, hit: { height: 136, width: 76, x: 564, y: 224 } },
  move: { centre: { x: 72, y: 300 }, hit: { height: 136, width: 152, x: 0, y: 224 } },
};

// Movement is the sign of a touch's x offset from the move ring's centre, outside this.
export const MOVE_DEAD_ZONE = 6;
// The knob shows the offset up to this far either way.
export const KNOB_TRAVEL = 12;
