import { SCREEN } from "../data/screen";
import {
  cardActions,
  cardActionsSize,
  type CardFonts,
  cardTextSize,
  contentCardLayout,
} from "./contentCard";

export function stageSelectCard(fonts: CardFonts, title: string, labels: readonly string[]) {
  const layout = contentCardLayout(
    { ...SCREEN, x: 0, y: 0 },
    [{ key: "actions", ...cardActionsSize(fonts.body, "stack", labels) }],
    { close: true, titleWidth: cardTextSize(fonts.title, title).width },
  );
  return {
    buttons: cardActions(fonts.body, "stack", layout.groups.actions!, labels),
    card: layout.card,
    close: layout.close!,
    title: layout.title!,
  };
}
