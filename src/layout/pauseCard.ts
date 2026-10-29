import type { Point, Rect } from "../data/types";

// Art's pause card (art/README.md, Pause card), in base pixels: a 9-slice card with the title in
// its header, the close X at its top right, the Touch controls and Quit rows, and Resume at the
// foot. Each label's point is its text's top-left; the state text ends at stateRight. Resume's
// label sinks to pressedLabel while Resume is pressed.
export const PAUSE_CARD = {
  card: { height: 236, width: 368, x: 176, y: 88 } satisfies Rect,
  close: { at: { x: 510, y: 94 } satisfies Point, hit: { height: 44, width: 44, x: 500, y: 88 } },
  quit: {
    icon: { x: 196, y: 202 } satisfies Point,
    label: { x: 228, y: 203 } satisfies Point,
    row: { height: 48, width: 352, x: 184, y: 188 } satisfies Rect,
  },
  resume: {
    hit: { height: 44, width: 160, x: 280, y: 264 } satisfies Rect,
    label: { x: 339, y: 275 } satisfies Point,
    pressedLabel: { x: 339, y: 277 } satisfies Point,
  },
  title: { x: 190, y: 93 } satisfies Point,
  touchControls: {
    checkbox: { x: 196, y: 150 } satisfies Point,
    label: { x: 228, y: 151 } satisfies Point,
    row: { height: 48, width: 352, x: 184, y: 136 } satisfies Rect,
    stateRight: 524,
  },
} as const;

// Art's pause button in the game's top-left corner: where its frame is drawn, and the area a
// press must land in, which reaches the screen's corner.
export const PAUSE_BUTTON = {
  at: { x: 9, y: 9 } satisfies Point,
  hit: { height: 52, width: 52, x: 0, y: 0 } satisfies Rect,
} as const;

// Text on the card is set at this scale: art's fonts are native at 8px and drawn at 2x.
export const CARD_TEXT_SCALE = 2;
