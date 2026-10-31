import { TEXT_BUTTON } from "./buttonLabel";
import { CARD_AT, CARD_FRAME, CARD_WIDTH, cardRect } from "./cardFrame";
import { labelledButton } from "./restartCard";

const ACTION_INSET = 8;
const STACK_GAP = 4;

// The two-stage picker uses the standard closeable card, one row per catalogue stage.
export const STAGE_SELECT_CARD = {
  buttons: [0, 1].map((index) =>
    labelledButton(
      {
        height: TEXT_BUTTON.height,
        width: CARD_WIDTH - 2 * ACTION_INSET,
        x: CARD_AT.x + ACTION_INSET,
        y: CARD_FRAME.firstRowY + index * (TEXT_BUTTON.height + STACK_GAP),
      },
      TEXT_BUTTON.labelDy,
    ),
  ),
  card: cardRect(176),
  close: CARD_FRAME.close,
} as const;
