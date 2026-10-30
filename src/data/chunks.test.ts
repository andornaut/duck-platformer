import { describe, expect, it } from "vitest";

import { ASSEMBLED_AREA, assembleZone, themesOf } from "../rules/assemble";
import { chunkProblems, recipeProblems } from "../rules/chunk";
import { ALL_CHUNKS, ALL_RECIPES, ALL_THEMES, FIXTURE_LIBRARY } from "../testing/chunks";
import { lookTiles, type Tileset } from "../view/tiles";
import { ARCHETYPES } from "./archetypes";
import { CHARACTERS } from "./characters";
import { CHUNK_RULES, SEAM_ROWS } from "./chunks";
import { ROOMS } from "./rooms";
import type { ChunkPlan, ZonePlan } from "./types";
import { RECIPES, ZONES } from "./zones";

const CATALOGUE = { archetypes: ARCHETYPES, characters: CHARACTERS };
const TILESETS = import.meta.glob<Tileset>("../../public/art/tilesets/*.json", {
  eager: true,
  import: "default",
});
const SEEDS = Array.from({ length: 50 }, (_, i) => i + 1);

// A chunk 60 wide whose ground is at row 50 at both edges, with extra placed on it.
function seamCase(extra: Partial<ChunkPlan>): ChunkPlan {
  return {
    cols: 60,
    difficulty: 1,
    entry: { row: 50 },
    exit: { row: 50 },
    objects: [],
    solids: [{ col: 0, cols: 60, look: "ground", row: 50, rows: 10 }],
    theme: "test",
    ...extra,
  };
}

describe("the chunk rules", () => {
  it("joins chunks only on the seam rows, with room to land at each", () => {
    expect(SEAM_ROWS.every((row) => row - CHUNK_RULES.headroom >= 0)).toBe(true);
  });
});

describe.each(ALL_THEMES)("theme %s", (_, theme) => {
  it("draws from a tileset art has, with every look's tiles, or from a placeholder drawn flat", () => {
    if (theme.tileset.startsWith("placeholder-")) {
      return;
    }
    const tileset = TILESETS[`../../public/art/tilesets/${theme.tileset}.json`];
    expect(tileset, theme.tileset).toBeDefined();
    const missing = Object.values(theme.looks).flatMap((look) =>
      lookTiles(look).filter((name) => !(tileset && name in tileset.tiles)),
    );
    expect(missing).toEqual([]);
  });

  it("draws each backdrop from a character that exists", () => {
    expect(theme.backdrops.filter(({ character }) => !(character in CHARACTERS))).toEqual([]);
  });

  it("places doors as a character whose archetype is a door", () => {
    expect(CHARACTERS[theme.door]?.archetype, theme.door).toBe("door");
  });
});

describe.each(ALL_CHUNKS)("chunk %s", (_, library, chunk) => {
  it("keeps the chunk rules and the seam rule", () => {
    expect(chunkProblems(library, CATALOGUE, chunk)).toEqual([]);
  });

  if ((chunk.slots ?? []).some(({ kind }) => kind === "door")) {
    it("fits each of its themes' doors in each door slot", () => {
      const tooSmall = themesOf(chunk).flatMap((key) => {
        const door = CHARACTERS[library.themes[key]?.door ?? ""];
        return (chunk.slots ?? [])
          .filter(
            ({ area, kind }) =>
              kind === "door" && (!door || area.cols < door.cols || area.rows < door.rows),
          )
          .map(({ id }) => `${id} for ${key}`);
      });
      expect(tooSmall).toEqual([]);
    });
  }
});

