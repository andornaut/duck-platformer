import type { Point, Rect } from "../data/types";
import { CARD_FRAME, cardRect } from "./cardFrame";
import { hitAround } from "./hitAreas";
import { CONTROL_EDGE } from "./playView";
import { type LabelledButton, labelledButton } from "./restartCard";

// Art's pause card (art/README.md, Pause, settings and install cards), in base pixels: every
// card's frame, title and close X (cardFrame.ts), then three buttons of one shape, stacked from
// its first row down: Resume, the primary, then Settings and Back to title. Each button's label is
// centred across it (Resume's led by the play mark), labelDy below its top and 2 lower while
// pressed. Each button's press area, hit, is its drawn button grown by hitAreas.ts's rule.
const BUTTON = { gap: 8, height: 40, labelDy: 9, width: 320, x: 200 } as const;
// The button at index down the stack.
const button = (index: number): LabelledButton =>
  labelledButton(
    {
      height: BUTTON.height,
      width: BUTTON.width,
      x: BUTTON.x,
      y: CARD_FRAME.firstRowY + index * (BUTTON.height + BUTTON.gap),
    },
    BUTTON.labelDy,
  );

export const PAUSE_CARD = {
  card: cardRect(200),
  close: CARD_FRAME.close,
  home: button(2),
  resume: button(0),
  settings: button(1),
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
