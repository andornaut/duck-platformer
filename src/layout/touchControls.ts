import { SCREEN } from "../data/screen";
import type { Point, Rect } from "../data/types";
import { type PressArea, type PressShape, TOUCH_CIRCLE_RADIUS } from "./hitAreas";

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

// The move hint's radius: its frame, the buttons' size, from its centre pixel to its edge.
const HINT_RADIUS = (BUTTON_FRAME - 1) / 2;

// Each button presses within TOUCH_CIRCLE_RADIUS plus the hint's radius of its centre, so a drag,
// which starts only off the buttons, draws the hint clear of each button's TOUCH_CIRCLE_RADIUS;
// the two circles are cut along the line midway between the centres, so they meet and never
// overlap. Jump's reaches on into the screen's bottom-right corner, away from Use: the rect from
// its centre to the corner, where a thumb reaching for it lands.
const RADIUS = TOUCH_CIRCLE_RADIUS + HINT_RADIUS;
const USE_HIT: PressShape = { awayFrom: JUMP_CENTRE, centre: USE_CENTRE, radius: RADIUS };
const JUMP_HIT: PressShape = [
  { awayFrom: USE_CENTRE, centre: JUMP_CENTRE, radius: RADIUS },
  {
    height: SCREEN.height - JUMP_CENTRE.y,
    width: SCREEN.width - JUMP_CENTRE.x,
    x: JUMP_CENTRE.x,
    y: JUMP_CENTRE.y,
  },
];

// Art's touch buttons, in base pixels: each button's centre, where it is drawn, and the area a
// touch must start in to take it (hitAreas.ts).
export const TOUCH_CONTROLS: Readonly<
  Record<TouchControl, { art: Rect; centre: Point; hit: PressShape }>
> = {
  jump: { art: JUMP_ART, centre: JUMP_CENTRE, hit: JUMP_HIT },
  use: { art: USE_ART, centre: USE_CENTRE, hit: USE_HIT },
};

// The touch buttons' press areas, for pressedArea.
export const TOUCH_PRESS_AREAS: readonly PressArea<TouchControl>[] = (
  Object.keys(TOUCH_CONTROLS) as TouchControl[]
).map((key) => ({ art: TOUCH_CONTROLS[key].art, hit: TOUCH_CONTROLS[key].hit, key }));

// Art's move hint, a drawing with no press area of its own (movement is the floating drag
// everywhere off the buttons): a ring in a frame the buttons' size, centred at rest on centre,
// anchored to the canvas's bottom-left corner, and a knob that moves from the ring's centre at
// most knobReach pixels left or right the way the drag goes. At rest its centre is level with
// Jump's and mirrors Use's across the screen: as far in from the left edge as Use's is from the
// right. Anchored to opposite bottom corners, the two keep that in every canvas.
const MOVE_HINT_CENTRE: Point = { x: SCREEN.width - 1 - USE_CENTRE.x, y: JUMP_CENTRE.y };
export const MOVE_HINT = {
  art: buttonArt(MOVE_HINT_CENTRE),
  centre: MOVE_HINT_CENTRE,
  knobReach: 12,
} as const;
