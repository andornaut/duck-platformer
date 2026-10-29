import type { Reaches } from "./types";

// Gameplay's targets: the duck makes each reach exactly, and never one tile more.
export const REACH: Reaches = {
  gap: 31,
  hop: 3,
  jump: 8,
};
