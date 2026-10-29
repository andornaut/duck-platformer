import { describe, expect, it } from "vitest";

import type { LevelPlan } from "../data/types";
import { levelLayout, tileRect } from "./tiles";

describe("tileRect", () => {
  it.each([
    [10, { col: 0, cols: 1, row: 0, rows: 1 }, { height: 10, width: 10, x: 0, y: 0 }],
    [10, { col: 3, cols: 2, row: 31, rows: 5 }, { height: 50, width: 20, x: 30, y: 310 }],
    [8, { col: 3, cols: 2, row: 31, rows: 5 }, { height: 40, width: 16, x: 24, y: 248 }],
  ])("at %i px a tile, puts %j at %j", (tile, rect, pixels) => {
    expect(tileRect(tile, rect)).toEqual(pixels);
  });
});

describe("levelLayout", () => {
  const PLAN: LevelPlan = {
    cols: 64,
    exit: { col: 60, cols: 2, row: 30, rows: 3 },
    hazards: [{ col: 20, cols: 4, row: 32, rows: 1 }],
    ledges: [{ col: 30, cols: 6, row: 25, rows: 1 }],
    movers: [
      {
        cols: 4,
        from: { col: 10, row: 20 },
        pause: 0.5,
        phase: 0.25,
        rows: 1,
        speed: 3,
        to: { col: 20, row: 20 },
      },
    ],
    movingHazards: [
      {
        cols: 2,
        from: { col: 40, row: 32 },
        pause: 0,
        phase: 0.5,
        rows: 1,
        speed: 6,
        to: { col: 50, row: 32 },
      },
    ],
    rows: 36,
    solids: [{ col: 0, cols: 64, row: 33, rows: 3 }],
    start: { col: 5, row: 33 },
  };
  it.each([
    ["exit", { height: 30, width: 20, x: 600, y: 300 }],
    ["hazards", [{ height: 10, width: 40, x: 200, y: 320 }]],
    ["height", 360],
    ["ledges", [{ height: 10, width: 60, x: 300, y: 250 }]],
    [
      "movers",
      [
        {
          from: { x: 100, y: 200 },
          height: 10,
          pause: 0.5,
          phase: 0.25,
          speed: 30,
          to: { x: 200, y: 200 },
          width: 40,
        },
      ],
    ],
    [
      "movingHazards",
      [
        {
          from: { x: 400, y: 320 },
          height: 10,
          pause: 0,
          phase: 0.5,
          speed: 60,
          to: { x: 500, y: 320 },
          width: 20,
        },
      ],
    ],
    ["solids", [{ height: 30, width: 640, x: 0, y: 330 }]],
    ["start", { x: 50, y: 330 }],
    ["width", 640],
  ])("converts the %s", (field, pixels) => {
    expect(levelLayout(10, PLAN)).toHaveProperty(field, pixels);
  });
});
