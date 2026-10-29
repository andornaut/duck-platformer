import type { Point, TouchTuning } from "../data/types";
import { TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { contains } from "../rules/rect";

// What the player is asking for, from the keyboard and the touch controls together.
export interface Intent {
  readonly interact: boolean;
  readonly jump: boolean;
  readonly move: -1 | 0 | 1;
}

const LEFT_KEYS = ["ArrowLeft", "KeyA"];
const RIGHT_KEYS = ["ArrowRight", "KeyD"];
const JUMP_KEYS = ["ArrowUp", "KeyW", "Space"];
const INTERACT_KEYS = ["KeyE"];

// The keys held, by KeyboardEvent.code. Left and right together cancel.
export function keyIntent(held: ReadonlySet<string>): Intent {
  const left = LEFT_KEYS.some((key) => held.has(key));
  const right = RIGHT_KEYS.some((key) => held.has(key));
  return {
    interact: INTERACT_KEYS.some((key) => held.has(key)),
    jump: JUMP_KEYS.some((key) => held.has(key)),
    move: left === right ? 0 : left ? -1 : 1,
  };
}

// What a touch does: hold the button it starts on, or else move her.
export type TouchUse = TouchControl | "move";

// The use a touch starting at point takes. It keeps that use until it lifts.
export function touchUseAt(point: Point): TouchUse {
  return (
    (Object.keys(TOUCH_CONTROLS) as TouchControl[]).find((control) =>
      contains(TOUCH_CONTROLS[control].hit, point),
    ) ?? "move"
  );
}

// A move touch's direction from its x offset to where it started.
export function moveFromOffset(tuning: TouchTuning, dx: number): -1 | 0 | 1 {
  if (dx > tuning.moveDeadZone) {
    return 1;
  }
  return dx < -tuning.moveDeadZone ? -1 : 0;
}

// Each held touch, in the order they started: its use, the x it started at and its x now.
export interface HeldTouch {
  readonly startX: number;
  readonly use: TouchUse;
  readonly x: number;
}

// Of two move touches, the later one moves her.
export function touchIntent(tuning: TouchTuning, touches: readonly HeldTouch[]): Intent {
  const mover = touches.filter((touch) => touch.use === "move").at(-1);
  return {
    interact: touches.some((touch) => touch.use === "interact"),
    jump: touches.some((touch) => touch.use === "jump"),
    move: mover ? moveFromOffset(tuning, mover.x - mover.startX) : 0,
  };
}

// Either source asking counts. Opposite moves cancel.
export function combineIntents(a: Intent, b: Intent): Intent {
  const sum = a.move + b.move;
  return {
    interact: a.interact || b.interact,
    jump: a.jump || b.jump,
    move: sum > 0 ? 1 : sum < 0 ? -1 : 0,
  };
}
