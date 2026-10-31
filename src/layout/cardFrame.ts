import { MODAL_CONTENT } from "@andornaut/game-kit/modalLayout";

import type { Point, Rect } from "../data/types";
import { hitAround } from "./hitAreas";

export const CARD_TEXT_SCALE = 2;

export const CARD_CONTENT = {
  closeInset: 6,
  closeSize: 24,
  gap: 8,
  lineHeight: 16,
  padding: MODAL_CONTENT.padding,
  rowGap: 4,
} as const;

// Fixed frame geometry for the placeholder celebration. Ordinary modal cards measure their
// contents through contentCardLayout.
export const CARD_AT: Point = { x: 176, y: 88 };
export const CARD_WIDTH = 368;

const CLOSE_ART: Rect = {
  height: CARD_CONTENT.closeSize,
  width: CARD_CONTENT.closeSize,
  x: CARD_AT.x + CARD_CONTENT.closeInset,
  y: CARD_AT.y + CARD_CONTENT.closeInset,
};

export const CARD_FRAME = {
  // The close X, drawn at the card's top left, and its press area.
  close: {
    art: CLOSE_ART,
    at: { x: CLOSE_ART.x, y: CLOSE_ART.y } satisfies Point,
    hit: hitAround(CLOSE_ART),
  },
  firstRowY: CARD_AT.y + 48,
  padding: MODAL_CONTENT.padding,
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
