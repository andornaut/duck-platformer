import { describe, expect, it } from "vitest";

import type { LevelPlan, ObjectType } from "../data/types";
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
  const LIFT: ObjectType = {
    art: "lift",
    collision: "solid",
    cols: 4,
    motion: {
      algorithm: "linear",
      direction: "up",
      distance: 6,
      hopHeight: 0,
      pause: 1,
      speed: 2,
      variance: 0,
    },
    reaction: { kind: "avoid", range: 5, speed: 3 },
    rows: 1,
  };
  const PLAN: LevelPlan = {
    areas: {
      yard: {
        cols: 64,
        entries: { gate: { col: 5, row: 33 } },
        objects: [
          { col: 20, row: 30, type: "lift" },
          {
            col: 40,
            cols: 8,
            overrides: { motion: { distance: 3 }, reaction: { kind: "none" } },
            phase: 0.5,
            row: 25,
            to: { area: "yard", entry: "gate" },
            type: "lift",
          },
        ],
        rows: 36,
        solids: [{ col: 0, cols: 64, row: 33, rows: 3 }],
      },
    },
    start: { area: "yard", entry: "gate" },
  };
  const layout = levelLayout(
    10,
    { lift: LIFT },
    { lift: { frame: { height: 10, width: 40 }, hitbox: { height: 6, width: 30, x: 5, y: 2 } } },
    PLAN,
  );
  const yard = layout.areas.yard;
  it.each([
    ["the area's size", { height: yard?.height, width: yard?.width }, { height: 360, width: 640 }],
    ["its entries", yard?.entries, { gate: { x: 50, y: 330 } }],
    ["its terrain", yard?.solids, [{ height: 30, width: 640, x: 0, y: 330 }]],
    [
      "an object of its type's size",
      yard?.objects[0] && { height: yard.objects[0].height, width: yard.objects[0].width },
      { height: 10, width: 40 },
    ],
    ["an object sized by its placement", yard?.objects[1]?.width, 80],
    ["an object's spot", yard?.objects[0]?.origin, { x: 200, y: 300 }],
    ["its motion in pixels", yard?.objects[0]?.motion.distance, 60],
    ["its speed in pixels", yard?.objects[0]?.motion.speed, 20],
    ["its reaction in pixels", yard?.objects[0]?.reaction, { kind: "avoid", range: 50, speed: 30 }],
    ["a placement's motion overrides", yard?.objects[1]?.motion.distance, 30],
    ["a placement's reaction overrides", yard?.objects[1]?.reaction.kind, "none"],
    ["a phase, 0 when unset", [yard?.objects[0]?.phase, yard?.objects[1]?.phase], [0, 0.5]],
    ["a door's link", yard?.objects[1]?.to, { area: "yard", entry: "gate" }],
    ["its art's hit box", yard?.objects[0]?.hitbox, { height: 6, width: 30, x: 5, y: 2 }],
    [
      "its art's hit box, the frame centred on a wider placement",
      yard?.objects[1]?.hitbox,
      { height: 6, width: 30, x: 25, y: 2 },
    ],
    ["the start", layout.start, { area: "yard", entry: "gate" }],
  ])("converts %s", (_, converted, expected) => {
    expect(converted).toEqual(expected);
  });

  it("refuses a placement of an unknown type", () => {
    const yardPlan = PLAN.areas.yard;
    const bad = {
      ...PLAN,
      areas: { yard: { ...yardPlan, objects: [{ col: 0, row: 0, type: "kite" }] } },
    };
    expect(() => levelLayout(10, { lift: LIFT }, {}, bad as LevelPlan)).toThrow("kite");
  });
});
