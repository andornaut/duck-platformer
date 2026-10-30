import { describe, expect, it } from "vitest";

import type { AreaPlan, ChunkPlan, ZoneRecipe } from "../data/types";
import { ASSEMBLED_AREA, assembleZone, type ChunkLibrary } from "./assemble";
import { recipeProblems } from "./chunk";

const ROWS = 60;
const SEEDS = Array.from({ length: 20 }, (_, i) => i + 1);

// A chunk 60 wide on ground at its entry row, rising or dropping to its exit row halfway.
function chunk(entry: 30 | 40 | 50, exit: 30 | 40 | 50, extra: Partial<ChunkPlan> = {}): ChunkPlan {
  return {
    cols: 60,
    difficulty: 1,
    entry: { row: entry },
    exit: { row: exit },
    objects: [],
    solids: [
      { col: 0, cols: 30, look: "ground", row: entry, rows: ROWS - entry },
      { col: 30, cols: 30, look: "ground", row: exit, rows: ROWS - exit },
    ],
    theme: "t",
    ...extra,
  };
}

function library(chunks: Readonly<Record<string, ChunkPlan>>): ChunkLibrary {
  return {
    characters: { door: { cols: 2, rows: 3 } },
    chunks: { finish: chunk(50, 50), start: chunk(50, 50), ...chunks },
    rows: ROWS,
    rules: { cols: { max: 120, min: 60 }, footing: 4, headroom: 6 },
    seams: [30, 40, 50],
    themes: {
      t: {
        backdrops: [{ character: "sky", row: 0 }],
        door: "door",
        looks: { ground: "grass" },
        tileset: "tiles",
      },
    },
  };
}

// A recipe for start, middles chunks between, then finish: exactly that wide at 60 each.
function recipe(middles: number, extra: Partial<ZoneRecipe> = {}): ZoneRecipe {
  const cols = 60 * (middles + 2);
  return {
    difficulty: { max: 1, min: 1 },
    doors: [],
    events: [],
    finish: "finish",
    length: { max: cols, min: cols },
    start: "start",
    theme: "t",
    ...extra,
  };
}

const areaOf = (plan: ReturnType<typeof assembleZone>): AreaPlan => {
  const area = plan.areas[ASSEMBLED_AREA];
  if (!area) {
    throw new Error("no area");
  }
  return area;
};
const middleIds = (area: AreaPlan) => (area.chunks ?? []).slice(1, -1).map(({ chunk: id }) => id);
const runs = (lib: ChunkLibrary, zone: ZoneRecipe) =>
  new Set(SEEDS.map((seed) => middleIds(areaOf(assembleZone(lib, seed, "z", zone))).join(" ")));

