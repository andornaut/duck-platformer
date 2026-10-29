import type {
  AreaLayout,
  DuckTuning,
  ObjectLayout,
  Point,
  Rect,
  TilePoint,
  ZoneLayout,
} from "../data/types";
import { STEP_SECONDS } from "../rules/step";
import {
  areaOf,
  enterArea,
  standsOn,
  startZone,
  stepZone,
  type ZoneInput,
  type ZoneState,
} from "../rules/zone";

// A top she can stand on in an area: a still span from left to right at height y, or a moving
// platform's top (mover: its object's index), placed where its track starts. Still spans are
// the tops of terrain and still solid and ledge objects, joined where they meet at one height,
// less where a solid or still hazard leaves her no room to stand.
export interface Surface {
  readonly area: string;
  readonly key: string;
  readonly left: number;
  readonly mover: number | undefined;
  readonly right: number;
  readonly y: number;
}

// Where the walk has her standing: a stretch of a surface, its bucket (BUCKET px wide, from the
// surface's left), and her zone state when she first came to stand there.
interface Spot {
  readonly bucket: number;
  readonly state: ZoneState;
  readonly surface: Surface;
}

// What the walk finds: every surface in the zone, the keys of those she came to stand on,
// whether she cleared the zone, and how many zone steps it ran.
export interface ZoneWalk {
  readonly cleared: boolean;
  readonly reached: ReadonlySet<string>;
  readonly steps: number;
  readonly surfaces: readonly Surface[];
}

const STILL: ZoneInput = { jumpHeld: false, move: 0, useHeld: false };
// The walk splits each surface into stretches this wide, so a jump along one surface (over a
// hazard on it, say) counts as a move.
const BUCKET = 96;
// How far she runs up before a takeoff, and how far inside her surface her centre stays as she
// gets into place, in px; how long a try may run after the takeoff, and how long she may take to
// walk into place, in steps.
const RUN_UP = 36;
const FOOTING = 16;
const AIR_STEPS = Math.round(5 / STEP_SECONDS);
const WALK_STEPS = Math.round(8 / STEP_SECONDS);
// Where she presses Jump before the edge she runs off, in px back along her run, besides every
// TAKEOFF_STEP px along her surface; and the nearby buckets of her own surface she aims for.
const EDGE_TAKEOFFS = [4, 12, 36, 72, 120];
const TAKEOFF_STEP = 12;
const OWN_BUCKETS = [-3, -2, -1, 1, 2, 3];
// Waits before a try, in steps, where something moves near it: through the longest cycle of the
// area's moving things (at most MAX_CYCLE seconds), every half second.
const WAIT_STEP = Math.round(0.5 / STEP_SECONDS);
const MAX_CYCLE = 16;

const isStill = (object: ObjectLayout) =>
  object.motion.algorithm === "static" && object.reaction.kind === "none";

const objectRect = (object: ObjectLayout, at: Point): Rect => ({
  height: object.height,
  width: object.width,
  x: at.x,
  y: at.y,
});

// The area an object can be in over its track: its rectangle swept along its motion's axis.
function sweptRect(object: ObjectLayout): Rect {
  const { direction, distance } = object.motion;
  const reach = object.reaction.kind === "none" ? distance : distance + object.reaction.range;
  const rect = objectRect(object, object.origin);
  switch (direction) {
    case "left":
      return { ...rect, width: rect.width + reach, x: rect.x - reach };
    case "right":
      return { ...rect, width: rect.width + reach };
    case "up":
      return { ...rect, height: rect.height + reach, y: rect.y - reach };
    default:
      return { ...rect, height: rect.height + reach };
  }
}

// The x spans of spans with the parts in cuts taken out.
function subtract(
  spans: readonly [number, number][],
  cuts: readonly [number, number][],
): [number, number][] {
  return cuts.reduce<[number, number][]>(
    (rest, [from, to]) =>
      rest.flatMap(([left, right]): [number, number][] =>
        to <= left || from >= right
          ? [[left, right]]
          : [
              ...(from > left ? [[left, from] as [number, number]] : []),
              ...(to < right ? [[to, right] as [number, number]] : []),
            ],
      ),
    [...spans],
  );
}

