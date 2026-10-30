import type { RoomPlan } from "./types";

// The rooms behind doors, by key. Each room's name is TEXT.rooms[key].name.
export const ROOMS: Readonly<Record<string, RoomPlan>> = {
  // PLACEHOLDER: an empty room showing only its name, behind every door until gameplay designs
  // the rooms.
  test: {},
};
