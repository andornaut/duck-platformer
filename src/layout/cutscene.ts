import { SCREEN } from "../data/screen";
import { TEXT_BUTTON } from "./buttonLabel";
import { labelledButton } from "./labelledButton";
import { MAP_SCREEN } from "./mapScreen";

const footer = MAP_SCREEN.continue.button;

export const CUTSCENE_CONTINUE = labelledButton(
  { ...footer, x: (SCREEN.width - footer.width) / 2 },
  TEXT_BUTTON.labelDy,
);