function areaSurfaces(tuning: DuckTuning, name: string, area: AreaLayout): Surface[] {
  const still = area.objects.filter(isStill);
  const solids = [
    ...area.solids,
    ...still.filter((o) => o.collision === "solid").map((o) => objectRect(o, o.origin)),
  ];
  const tops = [
    ...solids,
    ...still.filter((o) => o.collision === "ledge").map((o) => objectRect(o, o.origin)),
  ];
  const hazards = still
    .filter((o) => o.collision === "hazard")
    .map((o) =>
      o.hitbox
        ? { ...o.hitbox, x: o.origin.x + o.hitbox.x, y: o.origin.y + o.hitbox.y }
        : objectRect(o, o.origin),
    );
  const heights = [...new Set(tops.map((top) => top.y))].sort((a, b) => a - b);
  const surfaces = heights.flatMap((y) => {
    const spans = tops
      .filter((top) => top.y === y)
      .map((top): [number, number] => [top.x, top.x + top.width])
      .sort((a, b) => a[0] - b[0])
      .reduce<[number, number][]>((joined, [left, right]) => {
        const last = joined.at(-1);
        if (last && left <= last[1]) {
          last[1] = Math.max(last[1], right);
        } else {
          joined.push([left, right]);
        }
        return joined;
      }, []);
    const cuts = [...solids, ...hazards]
      .filter((rect) => rect.y < y && rect.y + rect.height > y - tuning.height)
      .map((rect): [number, number] => [rect.x, rect.x + rect.width]);
    return subtract(spans, cuts).map(([left, right]) => ({ left, right, y }));
  });
  const movers = area.objects.flatMap((object, index) =>
    !isStill(object) && (object.collision === "solid" || object.collision === "ledge")
      ? [
          {
            left: object.origin.x,
            mover: index,
            right: object.origin.x + object.width,
            y: object.origin.y,
          },
        ]
      : [],
  );
  return [...surfaces.map((span) => ({ ...span, mover: undefined })), ...movers].map((span) => ({
    ...span,
    area: name,
    key: `${name}:${span.mover ?? "still"}:${span.left},${span.y}`,
  }));
}

// Every surface she can stand on in the zone.
export function zoneSurfaces(tuning: DuckTuning, layout: ZoneLayout): Surface[] {
  return Object.entries(layout.areas).flatMap(([name, area]) => areaSurfaces(tuning, name, area));
}

// The surface a spot names: one whose top is the spot's row and whose span, where its track
// starts, takes in the spot's column's left edge.
export function surfaceAt(
  tile: number,
  surfaces: readonly Surface[],
  area: string,
  spot: TilePoint,
): Surface | undefined {
  const x = spot.col * tile;
  return surfaces.find(
    (surface) =>
      surface.area === area &&
      surface.y === spot.row * tile &&
      surface.left <= x &&
      x <= surface.right,
  );
}

// Where a surface is now: a moving platform's top where the zone has it.
function placed(surface: Surface, zone: ZoneState, layout: ZoneLayout): Surface {
  if (surface.mover === undefined) {
    return surface;
  }
  const object = areaOf(layout, surface.area).objects[surface.mover];
  const at = zone.objects[surface.mover] ?? object?.origin ?? { x: 0, y: 0 };
  const width = object?.width ?? surface.right - surface.left;
  return { ...surface, left: at.x, right: at.x + width, y: at.y };
}

// The surface she stands on, if any.
function surfaceUnder(
  tuning: DuckTuning,
  layout: ZoneLayout,
  surfaces: readonly Surface[],
  zone: ZoneState,
): Surface | undefined {
  const { duck } = zone;
  if (!duck.grounded) {
    return undefined;
  }
  return surfaces
    .filter((surface) => surface.area === zone.area)
    .find((surface) => {
      const now = placed(surface, zone, layout);
      return standsOn(tuning, duck, {
        height: 1,
        width: now.right - now.left,
        x: now.left,
        y: now.y,
      });
    });
}

// The spot she stands on, on surface: its bucket by where her centre is along it.
function spotOf(surface: Surface, zone: ZoneState, layout: ZoneLayout, tuning: DuckTuning): Spot {
  const now = placed(surface, zone, layout);
  const centre = zone.duck.x + tuning.width / 2;
  const bucket = Math.max(
    0,
    Math.floor((Math.min(Math.max(centre, now.left), now.right) - now.left) / BUCKET),
  );
  return { bucket, state: zone, surface };
}

