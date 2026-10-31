import type { Rect } from "../data/types";
import { TEXT_BUTTON } from "./buttonLabel";
import { CARD_AT, CARD_FRAME, CARD_WIDTH } from "./cardFrame";
import { labelledButton } from "./restartCard";

const ACTION_INSET = 8;
const STACK_GAP = 4;
export const DIALOGUE_CHOICE = {
  labelRoom: CARD_WIDTH - 2 * ACTION_INSET - 2 * TEXT_BUTTON.inset,
  prompt: { lines: 3, pitch: 20, scale: 2, width: CARD_WIDTH - 2 * CARD_FRAME.padding },
} as const;

// A required card has no close control. Its shared-height buttons follow the wrapped prompt.
export function dialogueChoiceLayout(promptLines: number, ids: readonly string[]) {
  const question = { x: CARD_AT.x + CARD_FRAME.padding, y: CARD_FRAME.titleY };
  const first = Math.max(
    CARD_FRAME.firstRowY,
    question.y + promptLines * DIALOGUE_CHOICE.prompt.pitch + TEXT_BUTTON.gap,
  );
  const buttons = ids.map((id, index) => ({
    id,
    layout: labelledButton(
      {
        height: TEXT_BUTTON.height,
        width: CARD_WIDTH - 2 * ACTION_INSET,
        x: CARD_AT.x + ACTION_INSET,
        y: first + index * (TEXT_BUTTON.height + STACK_GAP),
      },
      TEXT_BUTTON.labelDy,
    ),
  }));
  const bottom = first + ids.length * (TEXT_BUTTON.height + STACK_GAP) - STACK_GAP + ACTION_INSET;
  return {
    buttons,
    card: { height: bottom - CARD_AT.y, width: CARD_WIDTH, ...CARD_AT } satisfies Rect,
    question,
  };
}
