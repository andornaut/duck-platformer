import { containsPoint } from "@andornaut/game-kit/rect";
import type { BitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { bitmapMeasure, fitsRoom, fittingText } from "@andornaut/game-kit/text/textFit";

import type { DialoguePlan, DialogueSpeaker, GameText, Point, Rect } from "../data/types";

export interface DialogueParagraph {
  readonly colour: DialogueSpeaker["colour"];
  readonly name: string;
  readonly portrait: string;
  readonly text: string;
}

// Resolve one linear conversation before showing it, so missing words or speakers fail together.
export function dialogueParagraphs(
  speakers: Readonly<Record<string, DialogueSpeaker>>,
  text: Pick<GameText, "dialogue" | "lines">,
  plan: DialoguePlan,
): readonly DialogueParagraph[] {
  if (plan.lines.length === 0) {
    throw new Error("A dialogue needs at least one paragraph");
  }
  return plan.lines.map(({ line, speaker }) => {
    const who = speakers[speaker];
    const name = text.dialogue.speakers[speaker];
    const paragraph = text.lines[line];
    if (!who || !name?.trim() || !paragraph?.trim()) {
      throw new Error(`Incomplete dialogue paragraph ${line} by ${speaker}`);
    }
    return { ...who, name, text: paragraph };
  });
}

// Wrap at the fixed font size. A paragraph outside its room is rejected rather than shrunk.
export function dialogueLines(
  font: BitmapFont,
  style: { readonly lines: number; readonly scale: number },
  width: number,
  text: string,
): readonly string[] {
  const measure = bitmapMeasure(font);
  const fitted = fittingText(style, measure, width, text);
  if (!fitsRoom(measure, width, fitted)) {
    throw new Error("Dialogue paragraph does not fit its text area");
  }
  return fitted.lines;
}

export type DialogueAction = "advance" | "focusSkip" | "skip";

// Tab focuses Skip; a new key advances, or activates Skip with Enter or Space while focused.
export function dialogueKeyAction(
  skipFocused: boolean,
  { key, repeat }: Pick<KeyboardEvent, "key" | "repeat">,
): DialogueAction | undefined {
  if (repeat || ["Alt", "Control", "Meta", "Shift"].includes(key)) {
    return undefined;
  }
  if (key === "Tab") {
    return "focusSkip";
  }
  return skipFocused && ["Enter", " "].includes(key) ? "skip" : "advance";
}

export interface DialoguePress {
  readonly at: Point;
  readonly cancelled: boolean;
  readonly id: number;
  readonly skip: boolean;
}

// Leaving the tap radius cancels the press even when it later returns to its starting point.
export function moveDialoguePress(
  tapDistance: number,
  at: Point,
  press: DialoguePress,
): DialoguePress {
  return {
    ...press,
    cancelled: press.cancelled || Math.hypot(at.x - press.at.x, at.y - press.at.y) > tapDistance,
  };
}

// A fresh completed tap advances. Skip must be pressed and released inside its press area.
export function dialogueTapAction(
  skipHit: Rect,
  tapDistance: number,
  press: DialoguePress | undefined,
  pointer: Point & { readonly id: number; readonly wasCanceled: boolean },
): Exclude<DialogueAction, "focusSkip"> | undefined {
  if (!press || pointer.id !== press.id || pointer.wasCanceled) {
    return undefined;
  }
  if (moveDialoguePress(tapDistance, pointer, press).cancelled) {
    return undefined;
  }
  const skip = containsPoint(skipHit, pointer.x, pointer.y);
  return press.skip ? (skip ? "skip" : undefined) : skip ? undefined : "advance";
}