const spotKey = (spot: Pick<Spot, "bucket" | "surface">) => `${spot.surface.key}#${spot.bucket}`;

// A stretch she may aim for: a whole surface, or one bucket of one (key: the spot's key).
interface Target {
  readonly key: string;
  readonly left: number;
  readonly right: number;
  readonly surface: Surface;
}

// One try, as input for each step. dir: the way she runs. pre: where her trailing side goes
// before she runs. takeoff: where her trailing side is when she presses Jump; or, with late, she
// runs on until she leaves the ground and presses late steps after. hold: the steps she holds
// Jump, 0 for none. rise: the steps after the press she goes straight up before she steers.
// target: the stretch she steers to land on. pre and takeoff are from the left
// of the surface she starts on, wherever a moving one has got to.
interface Try {
  readonly dir: -1 | 1;
  readonly hold: number;
  readonly late: number | undefined;
  readonly pre: number;
  readonly rise: number;
  readonly takeoff: number;
  readonly target: Target;
}

const trailing = (tuning: DuckTuning, dir: -1 | 1, x: number) => (dir > 0 ? x : x + tuning.width);

// Runs zone on one step at a time; step returns false once she restarts.
function runner(tuning: DuckTuning, layout: ZoneLayout, start: ZoneState) {
  const run = {
    step: (input: ZoneInput) => {
      const before = run.zone.restarts;
      run.zone = stepZone(tuning, layout, STEP_SECONDS, input, run.zone);
      run.steps++;
      return run.zone.restarts === before;
    },
    steps: 0,
    zone: start,
  };
  return run;
}

// The input that steers her centre into a stretch, wherever its surface is now.
function steer(
  tuning: DuckTuning,
  layout: ZoneLayout,
  target: Target,
  zone: ZoneState,
): -1 | 0 | 1 {
  const shift = placed(target.surface, zone, layout).left - target.surface.left;
  const lo = target.left + shift + tuning.width / 2;
  const hi = target.right + shift - tuning.width / 2;
  const centre = zone.duck.x + tuning.width / 2;
  return centre < Math.min(lo, hi) ? 1 : centre > Math.max(lo, hi) ? -1 : 0;
}

// Plays a try from a spot, starting at start. Returns where she first comes to stand after
// leaving the ground, if that is another spot, and the steps it ran.
function play(
  tuning: DuckTuning,
  layout: ZoneLayout,
  surfaces: readonly Surface[],
  from: Spot,
  start: ZoneState,
  attempt: Try,
): { landed: Spot | undefined; steps: number } {
  const run = runner(tuning, layout, start);
  const missed = () => ({ landed: undefined, steps: run.steps });
  const base = () => placed(from.surface, run.zone, layout).left;
  const { dir } = attempt;
  // Into place, braking in time to stop there, then still.
  for (let i = 0; i < WALK_STEPS; i++) {
    const { vx } = run.zone.duck;
    const gap = base() + attempt.pre - trailing(tuning, dir, run.zone.duck.x);
    if (Math.abs(gap) < 2 && Math.abs(vx) < 1) {
      break;
    }
    const stopping = (vx * vx) / (2 * tuning.groundAccel);
    const move = Math.abs(gap) <= stopping + 1 && vx * gap >= 0 ? 0 : gap > 0 ? 1 : -1;
    if (!run.step({ ...STILL, move }) || !run.zone.duck.grounded) {
      return missed();
    }
  }
  // The run up to the takeoff.
  let stuck = 0;
  for (let i = 0; i < WALK_STEPS && stuck < 3; i++) {
    const { duck } = run.zone;
    const there =
      attempt.late === undefined
        ? dir * (trailing(tuning, dir, duck.x) - base() - attempt.takeoff) >= 0
        : !duck.grounded;
    if (there) {
      break;
    }
    if (!run.step({ ...STILL, move: dir })) {
      return missed();
    }
    stuck = Math.abs(run.zone.duck.x - duck.x) < 1e-9 ? stuck + 1 : 0;
  }
  for (let i = 0; i < (attempt.late ?? 0); i++) {
    if (!run.step({ ...STILL, move: dir })) {
      return missed();
    }
  }
  // The press, then steering onto the target until she lands.
  let left = !run.zone.duck.grounded;
  for (let i = 0; i < AIR_STEPS; i++) {
    const move = i < attempt.rise ? 0 : steer(tuning, layout, attempt.target, run.zone);
    if (!run.step({ jumpHeld: i < attempt.hold, move, useHeld: false })) {
      return missed();
    }
    left ||= !run.zone.duck.grounded;
    if (left && run.zone.duck.grounded) {
      const landed = comeToRest(tuning, layout, surfaces, run);
      return {
        landed: landed && spotKey(landed) !== spotKey(from) ? landed : undefined,
        steps: run.steps,
      };
    }
  }
  return missed();
}

