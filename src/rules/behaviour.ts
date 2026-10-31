import type {
  BehaviourCondition,
  BehaviourNode,
  BehaviourPlan,
  DuckTuning,
  ObjectLayout,
  Point,
  Rect,
} from "../data/types";
import { duckBox, type DuckState } from "./duck";
import { overlaps } from "./rect";

export interface BehaviourState {
  readonly active: boolean;
  readonly elapsed: number;
  readonly facing: -1 | 1;
  readonly stateKey: string;
}

export interface BehaviourSegment {
  readonly end: number;
  readonly facing: -1 | 1;
  readonly from: Point;
  readonly start: number;
  readonly to: Point;
}

export interface BehaviourStep {
  readonly at: Point;
  readonly segments: readonly BehaviourSegment[];
  readonly state: BehaviourState;
}

// Resolve a complete graph once; malformed transitions fail before a stage starts.
export function layoutBehaviour(tile: number, plan: BehaviourPlan): BehaviourPlan {
  const valid = (value: number) => Number.isFinite(value) && value >= 0;
  if (!Number.isFinite(plan.distance) || !plan.states[plan.initial]) {
    throw new Error("Invalid behaviour extent or initial state");
  }
  const states = Object.fromEntries(
    Object.entries(plan.states).map(([key, node]) => {
      if (
        !node.animation ||
        (node.motion.kind === "move" &&
          (!valid(node.motion.speed) || node.motion.speed === 0 || plan.distance === 0))
      ) {
        throw new Error(`Invalid behaviour motion or animation in ${key}`);
      }
      const transitions = node.transitions.map((transition) => {
        if (!plan.states[transition.to] || transition.when.length === 0) {
          throw new Error(`Invalid behaviour transition in ${key}`);
        }
        const when = transition.when.map((condition): BehaviourCondition => {
          if (condition.kind === "boundary") {
            return condition;
          }
          const amount =
            condition.kind === "elapsed"
              ? condition.seconds
              : condition.kind === "nearby"
                ? condition.range
                : condition.tolerance;
          if (!valid(amount)) {
            throw new Error(`Invalid behaviour condition in ${key}`);
          }
          return condition.kind === "nearby"
            ? { ...condition, range: condition.range * tile }
            : condition.kind === "same-ground"
              ? { ...condition, tolerance: condition.tolerance * tile }
              : condition;
        });
        return { ...transition, when };
      });
      return [
        key,
        {
          ...node,
          motion:
            node.motion.kind === "move"
              ? { ...node.motion, speed: node.motion.speed * tile }
              : node.motion,
          transitions,
        },
      ];
    }),
  );
  return { ...plan, distance: plan.distance * tile, states };
}

function nodeOf(object: ObjectLayout, key: string): BehaviourNode {
  const node = object.behaviour?.states[key];
  if (!node) {
    throw new Error(`No behaviour state ${key} for ${object.character}`);
  }
  return node;
}

function enterState(
  tuning: DuckTuning,
  object: ObjectLayout,
  duck: DuckState,
  at: Point,
  key: string,
  state: BehaviourState,
): BehaviourState {
  const node = nodeOf(object, key);
  let facing =
    node.motion.kind === "move" && node.motion.direction !== "facing"
      ? node.motion.direction
      : state.facing;
  if (node.enter === "face-target") {
    const axis = object.behaviour?.axis ?? "x";
    const mine = at[axis] + (axis === "x" ? object.width : object.height) / 2;
    const target = duck[axis] + (axis === "x" ? tuning.width : tuning.height) / 2;
    facing = target < mine ? -1 : 1;
  }
  return { ...state, elapsed: 0, facing, stateKey: key };
}

export function startBehaviour(
  tuning: DuckTuning,
  object: ObjectLayout,
  duck: DuckState,
): BehaviourState {
  const plan = object.behaviour;
  if (!plan) {
    throw new Error(`No behaviour for ${object.character}`);
  }
  return enterState(tuning, object, duck, object.origin, plan.initial, {
    active: object.scene === undefined,
    elapsed: 0,
    facing: plan.distance < 0 ? -1 : 1,
    stateKey: plan.initial,
  });
}

// Collision and a visible contact outline use the same box. Vertical movers do not flip their
// horizontal art merely because they reverse vertical travel.
export function contactBox(object: ObjectLayout, at: Point, facing: -1 | 1): Rect {
  const box = object.hitbox ?? { height: object.height, width: object.width, x: 0, y: 0 };
  return {
    ...box,
    x:
      at.x +
      (facing === 1 || object.behaviour?.axis === "y" ? box.x : object.width - box.x - box.width),
    y: at.y + box.y,
  };
}

function heading(node: BehaviourNode, state: BehaviourState): -1 | 1 {
  return node.motion.kind === "move" && node.motion.direction !== "facing"
    ? node.motion.direction
    : state.facing;
}

