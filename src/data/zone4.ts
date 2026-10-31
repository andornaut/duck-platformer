import { BOUNDARY_START, VERTICAL_FINISH } from "./chunkTemplates";
import type { ChunkPlan } from "./types";

export const WOODLAND_CHUNKS: Readonly<Record<string, ChunkPlan>> = {
  "forest-paths-finish": { ...VERTICAL_FINISH, theme: "forest-paths" },
  "forest-paths-start": { ...BOUNDARY_START, theme: "forest-paths" },
  "ravine-finish": { ...VERTICAL_FINISH, theme: "ravine" },
  "ravine-start": { ...BOUNDARY_START, theme: "ravine" },
};
