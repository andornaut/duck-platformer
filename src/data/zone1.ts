import type { ZonePlan } from "./types";

// Zone 1: a New York street, outdoors, in one area.
//
// The street is two screens tall. The sidewalk's top is row 50, with the sidewalk and the road
// filling rows 50 to 59, so on the sidewalk she stands two thirds down the screen. A pit-floor
// hazard 4 below the sidewalk's top in every opening restarts the zone soon after she drops in.
// Awnings and the canopy sit on row 44, 6 above the sidewalk. Along the sidewalk, left to right,
// it teaches: walk, hop, jump, a gap, a cellar hatch, the courier, then the ferret's trap at the
// exit door. Over the makeup store and its neighbour, a detour climbs the buildings into the
// upper screen and drops back down: a fall onto the sidewalk is safe, as every fall flutters.
export const ZONE_1: ZonePlan = {
  areas: {
    street: {
      cols: 240,
      entries: { start: { col: 4, row: 50 } },
      objects: [
        // The sky and the far skyline behind the whole street, down to the sidewalk.
        { character: "street-sky", col: 0, cols: 240, row: 0 },
        { character: "street-skyline", col: 0, cols: 240, row: 0 },
        // Walk: the café, with a flock of pigeons that flee as she comes near.
        { character: "storefront-cafe", col: 6, row: 40 },
        { character: "pigeon", col: 12, row: 48 },
        { character: "pigeon", col: 14, phase: 0.3, row: 48 },
        { character: "pigeon", col: 17, phase: 0.6, row: 48 },
        { character: "pigeon", col: 19, phase: 0.1, row: 48 },
        { character: "walk-signal", col: 24, row: 43 },
        // Hop: a planter, up 2, in front of the florist; then down 1 into a cross street and up
        // 1 out of it.
        { character: "planter", col: 28, cols: 4, row: 48 },
        { character: "storefront-florist", col: 30, row: 40 },
        { character: "cross-street", col: 40, row: 49 },
        // Jump: a hot-dog cart, up 6 (or over it), level with the makeup store's awning.
        { character: "storefront-gift-shop", col: 54, row: 40 },
        { character: "awning", col: 54, cols: 8, row: 44 },
        { character: "hot-dog-cart", col: 66, row: 44 },
        { character: "storefront-makeup-store", col: 69, row: 40 },
        { character: "awning", col: 69, cols: 8, row: 44 },
        // The detour, matching art's climbing pieces. On the walk-up: from the makeup store's
        // awning (row 44), fire-escape landings at rows 36, 28, 20 and 13 (up 8, 8, 8 and 7),
        // then up 8 to the walk-up's cornice on its roof (row 5), the street's highest top. On the
        // brownstone beside it: two window sills at row 33 (up 3 and across from the lowest
        // landing), its cornice at row 20 (level with the third landing), and the water tower's
        // tank top at row 14 (up 6 from that cornice).
        { character: "fire-escape-ladder", col: 79, row: 36 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 36 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 34 },
        { character: "fire-escape-ladder", col: 79, row: 28 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 28 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 26 },
        { character: "fire-escape-ladder", col: 79, row: 20 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 20 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 18 },
        { character: "fire-escape-ladder", col: 79, row: 12 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 13 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 11 },
        { character: "cornice", col: 64, cols: 32, row: 5 },
        { character: "window-sill", col: 98, row: 33 },
        { character: "window-sill", col: 104, row: 33 },
        { character: "cornice", col: 96, cols: 28, row: 20 },
        { character: "water-tower", col: 110, row: 13 },
        { character: "water-tank", col: 110, row: 14 },
        { character: "street-tree", col: 82, row: 39 },
        // A second flock, under the tree.
        { character: "pigeon", col: 88, row: 48 },
        { character: "pigeon", col: 91, phase: 0.4, row: 48 },
        { character: "pigeon", col: 93, phase: 0.7, row: 48 },
        // A gap: a subway entrance, 10 across.
        { character: "subway-railing", col: 102, row: 45 },
        { character: "pit-floor", col: 108, cols: 10, row: 54 },
        // A cellar hatch open 4 across, past the pet shop's dog; then one open 6 across. Each
        // has a steel leaf 2 up at each edge.
        { character: "storefront-pet-shop", col: 120, row: 40 },
        { character: "dog-pug", col: 122, row: 47 },
        { character: "hatch-left", col: 134, row: 48 },
        { character: "pit-opening", col: 135, cols: 4, row: 50 },
        { character: "pit-floor", col: 135, cols: 4, row: 54 },
        { character: "hatch-right", col: 139, row: 48 },
        { character: "storefront-diner", col: 140, row: 40 },
        { character: "awning", col: 140, cols: 9, row: 44 },
        { character: "hatch-left", col: 148, row: 48 },
        { character: "pit-opening", col: 149, cols: 6, row: 50 },
        { character: "pit-floor", col: 149, cols: 6, row: 54 },
        { character: "hatch-right", col: 155, row: 48 },
        // The courier: rides from col 186 to as far as col 166 and back. Wait left of col 164
        // or on the noodle bar's awning, then jump it.
        { character: "storefront-noodle-bar", col: 158, row: 40 },
        { character: "awning", col: 158, cols: 10, row: 44 },
        { character: "pedestrian-cat", col: 172, row: 45 },
        { character: "frog-courier", col: 186, row: 47 },
        { character: "pedestrian-raccoon", col: 200, phase: 0.5, row: 45 },
        // The ferret's trap, then the zone's exit door under a canopy.
        { character: "ferret-trap-snap", col: 212, row: 48 },
        { character: "canopy", col: 218, cols: 12, row: 44 },
        { character: "exit-door", col: 222, row: 46 },
      ],
      rows: 60,
      solids: [
        // A wall at the street's left edge, above the sidewalk.
        { col: 0, cols: 1, look: "sidewalk", row: 0, rows: 50 },
        { col: 0, cols: 40, look: "sidewalk", row: 50, rows: 10 },
        // The cross street's road, one below the sidewalk.
        { col: 40, cols: 10, look: "road", row: 51, rows: 9 },
        { col: 50, cols: 58, look: "sidewalk", row: 50, rows: 10 },
        // The subway entrance: cols 108 to 117.
        { col: 118, cols: 16, look: "sidewalk", row: 50, rows: 10 },
        // Cellar hatches: cols 134 to 139 and 148 to 155, their edge tiles placed as objects.
        { col: 140, cols: 8, look: "sidewalk", row: 50, rows: 10 },
        { col: 156, cols: 84, look: "sidewalk", row: 50, rows: 10 },
      ],
      tileset: "tiles-street",
    },
  },
  start: { area: "street", entry: "start" },
};
