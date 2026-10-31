import type { BehaviourPlan } from "../data/types";

export const TEST_PURSUER: BehaviourPlan = {
  axis: "x",
  distance: 100,
  inactiveAnimation: "idle",
  initial: "watchRight",
  states: {
    brace: {
      animation: "crouch",
      enter: "face-target",
      motion: { kind: "wait" },
      transitions: [{ to: "burst", when: [{ kind: "elapsed", seconds: 0.25 }] }],
    },
    burst: {
      animation: "rush",
      motion: { direction: "facing", kind: "move", speed: 300 },
      transitions: [{ to: "recover", when: [{ kind: "elapsed", seconds: 0.5 }] }],
    },
    recover: {
      animation: "rest",
      motion: { kind: "wait" },
      transitions: [{ to: "watchRight", when: [{ kind: "elapsed", seconds: 0.25 }] }],
    },
    watchLeft: {
      animation: "walk",
      motion: { direction: -1, kind: "move", speed: 20 },
      transitions: [
        {
          to: "brace",
          when: [
            { kind: "nearby", range: 80 },
            { kind: "same-ground", tolerance: 1 },
          ],
        },
        { to: "watchRight", when: [{ kind: "boundary" }] },
      ],
    },
    watchRight: {
      animation: "walk",
      motion: { direction: 1, kind: "move", speed: 20 },
      transitions: [
        {
          to: "brace",
          when: [
            { kind: "nearby", range: 80 },
            { kind: "same-ground", tolerance: 1 },
          ],
        },
        { to: "watchLeft", when: [{ kind: "boundary" }] },
      ],
    },
  },
};

export const TEST_SHUTTLE: BehaviourPlan = {
  axis: "y",
  distance: -60,
  initial: "outbound",
  states: {
    farHold: {
      animation: "ride",
      motion: { kind: "wait" },
      transitions: [{ to: "homebound", when: [{ kind: "elapsed", seconds: 0.5 }] }],
    },
    homebound: {
      animation: "ride",
      motion: { direction: 1, kind: "move", speed: 30 },
      transitions: [{ to: "nearHold", when: [{ kind: "boundary" }] }],
    },
    nearHold: {
      animation: "ride",
      motion: { kind: "wait" },
      transitions: [{ to: "outbound", when: [{ kind: "elapsed", seconds: 0.5 }] }],
    },
    outbound: {
      animation: "ride",
      motion: { direction: -1, kind: "move", speed: 30 },
      transitions: [{ to: "farHold", when: [{ kind: "boundary" }] }],
    },
  },
};
