import { BOUNDARY_START, PATROL_FINISH_GEOMETRY } from "./chunkTemplates";
import type { ChunkPlan } from "./types";

const HOME_CITY_FINISH: Omit<ChunkPlan, "theme"> = {
  ...PATROL_FINISH_GEOMETRY,
  backdrops: [{ character: "facade-one-storey", col: 6, cols: 8, role: "near-wall", row: 34 }],
  cols: 60,
  difficulty: 4,
  entry: { row: 50 },
  exit: { row: 50 },
};

export const HOME_CITY_CHUNKS: Readonly<Record<string, ChunkPlan>> = {
  "city-outskirts-finish": { ...HOME_CITY_FINISH, theme: "city-outskirts" },
  "city-outskirts-start": { ...BOUNDARY_START, theme: "city-outskirts" },
  "familiar-neighbourhood-finish": { ...HOME_CITY_FINISH, theme: "familiar-neighbourhood" },
  "familiar-neighbourhood-start": { ...BOUNDARY_START, theme: "familiar-neighbourhood" },
};
