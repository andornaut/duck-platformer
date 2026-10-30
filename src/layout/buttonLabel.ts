import type { Rect } from "../data/types";

// Standard menu action geometry, shared by start-screen and card buttons.
export const TEXT_BUTTON = { gap: 8, height: 48, labelDy: 13 } as const;

// A mark drawn just before a button's label, such as Resume's play triangle: its width, and the
// gap from it to the label's ink.
export interface LabelMark {
  readonly gap: number;
  readonly width: number;
}

// Art's optional play mark: 5 wide, 6 from the label's ink, its top MARK_DROP below the label's
// origin. Its ink colour suits a light button face.
export const PLAY_MARK: LabelMark = { gap: 6, width: 5 };
export const MARK_DROP = 4;

// Where a button's label starts, with its mark before it when it has one, so that the two are
// centred across the button as one group: the group starts at the button's centre less half the
// group's width, rounded down.
export function centredLabel(
  button: Rect,
  labelInk: number,
  mark?: LabelMark,
): { readonly labelX: number; readonly markX?: number } {
  const lead = mark === undefined ? 0 : mark.width + mark.gap;
  const left = button.x + Math.floor(button.width / 2) - Math.floor((lead + labelInk) / 2);
  return mark === undefined ? { labelX: left } : { labelX: left + lead, markX: left };
}
