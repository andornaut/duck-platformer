import type { Character } from "./types";

// Who or what each placed thing is, by name: its archetype, art, size and tuning. art is a piece
// or tile name from art/README.md, a backdrop or sprite, or placeholder-<name> where art has none
// yet. Tiled pieces (awnings, the canopy, planters, pit openings and the lobby's ledges) take
// their width from each placement.
export const CHARACTERS: Readonly<Record<string, Character>> = {
  // A shop awning: one-way, laid 6 above the sidewalk across a storefront.
  awning: {
    archetype: "ledge",
    art: "one-way-awning",
    cols: 3,
    rows: 1,
  },
  // The lobby's mezzanine edge: one-way.
  balcony: {
    archetype: "ledge",
    art: "one-way-balcony",
    cols: 3,
    rows: 1,
  },
  bookcase: {
    archetype: "scenery",
    art: "lobby-bookcase",
    cols: 7,
    rows: 32,
  },
  // A board of the bookcase: one-way, at 8, 16, 24 and 32 above the floor.
  "bookcase-shelf": {
    archetype: "ledge",
    art: "one-way-shelf",
    cols: 7,
    rows: 1,
  },
  "cross-street": {
    archetype: "scenery",
    art: "cross-street",
    cols: 10,
    rows: 2,
  },
  desk: {
    archetype: "scenery",
    art: "lobby-desk",
    cols: 10,
    rows: 8,
  },
  // The reception desk's top: one-way, 8 above the floor.
  "desk-top": {
    archetype: "ledge",
    art: "one-way-desk",
    cols: 10,
    rows: 1,
  },
  // PLACEHOLDER: a harmless dog that trots up to her.
  dog: {
    archetype: "approacher",
    art: "placeholder-dog",
    cols: 3,
    rows: 2,
  },
  "doorman-podium": {
    archetype: "scenery",
    art: "doorman-podium",
    cols: 2,
    rows: 2,
  },
  // The ferret's first trap, set near the hotel door.
  "ferret-trap-snap": {
    animations: { idle: "set", move: "set", react: "set", talk: "set" },
    archetype: "hazard",
    art: "ferret-trap-snap",
    cols: 4,
    rows: 2,
  },
  // The rolling traffic: a frog courier on a delivery bike, back and forth along the sidewalk.
  // 3 tall, so a full jump clears it.
  "frog-courier": {
    animations: { idle: "idle", move: "ride", react: "idle", talk: "idle" },
    archetype: "hazard-patroller",
    art: "frog-courier",
    cols: 5,
    rows: 3,
  },
  // A cellar hatch's edges: the sidewalk's edge tile with an open steel leaf standing 2 above it.
  "hatch-left": {
    archetype: "solid",
    art: "hatch-left",
    cols: 1,
    rows: 3,
  },
  "hatch-right": {
    archetype: "solid",
    art: "hatch-right",
    cols: 1,
    rows: 3,
  },
  "hot-dog-cart": {
    archetype: "solid",
    art: "hot-dog-cart",
    cols: 3,
    rows: 6,
  },
  // The hotel's canopy: one-way, 6 above the sidewalk, over the hotel door.
  "hotel-canopy": {
    archetype: "ledge",
    art: "one-way-canopy",
    cols: 3,
    rows: 1,
  },
  "hotel-crest": {
    archetype: "scenery",
    art: "hotel-crest",
    cols: 8,
    rows: 4,
  },
  "hotel-door": {
    archetype: "door",
    art: "door",
    cols: 3,
    rows: 4,
  },
  "hotel-window": {
    archetype: "scenery",
    art: "hotel-window",
    cols: 3,
    rows: 13,
  },
  // The lobby's balcony railing, a backdrop repeated across its run.
  "lobby-balustrade": {
    archetype: "scenery",
    art: "lobby-balustrade",
    cols: 4,
    rows: 3,
  },
  "lobby-front-door": {
    archetype: "scenery",
    art: "lobby-front-door",
    cols: 13,
    rows: 15,
  },
  "lobby-lamp": {
    archetype: "scenery",
    art: "lobby-lamp",
    cols: 4,
    rows: 16,
  },
  "lobby-plant": {
    archetype: "scenery",
    art: "lobby-plant",
    cols: 4,
    rows: 10,
  },
  // The lobby's wood-panelled wall, a backdrop repeated across the room.
  "lobby-wall": {
    archetype: "scenery",
    art: "lobby-wall",
    cols: 4,
    rows: 60,
  },
  "lobby-window": {
    archetype: "scenery",
    art: "lobby-window",
    cols: 8,
    rows: 20,
  },
  // PLACEHOLDER: people walking past, back and forth, paying her no attention.
  pedestrian: {
    archetype: "walker",
    art: "placeholder-pedestrian",
    cols: 2,
    rows: 4,
  },
  // PLACEHOLDER: pigeons pecking about, which flee as she comes near.
  pigeon: {
    archetype: "hopper-avoider",
    art: "placeholder-pigeon",
    cols: 1,
    rows: 1,
  },
  // The dark floor of a pit, 4 below the sidewalk's top: a quick restart for a fall into an
  // opening.
  "pit-floor": {
    archetype: "hazard",
    art: "placeholder-pit-floor",
    cols: 1,
    rows: 1,
  },
  // The open cellar between a hatch's edges: drawn only, over a gap in the sidewalk she falls
  // through.
  "pit-opening": {
    archetype: "scenery",
    art: "pit-opening",
    cols: 1,
    rows: 1,
  },
  // A 2-tile step.
  planter: {
    archetype: "solid",
    art: "planter",
    cols: 2,
    rows: 2,
  },
  sofa: {
    archetype: "scenery",
    art: "lobby-sofa",
    cols: 10,
    rows: 6,
  },
  // The sofa's seat: one-way, 3 above the floor.
  "sofa-cushion": {
    archetype: "ledge",
    art: "one-way-cushion",
    cols: 8,
    rows: 1,
  },
  // The stairwell to the next floor: Use there clears the zone.
  "stairwell-exit": {
    archetype: "exit",
    art: "exit",
    cols: 7,
    rows: 15,
  },
  "storefront-cafe": {
    archetype: "scenery",
    art: "storefront-cafe",
    cols: 7,
    rows: 10,
  },
  "storefront-diner": {
    archetype: "scenery",
    art: "storefront-diner",
    cols: 9,
    rows: 10,
  },
  "storefront-florist": {
    archetype: "scenery",
    art: "storefront-florist",
    cols: 7,
    rows: 10,
  },
  "storefront-gift-shop": {
    archetype: "scenery",
    art: "storefront-gift-shop",
    cols: 8,
    rows: 10,
  },
  "storefront-makeup-store": {
    archetype: "scenery",
    art: "storefront-makeup-store",
    cols: 8,
    rows: 10,
  },
  "storefront-noodle-bar": {
    archetype: "scenery",
    art: "storefront-noodle-bar",
    cols: 10,
    rows: 10,
  },
  "storefront-pet-shop": {
    archetype: "scenery",
    art: "storefront-pet-shop",
    cols: 9,
    rows: 10,
  },
  // The street's sky and far skyline, backdrops repeated across the street.
  "street-sky": {
    archetype: "scenery",
    art: "street-sky",
    cols: 4,
    rows: 26,
  },
  "street-skyline": {
    archetype: "scenery",
    art: "street-skyline",
    cols: 28,
    rows: 23,
  },
  "street-tree": {
    archetype: "scenery",
    art: "street-tree",
    cols: 5,
    rows: 11,
  },
  "subway-railing": {
    archetype: "scenery",
    art: "subway-railing",
    cols: 6,
    rows: 5,
  },
  // PLACEHOLDER: the test zones' objects, drawn as flat rectangles: exits and a door (Use
  // zones), hazards, moving platforms whose motion each placement sets, a wandering cart and a
  // pigeon that hops about and flies from her.
  "test-cart": {
    archetype: "hazard-wanderer",
    art: "test-cart",
    cols: 3,
    rows: 2,
  },
  "test-door": {
    archetype: "door",
    art: "test-door",
    cols: 3,
    rows: 4,
  },
  "test-exit": {
    archetype: "exit",
    art: "test-exit",
    cols: 2,
    rows: 4,
  },
  "test-hazard": {
    archetype: "hazard",
    art: "test-hazard",
    cols: 1,
    rows: 1,
  },
  "test-mover": {
    archetype: "platform",
    art: "test-mover",
    cols: 4,
    rows: 1,
  },
  "test-pigeon": {
    archetype: "hopper-avoider",
    art: "test-pigeon",
    cols: 2,
    rows: 2,
    tuning: {
      motion: { direction: "right", distance: 8, speed: 3, variance: 0.3 },
      reaction: { range: 8, speed: 10 },
    },
  },
  "walk-signal": {
    archetype: "scenery",
    art: "walk-signal",
    cols: 1,
    rows: 7,
  },
};
