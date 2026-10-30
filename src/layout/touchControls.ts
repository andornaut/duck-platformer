import { SCREEN } from "../data/screen";
import type { Point, Rect } from "../data/types";
import { type PressArea, type PressShape, touchRadius } from "./hitAreas";

export type TouchControl = "jump" | "use";

// Art's touch buttons are discs drawn in frames this many base pixels square, each frame's
// centre pixel on its button's centre.
const BUTTON_FRAME = 75;

// Where a button is drawn: its frame, its centre pixel on centre.
function buttonArt(centre: Point): Rect {
  const half = (BUTTON_FRAME - 1) / 2;
  return { height: BUTTON_FRAME, width: BUTTON_FRAME, x: centre.x - half, y: centre.y - half };
}

const USE_CENTRE = { x: 592, y: 210 };
const JUMP_CENTRE = { x: 667, y: 307 };
const USE_ART = buttonArt(USE_CENTRE);
const JUMP_ART = buttonArt(JUMP_CENTRE);

// Each button presses within a circle about its centre (TOUCH_CIRCLE_RADIUS, touchRadius), and
// Jump's reaches on into the screen's bottom-right corner, away from Use: the rect from its
// centre to the corner, where a thumb reaching for it lands.
const RADIUS = touchRadius(USE_CENTRE, JUMP_CENTRE);
const JUMP_HIT: PressShape = [
  { centre: JUMP_CENTRE, radius: RADIUS },
  {
    height: SCREEN.height - JUMP_CENTRE.y,
    width: SCREEN.width - JUMP_CENTRE.x,
    x: JUMP_CENTRE.x,
    y: JUMP_CENTRE.y,
  },
];

// Art's touch buttons, in base pixels: each button's centre, where it is drawn, the area a touch
// must start in to take it (hitAreas.ts), how far its label's origin sits above the centre, and
// the room for its label: the widest label's ink at LABEL_SCALE.
export const TOUCH_CONTROLS: Readonly<
  Record<
    TouchControl,
    { art: Rect; centre: Point; hit: PressShape; labelRaise: number; labelRoom: number }
  >
> = {
  jump: { art: JUMP_ART, centre: JUMP_CENTRE, hit: JUMP_HIT, labelRaise: 1, labelRoom: 53 },
  use: {
    art: USE_ART,
    centre: USE_CENTRE,
    hit: { centre: USE_CENTRE, radius: RADIUS },
    labelRaise: 3,
    labelRoom: 55,
  },
};

// The touch buttons' press areas, for pressedArea.
export const TOUCH_PRESS_AREAS: readonly PressArea<TouchControl>[] = (
  Object.keys(TOUCH_CONTROLS) as TouchControl[]
).map((key) => ({ art: TOUCH_CONTROLS[key].art, hit: TOUCH_CONTROLS[key].hit, key }));

// Art's move hint, a drawing with no press area of its own (movement is the floating drag
// everywhere off the buttons): a ring in a frame the buttons' size, centred at rest on centre,
// anchored to the canvas's bottom-left corner, and a knob that moves from the ring's centre at
// most knobReach pixels left or right the way the drag goes.
const MOVE_HINT_CENTRE: Point = { x: 53, y: 258 };
export const MOVE_HINT = {
  art: buttonArt(MOVE_HINT_CENTRE),
  centre: MOVE_HINT_CENTRE,
  knobReach: 12,
} as const;

// A button's label is set in font-body at this scale.
export const LABEL_SCALE = 2;
