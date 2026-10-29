import type { ZonePlan } from "./types";

// Zone 1: a New York street, outdoors, in one area.
//
// The street is one screen of play: the sidewalk's top is row 26 (y 312), and below it the game
// shows ink. A pit-floor hazard 4 below the sidewalk's top in every opening restarts the zone
// soon after she drops in. Awnings and the canopy sit on row 20, 6 above the sidewalk. Left to
// right it teaches: walk, hop, jump, a gap, a cellar hatch, the courier, then the ferret's trap
// at the exit door.
export const ZONE_1: ZonePlan = {
  areas: {
    street: {
      cols: 240,
      entries: { start: { col: 4, row: 26 } },
      objects: [
        // The sky and the far skyline behind the whole street.
        { character: "street-sky", col: 0, cols: 240, row: 0 },
        { character: "street-skyline", col: 0, cols: 240, row: 3 },
        // Walk: the café, with a flock of pigeons that flee as she comes near.
        { character: "storefront-cafe", col: 6, row: 16 },
        { character: "pigeon", col: 12, row: 24 },
        { character: "pigeon", col: 14, phase: 0.3, row: 24 },
        { character: "pigeon", col: 17, phase: 0.6, row: 24 },
        { character: "pigeon", col: 19, phase: 0.1, row: 24 },
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
        // A second flock, under the tree.
        { character: "pigeon", col: 88, row: 24 },
        { character: "pigeon", col: 91, phase: 0.4, row: 24 },
        { character: "pigeon", col: 93, phase: 0.7, row: 24 },
        // A gap: a subway entrance, 10 across.
        { character: "subway-railing", col: 102, row: 21 },
        { character: "pit-floor", col: 108, cols: 10, row: 30 },
        // A cellar hatch open 4 across, past the pet shop's dog; then one open 6 across. Each
        // has a steel leaf 2 up at each edge.
        { character: "storefront-pet-shop", col: 120, row: 16 },
        { character: "dog-pug", col: 122, row: 23 },
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
        { character: "pedestrian-cat", col: 172, row: 21 },
        { character: "frog-courier", col: 186, row: 23 },
        { character: "pedestrian-raccoon", col: 200, phase: 0.5, row: 21 },
        // The ferret's trap, then the zone's exit door under a canopy.
        { character: "ferret-trap-snap", col: 212, row: 24 },
        { character: "canopy", col: 218, cols: 12, row: 20 },
        { character: "exit-door", col: 222, row: 22 },
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
