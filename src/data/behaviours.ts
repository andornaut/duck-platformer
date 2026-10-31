import type { BehaviourCondition, BehaviourNode, BehaviourPlan } from "./types";

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

interface PatrolChargeTuning {
  readonly alert: readonly BehaviourCondition[];
  readonly patrolPause: number;
  readonly patrolSpeed: number;
  readonly preparation: "crouch" | "warn";
  readonly preparationSeconds: number;
  readonly restSeconds: number;
  readonly rushSeconds: number;
  readonly rushSpeed: number;
}

function patrolChargeStates(tuning: PatrolChargeTuning): BehaviourPlan["states"] {
  return {
    [tuning.preparation]: {
      animation: tuning.preparation,
      enter: "face-target",
      motion: { kind: "wait" },
      transitions: [
        { to: "rush", when: [{ kind: "elapsed", seconds: tuning.preparationSeconds }] },
      ],
    },
    "patrol-left": {
      animation: "walk",
      motion: { direction: -1, kind: "move", speed: tuning.patrolSpeed },
      transitions: [
        { to: tuning.preparation, when: tuning.alert },
        { to: "wait-left", when: [{ kind: "boundary" }] },
      ],
    },
    "patrol-right": {
      animation: "walk",
      motion: { direction: 1, kind: "move", speed: tuning.patrolSpeed },
      transitions: [
        { to: tuning.preparation, when: tuning.alert },
        { to: "wait-right", when: [{ kind: "boundary" }] },
      ],
    },
    rest: {
      animation: "rest",
      motion: { kind: "wait" },
      transitions: [
        { to: "patrol-left", when: [{ kind: "elapsed", seconds: tuning.restSeconds }] },
      ],
    },
    rush: {
      animation: "rush",
      motion: { direction: "facing", kind: "move", speed: tuning.rushSpeed },
      transitions: [
        { to: "rest", when: [{ kind: "boundary" }] },
        { to: "rest", when: [{ kind: "elapsed", seconds: tuning.rushSeconds }] },
      ],
    },
    "wait-left": {
      animation: "idle",
      motion: { kind: "wait" },
      transitions: [
        { to: tuning.preparation, when: tuning.alert },
        { to: "patrol-right", when: [{ kind: "elapsed", seconds: tuning.patrolPause }] },
      ],
    },
    "wait-right": {
      animation: "idle",
      motion: { kind: "wait" },
      transitions: [
        { to: tuning.preparation, when: tuning.alert },
        { to: "patrol-left", when: [{ kind: "elapsed", seconds: tuning.patrolPause }] },
      ],
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
  states: patrolChargeStates({
    alert: DOG_ALERT,
    patrolPause: DOG_PATROL_PAUSE,
    patrolSpeed: DOG_PATROL_SPEED,
    preparation: "crouch",
    preparationSeconds: 0.45,
    restSeconds: 0.65,
    rushSeconds: 0.6,
    rushSpeed: 20,
  }),
};

export const GOOSE_BEHAVIOUR: BehaviourPlan = {
  axis: "x",
  distance: -8,
  inactiveAnimation: "idle",
  initial: "patrol-left",
  states: patrolChargeStates({
    alert: [
      { kind: "nearby", range: 10 },
      { kind: "same-ground", tolerance: 1 },
    ],
    patrolPause: 0.35,
    patrolSpeed: 2,
    preparation: "warn",
    preparationSeconds: 0.65,
    restSeconds: 1,
    rushSeconds: 0.45,
    rushSpeed: 14,
  }),
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
