import { describe } from "vitest";

import type { ChunkPlan, ZonePlan } from "../data/types";
import { assembleZone, type ChunkLibrary, themesOf, zonePlanOf } from "../rules/assemble";
import { ALL_CHUNKS, ALL_RECIPES } from "../testing/chunks";
import { walkSuite } from "../testing/walkSuite";

// Seeds each recipe is walked end to end for.
const SEEDS = [1, 2, 3, 4, 5];

// A chunk played alone, slots empty: she starts on its entry seam, and an exit stands on its
// exit seam, half its footing in.
function alone(library: ChunkLibrary, chunk: ChunkPlan): ZonePlan {
  const only = { ...library, chunks: { chunk } };
  const plan = zonePlanOf(only, () => 0, { door: [], event: [] }, themesOf(chunk)[0] ?? "", [
    "chunk",
  ]);
  const [name, area] = Object.entries(plan.areas)[0] ?? [];
  if (!name || !area) {
    throw new Error("an assembled zone has one area");
  }
  const exit = {
    character: "test-exit",
    col: chunk.cols - Math.floor(library.rules.footing / 2) - 1,
    cols: 2,
    row: chunk.exit.row - 4,
    rows: 4,
  };
  return { ...plan, areas: { [name]: { ...area, objects: [...area.objects, exit] } } };
}

describe.each(ALL_CHUNKS)("chunk %s alone", (_, library, chunk) => {
  walkSuite(alone(library, chunk));
});

describe.each(
  ALL_RECIPES.flatMap(([key, library, recipe]) =>
    SEEDS.map((seed) => [key, seed, library, recipe] as const),
  ),
)("recipe %s, seed %i", (key, seed, library, recipe) => {
  walkSuite(assembleZone(library, seed, key, recipe));
});
