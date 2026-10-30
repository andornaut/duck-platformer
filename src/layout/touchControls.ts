import { SCREEN } from "../data/screen";
import type { Point, Rect } from "../data/types";
import { hitAround, type PressArea } from "./hitAreas";

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

// Jump's press area: its button grown by the rule (hitAround), and on out to the screen's right
// and bottom edges, where a thumb reaching for it lands.
const JUMP_GROWN = hitAround(JUMP_ART);
const JUMP_HIT: Rect = {
  height: SCREEN.height - JUMP_GROWN.y,
  width: SCREEN.width - JUMP_GROWN.x,
  x: JUMP_GROWN.x,
  y: JUMP_GROWN.y,
};

// Art's touch buttons, in base pixels: each button's centre, where it is drawn, the area a touch
// must start in to take it (hitAreas.ts), how far its label's origin sits above the centre, and
// the room for its label: the widest label's ink at LABEL_SCALE.
export const TOUCH_CONTROLS: Readonly<
  Record<
    TouchControl,
    { art: Rect; centre: Point; hit: Rect; labelRaise: number; labelRoom: number }
  >
> = {
  jump: { art: JUMP_ART, centre: JUMP_CENTRE, hit: JUMP_HIT, labelRaise: 1, labelRoom: 53 },
  use: {
    art: USE_ART,
    centre: USE_CENTRE,
    hit: hitAround(USE_ART),
    labelRaise: 3,
    labelRoom: 55,
  },
};

// The touch buttons' press areas, for pressedArea: where Jump's and Use's overlap, the nearer
// button wins.
export const TOUCH_PRESS_AREAS: readonly PressArea<TouchControl>[] = (
  Object.keys(TOUCH_CONTROLS) as TouchControl[]
).map((key) => ({ art: TOUCH_CONTROLS[key].art, hit: TOUCH_CONTROLS[key].hit, key }));

// A button's label is set in font-body at this scale.
export const LABEL_SCALE = 2;