// Brings her to a stop where she landed: the spot she stands still on, unless stopping takes her
// off it or into a hazard.
function comeToRest(
  tuning: DuckTuning,
  layout: ZoneLayout,
  surfaces: readonly Surface[],
  run: ReturnType<typeof runner>,
): Spot | undefined {
  const under = surfaceUnder(tuning, layout, surfaces, run.zone);
  for (let i = 0; i < AIR_STEPS && Math.abs(run.zone.duck.vx) >= 1; i++) {
    if (!run.step(STILL) || !run.zone.duck.grounded) {
      return undefined;
    }
  }
  const still = surfaceUnder(tuning, layout, surfaces, run.zone);
  return under && still?.key === under.key ? spotOf(still, run.zone, layout, tuning) : undefined;
}

// Walks along her surface into a stretch of it: where she stands there, if she gets there.
function walkInto(
  tuning: DuckTuning,
  layout: ZoneLayout,
  surfaces: readonly Surface[],
  start: ZoneState,
  target: Target,
): { landed: Spot | undefined; steps: number } {
  const run = runner(tuning, layout, start);
  for (let i = 0; i < WALK_STEPS; i++) {
    const move = steer(tuning, layout, target, run.zone);
    if (move === 0) {
      const under = surfaceUnder(tuning, layout, surfaces, run.zone);
      const spot = under ? spotOf(under, run.zone, layout, tuning) : undefined;
      return { landed: spot && spotKey(spot) === target.key ? spot : undefined, steps: run.steps };
    }
    if (!run.step({ ...STILL, move }) || !run.zone.duck.grounded) {
      break;
    }
  }
  return { landed: undefined, steps: run.steps };
}

// Walks to a use zone's centre and presses Use: the state after, if Use acted.
function use(
  tuning: DuckTuning,
  layout: ZoneLayout,
  start: ZoneState,
  object: ObjectLayout,
): { done: ZoneState | undefined; steps: number } {
  const run = runner(tuning, layout, start);
  const target = object.origin.x + object.width / 2 - tuning.width / 2;
  for (let i = 0; i < WALK_STEPS; i++) {
    const gap = target - run.zone.duck.x;
    if (Math.abs(gap) < 2) {
      break;
    }
    if (!run.step({ ...STILL, move: gap > 0 ? 1 : -1 })) {
      return { done: undefined, steps: run.steps };
    }
  }
  for (const useHeld of [false, true]) {
    run.step({ ...STILL, useHeld });
  }
  const { zone } = run;
  return { done: zone.cleared || zone.using ? zone : undefined, steps: run.steps };
}

// Steps her still until she stands somewhere, or gives up.
function settle(tuning: DuckTuning, layout: ZoneLayout, zone: ZoneState): ZoneState {
  let settled = zone;
  for (let i = 0; i < AIR_STEPS && !settled.duck.grounded; i++) {
    settled = stepZone(tuning, layout, STEP_SECONDS, STILL, settled);
  }
  return settled;
}

// The zone after she stands still for each wait in turn (WAIT_STEP apart, count of them), up to
// the first that restarts her.
function waitStates(
  tuning: DuckTuning,
  layout: ZoneLayout,
  start: ZoneState,
  count: number,
): { states: ZoneState[]; steps: number } {
  const run = runner(tuning, layout, start);
  const states = [start];
  while (states.length < count) {
    for (let i = 0; i < WAIT_STEP; i++) {
      if (!run.step(STILL)) {
        return { states, steps: run.steps };
      }
    }
    states.push(run.zone);
  }
  return { states, steps: run.steps };
}

