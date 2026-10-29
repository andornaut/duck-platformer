import { randomStream } from "@andornaut/game-kit/random";

import type {
  AreaLayout,
  AreaLink,
  DuckTuning,
  LevelLayout,
  ObjectLayout,
  Point,
  Rect,
} from "../data/types";
import { duckBox, type DuckInput, type DuckState, EDGE, startDuck, stepDuck } from "./duck";
import { axisOf, motionTrack, type Track } from "./motion";
import { overlaps } from "./rect";

// What the player asks of the level this step: the duck's input, and whether Use is held. Use
// acts on the step it goes down.
export interface LevelInput extends DuckInput {
  readonly useHeld: boolean;
}

// area: the area she is in. attempt: 0, and one more after each restart; it reseeds the random
// motion, so a restart does not replay it. objects: each of the area's objects' top-left corner.
// seconds: time since she entered the area, which places the objects on their tracks. using: Use
// at a door, which holds the level still until enterArea takes her through. cleared: Use at the
// level's exit.
export interface LevelState {
  readonly area: string;
  readonly attempt: number;
  readonly cleared: boolean;
  readonly duck: DuckState;
  readonly objects: readonly Point[];
  readonly restarts: number;
  readonly seconds: number;
  readonly seed: number;
  readonly steps: number;
  readonly tracks: readonly Track[];
  readonly useHeld: boolean;
  readonly using: AreaLink | undefined;
}

export function areaOf(layout: LevelLayout, area: string): AreaLayout {
  const found = layout.areas[area];
  if (!found) {
    throw new Error(`No area ${area}`);
  }
  return found;
}

function rectAt(object: ObjectLayout, at: Point): Rect {
  return { ...at, height: object.height, width: object.width };
}

function pathAt(object: ObjectLayout, track: Track, seconds: number): Point {
  const offset = track.at(seconds);
  return { x: object.origin.x + offset.x, y: object.origin.y + offset.y };
}

// She arrives at the entry `link` names, the area's objects at the start of their tracks. The
// tracks' random draws come from the seed and the attempt, so each attempt rolls them afresh.
export function enterArea(
  tuning: DuckTuning,
  layout: LevelLayout,
  link: AreaLink,
  level: Pick<LevelState, "attempt" | "restarts" | "seed" | "steps">,
): LevelState {
  const area = areaOf(layout, link.area);
  const entry = area.entries[link.entry];
  if (!entry) {
    throw new Error(`No entry ${link.entry} in area ${link.area}`);
  }
  const tracks = area.objects.map((object, index) =>
    motionTrack(
      object.motion,
      object.phase,
      randomStream(level.seed + level.attempt, `${link.area}:${index}`),
    ),
  );
  return {
    ...level,
    area: link.area,
    cleared: false,
    duck: startDuck(tuning, entry),
    objects: area.objects.map((object, index) => pathAt(object, tracks[index] as Track, 0)),
    seconds: 0,
    tracks,
    // Use must go down after she arrives, so a press that took her through a door, or one held
    // from before, does not act again on the other side.
    useHeld: true,
    using: undefined,
  };
}

export function startLevel(tuning: DuckTuning, layout: LevelLayout, seed: number): LevelState {
  return enterArea(tuning, layout, layout.start, { attempt: 0, restarts: 0, seed, steps: 0 });
}

// Whether her feet are on top of rect.
export function standsOn(tuning: DuckTuning, duck: DuckState, rect: Rect): boolean {
  return (
    Math.abs(duck.y + tuning.height - rect.y) < EDGE &&
    duck.x < rect.x + rect.width &&
    duck.x + tuning.width > rect.x
  );
}

const centreOf = (rect: Rect): Point => ({
  x: rect.x + rect.width / 2,
  y: rect.y + rect.height / 2,
});

