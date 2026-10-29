import { describe, expect, it } from "vitest";

import { TEST_LEVELS } from "./levels";
import { SCREEN, TILE } from "./screen";
import type { TileRect } from "./types";

const inside = (cols: number, rows: number, rect: TileRect) =>
  rect.col >= 0 && rect.row >= 0 && rect.col + rect.cols <= cols && rect.row + rect.rows <= rows;

describe("TEST_LEVELS", () => {
  it.each(TEST_LEVELS.map((plan, index) => [index + 1, plan] as const))(
    "level %i is two screens tall, with everything inside it",
    (_, plan) => {
      expect(plan.rows * TILE).toBe(2 * SCREEN.height);
      const rects = [plan.exit, ...plan.hazards, ...plan.ledges, ...plan.solids];
      const movers = [...plan.movers, ...plan.movingHazards].flatMap(({ cols, from, rows, to }) => [
        { ...from, cols, rows },
        { ...to, cols, rows },
      ]);
      expect([...rects, ...movers].every((rect) => inside(plan.cols, plan.rows, rect))).toBe(true);
    },
  );
});
