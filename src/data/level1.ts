import type { LevelPlan } from "./types";

// Level 1, the ground floor: the street outside the hotel, then the lobby.
//
// The street is one screen of play: the sidewalk's top is row 26 (y 312), and below it the game
// shows ink, so every opening in the sidewalk is a fall out of the area that restarts the level. Awnings and the
// hotel canopy sit on row 20, 6 above the sidewalk. Left to right it teaches: walk, hop, jump, a
// gap, a cellar hatch, the courier, then the ferret's trap at the hotel door.
export const LEVEL_1: LevelPlan = {
  areas: {
    // The lobby: the floor's top is row 56 (y 672). A climb at the right end leads from the
    // floor to the stairwell exit on the balcony, 40 up, in the upper screen.
    lobby: {
      cols: 360,
      entries: { "front-door": { col: 8, row: 56 } },
      objects: [
        { col: 2, row: 41, type: "lobby-front-door" },
        // PLACEHOLDER: what happens in the lobby between the front door and the climb.
        { col: 30, row: 46, type: "lobby-plant" },
        { col: 40, row: 26, type: "lobby-window" },
        { col: 60, row: 2, type: "lobby-lamp" },
        { col: 100, row: 46, type: "lobby-plant" },
        { col: 120, row: 26, type: "lobby-window" },
        { col: 150, row: 2, type: "lobby-lamp" },
        { col: 180, row: 46, type: "lobby-plant" },
        { col: 200, row: 26, type: "lobby-window" },
        { col: 240, row: 2, type: "lobby-lamp" },
        { col: 260, row: 46, type: "lobby-plant" },
        // The climb: hop 3 onto the sofa's seat, up 5 and across 4 to the desk, across 4 to the
        // bookcase's lowest board, then up its boards 8 at a time and up 8 to the balcony.
        { col: 278, row: 50, type: "sofa" },
        { col: 280, cols: 8, row: 53, type: "sofa-cushion" },
        { col: 292, row: 48, type: "desk" },
        { col: 292, cols: 10, row: 48, type: "desk-top" },
        { col: 306, row: 24, type: "bookcase" },
        { col: 306, row: 48, type: "bookcase-shelf" },
        { col: 306, row: 40, type: "bookcase-shelf" },
        { col: 306, row: 32, type: "bookcase-shelf" },
        { col: 306, row: 24, type: "bookcase-shelf" },
        { col: 313, cols: 45, row: 16, type: "balcony" },
        { col: 348, row: 1, type: "stairwell-exit" },
      ],
      rows: 60,
      solids: [
        // The floor, and a wood post at each end of the room.
        { col: 0, cols: 360, row: 56, rows: 4 },
        { col: 0, cols: 2, row: 0, rows: 56 },
        { col: 358, cols: 2, row: 0, rows: 56 },
      ],
    },
    street: {
      cols: 240,
      entries: { start: { col: 4, row: 26 } },
      objects: [
        // Walk: the café, with pigeons that flee as she comes near.
        { col: 6, row: 16, type: "storefront-cafe" },
        { col: 14, row: 25, type: "pigeon" },
        { col: 17, row: 25, type: "pigeon" },
        { col: 24, row: 19, type: "walk-signal" },
        // Hop: a planter, up 2, in front of the florist; then down 1 into a cross street and up
        // 1 out of it.
        { col: 28, cols: 4, row: 24, type: "planter" },
        { col: 30, row: 16, type: "storefront-florist" },
        { col: 40, row: 25, type: "cross-street" },
        // Jump: a hot-dog cart, up 6 (or over it), level with the makeup store's awning.
        { col: 54, row: 16, type: "storefront-gift-shop" },
        { col: 54, cols: 8, row: 20, type: "awning" },
        { col: 66, row: 20, type: "hot-dog-cart" },
        { col: 69, row: 16, type: "storefront-makeup-store" },
        { col: 69, cols: 8, row: 20, type: "awning" },
        { col: 82, row: 15, type: "street-tree" },
        // A gap: a subway entrance, 10 across.
        { col: 102, row: 21, type: "subway-railing" },
        // A cellar hatch open 4 across, past the pet shop's dog; then one open 6 across. Each
        // has a steel leaf 2 up at each edge.
        { col: 120, row: 16, type: "storefront-pet-shop" },
        { col: 122, row: 24, type: "dog" },
        { col: 134, row: 24, type: "hatch-left" },
        { col: 135, cols: 4, row: 26, type: "pit-opening" },
        { col: 139, row: 24, type: "hatch-right" },
        { col: 140, row: 16, type: "storefront-diner" },
        { col: 140, cols: 9, row: 20, type: "awning" },
        { col: 148, row: 24, type: "hatch-left" },
        { col: 149, cols: 6, row: 26, type: "pit-opening" },
        { col: 155, row: 24, type: "hatch-right" },
        // The courier: rides from col 186 to as far as col 166 and back. Wait left of col 164
        // or on the noodle bar's awning, then jump it.
        { col: 158, row: 16, type: "storefront-noodle-bar" },
        { col: 158, cols: 10, row: 20, type: "awning" },
        { col: 172, row: 22, type: "pedestrian" },
        { col: 186, row: 23, type: "frog-courier" },
        { col: 200, phase: 0.5, row: 22, type: "pedestrian" },
        // The ferret's trap, then the hotel door under its canopy.
        { col: 206, row: 13, type: "hotel-window" },
        { col: 212, row: 24, type: "ferret-trap-snap" },
        { col: 218, cols: 12, row: 20, type: "hotel-canopy" },
        { col: 220, row: 12, type: "hotel-crest" },
        { col: 222, row: 22, to: { area: "lobby", entry: "front-door" }, type: "hotel-door" },
        { col: 227, row: 24, type: "doorman-podium" },
        { col: 233, row: 13, type: "hotel-window" },
      ],
      rows: 60,
      solids: [
        { col: 0, cols: 40, row: 26, rows: 4 },
        // The cross street's road, one below the sidewalk.
        { col: 40, cols: 10, row: 27, rows: 3 },
        { col: 50, cols: 58, row: 26, rows: 4 },
        // The subway entrance: cols 108 to 117.
        { col: 118, cols: 16, row: 26, rows: 4 },
        // Cellar hatches: cols 134 to 139 and 148 to 155, their edge tiles placed as objects.
        { col: 140, cols: 8, row: 26, rows: 4 },
        { col: 156, cols: 84, row: 26, rows: 4 },
      ],
    },
  },
  start: { area: "street", entry: "start" },
};