// How far she might go in one move, in px: up to rise, and along x when the landing is drop
// below the takeoff (negative for one above), carried by a platform at up to carry px/s.
function moveBounds(tuning: DuckTuning, carry: number) {
  const { flutterFallSpeed, gravity, jumpHoldTime, jumpSpeed, walkSpeed } = tuning;
  const rise = jumpSpeed * jumpHoldTime + (jumpSpeed * jumpSpeed) / (2 * gravity);
  const across = (drop: number) => {
    const air =
      jumpHoldTime +
      jumpSpeed / gravity +
      (rise + Math.max(0, drop)) / flutterFallSpeed +
      flutterFallSpeed / gravity;
    return (walkSpeed + carry) * (air + tuning.coyoteTime) + 2 * BUCKET;
  };
  return { across, rise: rise + 2 * BUCKET };
}

// The steps a moving thing takes to go round its track once, at most MAX_CYCLE.
function cycleSteps(object: ObjectLayout): number {
  const { distance, pause, speed } = object.motion;
  const seconds = speed > 0 ? 2 * (distance / speed + pause) : 0;
  return Math.ceil(Math.min(seconds, MAX_CYCLE) / STEP_SECONDS);
}

// The things in an area that move and that she can touch, and how many waits cover the longest
// cycle among them.
function movingThings(area: AreaLayout): { count: number; moving: ObjectLayout[] } {
  const moving = area.objects.filter((object) => !isStill(object) && object.collision !== "none");
  return { count: Math.floor(Math.max(0, ...moving.map(cycleSteps)) / WAIT_STEP) + 1, moving };
}

// The tries from a spot toward a target: from each way she can run at it, pressing Jump at every
// tile along her surface, just before the edge she runs off and in coyote time after it, each
// held and tapped, and off an edge with no press at all where the target is lower.
function triesToward(tuning: DuckTuning, from: Spot, here: Surface, target: Target): Try[] {
  const { width } = tuning;
  const lo = here.left + from.bucket * BUCKET - BUCKET;
  const hi = here.left + (from.bucket + 2) * BUCKET;
  // Where either surface moves, which way she must go depends on when she goes: both ways, then.
  const moving = here.mover !== undefined || target.surface.mover !== undefined;
  const dirs: (-1 | 1)[] =
    !moving && target.left >= here.right
      ? [1]
      : !moving && target.right <= here.left
        ? [-1]
        : [1, -1];
  const below = target.surface.y > here.y;
  const coyote = Math.ceil(tuning.coyoteTime / STEP_SECONDS);
  const lates = [...new Set([0, 3, 6, 9, coyote - 2, coyote - 1, coyote, coyote + 1])].filter(
    (late) => late >= 0,
  );
  // Held, tapped, and held going straight up through the tap window first, to clear something
  // close by that the hop alone does not.
  const tapSteps = Math.round(tuning.jumpTapWindow / STEP_SECONDS);
  const presses = [
    { hold: AIR_STEPS, rise: 0 },
    { hold: 1, rise: 0 },
    { hold: AIR_STEPS, rise: tapSteps },
  ];
  return dirs.flatMap((dir) => {
    const edge = dir > 0 ? here.right : here.left;
    const inReach = (x: number) => {
      const leading = x + dir * width;
      return Math.max(x, leading) > lo && Math.min(x, leading) < hi;
    };
    // Her run-up starts with her centre at least FOOTING px inside her surface, so stopping
    // there never takes her off it; the middle, on a surface narrower than that.
    const half = dir > 0 ? width / 2 : -width / 2;
    const middle = (here.left + here.right) / 2;
    const minCentre = Math.min(here.left + FOOTING, middle);
    const maxCentre = Math.max(here.right - FOOTING, middle);
    const preFor = (x: number) =>
      Math.min(Math.max(x - dir * RUN_UP + half, minCentre), maxCentre) - half;
    // Along her surface, her centre every TAKEOFF_STEP px from its left.
    const along = Array.from(
      { length: Math.floor((here.right - here.left) / TAKEOFF_STEP) + 1 },
      (_, i) => here.left + i * TAKEOFF_STEP - half,
    );
    const before = [...EDGE_TAKEOFFS.map((back) => edge - dir * back), ...along].filter(
      (x) => inReach(x) && dir * (x - edge) < 0,
    );
    const relative = (attempt: Omit<Try, "dir" | "rise" | "target"> & { rise?: number }): Try => ({
      rise: 0,
      ...attempt,
      dir,
      pre: attempt.pre - here.left,
      takeoff: attempt.takeoff - here.left,
      target,
    });
    const pressed = before.flatMap((x) =>
      presses.map((press) => relative({ ...press, late: undefined, pre: preFor(x), takeoff: x })),
    );
    const offEdge = inReach(edge)
      ? [
          ...lates.flatMap((late) =>
            presses.map((press) => relative({ ...press, late, pre: preFor(edge), takeoff: edge })),
          ),
          ...(below ? [relative({ hold: 0, late: 0, pre: preFor(edge), takeoff: edge })] : []),
        ]
      : [];
    return [...pressed, ...offEdge];
  });
}

