import type { ChunkPlan, ChunkRules, ThemePlan } from "./types";

// The rows a chunk's entry and exit stand on.
export const SEAM_ROWS = [30, 40, 50] as const;

export const CHUNK_RULES: ChunkRules = {
  cols: { max: 120, min: 60 },
  footing: 4,
  headroom: 6,
};

// The themes chunks are drawn in, by key.
export const THEMES: Readonly<Record<string, ThemePlan>> = {
  // PLACEHOLDER: the park, outdoors in autumn. Its tileset and backdrops aren't drawn yet, so it
  // names a placeholder tileset and no backdrops. Chunks name two looks: ground (the lawn, its
  // top at row 50) and raised (the terraces above it).
  park: {
    backdrops: [],
    looks: { ground: "ground", raised: "raised" },
    tileset: "placeholder-park",
  },
};

// PLACEHOLDER: the park's chunks, until gameplay drafts them.
export const CHUNKS: Readonly<Record<string, ChunkPlan>> = {};
