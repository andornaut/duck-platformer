import type { Reaches } from "./types";

// Gameplay's targets: the duck makes each reach exactly, and never one tile more.
export const REACH: Reaches = {
  gap: 12,
  hop: 2,
  jump: 6,
};