// Where a surface can be over its track: its x range and its highest and lowest top.
function sweptSpan(
  layout: ZoneLayout,
  surface: Surface,
): { bottom: number; left: number; right: number; top: number } {
  const object =
    surface.mover === undefined ? undefined : areaOf(layout, surface.area).objects[surface.mover];
  if (!object) {
    return { bottom: surface.y, left: surface.left, right: surface.right, top: surface.y };
  }
  const rect = sweptRect(object);
  return {
    bottom: rect.y + rect.height - object.height,
    left: rect.x,
    right: rect.x + rect.width,
    top: rect.y,
  };
}

// The stretches a spot might reach in one move: the other surfaces in its area within the
// duck's bounds, and its own surface's buckets nearby.
function targetsFrom(
  tuning: DuckTuning,
  layout: ZoneLayout,
  surfaces: readonly Surface[],
  from: Spot,
  here: Surface,
  carry: number,
): { others: Target[]; own: Target[] } {
  const bounds = moveBounds(tuning, carry);
  const lo = here.left + (from.bucket - 1) * BUCKET;
  const hi = here.left + (from.bucket + 2) * BUCKET;
  const others = surfaces
    .filter((surface) => surface.area === here.area && surface.key !== here.key)
    .filter((surface) => {
      const span = sweptSpan(layout, surface);
      const dx = Math.max(0, span.left - hi, lo - span.right);
      return here.y - span.bottom <= bounds.rise && dx <= bounds.across(span.bottom - here.y);
    })
    .map((surface) => ({ key: surface.key, left: surface.left, right: surface.right, surface }));
  const own = OWN_BUCKETS.map((offset) => from.bucket + offset)
    .filter((bucket) => bucket >= 0 && here.left + bucket * BUCKET < here.right)
    .map((bucket) => ({
      key: `${from.surface.key}#${bucket}`,
      left: here.left + bucket * BUCKET,
      right: Math.min(here.right, here.left + (bucket + 1) * BUCKET),
      surface: from.surface,
    }));
  return { others, own };
}

