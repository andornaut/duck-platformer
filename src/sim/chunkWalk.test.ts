import { describe } from "vitest";

import type { ChunkPlan, ZonePlan } from "../data/types";
import { assembleZone, type ChunkLibrary, themesOf, zonePlanOf } from "../rules/assemble";
import { ALL_CHUNKS, ALL_RECIPES } from "../testing/chunks";
import { walkSuite } from "../testing/walkSuite";

// Seeds each recipe is walked end to end for.
const SEEDS = [1, 2, 3, 4, 5];

// A chunk played alone, slots empty: she starts on its entry seam and clears at its right edge.
function alone(library: ChunkLibrary, chunk: ChunkPlan): ZonePlan {
  const only = { ...library, chunks: { chunk } };
  return zonePlanOf(only, () => 0, { door: [], event: [] }, themesOf(chunk)[0] ?? "", 2, ["chunk"]);
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
