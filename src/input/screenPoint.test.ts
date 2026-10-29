import { describe, expect, it } from "vitest";

import { type FrameTurn, gamePoint, gameScaledPoint } from "./screenPoint";

// A 648x360 game drawn at 720x400 (10/9 scale) with 140 px bars either side, unturned; turned,
// the same canvas on its side, its bounding rect 400 wide and 720 tall with 140 px bars above and
// below, so the game's top-left is the rect's top-right.
const GAME = { height: 360, width: 648 };
const CANVAS: Record<FrameTurn, { height: number; width: number; x: number; y: number }> = {
  0: { height: 400, width: 720, x: 140, y: 0 },
  90: { height: 720, width: 400, x: 0, y: 140 },
};

describe("gamePoint", () => {
  it.each<[string, FrameTurn, { x: number; y: number }, { x: number; y: number }]>([
    ["the canvas's top-left", 0, { x: 140, y: 0 }, { x: 0, y: 0 }],
    ["mid-canvas", 0, { x: 500, y: 200 }, { x: 324, y: 180 }],
    ["the left bar", 0, { x: 20, y: 200 }, { x: 0, y: 180 }],
    ["the right bar", 0, { x: 990, y: 300 }, { x: 647, y: 270 }],
    ["above the canvas", 0, { x: 500, y: -30 }, { x: 324, y: 0 }],
    ["below the canvas", 0, { x: 500, y: 430 }, { x: 324, y: 359 }],
    ["a corner beyond both edges", 0, { x: 1000, y: 500 }, { x: 647, y: 359 }],
    ["the game's top-left, turned", 90, { x: 400, y: 140 }, { x: 0, y: 0 }],
    ["mid-canvas, turned", 90, { x: 200, y: 500 }, { x: 324, y: 180 }],
    ["the game's bottom-right, turned", 90, { x: 0, y: 860 }, { x: 647, y: 359 }],
    ["the bar above the game's left edge, turned", 90, { x: 200, y: 20 }, { x: 0, y: 180 }],
    ["the bar below the game's right edge, turned", 90, { x: 100, y: 990 }, { x: 647, y: 270 }],
  ])("maps %s", (_, turn, client, game) => {
    expect(gamePoint(turn, CANVAS[turn], GAME, client)).toEqual(game);
  });
});

describe("gameScaledPoint", () => {
  it.each<[string, FrameTurn, { x: number; y: number }, { x: number; y: number }]>([
    ["mid-canvas", 0, { x: 500, y: 200 }, { x: 324, y: 180 }],
    ["the left bar", 0, { x: 50, y: 200 }, { x: -81, y: 180 }],
    ["the right bar", 0, { x: 950, y: 300 }, { x: 729, y: 270 }],
    ["above the canvas", 0, { x: 500, y: -30 }, { x: 324, y: -27 }],
    ["mid-canvas, turned", 90, { x: 200, y: 500 }, { x: 324, y: 180 }],
    ["the bar above the game's left edge, turned", 90, { x: 200, y: 50 }, { x: -81, y: 180 }],
    ["the bar below the game's right edge, turned", 90, { x: 100, y: 950 }, { x: 729, y: 270 }],
    ["right of the canvas, turned", 90, { x: 430, y: 500 }, { x: 324, y: -27 }],
  ])("maps %s without clamping", (_, turn, client, game) => {
    expect(gameScaledPoint(turn, CANVAS[turn], GAME, client)).toEqual(game);
  });
});