describe("assembleZone", () => {
  it.each<[string, Record<string, ChunkPlan>, ZoneRecipe, string[]]>([
    [
      "joins only where an exit meets the next entry, backing out of a likelier dead end",
      { dead: chunk(50, 30, { weight: 1000 }), down: chunk(40, 50), up: chunk(50, 40) },
      recipe(2),
      ["up down"],
    ],
    [
      "never places one chunk twice in a row",
      { a: chunk(50, 50), b: chunk(50, 50) },
      recipe(2),
      ["a b", "b a"],
    ],
    [
      "places a chunk at most its maxPerZone times",
      { a: chunk(50, 50, { maxPerZone: 2 }), b: chunk(50, 50, { maxPerZone: 1 }) },
      recipe(3),
      ["a b a"],
    ],
    [
      "keeps every middle chunk in the same inclusive band, with either extreme first or last",
      {
        easy: chunk(50, 50, { difficulty: 1 }),
        hard: chunk(50, 50, { difficulty: 5 }),
        x: chunk(50, 50, { difficulty: 2, maxPerZone: 1 }),
        y: chunk(50, 50, { difficulty: 4, maxPerZone: 1 }),
        z: chunk(50, 50, { difficulty: 3, maxPerZone: 1 }),
      },
      recipe(3, { difficulty: { max: 4, min: 2 } }),
      ["x y z", "x z y", "y x z", "y z x", "z x y", "z y x"],
    ],
    [
      "keeps the whole zone within its length",
      { a: chunk(50, 50), b: chunk(50, 50) },
      recipe(1, { length: { max: 200, min: 120 } }),
      ["", "a", "b"],
    ],
  ])("%s", (_, chunks, zone, allowed) => {
    const found = [...runs(library(chunks), zone)];
    expect(found.length).toBeGreaterThan(0);
    expect(found.filter((run) => !allowed.includes(run))).toEqual([]);
  });

  it.each<[string, Record<string, ChunkPlan>, ZoneRecipe]>([
    ["no chunk joins", { up: chunk(50, 40) }, recipe(1)],
    ["only one chunk fits a run of two", { a: chunk(50, 50) }, recipe(2)],
    [
      "maxPerZone runs out",
      { a: chunk(50, 50, { maxPerZone: 1 }), b: chunk(50, 50, { maxPerZone: 1 }) },
      recipe(3),
    ],
    ["no chunk is in the band", { a: chunk(50, 50, { difficulty: 4 }) }, recipe(1)],
    [
      "too few slots for the events",
      {
        a: chunk(50, 50, {
          slots: [{ area: { col: 0, cols: 1, row: 0, rows: 1 }, id: "s", kind: "event" }],
        }),
      },
      recipe(1, { events: [{ count: 2, id: "e" }] }),
    ],
  ])("fails clearly when %s", (_, chunks, zone) => {
    expect(() => assembleZone(library(chunks), 1, "z", zone)).toThrow(/^No assembly of zone z/);
  });

  it("supports one selected difficulty while keeping safe boundary chunks exempt", () => {
    const lib = library({
      a: chunk(50, 50, { difficulty: 3 }),
      b: chunk(50, 50, { difficulty: 3 }),
      easy: chunk(50, 50, { difficulty: 2 }),
      hard: chunk(50, 50, { difficulty: 4 }),
    });
    expect([...runs(lib, recipe(2, { difficulty: { max: 3, min: 3 } }))].sort()).toEqual([
      "a b",
      "b a",
    ]);
  });

  it.each([
    [0, 3],
    [2, 6],
    [4, 2],
    [1.5, 3],
    [2, 3.5],
    [NaN, 3],
    [1, Infinity],
  ])("refuses an invalid difficulty band %s to %s", (min, max) => {
    const difficulty = { max, min } as ZoneRecipe["difficulty"];
    expect(recipeProblems(library({}), recipe(0, { difficulty }))).toContain(
      `difficulty ${min} to ${max} is not an ordered band from 1 to 5`,
    );
  });

  it("gives the same zone for the same seed, and different zones across seeds", () => {
    const lib = library({ a: chunk(50, 50), b: chunk(50, 50), c: chunk(50, 50) });
    const zone = recipe(3);
    expect(assembleZone(lib, 7, "z", zone)).toEqual(assembleZone(lib, 7, "z", zone));
    expect(runs(lib, zone).size).toBeGreaterThan(1);
  });

  it("preserves theme and placed backdrop parallax across chunk assembly", () => {
    const lib = library({
      a: chunk(50, 50, {
        backdrops: [{ character: "tree", col: 3, parallax: { x: 0.4, y: 0.2 }, row: 20 }],
      }),
    });
    const theme = lib.themes.t;
    if (!theme) {
      throw new Error("no theme");
    }
    const withParallax = {
      ...lib,
      themes: {
        t: { ...theme, backdrops: [{ character: "sky", parallax: { x: 0, y: 0 }, row: 0 }] },
      },
    };
    const area = areaOf(assembleZone(withParallax, 1, "z", recipe(1)));
    expect(area.objects).toEqual([
      { character: "sky", col: 0, cols: area.cols, parallax: { x: 0, y: 0 }, row: 0 },
      { character: "tree", col: 63, parallax: { x: 0.4, y: 0.2 }, row: 20 },
    ]);
  });

  it("moves each chunk's contents to its zone columns, drawn in the theme, with its doors", () => {
    const lib = library({
      a: chunk(50, 50, {
        backdrops: [{ character: "tree", col: 3, row: 20 }],
        noCross: [{ from: { col: 1, row: 50 }, to: { col: 9, row: 50 } }],
        objects: [{ character: "bench", col: 5, row: 48 }],
        outOfReach: [{ col: 2, row: 10 }],
        slots: [{ area: { col: 6, cols: 2, row: 40, rows: 4 }, id: "s", kind: "door" }],
      }),
    });
    const area = areaOf(assembleZone(lib, 1, "z", recipe(1, { doors: [{ count: 1, room: "r" }] })));
    expect(area).toMatchObject({
      chunks: [
        { chunk: "start", col: 0, cols: 60 },
        { chunk: "a", col: 60, cols: 60 },
        { chunk: "finish", col: 120, cols: 60 },
      ],
      cols: 180,
      entries: { start: { col: 2, row: 50 } },
      noCross: [{ from: { col: 61, row: 50 }, to: { col: 69, row: 50 } }],
      objects: [
        { character: "sky", col: 0, cols: 180, row: 0 },
        { character: "tree", col: 63, row: 20 },
        { character: "bench", col: 65, row: 48 },
        { character: "door", col: 66, room: "r", row: 41 },
      ],
      outOfReach: [{ col: 62, row: 10 }],
      rows: ROWS,
      slots: [
        {
          area: { col: 66, cols: 2, row: 40, rows: 4 },
          chunk: 1,
          fill: "r",
          id: "s",
          kind: "door",
        },
      ],
      tileset: "tiles",
    });
    expect(area.solids.map(({ col, look }) => [col, look])).toEqual(
      [0, 30, 60, 90, 120, 150].map((col) => [col, "grass"]),
    );
  });

  it("fills as many slots as the recipe asks for, by the seed, and leaves the rest empty", () => {
    const slot = (id: string, kind: "door" | "event") => ({
      area: { col: 0, cols: 1, row: 0, rows: 1 },
      id,
      kind,
    });
    const lib = library({
      a: chunk(50, 50, { slots: [slot("e1", "event"), slot("e2", "event"), slot("d1", "door")] }),
      b: chunk(50, 50, { slots: [slot("e3", "event"), slot("d2", "door")] }),
    });
    const zone = recipe(2, {
      doors: [{ count: 1, room: "r" }],
      events: [
        { count: 1, id: "x" },
        { count: 1, id: "y" },
      ],
    });
    const fills = SEEDS.map((seed) =>
      (areaOf(assembleZone(lib, seed, "z", zone)).slots ?? []).map((each) => each.fill ?? "-"),
    );
    for (const each of fills) {
      expect([...each].sort()).toEqual(["-", "-", "r", "x", "y"]);
    }
    expect(new Set(fills.map((each) => each.join())).size).toBeGreaterThan(1);
  });

  it.each([0, 1, 2])("places the theme's door in each of %i filled door slots", (count) => {
    const slot = (id: string, col: number) => ({
      area: { col, cols: 4, row: 45, rows: 5 },
      id,
      kind: "door" as const,
    });
    const lib = library({
      a: chunk(50, 50, { slots: [slot("d1", 10)] }),
      b: chunk(50, 50, { slots: [slot("d2", 20)] }),
    });
    const zone = recipe(2, { doors: count === 0 ? [] : [{ count, room: "r" }] });
    for (const seed of SEEDS) {
      const area = areaOf(assembleZone(lib, seed, "z", zone));
      const doors = area.objects.filter(({ character }) => character === "door");
      const filled = (area.slots ?? []).filter(({ fill }) => fill !== undefined);
      expect(doors.map(({ col }) => col - 1)).toEqual(filled.map(({ area: rect }) => rect.col));
      expect(doors).toHaveLength(count);
    }
  });

  // A slot 4 wide and 5 tall at col 10 and row 45 of the middle chunk (zone col 70), its floor at
  // row 50.
  it.each([
    ["one narrower by an odd count, half a tile in", { cols: 3, rows: 5 }, { col: 70.5, row: 45 }],
    ["one narrower by an even count, a tile in", { cols: 2, rows: 3 }, { col: 71, row: 47 }],
    ["one as wide, flush", { cols: 4, rows: 4 }, { col: 70, row: 46 }],
  ])("centres %s and stands it on the slot's floor", (_, size, at) => {
    const lib = {
      ...library({
        a: chunk(50, 50, {
          slots: [{ area: { col: 10, cols: 4, row: 45, rows: 5 }, id: "d", kind: "door" }],
        }),
      }),
      characters: { door: size },
    };
    const area = areaOf(assembleZone(lib, 1, "z", recipe(1, { doors: [{ count: 1, room: "r" }] })));
    const door = area.objects.find(({ character }) => character === "door");
    expect(door && { col: door.col, row: door.row }).toEqual(at);
  });
});
