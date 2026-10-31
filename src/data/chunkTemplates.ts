import type { ChunkPlan } from "./types";

// A shared horizontal encounter with a waiting ledge on each side.
export const PATROL_FINISH_GEOMETRY: Pick<ChunkPlan, "objects" | "solids"> = {
  objects: [
    { character: "platform-ledge", col: 8, cols: 6, role: "ledge", row: 46 },
    { character: "dog-antagonist", col: 31, role: "antagonist", row: 46 },
    { character: "platform-ledge", col: 42, cols: 6, role: "ledge", row: 46 },
  ],
  solids: [{ col: 0, cols: 60, look: "ground", row: 50, rows: 10 }],
};
