import type { BitmapFont } from "@andornaut/game-kit/text/bitmapFont";

import { SCREEN } from "../data/screen";
import { dialogueLines } from "../dialogue/conversation";
import {
  CARD_CONTENT,
  cardActions,
  cardActionsSize,
  cardTextSize,
  contentCardLayout,
} from "./contentCard";

export function dialogueChoiceLayout(
  font: BitmapFont,
  prompt: string,
  options: readonly { readonly id: string; readonly label: string }[],
) {
  const text = dialogueLines(
    font,
    { lines: 3, scale: 2 },
    SCREEN.width - 2 * CARD_CONTENT.padding,
    prompt,
  ).join("\n");
  const labels = options.map(({ label }) => label);
  const layout = contentCardLayout({ ...SCREEN, x: 0, y: 0 }, [
    { key: "question", ...cardTextSize(font, text) },
    { key: "actions", ...cardActionsSize(font, "stack", labels) },
  ]);
  const buttons = cardActions(font, "stack", layout.groups.actions!, labels);
  return {
    buttons: options.map(({ id }, index) => ({ id, layout: buttons[index]! })),
    card: layout.card,
    question: layout.groups.question!,
    text,
  };
}
