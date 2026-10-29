import type { DuckTuning, LevelLayout, Rect } from "../data/types";
import { duckBox, type DuckInput, type DuckState, EDGE, startDuck, stepDuck } from "./duck";
import { moverRect } from "./movers";
import { overlaps } from "./rect";

// cleared: she reached the exit. A fall or a hazard puts her back at the start, the level's only
// checkpoint, and counts a restart. seconds: time since the level (re)started, which places the
// moving platforms, so a restart replays the same timing.
export interface LevelState {
  readonly cleared: boolean;
  readonly duck: DuckState;
  readonly restarts: number;
  readonly seconds: number;
  readonly steps: number;
}

export function startLevel(tuning: DuckTuning, layout: LevelLayout): LevelState {
  return {
    cleared: false,
    duck: startDuck(tuning, layout.start),
    restarts: 0,
    seconds: 0,
    steps: 0,
  };
}

// Whether her feet are on top of rect.
export function standsOn(tuning: DuckTuning, duck: DuckState, rect: Rect): boolean {
  return (
    Math.abs(duck.y + tuning.height - rect.y) < EDGE &&
    duck.x < rect.x + rect.width &&
    duck.x + tuning.width > rect.x
  );
}

// Moves her with the platform she rides, by (dx, dy), along each axis only as far as no solid
// is in the way.
function ride(
  tuning: DuckTuning,
  solids: readonly Rect[],
  dx: number,
  dy: number,
  duck: DuckState,
): DuckState {
  const clear = (x: number, y: number) =>
    !solids.some((solid) => overlaps({ ...duckBox(tuning, duck), x, y }, solid));
  const x = clear(duck.x + dx, duck.y) ? duck.x + dx : duck.x;
  const y = clear(x, duck.y + dy) ? duck.y + dy : duck.y;
  return { ...duck, x, y };
}

// One fixed step of the level. Pure, so the game and a headless simulator run the same rules.
// Moving hazards restart the level as hazards do. The moving platforms block like solids.
// Standing on one, she moves with it; leaving it, by a jump or a walk off its edge, she keeps its
// speed along x until she lands.
export function stepLevel(
  tuning: DuckTuning,
  layout: LevelLayout,
  seconds: number,
  input: DuckInput,
  level: LevelState,
): LevelState {
  if (level.cleared) {
    return level;
  }
  const time = level.seconds + seconds;
  const movers = layout.movers.map((mover) => ({
    after: moverRect(mover, time),
    before: moverRect(mover, level.seconds),
  }));
  const riding = movers.find(({ before }) => standsOn(tuning, level.duck, before));
  let duck = level.duck;
  let dx = 0;
  if (riding) {
    dx = riding.after.x - riding.before.x;
    duck = ride(tuning, layout.solids, dx, riding.after.y - riding.before.y, duck);
  }
  // A platform rising into her from below lifts her onto it, rather than meeting her as a wall.
  for (const { after, before } of movers) {
    const feet = duck.y + tuning.height;
    if (feet <= before.y + EDGE && feet > after.y && overlaps(duckBox(tuning, duck), after)) {
      duck = { ...duck, y: after.y - tuning.height };
    }
  }
  const solids = [...layout.solids, ...movers.map(({ after }) => after)];
  duck = stepDuck(tuning, solids, layout.ledges, seconds, input, duck);
  if (riding && !duck.grounded) {
    duck = { ...duck, carryVx: dx / seconds };
  }
  const box = duckBox(tuning, duck);
  const steps = level.steps + 1;
  const hazards = [
    ...layout.hazards,
    ...layout.movingHazards.map((hazard) => moverRect(hazard, time)),
  ];
  if (duck.y > layout.height || hazards.some((hazard) => overlaps(box, hazard))) {
    return { ...startLevel(tuning, layout), restarts: level.restarts + 1, steps };
  }
  return {
    cleared: overlaps(box, layout.exit),
    duck,
    restarts: level.restarts,
    seconds: time,
    steps,
  };
}
