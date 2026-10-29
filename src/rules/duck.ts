import type { DuckTuning, Point, Rect } from "../data/types";
import { overlaps } from "./rect";

// What the player asks of the duck this step. jumpHeld is the button's state; a jump starts on
// the step it goes down.
export interface DuckInput {
  readonly jumpHeld: boolean;
  readonly move: -1 | 0 | 1;
}

export interface DuckState {
  readonly facing: -1 | 1;
  // After a jump, until she lands: her fall is capped at the flutter speed.
  readonly fluttering: boolean;
  readonly grounded: boolean;
  readonly jumpHeld: boolean;
  readonly vx: number;
  readonly vy: number;
  // Her collision box's top-left corner.
  readonly x: number;
  readonly y: number;
}

export function startDuck(tuning: DuckTuning, start: Point): DuckState {
  return {
    facing: 1,
    fluttering: false,
    grounded: false,
    jumpHeld: false,
    vx: 0,
    vy: 0,
    x: start.x - tuning.width / 2,
    y: start.y - tuning.height,
  };
}

export function duckBox(tuning: DuckTuning, duck: DuckState): Rect {
  return { height: tuning.height, width: tuning.width, x: duck.x, y: duck.y };
}

// Moves speed toward target by at most step.
function approach(speed: number, target: number, step: number): number {
  return speed < target ? Math.min(target, speed + step) : Math.max(target, speed - step);
}

// One fixed step of seconds: steer, jump, fall, then move along x and along y in turn, each
// stopped at the first solid in the way.
export function stepDuck(
  tuning: DuckTuning,
  solids: readonly Rect[],
  seconds: number,
  input: DuckInput,
  duck: DuckState,
): DuckState {
  const accel = duck.grounded ? tuning.groundAccel : tuning.airAccel;
  let vx = approach(duck.vx, input.move * tuning.walkSpeed, accel * seconds);
  let vy = duck.vy;
  let fluttering = duck.fluttering;

  const jumpPressed = input.jumpHeld && !duck.jumpHeld;
  if (jumpPressed && duck.grounded) {
    vy = -tuning.jumpSpeed;
    fluttering = true;
  } else if (!input.jumpHeld && duck.jumpHeld && vy < 0) {
    vy *= tuning.jumpReleaseCut;
  }
  vy += tuning.gravity * seconds;
  vy = Math.min(vy, fluttering ? tuning.flutterFallSpeed : tuning.maxFallSpeed);

  let x = duck.x + vx * seconds;
  for (const solid of solids) {
    const box = { height: tuning.height, width: tuning.width, x, y: duck.y };
    if (overlaps(box, solid)) {
      x = vx > 0 ? solid.x - tuning.width : solid.x + solid.width;
      vx = 0;
    }
  }

  // grounded is found afresh each step: standing on a solid, gravity carries her a fraction of a
  // pixel into it, and the check below lands her again.
  let y = duck.y + vy * seconds;
  let grounded = false;
  for (const solid of solids) {
    const box = { height: tuning.height, width: tuning.width, x, y };
    if (overlaps(box, solid)) {
      if (vy > 0) {
        y = solid.y - tuning.height;
        grounded = true;
      } else {
        y = solid.y + solid.height;
      }
      vy = 0;
    }
  }
  if (grounded) {
    fluttering = false;
  }

  return {
    facing: input.move === 0 ? duck.facing : input.move,
    fluttering,
    grounded,
    jumpHeld: input.jumpHeld,
    vx,
    vy,
    x,
    y,
  };
}
