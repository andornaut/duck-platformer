import type { Point } from "../data/types";
import {
  KNOB_TRAVEL,
  MOVE_DEAD_ZONE,
  TOUCH_CONTROLS,
  type TouchControl,
} from "../layout/touchControls";
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

// The control a touch starting at point takes, if any. It keeps that control until it lifts.
export function controlAt(point: Point): TouchControl | undefined {
  return (Object.keys(TOUCH_CONTROLS) as TouchControl[]).find((control) =>
    contains(TOUCH_CONTROLS[control].hit, point),
  );
}

// A move touch's direction from its x offset to the ring's centre.
export function moveFromOffset(dx: number): -1 | 0 | 1 {
  if (dx > MOVE_DEAD_ZONE) {
    return 1;
  }
  return dx < -MOVE_DEAD_ZONE ? -1 : 0;
}

export function knobOffset(dx: number): number {
  return Math.max(-KNOB_TRAVEL, Math.min(KNOB_TRAVEL, dx));
}

// Each held touch: the control it took and where it is now.
export interface HeldTouch {
  readonly control: TouchControl;
  readonly x: number;
}

export function touchIntent(touches: readonly HeldTouch[]): Intent {
  const mover = touches.find((touch) => touch.control === "move");
  return {
    interact: touches.some((touch) => touch.control === "interact"),
    jump: touches.some((touch) => touch.control === "jump"),
    move: mover ? moveFromOffset(mover.x - TOUCH_CONTROLS.move.centre.x) : 0,
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
