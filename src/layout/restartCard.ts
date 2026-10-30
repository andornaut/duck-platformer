import type { Point, Rect } from "../data/types";
import { hitAround } from "./hitAreas";

// A button with a label: where it is drawn, its press area, and its label's origin y, at rest and
// pressed (the label sinks with the pressed face).
export interface LabelledButton {
  readonly button: Rect;
  readonly hit: Rect;
  readonly labelY: number;
  readonly pressedLabelY: number;
}

// A pressed button's label sinks this far.
const PRESSED_SINK = 2;

// A labelled button drawn at button, its label's origin labelDy below its top.
export function labelledButton(button: Rect, labelDy: number): LabelledButton {
  return {
    button,
    hit: hitAround(button),
    labelY: button.y + labelDy,
    pressedLabelY: button.y + labelDy + PRESSED_SINK,
  };
}

// The card that asks before Restart clears progress, in base pixels, from the settings card's
// parts: the card and its title, the question in body text at most room wide, then Cancel and
// Restart side by side, each art's `ui-button` stretched, its label centred across it.
export const RESTART_CARD = {
  cancel: labelledButton({ height: 36, width: 144, x: 208, y: 196 }, 7),
  card: { height: 168, width: 368, x: 176, y: 88 } satisfies Rect,
  question: { x: 198, y: 140 } satisfies Point,
  restart: labelledButton({ height: 36, width: 144, x: 368, y: 196 }, 7),
  room: 324,
  title: { x: 190, y: 93 } satisfies Point,
} as const;

// PLACEHOLDER: the celebration screen after the last zone, until art draws one: the settings
// card's parts over ink, its title, the message in body text at most room wide, then Restart (art's
// `ui-button` stretched) and Continue (art's `ui-resume`, led by the play mark) side by side.
export const CELEBRATION = {
  card: { height: 184, width: 368, x: 176, y: 88 } satisfies Rect,
  continue: labelledButton({ height: 44, width: 160, x: 368, y: 208 }, 11),
  message: { x: 198, y: 140 } satisfies Point,
  restart: labelledButton({ height: 44, width: 160, x: 192, y: 208 }, 11),
  room: 324,
  title: { x: 190, y: 93 } satisfies Point,
} as const;
