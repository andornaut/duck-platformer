import type { Point, Rect } from "../data/types";
import { HIT_MARGINS, hitAround } from "./hitAreas";

// Art's settings card (art/README.md, Pause, settings and install cards), in base pixels: the
// pause card's frame, title and close X, then the Touch controls row and, while the game can be
// installed, the Install row, over the build label. Each row is its own hit area. Each label's
// point is its text's top-left. The state text ends at stateRight; the button's label is
// centred across the button at labelY, or pressedLabelY while pressed, in at most room pixels;
// the build label is centred on centreX.
// The close X, drawn at the card's top right on every card, and its press area.
const CLOSE_ART: Rect = { height: 24, width: 24, x: 510, y: 94 };
const CLOSE = {
  art: CLOSE_ART,
  at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
  hit: hitAround(HIT_MARGINS.button, CLOSE_ART),
};
const INSTALL_ROW: Rect = { height: 48, width: 352, x: 184, y: 188 };
const TOUCH_ROW: Rect = { height: 48, width: 352, x: 184, y: 136 };

// Each row's press area, hit, is the row grown by hitAreas.ts's button margin.
export const SETTINGS_CARD = {
  buildLabel: { centreX: 360, y: 244, yWithoutInstall: 192 },
  card: { height: 184, width: 368, x: 176, y: 88 } satisfies Rect,
  cardWithoutInstall: { height: 132, width: 368, x: 176, y: 88 } satisfies Rect,
  close: CLOSE,
  install: {
    button: { height: 28, width: 72, x: 452, y: 198 } satisfies Rect,
    buttonLabel: { pressedY: 203, room: 56, y: 201 },
    hit: hitAround(HIT_MARGINS.button, INSTALL_ROW),
    icon: { x: 198, y: 204 } satisfies Point,
    label: { x: 228, y: 203 } satisfies Point,
    row: INSTALL_ROW,
  },
  title: { x: 190, y: 93 } satisfies Point,
  touchControls: {
    checkbox: { x: 504, y: 150 } satisfies Point,
    hit: hitAround(HIT_MARGINS.button, TOUCH_ROW),
    icon: { x: 198, y: 152 } satisfies Point,
    label: { x: 228, y: 151 } satisfies Point,
    row: TOUCH_ROW,
    stateRight: 494,
  },
} as const;

// Art's install steps card, over the settings for a browser that installs only from its own
// menu: the same frame, title and close X, and two steps, each a glyph and up to lines lines of
// text linePitch apart, at most room wide. The first step's glyph is the browser's button; the
// second's is the install glyph.
export const STEPS_CARD = {
  card: { height: 160, width: 368, x: 176, y: 88 } satisfies Rect,
  close: CLOSE,
  linePitch: 20,
  lines: 2,
  room: 296,
  steps: [
    { glyph: { x: 198, y: 145 } satisfies Point, text: { x: 228, y: 144 } satisfies Point },
    { glyph: { x: 198, y: 197 } satisfies Point, text: { x: 228, y: 196 } satisfies Point },
  ],
  title: { x: 190, y: 93 } satisfies Point,
} as const;

// Art's keyboard focus ring, a 9-slice drawn this far outside the focused row, button or close X
// on every side.
const FOCUS_OUTSET = 4;

export function focusRingAround({ height, width, x, y }: Rect): Rect {
  return {
    height: height + 2 * FOCUS_OUTSET,
    width: width + 2 * FOCUS_OUTSET,
    x: x - FOCUS_OUTSET,
    y: y - FOCUS_OUTSET,
  };
}
