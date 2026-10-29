import { describe, expect, it } from "vitest";

import { DUCK } from "../data/duck";
import { REACH } from "../data/reach";
import { TILE } from "../data/screen";
import type { ZonePlan } from "../data/types";
import { ZONE_1 } from "../data/zone1";
import { TEST_ZONES } from "../data/zones";
import { zoneLayout } from "../rules/tiles";
import { CATALOGUE, WALK_MS, walkSuite } from "../testing/walkSuite";
import { crosses, type Surface, zoneSurfaces } from "./zoneWalk";

const ZONES: [string, ZonePlan][] = [
  ["1", ZONE_1],
  ...TEST_ZONES.map((zone, index): [string, ZonePlan] => [`test ${index + 1}`, zone]),
];

describe.each(ZONES)("zone %s", (_, plan) => {
  walkSuite(plan);
});

// Ground at row 40 from col 0 to 20, where she starts, and a ledge rise tiles higher from col
// 20 + gap on.
function course(gap: number, rise: number): ZonePlan {
  return {
    areas: {
      course: {
        cols: 60 + gap,
        entries: { start: { col: 10, row: 40 } },
        objects: [],
        rows: 60,
        solids: [
          { col: 0, cols: 20, row: 40, rows: 20 },
          { col: 20 + gap, cols: 40, row: 40 - rise, rows: 20 + rise },
        ],
      },
    },
    start: { area: "course", entry: "start" },
  };
}

describe("crosses", () => {
  it.each([
    ["a gap", REACH.gap, 0, REACH.gap + 1, 0],
    ["a rise", 0, REACH.jump, 0, REACH.jump + 1],
  ])(
    "makes %s at her reach in one move, and never one tile more",
    (_, gap, rise, gapOver, riseOver) => {
      const makes = (plan: ZonePlan) => {
        const layout = zoneLayout(TILE, CATALOGUE, {}, {}, new Set(), plan);
        const surfaces = zoneSurfaces(DUCK, layout);
        const [start, end] = [...surfaces].sort((a, b) => a.left - b.left) as [Surface, Surface];
        return crosses(DUCK, layout, surfaces, start, end);
      };
      expect([makes(course(gap, rise)), makes(course(gapOver, riseOver))]).toEqual([true, false]);
    },
    WALK_MS,
  );
});
