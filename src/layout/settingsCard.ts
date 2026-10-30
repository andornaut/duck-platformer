import type { Point, Rect } from "../data/types";
import { hitAround } from "./hitAreas";

// Art's settings card (art/README.md, Pause, settings and install cards), in base pixels: the
// pause card's frame, title and close X, then the Move controls and Action buttons rows and,
// while the game can be installed, the Install row, over the build label. Each row is its own
// hit area. Each label's point is its text's top-left. A setting row's state text ends at
// stateRight, before its checkbox; the Install button's label is centred across the button at
// labelY, or pressedLabelY while pressed, in at most room pixels; the build label is centred on
// centreX.
// The close X, drawn at the card's top right on every card, and its press area.
const CLOSE_ART: Rect = { height: 24, width: 24, x: 510, y: 94 };
const CLOSE = {
  art: CLOSE_ART,
  at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
  hit: hitAround(CLOSE_ART),
};
const ROW = { height: 48, width: 352, x: 184 } as const;
const INSTALL_ROW: Rect = { ...ROW, y: 240 };

// A setting row at y: its checkbox, icon and label, each placed from the row's top, and its
// state text ending at stateRight.
function settingRow(y: number) {
  const row: Rect = { ...ROW, y };
  return {
    checkbox: { x: 504, y: y + 14 } satisfies Point,
    hit: hitAround(row),
    icon: { x: 198, y: y + 16 } satisfies Point,
    label: { x: 228, y: y + 15 } satisfies Point,
    row,
    stateRight: 494,
  };
}

// Each row's press area, hit, is the row grown by hitAreas.ts's rule.
export const SETTINGS_CARD = {
  actionButtons: settingRow(188),
  buildLabel: { centreX: 360, y: 296, yWithoutInstall: 244 },
  card: { height: 236, width: 368, x: 176, y: 88 } satisfies Rect,
  cardWithoutInstall: { height: 184, width: 368, x: 176, y: 88 } satisfies Rect,
  close: CLOSE,
  install: {
    button: { height: 28, width: 72, x: 452, y: 250 } satisfies Rect,
    buttonLabel: { pressedY: 255, room: 56, y: 253 },
    hit: hitAround(INSTALL_ROW),
    icon: { x: 198, y: 256 } satisfies Point,
    label: { x: 228, y: 255 } satisfies Point,
    row: INSTALL_ROW,
  },
  moveControls: settingRow(136),
  title: { x: 190, y: 93 } satisfies Point,
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
