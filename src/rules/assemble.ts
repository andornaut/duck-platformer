import { type Random, randomInt, randomStream, shuffled } from "@andornaut/game-kit/random";

import type {
  Character,
  ChunkPlan,
  ChunkRules,
  FilledSlot,
  Instance,
  PlacedChunk,
  SlotKind,
  TerrainRect,
  ThemePlan,
  TilePoint,
  ZonePlan,
  ZoneRecipe,
} from "../data/types";

// What zones are assembled from: the chunks and themes by key, the chunk rules, the seam rows,
// a zone's height in rows, and the characters by key, for the size of each theme's door.
export interface ChunkLibrary {
  readonly characters: Readonly<Record<string, Pick<Character, "cols" | "rows">>>;
  readonly chunks: Readonly<Record<string, ChunkPlan>>;
  readonly rows: number;
  readonly rules: ChunkRules;
  readonly seams: readonly number[];
  readonly themes: Readonly<Record<string, ThemePlan>>;
}

// An assembled zone's one area, and the entry she starts at.
export const ASSEMBLED_AREA = "main";
const START_ENTRY = "start";

// The themes a chunk is drawn in.
export function themesOf(chunk: ChunkPlan): readonly string[] {
  return typeof chunk.theme === "string" ? [chunk.theme] : chunk.theme;
}

// The difficulty curve's value at column col of a zone total columns wide: a line from the
// recipe's `from` at its left edge to its `to` at its right.
export function curveAt(recipe: ZoneRecipe, total: number, col: number): number {
  const { from, to } = recipe.difficulty;
  return from + ((to - from) * col) / total;
}

// Rounding slack when a difficulty is compared with the curve.
export const CURVE_SLACK = 1e-9;

// The whole totals T for which a chunk of difficulty d centred on column centre is within 1 of
// the curve, as [lo, hi] (hi may be Infinity), or undefined when none is.
function curveTotals(
  recipe: ZoneRecipe,
  centre: number,
  difficulty: number,
): [number, number] | undefined {
  const { from, to } = recipe.difficulty;
  const slope = (to - from) * centre;
  if (slope === 0) {
    return Math.abs(difficulty - from) <= 1 ? [0, Infinity] : undefined;
  }
  // slope / T must lie in [low, high]; with a negative slope, -slope / T in [-high, -low].
  const [low, high] =
    slope > 0
      ? [difficulty - 1 - from, difficulty + 1 - from]
      : [from - difficulty - 1, from - difficulty + 1];
  const size = Math.abs(slope);
  if (high <= 0) {
    return undefined;
  }
  const lo = Math.ceil(size / high - CURVE_SLACK);
  const hi = low > 0 ? Math.floor(size / low + CURVE_SLACK) : Infinity;
  return lo <= hi ? [lo, hi] : undefined;
}

function chunkOf(library: ChunkLibrary, id: string): ChunkPlan {
  const chunk = library.chunks[id];
  if (!chunk) {
    throw new Error(`No chunk ${id}`);
  }
  return chunk;
}

const slotCount = (chunk: ChunkPlan, kind: SlotKind) =>
  (chunk.slots ?? []).filter((slot) => slot.kind === kind).length;

const wanted = (entries: readonly { readonly count: number }[]) =>
  entries.reduce((sum, { count }) => sum + count, 0);

// The chunks in an order drawn from random, each placed ahead of another as likely as its
// weight is to the other's (weighted sampling without replacement).
function weightedOrder(random: Random, library: ChunkLibrary, ids: readonly string[]): string[] {
  return ids
    .map((id) => ({ id, key: random() ** (1 / (chunkOf(library, id).weight ?? 1)) }))
    .sort((a, b) => b.key - a.key)
    .map(({ id }) => id);
}

// Where the search stands: the chunks so far after the start, the columns they take with the
// start's, the totals the curve still allows, and the event and door slots so far.
interface Run {
  readonly counts: ReadonlyMap<string, number>;
  readonly doors: number;
  readonly events: number;
  readonly ids: readonly string[];
  readonly totals: readonly [number, number];
  readonly width: number;
}

