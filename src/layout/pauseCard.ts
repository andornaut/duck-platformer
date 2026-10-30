import type { Point, Rect } from "../data/types";
import { HIT_MARGINS, hitAround } from "./hitAreas";

// Art's pause card (art/README.md, Pause, settings and install cards), in base pixels: a 9-slice
// card with the title in its header, the close X at its top right, the Settings and Return home
// rows, and Resume at the foot. Each label's point is its text's top-left. Resume's label, centred
// with its play mark, starts at labelY, sinking to pressedLabelY while Resume is pressed. Each
// button's press area, hit, is its drawn button grown by hitAreas.ts's button margin.
const CLOSE_ART: Rect = { height: 24, width: 24, x: 510, y: 94 };
const HOME_ROW: Rect = { height: 48, width: 352, x: 184, y: 188 };
const RESUME_ART: Rect = { height: 44, width: 160, x: 280, y: 264 };
const SETTINGS_ROW: Rect = { height: 48, width: 352, x: 184, y: 136 };

export const PAUSE_CARD = {
  card: { height: 236, width: 368, x: 176, y: 88 } satisfies Rect,
  close: {
    art: CLOSE_ART,
    at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
    hit: hitAround(HIT_MARGINS.button, CLOSE_ART),
  },
  home: {
    hit: hitAround(HIT_MARGINS.button, HOME_ROW),
    icon: { x: 198, y: 204 } satisfies Point,
    label: { x: 228, y: 203 } satisfies Point,
    row: HOME_ROW,
  },
  resume: {
    art: RESUME_ART,
    hit: hitAround(HIT_MARGINS.button, RESUME_ART),
    labelY: 275,
    pressedLabelY: 277,
  },
  settings: {
    hit: hitAround(HIT_MARGINS.button, SETTINGS_ROW),
    icon: { x: 198, y: 152 } satisfies Point,
    label: { x: 228, y: 151 } satisfies Point,
    row: SETTINGS_ROW,
  },
  title: { x: 190, y: 93 } satisfies Point,
} as const;

// Art's pause button in the game's top-left corner: where its frame is drawn, and the area a
// press must land in, its frame grown by hitAreas.ts's touch-control margin.
const PAUSE_ART: Rect = { height: 35, width: 35, x: 9, y: 9 };

export const PAUSE_BUTTON = {
  art: PAUSE_ART,
  at: { x: PAUSE_ART.x, y: PAUSE_ART.y } satisfies Point,
  hit: hitAround(HIT_MARGINS.touchControl, PAUSE_ART),
} as const;

// Text on the card is set at this scale: art's fonts are native at 8px and drawn at 2x.
export const CARD_TEXT_SCALE = 2;
