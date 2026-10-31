import type { BehaviourNode, BehaviourPlan } from "./types";

const CROSSING_PAUSE = 1;
const CROSSING_SPEED = 6;
const DOG_PATROL_PAUSE = 0.2;
const DOG_PATROL_SPEED = 3;

const DOG_ALERT = [
  { kind: "nearby", range: 14 },
  { kind: "same-ground", tolerance: 1 },
] as const;

function shuttleStates(
  speed: number,
  pause: number,
  animation: BehaviourNode["animation"],
): BehaviourPlan["states"] {
  return {
    back: {
      animation,
      motion: { direction: -1, kind: "move", speed },
      transitions: [{ to: "wait-near", when: [{ kind: "boundary" }] }],
    },
    forward: {
      animation,
      motion: { direction: 1, kind: "move", speed },
      transitions: [{ to: "wait-far", when: [{ kind: "boundary" }] }],
    },
    "wait-far": {
      animation,
      motion: { kind: "wait" },
      transitions: [{ to: "back", when: [{ kind: "elapsed", seconds: pause }] }],
    },
    "wait-near": {
      animation,
      motion: { kind: "wait" },
      transitions: [{ to: "forward", when: [{ kind: "elapsed", seconds: pause }] }],
    },
  };
}

export const BOAT_BEHAVIOUR: BehaviourPlan = {
  axis: "x",
  distance: 30,
  initial: "forward",
  states: shuttleStates(CROSSING_SPEED, CROSSING_PAUSE, "idle"),
};

export const CITY_GROUND_HAZARD_BEHAVIOUR: BehaviourPlan = {
  axis: "x",
  distance: 10,
  initial: "forward",
  states: shuttleStates(5, 0.4, null),
};

export const CITY_LIFT_BEHAVIOUR: BehaviourPlan = {
  axis: "y",
  distance: -12,
  initial: "back",
  states: shuttleStates(4, 0.6, null),
};

export const CITY_SHUTTLE_BEHAVIOUR: BehaviourPlan = {
  axis: "x",
  distance: 30,
  initial: "forward",
  states: shuttleStates(CROSSING_SPEED, CROSSING_PAUSE, null),
};

export const DOG_BEHAVIOUR: BehaviourPlan = {
  axis: "x",
  distance: -12,
  inactiveAnimation: "idle",
  initial: "patrol-left",
  states: {
    crouch: {
      animation: "crouch",
      enter: "face-target",
      motion: { kind: "wait" },
      transitions: [{ to: "rush", when: [{ kind: "elapsed", seconds: 0.45 }] }],
    },
    "patrol-left": {
      animation: "walk",
      motion: { direction: -1, kind: "move", speed: DOG_PATROL_SPEED },
      transitions: [
        { to: "crouch", when: DOG_ALERT },
        { to: "wait-left", when: [{ kind: "boundary" }] },
      ],
    },
    "patrol-right": {
      animation: "walk",
      motion: { direction: 1, kind: "move", speed: DOG_PATROL_SPEED },
      transitions: [
        { to: "crouch", when: DOG_ALERT },
        { to: "wait-right", when: [{ kind: "boundary" }] },
      ],
    },
    rest: {
      animation: "rest",
      motion: { kind: "wait" },
      transitions: [{ to: "patrol-left", when: [{ kind: "elapsed", seconds: 0.65 }] }],
    },
    rush: {
      animation: "rush",
      motion: { direction: "facing", kind: "move", speed: 20 },
      transitions: [
        { to: "rest", when: [{ kind: "boundary" }] },
        { to: "rest", when: [{ kind: "elapsed", seconds: 0.6 }] },
      ],
    },
    "wait-left": {
      animation: "idle",
      motion: { kind: "wait" },
      transitions: [
        { to: "crouch", when: DOG_ALERT },
        { to: "patrol-right", when: [{ kind: "elapsed", seconds: DOG_PATROL_PAUSE }] },
      ],
    },
    "wait-right": {
      animation: "idle",
      motion: { kind: "wait" },
      transitions: [
        { to: "crouch", when: DOG_ALERT },
        { to: "patrol-left", when: [{ kind: "elapsed", seconds: DOG_PATROL_PAUSE }] },
      ],
    },
  },
};

export const RACCOON_BEHAVIOUR: BehaviourPlan = {
  axis: "y",
  distance: -10,
  initial: "climb",
  states: {
    climb: {
      animation: "climb",
      motion: { direction: -1, kind: "move", speed: 3 },
      transitions: [{ to: "prepare", when: [{ kind: "boundary" }] }],
    },
    drop: {
      animation: "drop",
      motion: { direction: 1, kind: "move", speed: 12 },
      transitions: [{ to: "rest", when: [{ kind: "boundary" }] }],
    },
    prepare: {
      animation: "prepare",
      motion: { kind: "wait" },
      transitions: [{ to: "drop", when: [{ kind: "elapsed", seconds: 0.6 }] }],
    },
    rest: {
      animation: "rest",
      motion: { kind: "wait" },
      transitions: [{ to: "climb", when: [{ kind: "elapsed", seconds: 0.8 }] }],
    },
  },
};
