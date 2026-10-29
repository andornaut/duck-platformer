import type { DuckTuning, FloorLayout } from "../data/types";
import { duckBox, type DuckInput, type DuckState, startDuck, stepDuck } from "./duck";
import { overlaps } from "./rect";

// cleared: she reached the exit. A fall or a hazard puts her back at the start and counts a
// restart.
export interface FloorState {
  readonly cleared: boolean;
  readonly duck: DuckState;
  readonly restarts: number;
  readonly steps: number;
}

export function startFloor(tuning: DuckTuning, layout: FloorLayout): FloorState {
  return { cleared: false, duck: startDuck(tuning, layout.start), restarts: 0, steps: 0 };
}

// One fixed step of the floor. Pure, so the game and a headless simulator run the same rules.
export function stepFloor(
  tuning: DuckTuning,
  layout: FloorLayout,
  seconds: number,
  input: DuckInput,
  floor: FloorState,
): FloorState {
  if (floor.cleared) {
    return floor;
  }
  const duck = stepDuck(tuning, layout.solids, seconds, input, floor.duck);
  const box = duckBox(tuning, duck);
  const steps = floor.steps + 1;
  if (duck.y > layout.height || layout.hazards.some((hazard) => overlaps(box, hazard))) {
    return {
      cleared: false,
      duck: startDuck(tuning, layout.start),
      restarts: floor.restarts + 1,
      steps,
    };
  }
  return { cleared: overlaps(box, layout.exit), duck, restarts: floor.restarts, steps };
}
