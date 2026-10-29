import { beforeAll, describe, expect, it } from "vitest";

import manifestJson from "../../public/art/manifest.json";
import { ARCHETYPES } from "../data/archetypes";
import { CHARACTERS } from "../data/characters";
import { DUCK } from "../data/duck";
import { REACH } from "../data/reach";
import { TILE } from "../data/screen";
import type { TilePoint, ZoneLayout, ZonePlan } from "../data/types";
import { ZONE_1 } from "../data/zone1";
import { TEST_ZONES } from "../data/zones";
import { zoneLayout } from "../rules/tiles";
import { artHitboxes, type ArtManifest } from "../view/aseprite";
import {
  crosses,
  type Surface,
  surfaceAt,
  walkZone,
  zoneSurfaces,
  type ZoneWalk,
} from "./zoneWalk";

const SHEETS = import.meta.glob<{
  readonly frames: Readonly<Record<string, { readonly sourceSize: { w: number; h: number } }>>;
}>("../../public/art/sprites/*.json", { eager: true, import: "default" });
const HITBOXES = artHitboxes((key) => {
  const frame = Object.values(SHEETS[`../../public/art/sprites/${key}.json`]?.frames ?? {})[0];
  return { height: frame?.sourceSize.h ?? 0, width: frame?.sourceSize.w ?? 0 };
}, manifestJson as ArtManifest);
const CATALOGUE = { archetypes: ARCHETYPES, characters: CHARACTERS };
// The walk takes seconds on a large zone.
const WALK_MS = 120_000;

const ZONES: [string, ZonePlan][] = [
  ["1", ZONE_1],
  ...TEST_ZONES.map((zone, index): [string, ZonePlan] => [`test ${index + 1}`, zone]),
];

const named = (surface: Surface) =>
  `${surface.area} cols ${surface.left / TILE}-${surface.right / TILE} row ${surface.y / TILE}${
    surface.mover === undefined ? "" : " (moving)"
  }`;
const spotName = (area: string, spot: TilePoint) => `${area} col ${spot.col} row ${spot.row}`;

describe.each(ZONES)("zone %s", (_, plan) => {
  let layout: ZoneLayout;
  let walk: ZoneWalk;
  const areas = Object.entries(plan.areas);
  const marks = areas.flatMap(([area, { outOfReach = [] }]) =>
    outOfReach.map((spot) => ({ area, spot })),
  );

  beforeAll(() => {
    layout = zoneLayout(TILE, CATALOGUE, HITBOXES, new Set(), plan);
    walk = walkZone(DUCK, layout);
  }, WALK_MS);

  it("clears at its exit, walked from the start", () => {
    expect(walk.cleared).toBe(true);
  });

  it("reaches every surface it does not mark out of reach", () => {
    const marked = new Set(
      marks.flatMap(({ area, spot }) => surfaceAt(TILE, walk.surfaces, area, spot)?.key ?? []),
    );
    const unreached = walk.surfaces.filter(
      (surface) => !walk.reached.has(surface.key) && !marked.has(surface.key),
    );
    expect(unreached.map(named)).toEqual([]);
  });

  it("marks out of reach only surfaces she never reaches", () => {
    const wrong = marks.filter(({ area, spot }) => {
      const surface = surfaceAt(TILE, walk.surfaces, area, spot);
      return surface === undefined || walk.reached.has(surface.key);
    });
    expect(wrong.map(({ area, spot }) => spotName(area, spot))).toEqual([]);
  });

  it(
    "can't be crossed at a no-cross spot in one move",
    () => {
      const crossed = areas.flatMap(([area, { noCross = [] }]) =>
        noCross.flatMap(({ from, to }) => {
          const start = surfaceAt(TILE, walk.surfaces, area, from);
          const end = surfaceAt(TILE, walk.surfaces, area, to);
          const pair = `${spotName(area, from)} to ${spotName(area, to)}`;
          if (!start || !end) {
            return [`${pair}: not both surfaces`];
          }
          return crosses(DUCK, layout, walk.surfaces, start, end) ? [pair] : [];
        }),
      );
      expect(crossed).toEqual([]);
    },
    WALK_MS,
  );
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
        const layout = zoneLayout(TILE, CATALOGUE, {}, new Set(), plan);
        const surfaces = zoneSurfaces(DUCK, layout);
        const [start, end] = [...surfaces].sort((a, b) => a.left - b.left) as [Surface, Surface];
        return crosses(DUCK, layout, surfaces, start, end);
      };
      expect([makes(course(gap, rise)), makes(course(gapOver, riseOver))]).toEqual([true, false]);
    },
    WALK_MS,
  );
});
