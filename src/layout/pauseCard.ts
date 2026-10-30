import type { Point, Rect } from "../data/types";
import { hitAround } from "./hitAreas";
import { CONTROL_EDGE } from "./playView";
import { type LabelledButton, labelledButton } from "./restartCard";

// Art's pause card (art/README.md, Pause, settings and install cards), in base pixels: a 9-slice
// card with the title in its header and the close X at its top right, then three buttons of one
// shape, stacked: Resume, the primary, then Settings and Back to title. Each button's label is
// centred across it (Resume's led by the play mark), labelDy below its top and 2 lower while
// pressed. Each button's press area, hit, is its drawn button grown by hitAreas.ts's rule.
const CLOSE_ART: Rect = { height: 24, width: 24, x: 510, y: 94 };
const BUTTON = { height: 40, labelDy: 9, width: 320, x: 200 } as const;
const button = (y: number): LabelledButton =>
  labelledButton({ height: BUTTON.height, width: BUTTON.width, x: BUTTON.x, y }, BUTTON.labelDy);

export const PAUSE_CARD = {
  card: { height: 200, width: 368, x: 176, y: 88 } satisfies Rect,
  close: {
    art: CLOSE_ART,
    at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
    hit: hitAround(CLOSE_ART),
  },
  home: button(232),
  resume: button(136),
  settings: button(184),
  title: { x: 190, y: 93 } satisfies Point,
} as const;

// Art's pause button in the game's top-left corner: where its frame is drawn, and the area a
// press must land in, its frame grown by hitAreas.ts's rule. Art draws the disc 1px inside its
// frame, so the disc's edge sits CONTROL_EDGE in from the view's top and left.
const PAUSE_ART: Rect = { height: 35, width: 35, x: CONTROL_EDGE - 1, y: CONTROL_EDGE - 1 };

export const PAUSE_BUTTON = {
  art: PAUSE_ART,
  at: { x: PAUSE_ART.x, y: PAUSE_ART.y } satisfies Point,
  hit: hitAround(PAUSE_ART),
} as const;

// Text on the card is set at this scale: art's fonts are native at 8px and drawn at 2x.
export const CARD_TEXT_SCALE = 2;
