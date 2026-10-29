import type { Point, Rect } from "../data/types";

export type TouchControl = "jump" | "use";

// Art's touch buttons, in base pixels: each button's centre, the area a touch must start in to
// take it, and the room for its label: the widest label's ink at LABEL_SCALE.
export const TOUCH_CONTROLS: Readonly<
  Record<TouchControl, { centre: Point; hit: Rect; labelRoom: number }>
> = {
  jump: {
    centre: { x: 596, y: 316 },
    hit: { height: 80, width: 152, x: 488, y: 280 },
    labelRoom: 41,
  },
  use: {
    centre: { x: 536, y: 244 },
    hit: { height: 80, width: 152, x: 488, y: 200 },
    labelRoom: 33,
  },
};

// A button's label is set in font-body at this scale, its origin this many base pixels above the
// button's centre.
export const LABEL_SCALE = 2;
export const LABEL_RAISE = 3;
