import type { Rect } from "../data/types";
import { hitAround } from "./hitAreas";

export interface LabelledButton {
  readonly button: Rect;
  readonly hit: Rect;
  readonly labelY: number;
  readonly pressedLabelY: number;
}

const PRESSED_SINK = 2;

export function labelledButton(button: Rect, labelDy: number): LabelledButton {
  return {
    button,
    hit: hitAround(button),
    labelY: button.y + labelDy,
    pressedLabelY: button.y + labelDy + PRESSED_SINK,
  };
}