// The ids of the chunks between the recipe's start and finish, left to right: a seeded run
// whose seams join, never the same chunk twice in a row, each chunk at most its maxPerZone
// times, within 1 of the difficulty curve, with slots enough for the recipe's events and doors,
// and the whole zone within the recipe's length. It aims for a length drawn from the seed, tries
// the chunks in a seeded weighted order, and backtracks when stuck. Undefined when none exists.
function searchRun(
  library: ChunkLibrary,
  random: Random,
  recipe: ZoneRecipe,
): readonly string[] | undefined {
  const start = chunkOf(library, recipe.start);
  const finish = chunkOf(library, recipe.finish);
  const pool = Object.keys(library.chunks)
    .filter((id) => id !== recipe.start && id !== recipe.finish)
    .filter((id) => themesOf(chunkOf(library, id)).includes(recipe.theme))
    .sort();
  const { max, min } = recipe.length;
  const target = randomInt(random, min, max + 1);
  const needEvents = wanted(recipe.events);
  const needDoors = wanted(recipe.doors);
  const failed = new Set<string>();
  const keyOf = (run: Run) =>
    [
      run.width,
      run.ids.at(-1) ?? recipe.start,
      run.totals.join("-"),
      Math.min(run.events, needEvents),
      Math.min(run.doors, needDoors),
      ...pool.flatMap((id) =>
        chunkOf(library, id).maxPerZone === undefined ? [] : [run.counts.get(id) ?? 0],
      ),
    ].join("|");

  const finishes = (run: Run, prev: string, exitRow: number) => {
    const total = run.width + finish.cols;
    return (
      prev !== recipe.finish &&
      exitRow === finish.entry.row &&
      total >= Math.max(min, run.totals[0]) &&
      total <= Math.min(max, run.totals[1]) &&
      run.events + slotCount(finish, "event") >= needEvents &&
      run.doors + slotCount(finish, "door") >= needDoors
    );
  };

  const extend = (run: Run, id: string): Run | undefined => {
    const chunk = chunkOf(library, id);
    const width = run.width + chunk.cols;
    const allowed = curveTotals(recipe, run.width + chunk.cols / 2, chunk.difficulty);
    if (!allowed) {
      return undefined;
    }
    const lo = Math.max(run.totals[0], allowed[0], width + finish.cols, min);
    const hi = Math.min(run.totals[1], allowed[1], max);
    if (lo > hi) {
      return undefined;
    }
    return {
      counts: new Map(run.counts).set(id, (run.counts.get(id) ?? 0) + 1),
      doors: run.doors + slotCount(chunk, "door"),
      events: run.events + slotCount(chunk, "event"),
      ids: [...run.ids, id],
      totals: [lo, hi],
      width,
    };
  };

  const search = (run: Run): readonly string[] | undefined => {
    const key = keyOf(run);
    if (failed.has(key)) {
      return undefined;
    }
    const prev = run.ids.at(-1) ?? recipe.start;
    const exitRow = chunkOf(library, prev).exit.row;
    const next = pool.filter((id) => {
      const chunk = chunkOf(library, id);
      return (
        id !== prev &&
        chunk.entry.row === exitRow &&
        (run.counts.get(id) ?? 0) < (chunk.maxPerZone ?? Infinity) &&
        run.width + chunk.cols + finish.cols <= max
      );
    });
    const order: (string | undefined)[] = weightedOrder(random, library, next);
    // undefined stands for the finish: tried first once the run is long enough.
    if (run.width + finish.cols >= target) {
      order.unshift(undefined);
    } else {
      order.push(undefined);
    }
    for (const id of order) {
      if (id === undefined) {
        if (finishes(run, prev, exitRow)) {
          return run.ids;
        }
        continue;
      }
      const longer = extend(run, id);
      const found = longer && search(longer);
      if (found) {
        return found;
      }
    }
    failed.add(key);
    return undefined;
  };

  return search({
    counts: new Map(),
    doors: slotCount(start, "door"),
    events: slotCount(start, "event"),
    ids: [],
    totals: [0, Infinity],
    width: start.cols,
  });
}

const shiftPoint = (col: number, point: TilePoint): TilePoint => ({
  ...point,
  col: point.col + col,
});
const shiftInstance = (col: number, instance: Instance): Instance => ({
  ...instance,
  col: instance.col + col,
});