// Where an object goes this step. Without a reaction, it follows its track. Within its reaction's
// range of her it moves along its motion's axis, away from her or toward her; out of range it
// heads back to its track, at the reaction's speed either way.
export function objectStep(
  tuning: DuckTuning,
  object: ObjectLayout,
  seconds: number,
  path: Point,
  duck: DuckState,
  at: Point,
): Point {
  const { reaction } = object;
  if (reaction.kind === "none") {
    return path;
  }
  const reach = reaction.speed * seconds;
  const mine = centreOf(rectAt(object, at));
  const hers = centreOf(duckBox(tuning, duck));
  if (Math.hypot(hers.x - mine.x, hers.y - mine.y) <= reaction.range) {
    const axis = axisOf(object.motion.direction);
    const toward = (hers.x - mine.x) * axis.x + (hers.y - mine.y) * axis.y >= 0 ? 1 : -1;
    const sign = reaction.kind === "approach" ? toward : -toward;
    return { x: at.x + axis.x * sign * reach, y: at.y + axis.y * sign * reach };
  }
  const dx = path.x - at.x;
  const dy = path.y - at.y;
  const away = Math.hypot(dx, dy);
  return away <= reach ? path : { x: at.x + (dx / away) * reach, y: at.y + (dy / away) * reach };
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
// Solid objects block like terrain and ledge objects only from above; standing on a moving one,
// she moves with it, and leaving it by a jump or a walk off its edge she keeps its speed along x
// until she lands. Touching a hazard or falling out of the area restarts the level at its start,
// the next attempt. Use at a use zone clears the level at its exit, or at a door sets `using`,
// and the level holds still until enterArea.
export function stepLevel(
  tuning: DuckTuning,
  layout: LevelLayout,
  seconds: number,
  input: LevelInput,
  level: LevelState,
): LevelState {
  if (level.cleared || level.using) {
    return level;
  }
  const area = areaOf(layout, level.area);
  const time = level.seconds + seconds;
  const objects = area.objects.map((object, index) => {
    const before = level.objects[index] ?? object.origin;
    const path = pathAt(object, level.tracks[index] as Track, time);
    const after = objectStep(tuning, object, seconds, path, level.duck, before);
    return { after: rectAt(object, after), before: rectAt(object, before), object };
  });
  const platforms = objects.filter(
    ({ object }) => object.collision === "solid" || object.collision === "ledge",
  );
  const riding = platforms.find(({ before }) => standsOn(tuning, level.duck, before));
  let duck = level.duck;
  let dx = 0;
  if (riding) {
    dx = riding.after.x - riding.before.x;
    duck = ride(tuning, area.solids, dx, riding.after.y - riding.before.y, duck);
  }
  // A platform rising into her from below lifts her onto it, rather than meeting her as a wall.
  for (const { after, before } of platforms) {
    const feet = duck.y + tuning.height;
    if (feet <= before.y + EDGE && feet > after.y && overlaps(duckBox(tuning, duck), after)) {
      duck = { ...duck, y: after.y - tuning.height };
    }
  }
  const rects = (collision: string) =>
    objects.filter(({ object }) => object.collision === collision).map(({ after }) => after);
  const hazards = objects
    .filter(({ object }) => object.collision === "hazard")
    .map(({ after, object }) =>
      object.hitbox
        ? { ...object.hitbox, x: after.x + object.hitbox.x, y: after.y + object.hitbox.y }
        : after,
    );
  duck = stepDuck(
    tuning,
    [...area.solids, ...rects("solid")],
    rects("ledge"),
    seconds,
    input,
    duck,
  );
  if (riding && !duck.grounded) {
    duck = { ...duck, carryVx: dx / seconds };
  }
  const box = duckBox(tuning, duck);
  const steps = level.steps + 1;
  if (duck.y > area.height || hazards.some((hazard) => overlaps(box, hazard))) {
    return enterArea(tuning, layout, layout.start, {
      attempt: level.attempt + 1,
      restarts: level.restarts + 1,
      seed: level.seed,
      steps,
    });
  }
  const usePressed = input.useHeld && !level.useHeld;
  const zone = usePressed
    ? objects.find(({ after, object }) => object.collision === "use" && overlaps(box, after))
    : undefined;
  return {
    ...level,
    cleared: zone !== undefined && zone.object.to === undefined,
    duck,
    objects: objects.map(({ after }) => ({ x: after.x, y: after.y })),
    seconds: time,
    steps,
    useHeld: input.useHeld,
    using: zone?.object.to,
  };
}
