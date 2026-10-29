import type { DuckTuning, Point, Rect } from "../data/types";
import { overlaps } from "./rect";

// Pixels of rounding error allowed when she stands exactly on an edge.
export const EDGE = 1e-6;

// What the player asks of the duck this step. jumpHeld is the button's state; a jump starts on
// the step it goes down.
export interface DuckInput {
  readonly jumpHeld: boolean;
  readonly move: -1 | 0 | 1;
}

export interface DuckState {
  // Seconds a pressed jump still waits to start, should she land or still be in coyote time.
  readonly bufferLeft: number;
  // Speed along x carried from a moving platform she left, kept until she lands or meets a wall.
  readonly carryVx: number;
  // Seconds after leaving the ground in which a jump still starts. 0 once she has jumped.
  readonly coyoteLeft: number;
  readonly facing: -1 | 1;
  readonly grounded: boolean;
  readonly jumpHeld: boolean;
  // Seconds Jump has been held since it started her jump; 0 while it is up.
  readonly jumpHeldFor: number;
  // Seconds a still-held jump keeps her rising at jumpSpeed once its tap window has passed. 0 once
  // Jump is released or she meets a ceiling.
  readonly jumpHoldLeft: number;
  readonly vx: number;
  readonly vy: number;
  // Her collision box's top-left corner.
  readonly x: number;
  readonly y: number;
}

export function startDuck(tuning: DuckTuning, start: Point): DuckState {
  return {
    bufferLeft: 0,
    carryVx: 0,
    coyoteLeft: 0,
    facing: 1,
    grounded: false,
    jumpHeld: false,
    jumpHeldFor: 0,
    jumpHoldLeft: 0,
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
// stopped at the first solid in the way. Ledges stop her only from above: falling onto one from
// at or above its top, never rising or walking through it. Every fall flutters: it never passes
// the flutter speed.
export function stepDuck(
  tuning: DuckTuning,
  solids: readonly Rect[],
  ledges: readonly Rect[],
  seconds: number,
  input: DuckInput,
  duck: DuckState,
): DuckState {
  const accel = duck.grounded ? tuning.groundAccel : tuning.airAccel;
  let vx = approach(duck.vx, input.move * tuning.walkSpeed, accel * seconds);
  let vy = duck.vy;

  const jumpPressed = input.jumpHeld && !duck.jumpHeld;
  let bufferLeft = jumpPressed ? tuning.jumpBuffer : Math.max(0, duck.bufferLeft - seconds);
  let coyoteLeft = Math.max(0, duck.coyoteLeft - seconds);
  let jumpHoldLeft = input.jumpHeld ? duck.jumpHoldLeft : 0;
  // Seconds Jump was held before this step, since it started her jump.
  let heldBefore = duck.jumpHeldFor;
  if ((jumpPressed || bufferLeft > 0) && (duck.grounded || duck.coyoteLeft > 0)) {
    vy = -tuning.jumpSpeed;
    bufferLeft = 0;
    coyoteLeft = 0;
    // A buffered jump whose button was already released is a hop: no hold.
    jumpHoldLeft = input.jumpHeld ? tuning.jumpHoldTime : 0;
    heldBefore = 0;
  }
  const jumpHeldFor = input.jumpHeld ? heldBefore + seconds : 0;
  // Letting go of a jump held past its tap window while she still rises cuts her climb short. A
  // press let go within the window is a hop, the launch alone, however short it was.
  const released = duck.jumpHeld && !input.jumpHeld;
  if (released && heldBefore >= tuning.jumpTapWindow && vy < 0) {
    vy *= tuning.jumpReleaseCut;
  }
  if (jumpHoldLeft > 0 && heldBefore >= tuning.jumpTapWindow) {
    // Held past the tap window, a jump rises steadily at jumpSpeed until the hold runs out.
    vy = -tuning.jumpSpeed;
    jumpHoldLeft = Math.max(0, jumpHoldLeft - seconds);
  } else {
    vy = Math.min(vy + tuning.gravity * seconds, tuning.flutterFallSpeed);
  }

  let carryVx = duck.carryVx;
  const moving = vx + carryVx;
  let x = duck.x + moving * seconds;
  for (const solid of solids) {
    const box = { height: tuning.height, width: tuning.width, x, y: duck.y };
    if (overlaps(box, solid)) {
      x = moving > 0 ? solid.x - tuning.width : solid.x + solid.width;
      vx = 0;
      carryVx = 0;
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
        jumpHoldLeft = 0;
      }
      vy = 0;
    }
  }
  const bottom = duck.y + tuning.height;
  for (const ledge of ledges) {
    const box = { height: tuning.height, width: tuning.width, x, y };
    if (vy > 0 && bottom <= ledge.y + EDGE && overlaps(box, ledge)) {
      y = ledge.y - tuning.height;
      grounded = true;
      vy = 0;
    }
  }
  if (grounded) {
    coyoteLeft = tuning.coyoteTime;
    carryVx = 0;
  }

  return {
    bufferLeft,
    carryVx,
    coyoteLeft,
    facing: input.move === 0 ? duck.facing : input.move,
    grounded,
    jumpHeld: input.jumpHeld,
    jumpHeldFor,
    jumpHoldLeft,
    vx,
    vy,
    x,
    y,
  };
}