// A zone of chunks ids, left to right, drawn in theme: each chunk's contents moved to its zone
// columns, each terrain look as the theme's tileset draws it, the theme's repeated backdrops
// across the whole zone, and fills (event ids, then door rooms, by kind) placed in its slots by
// random. A filled door slot places the theme's door at its own size, centred across the slot
// (half a tile in where the two widths differ by an odd number of tiles) and standing on its
// floor, leading to its room.
// She starts on the first chunk's entry seam, half its footing in.
export function zonePlanOf(
  library: ChunkLibrary,
  random: Random,
  fills: Readonly<Record<SlotKind, readonly string[]>>,
  themeKey: string,
  ids: readonly string[],
): ZonePlan {
  const theme = library.themes[themeKey];
  if (!theme) {
    throw new Error(`No theme ${themeKey}`);
  }
  const chunks = ids.map((id) => chunkOf(library, id));
  const placed = chunks.reduce<PlacedChunk[]>((list, chunk, index) => {
    const last = list.at(-1);
    list.push({ chunk: ids[index] ?? "", col: last ? last.col + last.cols : 0, cols: chunk.cols });
    return list;
  }, []);
  const cols = placed.reduce((sum, chunk) => sum + chunk.cols, 0);
  const at = (index: number) => placed[index]?.col ?? 0;
  const look = (id: string, solid: TerrainRect): TerrainRect => {
    if (solid.look === undefined) {
      return solid;
    }
    const drawn = theme.looks[solid.look];
    if (drawn === undefined) {
      throw new Error(`Theme ${themeKey} has no look ${solid.look} for chunk ${id}`);
    }
    return { ...solid, look: drawn };
  };
  const slots = chunks.flatMap((chunk, index) =>
    (chunk.slots ?? []).map((slot): FilledSlot => ({
      ...slot,
      area: { ...slot.area, col: slot.area.col + at(index) },
      chunk: index,
    })),
  );
  const filled = new Map<FilledSlot, string>();
  for (const kind of ["event", "door"] as const) {
    const open = shuffled(
      random,
      slots.filter((slot) => slot.kind === kind),
    );
    const want = fills[kind];
    if (want.length > open.length) {
      throw new Error(`${want.length} ${kind}s for ${open.length} ${kind} slots`);
    }
    want.forEach((fill, index) => filled.set(open[index] as FilledSlot, fill));
  }
  const door = library.characters[theme.door];
  const doors = slots.flatMap((slot): Instance[] => {
    const room = filled.get(slot);
    if (slot.kind !== "door" || room === undefined) {
      return [];
    }
    if (!door) {
      throw new Error(`No character ${theme.door} for theme ${themeKey}'s doors`);
    }
    const { area } = slot;
    return [
      {
        character: theme.door,
        col: area.col + (area.cols - door.cols) / 2,
        room,
        row: area.row + area.rows - door.rows,
      },
    ];
  });
  const first = chunks[0];
  return {
    areas: {
      [ASSEMBLED_AREA]: {
        chunks: placed,
        cols,
        entries: {
          [START_ENTRY]: {
            col: Math.floor(library.rules.footing / 2),
            row: first?.entry.row ?? library.rows,
          },
        },
        noCross: chunks.flatMap((chunk, index) =>
          (chunk.noCross ?? []).map(({ from, to }) => ({
            from: shiftPoint(at(index), from),
            to: shiftPoint(at(index), to),
          })),
        ),
        objects: [
          ...theme.backdrops.map(({ character, row }) => ({ character, col: 0, cols, row })),
          ...chunks.flatMap((chunk, index) =>
            (chunk.backdrops ?? []).map((instance) => shiftInstance(at(index), instance)),
          ),
          ...chunks.flatMap((chunk, index) =>
            chunk.objects.map((instance) => shiftInstance(at(index), instance)),
          ),
          ...doors,
        ],
        outOfReach: chunks.flatMap((chunk, index) =>
          (chunk.outOfReach ?? []).map((spot) => shiftPoint(at(index), spot)),
        ),
        rows: library.rows,
        slots: slots.map((slot) => {
          const fill = filled.get(slot);
          return fill === undefined ? slot : { ...slot, fill };
        }),
        solids: chunks.flatMap((chunk, index) =>
          chunk.solids.map((solid) =>
            look(ids[index] ?? "", { ...solid, col: solid.col + at(index) }),
          ),
        ),
        tileset: theme.tileset,
      },
    },
    start: { area: ASSEMBLED_AREA, entry: START_ENTRY },
  };
}

// The recipe's events and doors, each id or room repeated count times.
function fillsOf(recipe: ZoneRecipe): Record<SlotKind, string[]> {
  return {
    door: recipe.doors.flatMap(({ count, room }) => Array<string>(count).fill(room)),
    event: recipe.events.flatMap(({ count, id }) => Array<string>(count).fill(id)),
  };
}

// The zone key's recipe assembled for a lap's seed: its start chunk, a seeded run of its
// theme's chunks (searchRun), and its finish chunk, with the recipe's events and doors in
// seeded slots. The same seed always gives the same zone. Throws when no assembly fits.
export function assembleZone(
  library: ChunkLibrary,
  seed: number,
  key: string,
  recipe: ZoneRecipe,
): ZonePlan {
  const run = searchRun(library, randomStream(seed, `assemble:${key}`), recipe);
  if (!run) {
    throw new Error(
      `No assembly of zone ${key} fits its recipe: its theme's chunks never join from ` +
        `${recipe.start} to ${recipe.finish} within ${recipe.length.min} to ` +
        `${recipe.length.max} columns, the difficulty curve and each chunk's maxPerZone, ` +
        "with slots for its events and doors",
    );
  }
  return zonePlanOf(library, randomStream(seed, `slots:${key}`), fillsOf(recipe), recipe.theme, [
    recipe.start,
    ...run,
    recipe.finish,
  ]);
}
