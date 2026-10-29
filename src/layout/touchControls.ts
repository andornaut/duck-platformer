import type { Point, Rect } from "../data/types";

export type TouchControl = "jump" | "use";

// Art's touch buttons, in base pixels: each button's centre, the area a touch must start in to
// take it, how far its label's origin sits above the centre, and the room for its label: the
// widest label's ink at LABEL_SCALE.
export const TOUCH_CONTROLS: Readonly<
  Record<TouchControl, { centre: Point; hit: Rect; labelRaise: number; labelRoom: number }>
> = {
  jump: {
    centre: { x: 667, y: 307 },
    hit: { height: 104, width: 198, x: 522, y: 256 },
    labelRaise: 1,
    labelRoom: 53,
  },
  use: {
    centre: { x: 592, y: 210 },
    hit: { height: 104, width: 198, x: 522, y: 152 },
    labelRaise: 3,
    labelRoom: 45,
  },
};

// A button's label is set in font-body at this scale.
export const LABEL_SCALE = 2;
