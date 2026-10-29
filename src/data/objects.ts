import type { Motion, ObjectType, Reaction } from "./types";

const STILL: Motion = {
  algorithm: "static",
  direction: "right",
  distance: 0,
  hopHeight: 0,
  pause: 0,
  speed: 0,
  variance: 0,
};
const NO_REACTION: Reaction = { kind: "none", range: 0, speed: 0 };

// Every kind of object a level places, by name. PLACEHOLDER: the test levels' objects, drawn as
// flat rectangles: exits and a door (Use zones), hazards, moving platforms whose motion each
// placement sets, a wandering cart and a pigeon that hops about and flies from her.
export const OBJECT_TYPES: Readonly<Record<string, ObjectType>> = {
  "test-cart": {
    art: "test-cart",
    collision: "hazard",
    cols: 3,
    motion: { ...STILL, algorithm: "wander", distance: 30, pause: 0.5, speed: 5, variance: 0.3 },
    reaction: NO_REACTION,
    rows: 2,
  },
  "test-door": {
    art: "test-door",
    collision: "use",
    cols: 3,
    motion: STILL,
    reaction: NO_REACTION,
    rows: 4,
  },
  "test-exit": {
    art: "test-exit",
    collision: "use",
    cols: 2,
    motion: STILL,
    reaction: NO_REACTION,
    rows: 4,
  },
  "test-hazard": {
    art: "test-hazard",
    collision: "hazard",
    cols: 1,
    motion: STILL,
    reaction: NO_REACTION,
    rows: 1,
  },
  "test-mover": {
    art: "test-mover",
    collision: "solid",
    cols: 4,
    motion: { ...STILL, algorithm: "linear" },
    reaction: NO_REACTION,
    rows: 1,
  },
  "test-pigeon": {
    art: "test-pigeon",
    collision: "none",
    cols: 2,
    motion: {
      ...STILL,
      algorithm: "hop",
      distance: 8,
      hopHeight: 1,
      pause: 1,
      speed: 3,
      variance: 0.3,
    },
    reaction: { kind: "avoid", range: 8, speed: 10 },
    rows: 2,
  },
};
