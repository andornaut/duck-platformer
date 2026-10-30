import type { ZonePlan } from "./types";

// Zone 1: a New York street, outdoors, in one area.
//
// The street is two screens tall. The sidewalk's top is row 50, with the sidewalk and the road
// filling rows 50 to 59, so on the sidewalk she stands two thirds down the screen. A pit-floor
// hazard 4 below the sidewalk's top in every opening restarts the zone soon after she drops in.
// Awnings and the canopy sit on row 44, 6 above the sidewalk. Along the sidewalk, left to right,
// it teaches: walk, hop, jump, a gap, a cellar hatch, the courier, then the ferret's trap before
// the street's end, which clears the zone. Over the makeup store and its neighbour, a detour
// climbs the buildings into the upper screen and drops back down: a fall onto the sidewalk is
// safe, as every fall flutters.
export const ZONE_1: ZonePlan = {
  areas: {
    street: {
      cols: 240,
      entries: { start: { col: 4, row: 50 } },
      objects: [
        // The sky and the far skyline behind the whole street, down to the sidewalk.
        { character: "street-sky", col: 0, cols: 240, parallax: { x: 0, y: 0 }, row: 0 },
        { character: "street-city-far", col: 0, cols: 240, parallax: { x: 0.15, y: 0.05 }, row: 0 },
        { character: "street-city-mid", col: 0, cols: 240, parallax: { x: 0.4, y: 0.15 }, row: 0 },
        // The buildings behind the shops, standing on the sidewalk line, in runs a whole number
        // of pieces wide. A two-storey building is its facade capped by a roofline at row 20; a
        // three-storey one adds an upper storey (rows 9 to 23) and its roofline's top is row 5.
        // Each roofline carries a cornice along its top. Left to right: a brownstone, the cross
        // street's gap, one-storey brick, the walk-up whose fire escape the detour climbs, the
        // brownstone with the water tower, one-storey brick, a second walk-up and a brownstone to
        // the street's end.
        { character: "facade-brownstone", col: 0, cols: 40, row: 24 },
        { character: "roofline-brownstone", col: 0, cols: 40, row: 20 },
        { character: "cornice", col: 1, cols: 39, row: 20 },
        { character: "facade-one-storey", col: 52, cols: 12, row: 34 },
        { character: "facade-walkup", col: 64, cols: 32, row: 24 },
        { character: "facade-walkup-upper", col: 64, cols: 32, row: 9 },
        { character: "roofline-walkup", col: 64, cols: 32, row: 5 },
        { character: "facade-brownstone", col: 96, cols: 28, row: 24 },
        { character: "roofline-brownstone", col: 96, cols: 28, row: 20 },
        { character: "facade-one-storey", col: 124, cols: 28, row: 34 },
        { character: "facade-walkup", col: 152, cols: 40, row: 24 },
        { character: "facade-walkup-upper", col: 152, cols: 40, row: 9 },
        { character: "roofline-walkup", col: 152, cols: 40, row: 5 },
        { character: "cornice", col: 152, cols: 40, row: 5 },
        { character: "facade-brownstone", col: 192, cols: 48, row: 24 },
        { character: "roofline-brownstone", col: 192, cols: 48, row: 20 },
        { character: "cornice", col: 192, cols: 48, row: 20 },
        // Walk: the café, with a flock of pigeons that flee as she comes near.
        { character: "storefront-cafe", col: 6, row: 40 },
        { character: "pigeon", col: 12, row: 48 },
        { character: "pigeon", col: 14, phase: 0.3, row: 48 },
        { character: "pigeon", col: 17, phase: 0.6, row: 48 },
        { character: "pigeon", col: 19, phase: 0.1, row: 48 },
        { character: "walk-signal", col: 24, row: 43 },
        // Hop: a short press up 2 onto a planter in front of the florist; then down 1 into a cross
        // street and a tap up 1 out of it.
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
        // awning (row 44), fire-escape landings at rows 39, 33, 27, 23, 18, 13 and 9 (up 5, 6, 6,
        // 4, 5, 5 and 4; 33 and 18 on the window sills), then up 4 to the walk-up's cornice on its
        // roof (row 5), the street's highest top. Each landing has its railing, with open jumps
        // between the ledges. On the brownstone beside it: two
        // window sills level with the landing at row 33, its cornice at row 20 (up 3 and across
        // from the landing at row 23), and the water tower's tank top at row 14 (up 6 from that
        // cornice).
        { character: "fire-escape-landing", col: 74, cols: 8, row: 39 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 37 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 33 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 31 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 27 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 25 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 23 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 21 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 18 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 16 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 13 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 11 },
        { character: "fire-escape-landing", col: 74, cols: 8, row: 9 },
        { character: "fire-escape-railing", col: 74, cols: 8, row: 7 },
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
        // A door to the test room, in the brownstone's ground storey.
        { character: "street-door", col: 97, room: "test", row: 46 },
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
        // The ferret's trap, then a canopy before the street's end.
        { character: "ferret-trap-snap", col: 212, row: 48 },
        { character: "canopy", col: 218, cols: 12, row: 44 },
      ],
      // The roofs the detour doesn't reach: the second walk-up's and the last brownstone's
      // cornices. The first brownstone's cornice is in reach, by a drop off the climbed walk-up's
      // roof.
      outOfReach: [
        { col: 170, row: 5 },
        { col: 215, row: 20 },
      ],
      rows: 60,
      solids: [
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
