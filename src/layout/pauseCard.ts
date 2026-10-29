import type { Point, Rect } from "../data/types";

// Art's pause card (art/README.md, Settings), in base pixels: a 9-slice card with the title in
// its header, the close X at its top right, a row per setting and Resume at the foot. Each
// label's point is its text's top-left; the state text ends at stateRight.
//
// PLACEHOLDER: the Quit row and the pause button are not in art's spec yet. Quit is a second row
// one ROW_PITCH under the Touch controls row, which moves Resume and the card's foot down by the
// same; the pause button is a drawn shape in the top-left corner.
const ROW_PITCH = 52;
// A row's label sits this far under the row's top.
const LABEL_DY = 15;
// A row's label starts here, clear of the checkbox.
const LABEL_X = 228;

const TOUCH_ROW: Rect = { height: 48, width: 352, x: 184, y: 136 };
const QUIT_ROW: Rect = { ...TOUCH_ROW, y: TOUCH_ROW.y + ROW_PITCH };

export const PAUSE_CARD = {
  card: { height: 184 + ROW_PITCH, width: 368, x: 176, y: 88 } satisfies Rect,
  close: { at: { x: 510, y: 94 } satisfies Point, hit: { height: 44, width: 44, x: 500, y: 88 } },
  quit: { label: { x: LABEL_X, y: QUIT_ROW.y + LABEL_DY } satisfies Point, row: QUIT_ROW },
  resume: {
    hit: { height: 44, width: 160, x: 280, y: 212 + ROW_PITCH } satisfies Rect,
    label: { x: 339, y: 223 + ROW_PITCH } satisfies Point,
  },
  title: { x: 190, y: 93 } satisfies Point,
  touchControls: {
    checkbox: { x: 196, y: 150 } satisfies Point,
    label: { x: LABEL_X, y: TOUCH_ROW.y + LABEL_DY } satisfies Point,
    row: TOUCH_ROW,
    stateRight: 524,
  },
} as const;

// The pause button in the game's top-left corner: the area a press must land in, and the drawn
// button centred in it.
export const PAUSE_BUTTON = {
  face: { height: 28, width: 28, x: 10, y: 10 } satisfies Rect,
  hit: { height: 48, width: 48, x: 0, y: 0 } satisfies Rect,
} as const;

// Text on the card is set at this scale: art's fonts are native at 8px and drawn at 2x.
export const CARD_TEXT_SCALE = 2;
