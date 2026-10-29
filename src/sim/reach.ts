import { assertNever } from "@andornaut/game-kit/assertNever";

import type {
  AreaLayout,
  DuckTuning,
  Point,
  Reaches,
  Rect,
  TileRect,
  ZoneLayout,
  ZonePlan,
} from "../data/types";
import { STEP_SECONDS } from "../rules/step";
import { tileRect, zoneLayout } from "../rules/tiles";
import { startZone, stepZone, type ZoneInput, type ZoneState } from "../rules/zone";

export type Reach = keyof Reaches;

// Each check plays a tile zone on the real rules: ground whose top is row GROUND_ROW, RUN_UP
// tiles of it before the ledge or gap, and room above for the tallest ledge tried.
const GROUND_ROW = 40;
const RUN_UP = 40;
const FAR_SIDE = 20;
// The largest reach tried, in tiles, and how long a try may take before it counts as missed.
const MAX_TILES = 60;
const MAX_STEPS = Math.round(10 / STEP_SECONDS);
// Steps she stands still first, so every try starts from her standing on the ground.
const SETTLE_STEPS = 2;
const STILL: ZoneInput = { jumpHeld: false, move: 0, useHeld: false };

// One try: the zone, the solid she must land on top of, and her input for each step given the
// state so far.
interface Course {
  readonly input: (zone: ZoneState) => ZoneInput;
  readonly layout: ZoneLayout;
  readonly target: Rect;
}

const ground = (cols: number) => ({ col: 0, cols, row: GROUND_ROW, rows: 2 });

// One area of terrain, with nothing in it, where she starts at start (her box's bottom centre).
function courseLayout(tile: number, cols: number, solids: TileRect[], start: Point): ZoneLayout {
  const plan: ZonePlan = {
    areas: {
      course: {
        cols,
        entries: { start: { col: 0, row: 0 } },
        objects: [],
        rows: GROUND_ROW + 2,
        solids,
      },
    },
    start: { area: "course", entry: "start" },
  };
  const layout = zoneLayout(tile, { archetypes: {}, characters: {} }, {}, new Set(), plan);
  const area = layout.areas.course as AreaLayout;
  return { ...layout, areas: { course: { ...area, entries: { start } } } };
}

// A ledge tiles high, just right of where she stands still. She walks right, holding Jump for
// jumpSteps from the first step she moves.
function ledgeCourse(tuning: DuckTuning, tile: number, tiles: number, jumpSteps: number): Course {
  const ledge = { col: RUN_UP, cols: FAR_SIDE, row: GROUND_ROW - tiles, rows: tiles };
  const target = tileRect(tile, ledge);
  return {
    input: (zone) =>
      zone.steps < SETTLE_STEPS
        ? STILL
        : { jumpHeld: zone.steps < SETTLE_STEPS + jumpSteps, move: 1, useHeld: false },
    layout: courseLayout(tile, RUN_UP + FAR_SIDE, [ground(RUN_UP + FAR_SIDE), ledge], {
      x: target.x - tuning.width / 2,
      y: GROUND_ROW * tile,
    }),
    target,
  };
}

// A gap tiles wide between two runs of ground at the same height. She runs right from a
// standstill and presses Jump, holding it, on the last step she stands on the near edge: the
// step after which, without a jump, she would no longer stand on it.
function gapCourse(tuning: DuckTuning, tile: number, tiles: number): Course {
  const near = ground(RUN_UP);
  const far = { ...ground(FAR_SIDE), col: RUN_UP + tiles };
  const layout = courseLayout(tile, RUN_UP + tiles + FAR_SIDE, [near, far], {
    x: 2 * tile,
    y: GROUND_ROW * tile,
  });
  const run: ZoneInput = { jumpHeld: false, move: 1, useHeld: false };
  let jumped = false;
  return {
    input: (zone) => {
      if (zone.steps < SETTLE_STEPS) {
        return STILL;
      }
      jumped ||= !stepZone(tuning, layout, STEP_SECONDS, run, zone).duck.grounded;
      return jumped ? { ...run, jumpHeld: true } : run;
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
  let zone = startZone(tuning, layout, 1);
  while (zone.steps < MAX_STEPS && zone.restarts === 0) {
    zone = stepZone(tuning, layout, STEP_SECONDS, input(zone), zone);
    const { duck } = zone;
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
