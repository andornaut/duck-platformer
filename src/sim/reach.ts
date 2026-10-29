import { assertNever } from "@andornaut/game-kit/assertNever";
import { STEP_SECONDS } from "@andornaut/game-kit/clock/fixedStep";

import type { DuckTuning, LevelLayout, LevelPlan, Reaches, Rect } from "../data/types";
import type { DuckInput } from "../rules/duck";
import { type LevelState, startLevel, stepLevel } from "../rules/level";
import { levelLayout, tileRect } from "../rules/tiles";

export type Reach = keyof Reaches;

// Each check plays a tile level on the real rules: ground whose top is row GROUND_ROW, RUN_UP
// tiles of it before the ledge or gap, and room above for the tallest ledge tried.
const GROUND_ROW = 40;
const RUN_UP = 40;
const FAR_SIDE = 20;
// The largest reach tried, in tiles, and how long a try may take before it counts as missed.
const MAX_TILES = 60;
const MAX_STEPS = 600;
// Steps she stands still first, so every try starts from her standing on the ground.
const SETTLE_STEPS = 2;
const STILL: DuckInput = { jumpHeld: false, move: 0 };

// One try: the level, the solid she must land on top of, and her input for each step given the
// state so far.
interface Course {
  readonly input: (level: LevelState) => DuckInput;
  readonly layout: LevelLayout;
  readonly target: Rect;
}

const ground = (cols: number) => ({ col: 0, cols, row: GROUND_ROW, rows: 2 });

// A ledge tiles high, just right of where she stands still. She walks right, holding Jump for
// jumpSteps from the first step she moves.
function ledgeCourse(tuning: DuckTuning, tile: number, tiles: number, jumpSteps: number): Course {
  const ledge = { col: RUN_UP, cols: FAR_SIDE, row: GROUND_ROW - tiles, rows: tiles };
  const plan: LevelPlan = {
    cols: RUN_UP + FAR_SIDE,
    exit: { col: 0, cols: 1, row: 0, rows: 1 },
    hazards: [],
    ledges: [],
    movers: [],
    movingHazards: [],
    rows: GROUND_ROW + 2,
    solids: [ground(RUN_UP + FAR_SIDE), ledge],
    start: { col: 0, row: GROUND_ROW },
  };
  const layout = levelLayout(tile, plan);
  const target = tileRect(tile, ledge);
  return {
    input: (level) =>
      level.steps < SETTLE_STEPS
        ? STILL
        : { jumpHeld: level.steps < SETTLE_STEPS + jumpSteps, move: 1 },
    layout: { ...layout, start: { x: target.x - tuning.width / 2, y: layout.start.y } },
    target,
  };
}

// A gap tiles wide between two runs of ground at the same height. She runs right from a
// standstill and presses Jump, holding it, on the last step she stands on the near edge: the
// step after which, without a jump, she would no longer stand on it.
function gapCourse(tuning: DuckTuning, tile: number, tiles: number): Course {
  const near = ground(RUN_UP);
  const far = { ...ground(FAR_SIDE), col: RUN_UP + tiles };
  const plan: LevelPlan = {
    cols: RUN_UP + tiles + FAR_SIDE,
    exit: { col: 0, cols: 1, row: 0, rows: 1 },
    hazards: [],
    ledges: [],
    movers: [],
    movingHazards: [],
    rows: GROUND_ROW + 2,
    solids: [near, far],
    start: { col: 2, row: GROUND_ROW },
  };
  const layout = levelLayout(tile, plan);
  const run: DuckInput = { jumpHeld: false, move: 1 };
  let jumped = false;
  return {
    input: (level) => {
      if (level.steps < SETTLE_STEPS) {
        return STILL;
      }
      jumped ||= !stepLevel(tuning, layout, STEP_SECONDS, run, level).duck.grounded;
      return jumped ? { jumpHeld: true, move: 1 } : run;
    },
    layout,
    target: tileRect(tile, far),
  };
}

function course(tuning: DuckTuning, tile: number, reach: Reach, tiles: number): Course {
  switch (reach) {
    case "hop":
      return ledgeCourse(tuning, tile, tiles, 1);
    case "jump":
      return ledgeCourse(tuning, tile, tiles, MAX_STEPS);
    case "gap":
      return gapCourse(tuning, tile, tiles);
    default:
      return assertNever(reach);
  }
}

// Whether she makes a reach of tiles: she stands on top of the ledge or the far side before a
// restart or the time runs out.
export function makes(tuning: DuckTuning, tile: number, reach: Reach, tiles: number): boolean {
  const { input, layout, target: solid } = course(tuning, tile, reach, tiles);
  let level = startLevel(tuning, layout);
  while (level.steps < MAX_STEPS && level.restarts === 0) {
    level = stepLevel(tuning, layout, STEP_SECONDS, input(level), level);
    const { duck } = level;
    const onTop = Math.abs(duck.y + tuning.height - solid.y) < 1e-6;
    const over = duck.x + tuning.width > solid.x && duck.x < solid.x + solid.width;
    if (duck.grounded && onTop && over) {
      return true;
    }
  }
  return false;
}

// The largest reach of each kind she makes, in tiles, or 0.
export function measureReaches(tuning: DuckTuning, tile: number): Reaches {
  const largest = (reach: Reach) => {
    let best = 0;
    for (let tiles = 1; tiles <= MAX_TILES; tiles++) {
      if (makes(tuning, tile, reach, tiles)) {
        best = tiles;
      }
    }
    return best;
  };
  return { gap: largest("gap"), hop: largest("hop"), jump: largest("jump") };
}
