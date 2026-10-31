import type { DuckTuning, Point, Rect, Size } from "../data/types";
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
  // The ascent profile ends on a late release, ceiling contact or apex.
  readonly jumpRise: "free" | "held" | "hop";
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
    jumpRise: "free",
    vx: 0,
    vy: 0,
    x: start.x - tuning.width / 2,
    y: start.y - tuning.height,
  };
}

export function duckBox(tuning: DuckTuning, duck: DuckState): Rect {
  return { height: tuning.height, width: tuning.width, x: duck.x, y: duck.y };
}

// The whole-pixel rect her drawn frame, frame big, covers: its bottom edge on her collision
// box's bottom edge and its horizontal centre on the box's, where the zone draws her sprite.
export function duckFrameRect(tuning: DuckTuning, frame: Size, duck: DuckState): Rect {
  return {
    height: frame.height,
    width: frame.width,
    x: Math.round(duck.x + tuning.width / 2 - frame.width / 2),
    y: Math.round(duck.y + tuning.height - frame.height),
  };
}

// Moves speed toward target by at most step.
function approach(speed: number, target: number, step: number): number {
  return speed < target ? Math.min(target, speed + step) : Math.max(target, speed - step);
}

// Smoothly add height and restore normal ascent gravity as a hold passes the tap window.
function jumpProfile(tuning: DuckTuning, heldFor: number): { gravity: number; height: number } {
  const progress = Math.max(0, Math.min(1, (heldFor - tuning.jumpTapWindow) / tuning.jumpLiftTime));
  const lift = progress * progress * (3 - 2 * progress);
  const hopGravity = (2 * tuning.jumpHopHeight) / tuning.jumpHopTime ** 2;
  const fullHeight = tuning.jumpSpeed ** 2 / (2 * tuning.gravity);
  return {
    gravity: hopGravity + (tuning.gravity - hopGravity) * lift,
    height: tuning.jumpHopHeight + (fullHeight - tuning.jumpHopHeight) * lift,
  };
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
  let jumpRise = duck.jumpRise;
  // Seconds Jump was held before this step, since it started her jump.
  let heldBefore = duck.jumpHeldFor;
  if ((jumpPressed || bufferLeft > 0) && (duck.grounded || duck.coyoteLeft > 0)) {
    vy = -(2 * tuning.jumpHopHeight) / tuning.jumpHopTime;
    bufferLeft = 0;
    coyoteLeft = 0;
    heldBefore = 0;
    // A buffered press already released remains a low hop.
    jumpRise = input.jumpHeld ? "held" : "hop";
  }
  const jumpHeldFor = input.jumpHeld ? heldBefore + seconds : 0;
  const released = duck.jumpHeld && !input.jumpHeld;
  if (released && vy < 0 && jumpRise === "held") {
    const earned = jumpProfile(tuning, Math.max(0, heldBefore - seconds));
    if (heldBefore - seconds <= tuning.jumpTapWindow) {
      jumpRise = "hop";
    } else {
      jumpRise = "free";
      // Freeze the earned apex and restore normal gravity without adding more lift.
      vy *= Math.sqrt(tuning.gravity / earned.gravity);
    }
  }
  let gravity = tuning.gravity;
  if (vy < 0 && jumpRise !== "free") {
    const profile = jumpProfile(tuning, jumpRise === "held" ? heldBefore : 0);
    gravity = profile.gravity;
    if (jumpRise === "held") {
      const previous = jumpProfile(tuning, Math.max(0, heldBefore - seconds));
      // Add only the newly earned lift. Replacing speed from remaining height every step
      // would counter gravity near the apex and prevent the duck from beginning to fall.
      const energy = vy ** 2 / previous.gravity + 2 * (profile.height - previous.height);
      vy = -Math.sqrt(gravity * energy);
    }
  }
  vy = Math.min(vy + gravity * seconds, tuning.flutterFallSpeed);
  if (vy >= 0) {
    jumpRise = "free";
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
      }
      vy = 0;
      jumpRise = "free";
    }
  }
  const bottom = duck.y + tuning.height;
  for (const ledge of ledges) {
    const box = { height: tuning.height, width: tuning.width, x, y };
    if (vy > 0 && bottom <= ledge.y + EDGE && overlaps(box, ledge)) {
      y = ledge.y - tuning.height;
      grounded = true;
      vy = 0;
      jumpRise = "free";
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
    jumpRise,
    vx,
    vy,
    x,
    y,
  };
}
