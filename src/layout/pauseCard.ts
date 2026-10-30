import { SCREEN } from "../data/screen";
import type { Point, Rect } from "../data/types";
import { hitAround } from "./hitAreas";
import { TOUCH_CONTROLS } from "./touchControls";

// Art's pause card (art/README.md, Pause, settings and install cards), in base pixels: a 9-slice
// card with the title in its header, the close X at its top right, the Settings and Return home
// rows, and Resume at the foot. Each label's point is its text's top-left. Resume's label, centred
// with its play mark, starts at labelY, sinking to pressedLabelY while Resume is pressed. Each
// button's press area, hit, is its drawn button grown by hitAreas.ts's rule.
const CLOSE_ART: Rect = { height: 24, width: 24, x: 510, y: 94 };
const HOME_ROW: Rect = { height: 48, width: 352, x: 184, y: 188 };
const RESUME_ART: Rect = { height: 44, width: 160, x: 280, y: 264 };
const SETTINGS_ROW: Rect = { height: 48, width: 352, x: 184, y: 136 };

export const PAUSE_CARD = {
  card: { height: 236, width: 368, x: 176, y: 88 } satisfies Rect,
  close: {
    art: CLOSE_ART,
    at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
    hit: hitAround(CLOSE_ART),
  },
  home: {
    hit: hitAround(HOME_ROW),
    icon: { x: 198, y: 204 } satisfies Point,
    label: { x: 228, y: 203 } satisfies Point,
    row: HOME_ROW,
  },
  resume: {
    art: RESUME_ART,
    hit: hitAround(RESUME_ART),
    labelY: 275,
    pressedLabelY: 277,
  },
  settings: {
    hit: hitAround(SETTINGS_ROW),
    icon: { x: 198, y: 152 } satisfies Point,
    label: { x: 228, y: 151 } satisfies Point,
    row: SETTINGS_ROW,
  },
  title: { x: 190, y: 93 } satisfies Point,
} as const;

// Art's pause button in the game's top-left corner: where its frame is drawn, and the area a
// press must land in, its frame grown by hitAreas.ts's rule. Its frame sits as far in from the
// top-left corner as Jump's from the bottom-right, so, each drawn 1px inside its frame, the
// disc's edge mirrors Jump's ring's.
const JUMP_ART = TOUCH_CONTROLS.jump.art;
const PAUSE_ART: Rect = {
  height: 35,
  width: 35,
  x: SCREEN.width - (JUMP_ART.x + JUMP_ART.width),
  y: SCREEN.height - (JUMP_ART.y + JUMP_ART.height),
};

export const PAUSE_BUTTON = {
  art: PAUSE_ART,
  at: { x: PAUSE_ART.x, y: PAUSE_ART.y } satisfies Point,
  hit: hitAround(PAUSE_ART),
} as const;

// Text on the card is set at this scale: art's fonts are native at 8px and drawn at 2x.
export const CARD_TEXT_SCALE = 2;
