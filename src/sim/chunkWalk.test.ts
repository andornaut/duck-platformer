import { describe } from "vitest";

import type { ChunkPlan, ZonePlan } from "../data/types";
import { assembleZone, type ChunkLibrary, themesOf, zonePlanOf } from "../rules/assemble";
import { ALL_CHUNKS, ALL_RECIPES } from "../testing/chunks";
import { walkSuite } from "../testing/walkSuite";

// A chunk played alone, slots empty: she starts on its entry seam and clears at its right edge.
function alone(library: ChunkLibrary, chunk: ChunkPlan): ZonePlan {
  const only = { ...library, chunks: { chunk } };
  return zonePlanOf(only, () => 0, { door: [], event: [] }, themesOf(chunk)[0] ?? "", 2, ["chunk"]);
}

describe.each(ALL_CHUNKS)("chunk %s alone", (_, library, chunk) => {
  walkSuite(alone(library, chunk));
});

describe.each(ALL_RECIPES)("recipe %s", (key, library, recipe) => {
  walkSuite(assembleZone(library, 1, key, recipe));
});
