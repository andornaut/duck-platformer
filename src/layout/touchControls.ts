import type { Point, Rect } from "../data/types";

export type TouchControl = "jump" | "use";

// Art's touch buttons, in base pixels: each button's ring centre and the area a touch must start
// in to take it.
export const TOUCH_CONTROLS: Readonly<Record<TouchControl, { centre: Point; hit: Rect }>> = {
  jump: { centre: { x: 600, y: 304 }, hit: { height: 136, width: 76, x: 564, y: 224 } },
  use: { centre: { x: 528, y: 268 }, hit: { height: 136, width: 76, x: 488, y: 224 } },
};