// Walks the zone from its start on the real rules. From each spot she comes to stand on, it
// tries each stretch in range that she has not reached yet: a walk along her own surface, then
// every jump at it, at every wait where something moves near. It presses Use at each use zone
// near the spot; a door leads on to its area. It stops when no try finds a new spot.
export function walkZone(tuning: DuckTuning, layout: ZoneLayout): ZoneWalk {
  const surfaces = zoneSurfaces(tuning, layout);
  const seen = new Map<string, Spot>();
  const reached = new Set<string>();
  const queue: Spot[] = [];
  let steps = 0;
  let cleared = false;
  const reach = (spot: Spot) => {
    if (!seen.has(spotKey(spot))) {
      seen.set(spotKey(spot), spot);
      reached.add(spot.surface.key);
      queue.push(spot);
    }
  };
  const arrive = (zone: ZoneState) => {
    const settled = settle(tuning, layout, zone);
    const under = surfaceUnder(tuning, layout, surfaces, settled);
    if (under) {
      reach(spotOf(under, settled, layout, tuning));
    }
  };
  arrive(startZone(tuning, layout, 1));
  for (let from = queue.shift(); from; from = queue.shift()) {
    const area = areaOf(layout, from.surface.area);
    const here = placed(from.surface, from.state, layout);
    const { count, moving } = movingThings(area);
    const carry = Math.max(0, ...moving.map((object) => object.motion.speed));
    let waited: ZoneState[] | undefined;
    const startsFor = (lo: number, hi: number, target?: Surface) => {
      const near =
        from.surface.mover !== undefined ||
        target?.mover !== undefined ||
        moving.some((object) => {
          const rect = sweptRect(object);
          return rect.x < hi + BUCKET && rect.x + rect.width > lo - BUCKET;
        });
      if (!near) {
        return [from.state];
      }
      if (!waited) {
        const result = waitStates(tuning, layout, from.state, count);
        steps += result.steps;
        waited = result.states;
      }
      return waited;
    };
    const { others, own } = targetsFrom(tuning, layout, surfaces, from, here, carry);
    for (const target of [...own, ...others]) {
      const done = () =>
        target.surface === from.surface ? seen.has(target.key) : reached.has(target.key);
      const starts = startsFor(
        Math.min(here.left, target.left),
        Math.max(here.right, target.right),
        target.surface,
      );
      const tries = triesToward(tuning, from, here, target);
      for (const start of starts) {
        if (done()) {
          break;
        }
        if (target.surface === from.surface) {
          const walked = walkInto(tuning, layout, surfaces, start, target);
          steps += walked.steps;
          if (walked.landed) {
            reach(walked.landed);
            break;
          }
        }
        for (const attempt of tries) {
          if (done()) {
            break;
          }
          const { landed, steps: ran } = play(tuning, layout, surfaces, from, start, attempt);
          steps += ran;
          if (landed) {
            reach(landed);
          }
        }
      }
    }
    const lo = here.left + (from.bucket - 1) * BUCKET;
    const hi = here.left + (from.bucket + 2) * BUCKET;
    for (const object of area.objects.filter((each) => each.collision === "use")) {
      const centre = object.origin.x + object.width / 2;
      const top = here.y - tuning.height;
      const touches = top < object.origin.y + object.height && here.y > object.origin.y;
      if (centre < lo || centre > hi || !touches) {
        continue;
      }
      for (const start of startsFor(centre, centre)) {
        const { done, steps: ran } = use(tuning, layout, start, object);
        steps += ran;
        if (done?.cleared) {
          cleared = true;
        } else if (done?.using) {
          arrive(enterArea(tuning, layout, done.using, done));
        }
        if (done) {
          break;
        }
      }
    }
  }
  return { cleared, reached, steps, surfaces };
}

// Whether, standing on from, she can come to stand on to in one move: any try from any stretch
// of from, at any wait, that first lands her on to.
export function crosses(
  tuning: DuckTuning,
  layout: ZoneLayout,
  surfaces: readonly Surface[],
  from: Surface,
  to: Surface,
): boolean {
  const area = areaOf(layout, from.area);
  const { count } = movingThings(area);
  const entry = Object.keys(area.entries)[0] ?? "";
  const zone = enterArea(tuning, layout, { area: from.area, entry }, startZone(tuning, layout, 1));
  const target = { key: to.key, left: to.left, right: to.right, surface: to };
  const buckets = Math.ceil((from.right - from.left) / BUCKET);
  return Array.from({ length: buckets }, (_, bucket) => bucket).some((bucket) => {
    const x = Math.min(from.left + bucket * BUCKET + BUCKET / 2, from.right - 1);
    const state = settle(tuning, layout, {
      ...zone,
      duck: { ...zone.duck, vx: 0, vy: 0, x: x - tuning.width / 2, y: from.y - tuning.height },
    });
    const spot = { bucket, state, surface: from };
    const tries = triesToward(tuning, spot, from, target);
    return waitStates(tuning, layout, state, count).states.some((start) =>
      tries.some(
        (attempt) =>
          play(tuning, layout, surfaces, spot, start, attempt).landed?.surface.key === to.key,
      ),
    );
  });
}
