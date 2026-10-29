import type { Point, Size } from "../data/types";
import { type HeldTouch, knobOffset, moveFromOffset } from "../input/intent";
import { TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { type TagFrame, tagMs } from "./aseprite";

// A pressed control: when its press began, and the suffix its press and held tags carry. The
// move control's names the side pressed; the buttons' is empty.
export interface Press {
  readonly sinceMs: number;
  readonly suffix: string;
}

// The suffix of the press a control's touches make now, or undefined while it rests. The move
// control is pressed on a side once its touch leaves the dead zone.
export function pressSuffix(
  control: TouchControl,
  touches: readonly HeldTouch[],
): string | undefined {
  const touch = touches.find((held) => held.control === control);
  if (!touch) {
    return undefined;
  }
  if (control !== "move") {
    return "";
  }
  const move = moveFromOffset(touch.x - TOUCH_CONTROLS.move.centre.x);
  if (move === 0) {
    return undefined;
  }
  return move < 0 ? "-left" : "-right";
}

// A press that keeps its suffix keeps its start; a new one starts at nowMs.
export function trackPress(
  nowMs: number,
  suffix: string | undefined,
  press: Press | undefined,
): Press | undefined {
  if (suffix === undefined) {
    return undefined;
  }
  return press?.suffix === suffix ? press : { sinceMs: nowMs, suffix };
}

// The tag a control shows: rest, its press tag for as long as that plays, then held until
// release.
export function controlTag(
  tags: ReadonlyMap<string, readonly TagFrame[]>,
  nowMs: number,
  press: Press | undefined,
): string {
  if (!press) {
    return "rest";
  }
  const pressTag = `press${press.suffix}`;
  return nowMs - press.sinceMs < tagMs(tags, pressTag) ? pressTag : `held${press.suffix}`;
}

// The knob is held while a touch holds the move control.
export function knobTag(touches: readonly HeldTouch[]): string {
  return touches.some((touch) => touch.control === "move") ? "held" : "rest";
}

// The top-left of an odd-sized frame whose centre pixel sits on centre.
export function centredAt(centre: Point, frame: Size): Point {
  return { x: centre.x - (frame.width - 1) / 2, y: centre.y - (frame.height - 1) / 2 };
}

// The knob's whole-pixel top-left: centred on the move control, shifted by the move touch's
// offset, capped.
export function knobAt(frame: Size, touches: readonly HeldTouch[]): Point {
  const { centre } = TOUCH_CONTROLS.move;
  const touch = touches.find((held) => held.control === "move");
  const rest = centredAt(centre, frame);
  return { x: rest.x + Math.round(touch ? knobOffset(touch.x - centre.x) : 0), y: rest.y };
}