describe("the seam rule", () => {
  it.each<[string, Partial<ChunkPlan>, string]>([
    [
      "a gap within the footing",
      { solids: [{ col: 2, cols: 58, look: "ground", row: 50, rows: 10 }] },
      "entry: no terrain top at row 50 in cols 0, 1",
    ],
    [
      "terrain within the headroom",
      {
        solids: [
          { col: 0, cols: 60, look: "ground", row: 50, rows: 10 },
          { col: 56, cols: 4, look: "ground", row: 45, rows: 1 },
        ],
      },
      "exit: terrain within 6 rows above the seam",
    ],
    [
      "a hazard at the seam",
      { objects: [{ character: "test-hazard", col: 3, row: 49 }] },
      "entry: hazard test-hazard at col 3 row 49 at the seam",
    ],
    [
      "a mover's path through the seam",
      {
        objects: [
          {
            character: "test-mover",
            col: 10,
            overrides: { motion: { direction: "left", distance: 8 } },
            row: 47,
          },
        ],
      },
      "entry: test-mover at col 10 row 47 moves through the seam",
    ],
    ["a seam off the seam rows", { exit: { row: 45 as 50 } }, "exit row 45 is not a seam row"],
  ])("refuses %s", (_, extra, problem) => {
    expect(chunkProblems(FIXTURE_LIBRARY, CATALOGUE, seamCase(extra))).toContain(problem);
  });
});

describe("the recipes", () => {
  it("never share a key with a hand-built zone", () => {
    expect(Object.keys(RECIPES).filter((key) => key in ZONES)).toEqual([]);
  });
});

describe.each(ALL_RECIPES)("recipe %s", (key, library, recipe) => {
  const chunkAt = (id: string) => library.chunks[id] as ChunkPlan;
  let assembled: ZonePlan[] | undefined;
  const plans = () => (assembled ??= SEEDS.map((seed) => assembleZone(library, seed, key, recipe)));

  it("names a theme and start and finish chunks that exist, and fits them", () => {
    expect(recipeProblems(library, recipe)).toEqual([]);
  });

  it(`assembles for ${SEEDS.length} seeds`, () => {
    expect(plans()).toHaveLength(SEEDS.length);
  });

  it("starts and finishes on its chunks, joined where their seams meet, never one twice in a row", () => {
    for (const plan of plans()) {
      const ids = (plan.areas[ASSEMBLED_AREA]?.chunks ?? []).map(({ chunk }) => chunk);
      expect([ids[0], ids.at(-1)]).toEqual([recipe.start, recipe.finish]);
      ids.slice(1).forEach((id, index) => {
        const prev = ids[index] as string;
        expect(id, `${prev} then ${id}`).not.toBe(prev);
        expect(chunkAt(prev).exit.row, `${prev} into ${id}`).toBe(chunkAt(id).entry.row);
      });
    }
  });

  it("fits its length and difficulty band and keeps each chunk's maxPerZone", () => {
    for (const plan of plans()) {
      const area = plan.areas[ASSEMBLED_AREA];
      const placed = area?.chunks ?? [];
      const total = area?.cols ?? 0;
      expect(total).toBeGreaterThanOrEqual(recipe.length.min);
      expect(total).toBeLessThanOrEqual(recipe.length.max);
      const off = placed.slice(1, -1).filter(({ chunk }) => {
        const { difficulty } = chunkAt(chunk);
        return difficulty < recipe.difficulty.min || difficulty > recipe.difficulty.max;
      });
      expect(off).toEqual([]);
      const counts = new Map<string, number>();
      for (const { chunk } of placed.slice(1, -1)) {
        counts.set(chunk, (counts.get(chunk) ?? 0) + 1);
      }
      const over = [...counts].filter(([id, count]) => count > (chunkAt(id).maxPerZone ?? count));
      expect(over).toEqual([]);
    }
  });

  it("asks for doors only to rooms that exist", () => {
    expect(recipe.doors.filter(({ room }) => !(room in ROOMS))).toEqual([]);
  });

  it("places every event and door it asks for in a slot of that kind", () => {
    const wanted = [
      ...recipe.events.flatMap(({ count, id }) => Array<string>(count).fill(`event ${id}`)),
      ...recipe.doors.flatMap(({ count, room }) => Array<string>(count).fill(`door ${room}`)),
    ].sort();
    for (const plan of plans()) {
      const placed = (plan.areas[ASSEMBLED_AREA]?.slots ?? []).flatMap(({ fill, kind }) =>
        fill === undefined ? [] : [`${kind} ${fill}`],
      );
      expect(placed.sort()).toEqual(wanted);
    }
  });
});
