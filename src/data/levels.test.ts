import { describe, expect, it } from "vitest";

import { TEST_LEVELS } from "./levels";
import { OBJECT_TYPES } from "./objects";
import { SCREEN, TILE } from "./screen";
import type { AreaPlan, TileRect } from "./types";

const inside = (area: AreaPlan, rect: TileRect) =>
  rect.col >= 0 &&
  rect.row >= 0 &&
  rect.col + rect.cols <= area.cols &&
  rect.row + rect.rows <= area.rows;

const areas = TEST_LEVELS.flatMap((level, index) =>
  Object.entries(level.areas).map(([name, area]) => [`${index + 1} ${name}`, level, area] as const),
);

describe("TEST_LEVELS", () => {
  it.each(areas)(
    "area %s is two screens tall, its terrain and objects inside it",
    (_, __, area) => {
      expect(area.rows * TILE).toBe(2 * SCREEN.height);
      expect(area.solids.every((rect) => inside(area, rect))).toBe(true);
      for (const placed of area.objects) {
        const type = OBJECT_TYPES[placed.type];
        expect(type, placed.type).toBeDefined();
        const rect = {
          col: placed.col,
          cols: placed.cols ?? type?.cols ?? 0,
          row: placed.row,
          rows: placed.rows ?? type?.rows ?? 0,
        };
        expect(inside(area, rect), JSON.stringify(placed)).toBe(true);
      }
    },
  );

  it.each(areas)("area %s's doors lead to an entry that exists", (_, level, area) => {
    for (const { to } of area.objects) {
      if (to) {
        expect(level.areas[to.area]?.entries[to.entry], JSON.stringify(to)).toBeDefined();
      }
    }
  });

  it.each(TEST_LEVELS.map((level, index) => [index + 1, level] as const))(
    "level %i starts at an entry that exists and has an exit",
    (_, level) => {
      expect(level.areas[level.start.area]?.entries[level.start.entry]).toBeDefined();
      const exits = Object.values(level.areas).flatMap((area) =>
        area.objects.filter(
          (placed) => OBJECT_TYPES[placed.type]?.collision === "use" && !placed.to,
        ),
      );
      expect(exits.length).toBeGreaterThan(0);
    },
  );
});
