import type { Rect } from "../data/types";
import { TEXT_BUTTON } from "./buttonLabel";
import { CARD_FRAME, CARD_WIDTH } from "./cardFrame";
import { labelledButton } from "./restartCard";

const CARD: Rect = { height: 176, width: CARD_WIDTH, x: 176, y: 16 };
const INSET = 8;
const ACTION_WIDTH = (CARD.width - 2 * INSET - TEXT_BUTTON.gap) / 2;
const action = (x: number) =>
  labelledButton(
    { height: TEXT_BUTTON.height, width: ACTION_WIDTH, x, y: 136 },
    TEXT_BUTTON.labelDy,
  );

// The corpse remains visible below this required card, which has no close control.
export const DEATH_CARD = {
  card: CARD,
  home: action(CARD.x + INSET),
  level: {
    height: 20,
    width: CARD.width - 2 * CARD_FRAME.padding,
    x: CARD.x + CARD_FRAME.padding,
    y: 44,
  } satisfies Rect,
  progress: {
    height: 24,
    width: CARD.width - 2 * CARD_FRAME.padding,
    x: CARD.x + CARD_FRAME.padding,
    y: 92,
  } satisfies Rect,
  retry: action(CARD.x + INSET + ACTION_WIDTH + TEXT_BUTTON.gap),
  time: {
    height: 24,
    width: CARD.width - 2 * CARD_FRAME.padding,
    x: CARD.x + CARD_FRAME.padding,
    y: 64,
  } satisfies Rect,
} as const;

export const DEATH_PROGRESS_HEIGHT = 2;
