import type { DuckTuning, ObjectLayout, Point, Rect } from "../data/types";
import { duckBox, type DuckState } from "./duck";
import { overlaps } from "./rect";

export type ChargePhase = "crouch" | "patrol" | "rest" | "rush";

export interface ChargeState {
  readonly active: boolean;
  readonly elapsed: number;
  readonly facing: -1 | 1;
  readonly phase: ChargePhase;
}

// Each straight section of an object's movement, with its times within this step. Stationary
// sections are included so relative swept contact also catches the duck running into it.
export interface ChargeSegment {
  readonly end: number;
  readonly facing: -1 | 1;
  readonly from: Point;
  readonly start: number;
  readonly to: Point;
}

export interface ChargeStep {
  readonly at: Point;
  readonly segments: readonly ChargeSegment[];
  readonly state: ChargeState;
}

export function startCharge(object: ObjectLayout): ChargeState {
  const direction = object.motion.direction === "left" ? -1 : 1;
  return {
    active: object.scene === undefined,
    elapsed: 0,
    facing: object.phase < 0.5 ? direction : direction === 1 ? -1 : 1,
    phase: "patrol",
  };
}

// Both collision and the rendered danger outline use this fixed box, mirrored as the sprite is.
export function chargeContactBox(object: ObjectLayout, at: Point, facing: -1 | 1): Rect {
  const box = object.hitbox ?? { height: object.height, width: object.width, x: 0, y: 0 };
  return {
    ...box,
    x: at.x + (facing === 1 ? box.x : object.width - box.x - box.width),
    y: at.y + box.y,
  };
}

// A grounded duck near the patrol on the same floor starts a charge. Refuge ledges and jumps
// keep their feet clear of the patrol's floor and do not start one.
export function chargeCanTrigger(
  tuning: DuckTuning,
  object: ObjectLayout,
  duck: DuckState,
  at: Point,
): boolean {
  const charge = object.charge;
  if (!charge || !duck.grounded) {
    return false;
  }
  const hers = duckBox(tuning, duck);
  return (
    Math.abs(hers.y + hers.height - (at.y + object.height)) <= charge.groundTolerance &&
    Math.abs(hers.x + hers.width / 2 - (at.x + object.width / 2)) <= charge.triggerRange
  );
}

function patrolBounds(object: ObjectLayout): readonly [number, number] {
  const end =
    object.origin.x + (object.motion.direction === "left" ? -1 : 1) * object.motion.distance;
  return [Math.min(object.origin.x, end), Math.max(object.origin.x, end)];
}

// Horizontal terrain blocks the dog's collision box. The floor only touches its bottom edge,
// so it never limits horizontal travel.
function reachableX(
  object: ObjectLayout,
  solids: readonly Rect[],
  at: Point,
  facing: -1 | 1,
  desired: number,
): number {
  const [left, right] = patrolBounds(object);
  let x = Math.max(left, Math.min(right, desired));
  const box = chargeContactBox(object, at, facing);
  for (const solid of solids) {
    if (box.y >= solid.y + solid.height || solid.y >= box.y + box.height) {
      continue;
    }
    if (facing === 1 && box.x + box.width <= solid.x) {
      x = Math.min(x, at.x + solid.x - (box.x + box.width));
    } else if (facing === -1 && box.x >= solid.x + solid.width) {
      x = Math.max(x, at.x + solid.x + solid.width - box.x);
    }
  }
  return x;
}

// Pure fixed-step patrol and charge phases. Once crouching begins, its direction is retained
// through the rush and rest, regardless of the duck's later position.
export function stepCharge(
  tuning: DuckTuning,
  object: ObjectLayout,
  solids: readonly Rect[],
  seconds: number,
  duck: DuckState,
  at: Point,
  state: ChargeState,
): ChargeStep {
  const charge = object.charge;
  if (!charge || seconds <= 0) {
    return { at, segments: [], state };
  }
  if (!state.active) {
    return {
      at,
      segments: [{ end: seconds, facing: state.facing, from: at, start: 0, to: at }],
      state,
    };
  }
  const segments: ChargeSegment[] = [];
  let current = at;
  let next = state;
  let time = 0;
  const move = (duration: number, x: number) => {
    const to = { ...current, x };
    segments.push({ end: time + duration, facing: next.facing, from: current, start: time, to });
    current = to;
    time += duration;
  };
  while (true) {
    if (time >= seconds) {
      break;
    }
    const remaining = seconds - time;
    if (next.phase === "patrol") {
      if (chargeCanTrigger(tuning, object, duck, current)) {
        const hers = duck.x + tuning.width / 2;
        next = {
          active: true,
          elapsed: 0,
          facing: hers < current.x + object.width / 2 ? -1 : 1,
          phase: "crouch",
        };
        continue;
      }
      const desired = current.x + next.facing * object.motion.speed * remaining;
      if (desired === current.x) {
        move(remaining, current.x);
        continue;
      }
      const x = reachableX(object, solids, current, next.facing, desired);
      const duration = Math.abs(x - current.x) / object.motion.speed;
      if (duration > 0) {
        move(duration, x);
      }
      if (duration < remaining) {
        next = { ...next, facing: next.facing === 1 ? -1 : 1 };
        // A corridor narrower than the collision box cannot be patrolled.
        const reverse = reachableX(object, solids, current, next.facing, current.x + next.facing);
        if (reverse === current.x) {
          move(seconds - time, current.x);
        }
      }
      continue;
    }
    const duration =
      next.phase === "crouch"
        ? charge.crouchSeconds
        : next.phase === "rush"
          ? charge.rushSeconds
          : charge.restSeconds;
    const slice = Math.min(remaining, Math.max(0, duration - next.elapsed));
    if (next.phase === "rush") {
      const x = reachableX(
        object,
        solids,
        current,
        next.facing,
        current.x + next.facing * charge.rushSpeed * slice,
      );
      const moving = Math.abs(x - current.x) / charge.rushSpeed;
      if (moving > 0) {
        move(moving, x);
      }
      if (moving < slice) {
        move(slice - moving, current.x);
      }
    } else {
      move(slice, current.x);
    }
    const elapsed = next.elapsed + slice;
    if (elapsed >= duration) {
      next = {
        active: true,
        elapsed: 0,
        facing: next.facing,
        phase: next.phase === "crouch" ? "rush" : next.phase === "rush" ? "rest" : "patrol",
      };
    } else {
      next = { ...next, elapsed };
    }
  }
  return { at: current, segments, state: next };
}

// Relative linear swept overlap during one straight movement section. A positive interval of
// contact is required, matching ordinary rectangle collision; merely grazing an edge is safe.
export function sweptContact(a: Rect, aEnd: Point, b: Rect, bEnd: Point): boolean {
  if (overlaps(a, b)) {
    return true;
  }
  let enter = 0;
  let leave = 1;
  for (const axis of ["x", "y"] as const) {
    const size = axis === "x" ? "width" : "height";
    const velocity = aEnd[axis] - a[axis] - (bEnd[axis] - b[axis]);
    if (velocity === 0) {
      if (a[axis] >= b[axis] + b[size] || b[axis] >= a[axis] + a[size]) {
        return false;
      }
      continue;
    }
    const first = (b[axis] - a[axis] - a[size]) / velocity;
    const last = (b[axis] + b[size] - a[axis]) / velocity;
    enter = Math.max(enter, Math.min(first, last));
    leave = Math.min(leave, Math.max(first, last));
  }
  return enter < leave;
}