function endpoint(object: ObjectLayout, direction: -1 | 1): number {
  const plan = object.behaviour;
  if (!plan) {
    throw new Error(`No behaviour for ${object.character}`);
  }
  const origin = object.origin[plan.axis];
  return direction === 1
    ? Math.max(origin, origin + plan.distance)
    : Math.min(origin, origin + plan.distance);
}

function matches(
  tuning: DuckTuning,
  object: ObjectLayout,
  duck: DuckState,
  at: Point,
  state: BehaviourState,
  condition: BehaviourCondition,
): boolean {
  if (condition.kind === "elapsed") {
    return state.elapsed >= condition.seconds;
  }
  if (condition.kind === "boundary") {
    const axis = object.behaviour?.axis ?? "x";
    return at[axis] === endpoint(object, heading(nodeOf(object, state.stateKey), state));
  }
  if (condition.kind === "same-ground") {
    return (
      duck.grounded &&
      Math.abs(duck.y + tuning.height - (at.y + object.height)) <= condition.tolerance
    );
  }
  const hers = duckBox(tuning, duck);
  return (
    Math.hypot(
      hers.x + hers.width / 2 - at.x - object.width / 2,
      hers.y + hers.height / 2 - at.y - object.height / 2,
    ) <= condition.range
  );
}

function reachable(
  object: ObjectLayout,
  solids: readonly Rect[],
  at: Point,
  state: BehaviourState,
  direction: -1 | 1,
  desired: number,
): number {
  const axis = object.behaviour?.axis ?? "x";
  const edge = endpoint(object, direction);
  let to = direction === 1 ? Math.min(edge, desired) : Math.max(edge, desired);
  const box = contactBox(object, at, state.facing);
  const across = axis === "x" ? "y" : "x";
  const depth = axis === "x" ? "height" : "width";
  const length = axis === "x" ? "width" : "height";
  for (const solid of solids) {
    if (box[across] >= solid[across] + solid[depth] || solid[across] >= box[across] + box[depth]) {
      continue;
    }
    if (direction === 1 && box[axis] + box[length] <= solid[axis]) {
      to = Math.min(to, at[axis] + solid[axis] - box[axis] - box[length]);
    } else if (direction === -1 && box[axis] >= solid[axis] + solid[length]) {
      to = Math.max(to, at[axis] + solid[axis] + solid[length] - box[axis]);
    }
  }
  return to;
}

// Generic state graphs choose the motion, animation and transition order. The executor knows
// only bounded move/wait primitives and conditions; it has no character-specific cycle.
export function stepBehaviour(
  tuning: DuckTuning,
  object: ObjectLayout,
  solids: readonly Rect[],
  seconds: number,
  duck: DuckState,
  at: Point,
  state: BehaviourState,
): BehaviourStep {
  const plan = object.behaviour;
  if (!plan || seconds <= 0) {
    return { at, segments: [], state };
  }
  if (!state.active) {
    return {
      at,
      segments: [{ end: seconds, facing: state.facing, from: at, start: 0, to: at }],
      state,
    };
  }
  const segments: BehaviourSegment[] = [];
  const instant = new Set<string>();
  let current = at;
  let next = state;
  let time = 0;
  while (true) {
    const node = nodeOf(object, next.stateKey);
    const transition = node.transitions.find(({ when }) =>
      when.every((condition) => matches(tuning, object, duck, current, next, condition)),
    );
    if (transition) {
      if (instant.has(next.stateKey)) {
        throw new Error(`Instant behaviour transition cycle for ${object.character}`);
      }
      instant.add(next.stateKey);
      next = enterState(tuning, object, duck, current, transition.to, next);
      continue;
    }
    if (time >= seconds) {
      break;
    }
    let slice = seconds - time;
    for (const { when } of node.transitions) {
      if (
        when.every(
          (condition) =>
            condition.kind === "elapsed" || matches(tuning, object, duck, current, next, condition),
        )
      ) {
        const threshold = Math.max(
          0,
          ...when
            .filter((condition) => condition.kind === "elapsed")
            .map((condition) => condition.seconds),
        );
        if (threshold > next.elapsed) {
          slice = Math.min(slice, threshold - next.elapsed);
        }
      }
    }
    const to = { ...current };
    if (node.motion.kind === "move") {
      const direction = heading(node, next);
      const desired = current[plan.axis] + direction * node.motion.speed * slice;
      const end = reachable(object, solids, current, next, direction, desired);
      const moving = Math.abs(end - current[plan.axis]) / node.motion.speed;
      if (moving > 0) {
        slice = Math.min(slice, moving);
        to[plan.axis] = end;
      }
    }
    const end = time + slice;
    segments.push({ end, facing: next.facing, from: current, start: time, to });
    current = to;
    next = { ...next, elapsed: next.elapsed + slice };
    time = end > time ? end : seconds;
    instant.clear();
  }
  return { at: current, segments, state: next };
}

// A positive interval of relative swept overlap catches contact between fixed frames without
// treating an edge graze or a diagonal bounding-box overlap as a collision.
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
