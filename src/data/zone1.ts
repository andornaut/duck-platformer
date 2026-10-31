import type { ZonePlan } from "./types";

// Zone 1: a fixed parcel depot opening into the street, in one area.
// The first screen teaches walking, a one-tile tap, a full six-tile jump and a short gap.
// A loading yard separates those lessons from the street and its optional upper route.
// A ceiling over a one-tile step teaches releasing Jump early; red edges restart the zone.
export const ZONE_1: ZonePlan = {
  areas: {
    street: {
      cols: 288,
      entries: { start: { col: 4, row: 50 } },
      objects: [
        // The sky and the far skyline behind the whole street, down to the sidewalk.
        { character: "street-sky", col: 0, cols: 288, parallax: { x: 0, y: 0 }, row: 0 },
        { character: "street-city-far", col: 0, cols: 288, parallax: { x: 0.15, y: 0.05 }, row: 0 },
        { character: "street-city-mid", col: 0, cols: 288, parallax: { x: 0.4, y: 0.15 }, row: 0 },
        // The first screen holds the depot lessons, followed by the loading yard and street.
        { character: "depot-wall", col: 0, cols: 60, row: 35 },
        { character: "depot-loading-bay", col: 30, row: 40 },
        { character: "parcel-open", col: 2, row: 47 },
        { character: "facade-one-storey", col: 60, cols: 4, row: 34 },
        { character: "facade-walkup", col: 112, cols: 32, row: 24 },
        { character: "facade-walkup-upper", col: 112, cols: 32, row: 9 },
        { character: "roofline-walkup", col: 112, cols: 32, row: 5 },
        { character: "facade-brownstone", col: 144, cols: 28, row: 24 },
        { character: "roofline-brownstone", col: 144, cols: 28, row: 20 },
        { character: "facade-one-storey", col: 172, cols: 28, row: 34 },
        { character: "facade-walkup", col: 200, cols: 40, row: 24 },
        { character: "facade-walkup-upper", col: 200, cols: 40, row: 9 },
        { character: "roofline-walkup", col: 200, cols: 40, row: 5 },
        { character: "cornice", col: 200, cols: 40, row: 5 },
        { character: "facade-brownstone", col: 240, cols: 48, row: 24 },
        { character: "roofline-brownstone", col: 240, cols: 48, row: 20 },
        { character: "cornice", col: 240, cols: 48, row: 20 },
        // Safe walking room precedes the tap step and full-jump block in the depot floor.
        // Refuges before and after the loading yard keep her above the dog's contact box.
        { character: "platform-ledge", col: 68, cols: 6, row: 46 },
        { character: "dog-antagonist", col: 91, row: 46, scene: "depot-dog-intro" },
        { character: "platform-ledge", col: 102, cols: 6, row: 46 },
        { character: "walk-signal", col: 110, row: 43 },
        { character: "red-edge-top", col: 56, cols: 6, row: 54 },
        { character: "red-edge-support", col: 56, cols: 6, row: 55, rows: 5 },
        { character: "storefront-gift-shop", col: 110, row: 40 },
        { character: "hot-dog-cart", col: 114, row: 44 },
        { character: "storefront-makeup-store", col: 117, row: 40 },
        { character: "awning", col: 117, cols: 8, row: 44 },
        // The detour, matching art's climbing pieces. On the walk-up: from the makeup store's
        // awning (row 44), fire-escape landings at rows 39, 33, 27, 23, 18, 13 and 9 (up 5, 6, 6,
        // 4, 5, 5 and 4; 33 and 18 on the window sills), then up 4 to the walk-up's cornice on its
        // roof (row 5), the street's highest top. Each landing has its railing, with open jumps
        // between the ledges. On the brownstone beside it: two
        // window sills level with the landing at row 33, its cornice at row 20 (up 3 and across
        // from the landing at row 23), and the water tower's tank top at row 14 (up 6 from that
        // cornice).
        { character: "platform-ledge", col: 122, cols: 8, row: 39 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 37 },
        { character: "platform-ledge", col: 122, cols: 8, row: 33 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 31 },
        { character: "platform-ledge", col: 122, cols: 8, row: 27 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 25 },
        { character: "platform-ledge", col: 122, cols: 8, row: 23 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 21 },
        { character: "platform-ledge", col: 122, cols: 8, row: 18 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 16 },
        { character: "platform-ledge", col: 122, cols: 8, row: 13 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 11 },
        { character: "platform-ledge", col: 122, cols: 8, row: 9 },
        { character: "fire-escape-railing", col: 122, cols: 8, row: 7 },
        { character: "cornice", col: 112, cols: 32, row: 5 },
        { character: "window-sill", col: 146, row: 33 },
        { character: "window-sill", col: 152, row: 33 },
        { character: "cornice", col: 144, cols: 28, row: 20 },
        { character: "water-tower", col: 158, row: 13 },
        { character: "water-tank", col: 158, row: 14 },
        { character: "street-tree", col: 130, row: 39 },
        // A second flock, under the tree.
        { character: "pigeon", col: 136, row: 48 },
        { character: "pigeon", col: 139, phase: 0.4, row: 48 },
        { character: "pigeon", col: 141, phase: 0.7, row: 48 },
        // A door to the test room, in the brownstone's ground storey.
        { character: "street-door", col: 145, room: "test", row: 46 },
        // A gap: a subway entrance, 10 across.
        { character: "subway-railing", col: 150, row: 45 },
        { character: "red-edge-top", col: 156, cols: 10, row: 54 },
        { character: "red-edge-support", col: 156, cols: 10, row: 55, rows: 5 },
        // A cellar hatch open 4 across, past the pet shop's dog; then one open 6 across. Each
        // has a steel leaf 2 up at each edge.
        { character: "storefront-pet-shop", col: 168, row: 40 },
        { character: "dog-pug", col: 170, row: 47 },
        { character: "hatch-left", col: 182, row: 48 },
        { character: "pit-opening", col: 183, cols: 4, row: 50 },
        { character: "red-edge-top", col: 183, cols: 4, row: 54 },
        { character: "red-edge-support", col: 183, cols: 4, row: 55, rows: 5 },
        { character: "hatch-right", col: 187, row: 48 },
        { character: "storefront-diner", col: 188, row: 40 },
        { character: "awning", col: 188, cols: 9, row: 44 },
        { character: "hatch-left", col: 196, row: 48 },
        { character: "pit-opening", col: 197, cols: 6, row: 50 },
        { character: "red-edge-top", col: 197, cols: 6, row: 54 },
        { character: "red-edge-support", col: 197, cols: 6, row: 55, rows: 5 },
        { character: "hatch-right", col: 203, row: 48 },
        // A red edge on the sidewalk, below the noodle bar's awning.
        { character: "storefront-noodle-bar", col: 206, row: 40 },
        { character: "awning", col: 206, cols: 10, row: 44 },
        // Short presses pass the step under this ceiling; a full jump reaches its red edge.
        { character: "red-edge-bottom", col: 220, cols: 18, row: 45 },
        { character: "red-edge-left", col: 219, row: 43, rows: 2 },
        { character: "red-edge-right", col: 238, row: 43, rows: 2 },
        { character: "red-edge-top", col: 220, cols: 18, row: 42 },
        { character: "red-edge-support", col: 220, cols: 18, row: 43, rows: 2 },
        { character: "pedestrian-cat", col: 242, row: 45 },
        { character: "pedestrian-raccoon", col: 248, phase: 0.5, row: 45 },
        // Another red edge, then a canopy before the street's end.
        { character: "red-edge-top", col: 260, cols: 4, row: 49 },
        { character: "red-edge-support", col: 260, cols: 4, row: 50, rows: 10 },
        { character: "canopy", col: 266, cols: 12, row: 44 },
      ],
      // The roofs the detour doesn't reach: the second walk-up's and the last brownstone's
      // cornices.
      outOfReach: [
        { col: 218, row: 5 },
        { col: 263, row: 20 },
      ],
      rows: 60,
      solids: [
        { col: 0, cols: 20, look: "sidewalk", row: 50, rows: 10 },
        { col: 20, cols: 4, look: "sidewalk", row: 49, rows: 11 },
        { col: 24, cols: 16, look: "sidewalk", row: 50, rows: 10 },
        { col: 40, cols: 6, look: "sidewalk", row: 44, rows: 16 },
        { col: 46, cols: 10, look: "sidewalk", row: 50, rows: 10 },
        { col: 62, cols: 48, look: "sidewalk", row: 50, rows: 10 },
        { col: 110, cols: 46, look: "sidewalk", row: 50, rows: 10 },
        // The subway entrance: cols 156 to 165.
        { col: 166, cols: 16, look: "sidewalk", row: 50, rows: 10 },
        // Cellar hatches: cols 182 to 187 and 196 to 203, their edge tiles placed as objects.
        { col: 188, cols: 8, look: "sidewalk", row: 50, rows: 10 },
        { col: 204, cols: 24, look: "sidewalk", row: 50, rows: 10 },
        { col: 228, cols: 6, look: "sidewalk", row: 49, rows: 11 },
        { col: 234, cols: 26, look: "sidewalk", row: 50, rows: 10 },
        { col: 264, cols: 24, look: "sidewalk", row: 50, rows: 10 },
      ],
      tileset: "tiles-street",
    },
  },
  start: { area: "street", entry: "start" },
};
