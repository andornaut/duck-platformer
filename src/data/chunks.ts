import type { ChunkPlan, ChunkRules, ThemePlan } from "./types";

// The rows a chunk's entry and exit stand on.
export const SEAM_ROWS = [30, 40, 50] as const;

export const CHUNK_RULES: ChunkRules = {
  cols: { max: 120, min: 60 },
  footing: 4,
  headroom: 6,
};

// PLACEHOLDER: the park theme, until gameplay drafts it.
export const THEMES: Readonly<Record<string, ThemePlan>> = {};

// PLACEHOLDER: the park's chunks, until gameplay drafts them.
export const CHUNKS: Readonly<Record<string, ChunkPlan>> = {};
