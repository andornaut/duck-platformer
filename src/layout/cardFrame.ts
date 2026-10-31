import type { Point, Rect } from "../data/types";
import { hitAround } from "./hitAreas";

export const CARD_TEXT_SCALE = 2;

// Every card's frame (art/README.md, Pause, settings and install cards), in base pixels: art's
// `ui-settings-card` with no header band, CARD_WIDTH wide at CARD_AT, each card as tall as its
// contents. Its title sits centred across it near the top, its close X at its top-right corner,
// and its first row or button starts firstRowY down, the same on every card, so a new card takes
// these too. Text on the face is inset at least padding from its sides.
export const CARD_AT: Point = { x: 176, y: 88 };
export const CARD_WIDTH = 368;

const CLOSE_ART: Rect = { height: 24, width: 24, x: CARD_AT.x + CARD_WIDTH - 34, y: CARD_AT.y + 6 };

export const CARD_FRAME = {
  // The close X, drawn at the card's top right, and its press area.
  close: {
    art: CLOSE_ART,
    at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
    hit: hitAround(CLOSE_ART),
  },
  firstRowY: CARD_AT.y + 48,
  padding: 14,
  titleY: CARD_AT.y + 8,
} as const;

// A card as tall as height, at CARD_AT.
export function cardRect(height: number): Rect {
  return { height, width: CARD_WIDTH, ...CARD_AT };
}

// The origin of a card's title, advance px wide (its advance width at its scale), centred across
// card as art centres it: 2 px of the advance either side is not ink.
export function cardTitleAt(card: Rect, advance: number): Point {
  return {
    x: card.x + card.width / 2 - 2 - Math.floor((advance - 4) / 2),
    y: card.y + CARD_FRAME.titleY - CARD_AT.y,
  };
}
