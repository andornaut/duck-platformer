// The base resolution: every coordinate in the game is in these pixels, scaled to fit the
// screen.
export const SCREEN = { height: 360, width: 720 } as const;

// Hazard outlines lie wholly inside their collision boxes, with red outside and ink inside.
export const HAZARD_OUTLINE = { backing: "ink", colour: "red", redWidth: 2, width: 3 } as const;

// Zones are built on a grid of square tiles this many base pixels wide.
export const TILE = 12;

// Every zone is two screens tall, in tiles.
export const ZONE_ROWS = (2 * SCREEN.height) / TILE;
