import { BOUNDARY_START, VERTICAL_FINISH } from "./chunkTemplates";
import type { ChunkPlan } from "./types";

export const INDUSTRIAL_CHUNKS: Readonly<Record<string, ChunkPlan>> = {
  "freight-terminal-finish": { ...VERTICAL_FINISH, theme: "freight-terminal" },
  "freight-terminal-start": { ...BOUNDARY_START, theme: "freight-terminal" },
  "warehouse-district-finish": { ...VERTICAL_FINISH, theme: "warehouse-district" },
  "warehouse-district-start": { ...BOUNDARY_START, theme: "warehouse-district" },
};
