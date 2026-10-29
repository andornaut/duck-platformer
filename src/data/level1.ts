import type { LevelPlan } from "./types";

// Level 1, the ground floor: the street outside the hotel, then the lobby.
//
// The street is one screen of play: the sidewalk's top is row 26 (y 312), and below it the game
// shows ink. A pit-floor hazard 4 below the sidewalk's top in every opening restarts the level
// soon after she drops in. Awnings and the
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
        // The wood-panelled wall behind the whole room.
        { character: "lobby-wall", col: 0, cols: 360, row: 0 },
        // The balcony's railing, standing on it.
        { character: "lobby-balustrade", col: 313, cols: 45, row: 13 },
        { character: "lobby-front-door", col: 2, row: 41 },
        // PLACEHOLDER: what happens in the lobby between the front door and the climb.
        { character: "lobby-plant", col: 30, row: 46 },
        { character: "lobby-window", col: 40, row: 26 },
        { character: "lobby-lamp", col: 60, row: 2 },
        { character: "lobby-plant", col: 100, row: 46 },
        { character: "lobby-window", col: 120, row: 26 },
        { character: "lobby-lamp", col: 150, row: 2 },
        { character: "lobby-plant", col: 180, row: 46 },
        { character: "lobby-window", col: 200, row: 26 },
        { character: "lobby-lamp", col: 240, row: 2 },
        { character: "lobby-plant", col: 260, row: 46 },
        // The climb: hop 3 onto the sofa's seat, up 5 and across 4 to the desk, across 4 to the
        // bookcase's lowest board, then up its boards 8 at a time and up 8 to the balcony.
        { character: "sofa", col: 278, row: 50 },
        { character: "sofa-cushion", col: 280, cols: 8, row: 53 },
        { character: "desk", col: 292, row: 48 },
        { character: "desk-top", col: 292, cols: 10, row: 48 },
        { character: "bookcase", col: 306, row: 24 },
        { character: "bookcase-shelf", col: 306, row: 48 },
        { character: "bookcase-shelf", col: 306, row: 40 },
        { character: "bookcase-shelf", col: 306, row: 32 },
        { character: "bookcase-shelf", col: 306, row: 24 },
        { character: "balcony", col: 313, cols: 45, row: 16 },
        { character: "stairwell-exit", col: 348, row: 1 },
      ],
      rows: 60,
      solids: [
        // The floor, and a wood post at each end of the room.
        { col: 0, cols: 360, look: "floor", row: 56, rows: 4 },
        { col: 0, cols: 2, look: "post", row: 0, rows: 56 },
        { col: 358, cols: 2, look: "post", row: 0, rows: 56 },
      ],
      tileset: "tiles-lobby",
    },
    street: {
      cols: 240,
      entries: { start: { col: 4, row: 26 } },
      objects: [
        // The sky and the far skyline behind the whole street.
        { character: "street-sky", col: 0, cols: 240, row: 0 },
        { character: "street-skyline", col: 0, cols: 240, row: 3 },
        // Walk: the café, with pigeons that flee as she comes near.
        { character: "storefront-cafe", col: 6, row: 16 },
        { character: "pigeon", col: 14, row: 25 },
        { character: "pigeon", col: 17, row: 25 },
        { character: "walk-signal", col: 24, row: 19 },
        // Hop: a planter, up 2, in front of the florist; then down 1 into a cross street and up
        // 1 out of it.
        { character: "planter", col: 28, cols: 4, row: 24 },
        { character: "storefront-florist", col: 30, row: 16 },
        { character: "cross-street", col: 40, row: 25 },
        // Jump: a hot-dog cart, up 6 (or over it), level with the makeup store's awning.
        { character: "storefront-gift-shop", col: 54, row: 16 },
        { character: "awning", col: 54, cols: 8, row: 20 },
        { character: "hot-dog-cart", col: 66, row: 20 },
        { character: "storefront-makeup-store", col: 69, row: 16 },
        { character: "awning", col: 69, cols: 8, row: 20 },
        { character: "street-tree", col: 82, row: 15 },
        // A gap: a subway entrance, 10 across.
        { character: "subway-railing", col: 102, row: 21 },
        { character: "pit-floor", col: 108, cols: 10, row: 30 },
        // A cellar hatch open 4 across, past the pet shop's dog; then one open 6 across. Each
        // has a steel leaf 2 up at each edge.
        { character: "storefront-pet-shop", col: 120, row: 16 },
        { character: "dog", col: 122, row: 24 },
        { character: "hatch-left", col: 134, row: 24 },
        { character: "pit-opening", col: 135, cols: 4, row: 26 },
        { character: "pit-floor", col: 135, cols: 4, row: 30 },
        { character: "hatch-right", col: 139, row: 24 },
        { character: "storefront-diner", col: 140, row: 16 },
        { character: "awning", col: 140, cols: 9, row: 20 },
        { character: "hatch-left", col: 148, row: 24 },
        { character: "pit-opening", col: 149, cols: 6, row: 26 },
        { character: "pit-floor", col: 149, cols: 6, row: 30 },
        { character: "hatch-right", col: 155, row: 24 },
        // The courier: rides from col 186 to as far as col 166 and back. Wait left of col 164
        // or on the noodle bar's awning, then jump it.
        { character: "storefront-noodle-bar", col: 158, row: 16 },
        { character: "awning", col: 158, cols: 10, row: 20 },
        { character: "pedestrian", col: 172, row: 22 },
        { character: "frog-courier", col: 186, row: 23 },
        { character: "pedestrian", col: 200, phase: 0.5, row: 22 },
        // The ferret's trap, then the hotel door under its canopy.
        { character: "hotel-window", col: 206, row: 13 },
        { character: "ferret-trap-snap", col: 212, row: 24 },
        { character: "hotel-canopy", col: 218, cols: 12, row: 20 },
        { character: "hotel-crest", col: 220, row: 12 },
        { character: "hotel-door", col: 222, row: 22, to: { area: "lobby", entry: "front-door" } },
        { character: "doorman-podium", col: 227, row: 24 },
        { character: "hotel-window", col: 233, row: 13 },
      ],
      rows: 60,
      solids: [
        // A wall at the street's left edge, above the sidewalk.
        { col: 0, cols: 1, look: "sidewalk", row: 0, rows: 26 },
        { col: 0, cols: 40, look: "sidewalk", row: 26, rows: 4 },
        // The cross street's road, one below the sidewalk.
        { col: 40, cols: 10, look: "road", row: 27, rows: 3 },
        { col: 50, cols: 58, look: "sidewalk", row: 26, rows: 4 },
        // The subway entrance: cols 108 to 117.
        { col: 118, cols: 16, look: "sidewalk", row: 26, rows: 4 },
        // Cellar hatches: cols 134 to 139 and 148 to 155, their edge tiles placed as objects.
        { col: 140, cols: 8, look: "sidewalk", row: 26, rows: 4 },
        { col: 156, cols: 84, look: "sidewalk", row: 26, rows: 4 },
      ],
      tileset: "tiles-street",
    },
  },
  start: { area: "street", entry: "start" },
};
