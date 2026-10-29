import type { Collision, Motion, ObjectType, Reaction } from "./types";

export const STATIC_MOTION: Motion = {
  algorithm: "static",
  direction: "right",
  distance: 0,
  hopHeight: 0,
  pause: 0,
  speed: 0,
  variance: 0,
};

export const NO_REACTION: Reaction = { kind: "none", range: 0, speed: 0 };

// A static object: drawn, with collision as given.
function fixed(art: string, collision: Collision, cols: number, rows: number): ObjectType {
  return { art, collision, cols, motion: STATIC_MOTION, reaction: NO_REACTION, rows };
}

// Every kind of object a level places, by name. art is a piece or tile name from art/README.md,
// or placeholder-<name> where art has none yet. Tiled pieces (awnings, the canopy, planters, pit
// openings and the lobby's ledges) take their width from each placement.
export const OBJECT_TYPES: Readonly<Record<string, ObjectType>> = {
  // A shop awning: one-way, laid 6 above the sidewalk across a storefront.
  awning: fixed("one-way-awning", "ledge", 3, 1),
  // The lobby's mezzanine edge: one-way.
  balcony: fixed("one-way-balcony", "ledge", 3, 1),
  bookcase: fixed("lobby-bookcase", "none", 7, 32),
  // A board of the bookcase: one-way, at 8, 16, 24 and 32 above the floor.
  "bookcase-shelf": fixed("one-way-shelf", "ledge", 7, 1),
  "cross-street": fixed("cross-street", "none", 10, 2),
  desk: fixed("lobby-desk", "none", 10, 8),
  // The reception desk's top: one-way, 8 above the floor.
  "desk-top": fixed("one-way-desk", "ledge", 10, 1),
  // PLACEHOLDER: a harmless dog that trots up to her.
  dog: {
    art: "placeholder-dog",
    collision: "none",
    cols: 3,
    motion: {
      algorithm: "linear",
      direction: "right",
      distance: 4,
      hopHeight: 0,
      pause: 1,
      speed: 2,
      variance: 0.3,
    },
    reaction: { kind: "approach", range: 10, speed: 6 },
    rows: 2,
  },
  "doorman-podium": fixed("doorman-podium", "none", 2, 2),
  // The ferret's first trap, set near the hotel door.
  "ferret-trap-snap": fixed("ferret-trap-snap", "hazard", 4, 2),
  // The rolling traffic: a frog courier on a delivery bike, back and forth along the sidewalk.
  // 3 tall, so a full jump clears it.
  "frog-courier": {
    art: "frog-courier",
    collision: "hazard",
    cols: 5,
    motion: {
      algorithm: "linear",
      direction: "left",
      distance: 16,
      hopHeight: 0,
      pause: 0.5,
      speed: 6,
      variance: 0.25,
    },
    reaction: NO_REACTION,
    rows: 3,
  },
  // A cellar hatch's edges: the sidewalk's edge tile with an open steel leaf standing 2 above it.
  "hatch-left": fixed("hatch-left", "solid", 1, 3),
  "hatch-right": fixed("hatch-right", "solid", 1, 3),
  "hot-dog-cart": fixed("hot-dog-cart", "solid", 3, 6),
  // The hotel's canopy: one-way, 6 above the sidewalk, over the hotel door.
  "hotel-canopy": fixed("one-way-canopy", "ledge", 3, 1),
  "hotel-crest": fixed("hotel-crest", "none", 8, 4),
  "hotel-door": fixed("door", "use", 3, 4),
  "hotel-window": fixed("hotel-window", "none", 3, 13),
  "lobby-front-door": fixed("lobby-front-door", "none", 13, 15),
  "lobby-lamp": fixed("lobby-lamp", "none", 4, 16),
  "lobby-plant": fixed("lobby-plant", "none", 4, 10),
  "lobby-window": fixed("lobby-window", "none", 8, 20),
  // PLACEHOLDER: people walking past, back and forth, paying her no attention.
  pedestrian: {
    art: "placeholder-pedestrian",
    collision: "none",
    cols: 2,
    motion: {
      algorithm: "ease",
      direction: "left",
      distance: 20,
      hopHeight: 0,
      pause: 2,
      speed: 3,
      variance: 0.4,
    },
    reaction: NO_REACTION,
    rows: 4,
  },
  // PLACEHOLDER: pigeons pecking about, which flee as she comes near.
  pigeon: {
    art: "placeholder-pigeon",
    collision: "none",
    cols: 1,
    motion: {
      algorithm: "hop",
      direction: "left",
      distance: 3,
      hopHeight: 1,
      pause: 1,
      speed: 2,
      variance: 0.5,
    },
    reaction: { kind: "avoid", range: 6, speed: 8 },
    rows: 1,
  },
  // The dark floor of a pit, 4 below the sidewalk's top: a quick restart for a fall into an
  // opening.
  "pit-floor": fixed("placeholder-pit-floor", "hazard", 1, 1),
  // The open cellar between a hatch's edges: drawn only, over a gap in the sidewalk she falls
  // through.
  "pit-opening": fixed("pit-opening", "none", 1, 1),
  // A 2-tile step.
  planter: fixed("planter", "solid", 2, 2),
  sofa: fixed("lobby-sofa", "none", 10, 6),
  // The sofa's seat: one-way, 3 above the floor.
  "sofa-cushion": fixed("one-way-cushion", "ledge", 8, 1),
  // The stairwell to the next floor: Use there clears the level.
  "stairwell-exit": fixed("exit", "use", 7, 15),
  "storefront-cafe": fixed("storefront-cafe", "none", 7, 10),
  "storefront-diner": fixed("storefront-diner", "none", 9, 10),
  "storefront-florist": fixed("storefront-florist", "none", 7, 10),
  "storefront-gift-shop": fixed("storefront-gift-shop", "none", 8, 10),
  "storefront-makeup-store": fixed("storefront-makeup-store", "none", 8, 10),
  "storefront-noodle-bar": fixed("storefront-noodle-bar", "none", 10, 10),
  "storefront-pet-shop": fixed("storefront-pet-shop", "none", 9, 10),
  "street-tree": fixed("street-tree", "none", 5, 11),
  "subway-railing": fixed("subway-railing", "none", 6, 5),
  "walk-signal": fixed("walk-signal", "none", 1, 7),
  // PLACEHOLDER: the test levels' objects, drawn as flat rectangles: exits and a door (Use
  // zones), hazards, moving platforms whose motion each placement sets, a wandering cart and a
  // pigeon that hops about and flies from her.
  "test-cart": {
    art: "test-cart",
    collision: "hazard",
    cols: 3,
    motion: { ...STATIC_MOTION, algorithm: "wander", distance: 30, pause: 0.5, speed: 5, variance: 0.3 },
    reaction: NO_REACTION,
    rows: 2,
  },
  "test-door": {
    art: "test-door",
    collision: "use",
    cols: 3,
    motion: STATIC_MOTION,
    reaction: NO_REACTION,
    rows: 4,
  },
  "test-exit": {
    art: "test-exit",
    collision: "use",
    cols: 2,
    motion: STATIC_MOTION,
    reaction: NO_REACTION,
    rows: 4,
  },
  "test-hazard": {
    art: "test-hazard",
    collision: "hazard",
    cols: 1,
    motion: STATIC_MOTION,
    reaction: NO_REACTION,
    rows: 1,
  },
  "test-mover": {
    art: "test-mover",
    collision: "solid",
    cols: 4,
    motion: { ...STATIC_MOTION, algorithm: "linear" },
    reaction: NO_REACTION,
    rows: 1,
  },
  "test-pigeon": {
    art: "test-pigeon",
    collision: "none",
    cols: 2,
    motion: {
      ...STATIC_MOTION,
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
