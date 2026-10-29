import { describe, expect, it } from "vitest";

import type { FloorPlan } from "../data/types";
import { floorLayout, tileRect } from "./tiles";

describe("tileRect", () => {
  it.each([
    [10, { col: 0, cols: 1, row: 0, rows: 1 }, { height: 10, width: 10, x: 0, y: 0 }],
    [10, { col: 3, cols: 2, row: 31, rows: 5 }, { height: 50, width: 20, x: 30, y: 310 }],
    [8, { col: 3, cols: 2, row: 31, rows: 5 }, { height: 40, width: 16, x: 24, y: 248 }],
  ])("at %i px a tile, puts %j at %j", (tile, rect, pixels) => {
    expect(tileRect(tile, rect)).toEqual(pixels);
  });
});

describe("floorLayout", () => {
  const PLAN: FloorPlan = {
    cols: 64,
    exit: { col: 60, cols: 2, row: 30, rows: 3 },
    hazards: [{ col: 20, cols: 4, row: 32, rows: 1 }],
    rows: 36,
    solids: [{ col: 0, cols: 64, row: 33, rows: 3 }],
    start: { col: 5, row: 33 },
  };
  it.each([
    ["exit", { height: 30, width: 20, x: 600, y: 300 }],
    ["hazards", [{ height: 10, width: 40, x: 200, y: 320 }]],
    ["height", 360],
    ["solids", [{ height: 30, width: 640, x: 0, y: 330 }]],
    ["start", { x: 50, y: 330 }],
    ["width", 640],
  ])("converts the %s", (field, pixels) => {
    expect(floorLayout(10, PLAN)).toHaveProperty(field, pixels);
  });
});
