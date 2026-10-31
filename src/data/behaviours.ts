import type { BehaviourPlan } from "./types";

const BOAT_PAUSE = 1;
const BOAT_SPEED = 6;
const DOG_PATROL_PAUSE = 0.4;
const DOG_PATROL_SPEED = 2;

const DOG_ALERT = [
  { kind: "nearby", range: 8 },
  { kind: "same-ground", tolerance: 1 },
] as const;

export const BOAT_BEHAVIOUR: BehaviourPlan = {
  axis: "x",
  distance: 30,
  initial: "forward",
  states: {
    back: {
      animation: "idle",
      motion: { direction: -1, kind: "move", speed: BOAT_SPEED },
      transitions: [{ to: "wait-near", when: [{ kind: "boundary" }] }],
    },
    forward: {
      animation: "idle",
      motion: { direction: 1, kind: "move", speed: BOAT_SPEED },
      transitions: [{ to: "wait-far", when: [{ kind: "boundary" }] }],
    },
    "wait-far": {
      animation: "idle",
      motion: { kind: "wait" },
      transitions: [{ to: "back", when: [{ kind: "elapsed", seconds: BOAT_PAUSE }] }],
    },
    "wait-near": {
      animation: "idle",
      motion: { kind: "wait" },
      transitions: [{ to: "forward", when: [{ kind: "elapsed", seconds: BOAT_PAUSE }] }],
    },
  },
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
      transitions: [{ to: "rush", when: [{ kind: "elapsed", seconds: 0.7 }] }],
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
      transitions: [{ to: "patrol-left", when: [{ kind: "elapsed", seconds: 1.1 }] }],
    },
    rush: {
      animation: "rush",
      motion: { direction: "facing", kind: "move", speed: 12 },
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
