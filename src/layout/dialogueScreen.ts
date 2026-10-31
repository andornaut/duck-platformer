import { SCREEN } from "../data/screen";
import type { Point, Rect } from "../data/types";
import { TEXT_BUTTON } from "./buttonLabel";
import { labelledButton } from "./restartCard";

const EDGE = 8;
const CONTENT_INSET = 16;

// Dialogue art's fixed top panel, portrait and three lines at the shared font scale.
export const DIALOGUE_SCREEN = {
  box: { height: 96, width: 640, x: 40, y: 8 } satisfies Rect,
  forward: { x: 653, y: 75 } satisfies Point,
  name: { x: 130, y: 10 } satisfies Point,
  portrait: { x: 50, y: 24 } satisfies Point,
  portraitFrame: { x: 48, y: 22 } satisfies Point,
  text: { lines: 3, pitch: 20, scale: 2, width: 504, x: 128, y: 42 },
} as const;

export function dialogueNameTab(nameWidth: number): Rect {
  return { height: 20, width: nameWidth + 12, x: 124, y: 13 };
}

// Skip is an ordinary secondary action, ending one view-edge inset from the top-right.
export function dialogueSkipButton(labelWidth: number) {
  const width = Math.max(TEXT_BUTTON.height, labelWidth + 2 * CONTENT_INSET);
  return labelledButton(
    { height: TEXT_BUTTON.height, width, x: SCREEN.width - EDGE - width, y: EDGE },
    TEXT_BUTTON.labelDy,
  );
}
