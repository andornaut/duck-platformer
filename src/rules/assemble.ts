import { type Random, randomInt, randomStream, shuffled } from "@andornaut/game-kit/random";

import type {
  Character,
  ChunkPlan,
  ChunkRules,
  FilledSlot,
  Instance,
  OrderedZoneRecipe,
  PlacedChunk,
  SlotKind,
  StageRecipe,
  TerrainRect,
  ThemePlan,
  TilePoint,
  ZonePlan,
  ZoneRecipe,
} from "../data/types";
import { bindElement } from "./elementBinding";

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
// start's, and the event and door slots so far.
interface Run {
  readonly counts: ReadonlyMap<string, number>;
  readonly doors: number;
  readonly events: number;
  readonly ids: readonly string[];
  readonly width: number;
}

// The ids of the chunks between the recipe's start and finish, left to right: a seeded run
// whose seams join, never the same chunk twice in a row, each chunk at most its maxPerZone
// times, within the difficulty band, with slots enough for the recipe's events and doors,
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
    .filter((id) => {
      const { difficulty } = chunkOf(library, id);
      return difficulty >= recipe.difficulty.min && difficulty <= recipe.difficulty.max;
    })
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
      total >= min &&
      total <= max &&
      run.events + slotCount(finish, "event") >= needEvents &&
      run.doors + slotCount(finish, "door") >= needDoors
    );
  };

  const extend = (run: Run, id: string): Run => {
    const chunk = chunkOf(library, id);
    const width = run.width + chunk.cols;
    return {
      counts: new Map(run.counts).set(id, (run.counts.get(id) ?? 0) + 1),
      doors: run.doors + slotCount(chunk, "door"),
      events: run.events + slotCount(chunk, "event"),
      ids: [...run.ids, id],
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
      const found = search(longer);
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
// She starts at spawnCol on the first chunk's entry row.
export function zonePlanOf(
  library: ChunkLibrary,
  random: Random,
  fills: Readonly<Record<SlotKind, readonly string[]>>,
  themeKey: string,
  spawnCol: number,
  ids: readonly string[],
): ZonePlan {
  const theme = library.themes[themeKey];
  if (!theme) {
    throw new Error(`No theme ${themeKey}`);
  }
  const chunks = ids.map((id) => chunkOf(library, id));
  const first = chunks[0];
  if (!first || !Number.isInteger(spawnCol) || spawnCol <= 1 || spawnCol >= first.cols) {
    throw new Error(
      `Spawn column ${spawnCol} must be an integer beyond the first column and inside the opening chunk`,
    );
  }
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
  const doorTemplate = bindElement(theme.bindings, {
    character: "",
    col: 0,
    role: theme.door,
    row: 0,
  });
  const door = library.characters[doorTemplate.character];
  if (!door) {
    throw new Error(`No character ${doorTemplate.character} for theme ${themeKey}'s doors`);
  }
  const doors = slots.flatMap((slot): Instance[] => {
    const room = filled.get(slot);
    if (slot.kind !== "door" || room === undefined) {
      return [];
    }
    const { area } = slot;
    return [
      {
        ...doorTemplate,
        col: area.col + (area.cols - door.cols) / 2,
        room,
        row: area.row + area.rows - door.rows,
      },
    ];
  });
  return {
    areas: {
      [ASSEMBLED_AREA]: {
        chunks: placed,
        cols,
        entries: {
          [START_ENTRY]: {
            col: spawnCol,
            row: first.entry.row,
          },
        },
        noCross: chunks.flatMap((chunk, index) =>
          (chunk.noCross ?? []).map(({ from, to }) => ({
            from: shiftPoint(at(index), from),
            to: shiftPoint(at(index), to),
          })),
        ),
        objects: [
          ...theme.backdrops.map((backdrop) =>
            bindElement(theme.bindings, { ...backdrop, col: 0, cols }),
          ),
          ...chunks.flatMap((chunk, index) =>
            (chunk.backdrops ?? []).map((instance) =>
              bindElement(theme.bindings, shiftInstance(at(index), instance)),
            ),
          ),
          ...chunks.flatMap((chunk, index) =>
            chunk.objects.map((instance) =>
              bindElement(theme.bindings, shiftInstance(at(index), instance)),
            ),
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
function fillsOf(recipe: Pick<ZoneRecipe, "doors" | "events">): Record<SlotKind, string[]> {
  return {
    door: recipe.doors.flatMap(({ count, room }) => Array<string>(count).fill(room)),
    event: recipe.events.flatMap(({ count, id }) => Array<string>(count).fill(id)),
  };
}

// Ordered sections have one generated chunk each; only the outer stage ends add fixed caps.
export function orderedRecipeProblems(library: ChunkLibrary, recipe: OrderedZoneRecipe): string[] {
  const problems: string[] = [];
  if (recipe.sections.length === 0) {
    return ["ordered stage has no sections"];
  }
  if (
    new Set(recipe.sections.map(({ id }) => id)).size !== recipe.sections.length ||
    recipe.sections.some(({ id }) => id.length === 0)
  ) {
    problems.push("section ids must be unique and nonempty");
  }
  for (const id of [recipe.start, recipe.finish]) {
    if (!library.chunks[id]) {
      problems.push(`no chunk ${id}`);
    }
  }
  const first = recipe.sections[0];
  const last = recipe.sections.at(-1);
  for (const [id, section] of [
    [recipe.start, first],
    [recipe.finish, last],
  ] as const) {
    const cap = library.chunks[id];
    if (
      cap &&
      section &&
      (!Number.isInteger(cap.cols) ||
        cap.cols < library.rules.cols.min ||
        cap.cols > library.rules.cols.max ||
        !themesOf(cap).includes(section.theme))
    ) {
      problems.push(`invalid cap ${id} for section ${section.id}`);
    }
  }
  for (const section of recipe.sections) {
    if (!library.themes[section.theme]) {
      problems.push(`no theme ${section.theme}`);
    }
    if (section.chunks.length === 0 || new Set(section.chunks).size !== section.chunks.length) {
      problems.push(`invalid chunk pool for section ${section.id}`);
    }
    if (!Number.isInteger(section.spawnCol) || section.spawnCol <= 1) {
      problems.push(`invalid spawn column for section ${section.id}`);
    }
    if (
      !Number.isInteger(section.difficulty.min) ||
      !Number.isInteger(section.difficulty.max) ||
      section.difficulty.min < 1 ||
      section.difficulty.max > 5 ||
      section.difficulty.min > section.difficulty.max
    ) {
      problems.push(`invalid difficulty for section ${section.id}`);
    }
    for (const id of section.chunks) {
      const chunk = library.chunks[id];
      if (
        chunk &&
        (!Number.isInteger(chunk.cols) ||
          chunk.cols < library.rules.cols.min ||
          chunk.cols > library.rules.cols.max)
      ) {
        problems.push(`invalid generated width for chunk ${id}`);
      }
      if (!chunk) {
        problems.push(`no chunk ${id}`);
      } else if (
        id === recipe.start ||
        id === recipe.finish ||
        !themesOf(chunk).includes(section.theme)
      ) {
        problems.push(`invalid chunk ${id} for section ${section.id}`);
      }
    }
    for (const { count } of [...section.doors, ...section.events]) {
      if (!Number.isInteger(count) || count < 0) {
        problems.push(`invalid fill count for section ${section.id}`);
      }
    }
  }
  return problems;
}

function assembleOrdered(
  library: ChunkLibrary,
  seed: number,
  key: string,
  recipe: OrderedZoneRecipe,
): ZonePlan {
  const problems = orderedRecipeProblems(library, recipe);
  if (problems.length > 0) {
    throw new Error(problems.join("; "));
  }
  const start = chunkOf(library, recipe.start);
  const finish = chunkOf(library, recipe.finish);
  const first = recipe.sections[0];
  const last = recipe.sections.at(-1);
  if (
    !first ||
    !last ||
    !themesOf(start).includes(first.theme) ||
    !themesOf(finish).includes(last.theme)
  ) {
    throw new Error("Stage caps do not match their section themes");
  }
  const counts = new Map<string, number>();
  for (const id of [recipe.start, recipe.finish]) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  if ([...counts].some(([id, count]) => count > (chunkOf(library, id).maxPerZone ?? Infinity))) {
    throw new Error("Stage caps exceed maxPerZone");
  }
  const pools = recipe.sections.map((section, index) =>
    shuffled(randomStream(seed, `section:${key}:${section.id}`), section.chunks).filter((id) => {
      const chunk = chunkOf(library, id);
      const caps = [
        ...(index === 0 ? [start] : []),
        chunk,
        ...(index === recipe.sections.length - 1 ? [finish] : []),
      ];
      return (
        chunk.difficulty >= section.difficulty.min &&
        chunk.difficulty <= section.difficulty.max &&
        caps.every((part, at) => at === 0 || caps[at - 1]?.exit.row === part.entry.row) &&
        wanted(section.doors) <= caps.reduce((sum, part) => sum + slotCount(part, "door"), 0) &&
        wanted(section.events) <= caps.reduce((sum, part) => sum + slotCount(part, "event"), 0)
      );
    }),
  );
  const selected: string[] = [];
  const failed = new Set<string>();
  const limited = [...new Set(recipe.sections.flatMap((section) => section.chunks))]
    .filter((id) => chunkOf(library, id).maxPerZone !== undefined)
    .sort();
  const choose = (index: number): boolean => {
    if (index === recipe.sections.length) {
      return true;
    }
    const state = `${index}:${limited.map((id) => counts.get(id) ?? 0).join(",")}`;
    if (failed.has(state)) {
      return false;
    }
    for (const id of pools[index] ?? []) {
      const count = counts.get(id) ?? 0;
      if (count >= (chunkOf(library, id).maxPerZone ?? Infinity)) {
        continue;
      }
      counts.set(id, count + 1);
      selected.push(id);
      if (choose(index + 1)) {
        return true;
      }
      selected.pop();
      counts.set(id, count);
    }
    failed.add(state);
    return false;
  };
  if (!choose(0)) {
    throw new Error(`No ordered assembly of stage ${key} fits its section pools`);
  }
  const order = recipe.sections.map(({ id }) => id);
  const areas = Object.fromEntries(
    recipe.sections.map((section, index) => {
      const middle = selected[index];
      if (!middle) {
        throw new Error(`No selected chunk for ${section.id}`);
      }
      const ids = [
        ...(index === 0 ? [recipe.start] : []),
        middle,
        ...(index === order.length - 1 ? [recipe.finish] : []),
      ];
      const single = zonePlanOf(
        library,
        randomStream(seed, `slots:${key}:${section.id}`),
        fillsOf(section),
        section.theme,
        section.spawnCol,
        ids,
      ).areas[ASSEMBLED_AREA];
      if (!single) {
        throw new Error(`No assembled section ${section.id}`);
      }
      const previous = order[index - 1];
      const next = order[index + 1];
      const marker = (side: "left" | "right"): Instance => {
        const instance = bindElement(library.themes[section.theme]?.bindings ?? {}, {
          character: "",
          col: 0,
          role: recipe.transitionRoles[side],
          row: 0,
        });
        const character = library.characters[instance.character];
        if (
          !character ||
          character.cols > library.rules.footing ||
          character.rows > library.rules.headroom
        ) {
          throw new Error(`Transition marker ${instance.character} exceeds safe seam dimensions`);
        }
        const row =
          side === "left"
            ? chunkOf(library, ids[0] ?? "").entry.row
            : chunkOf(library, ids.at(-1) ?? "").exit.row;
        return {
          ...instance,
          col: side === "left" ? 0 : single.cols - character.cols,
          row: row - character.rows,
        };
      };
      return [
        section.id,
        {
          ...single,
          entries: {
            ...single.entries,
            return: { col: single.cols - 2, row: chunkOf(library, ids.at(-1) ?? "").exit.row },
          },
          objects: [
            ...single.objects,
            ...(previous !== undefined ? [marker("left")] : []),
            ...(next !== undefined ? [marker("right")] : []),
          ],
          walkLinks: {
            ...(previous !== undefined ? { left: { area: previous, entry: "return" } } : {}),
            ...(next !== undefined ? { right: { area: next, entry: START_ENTRY } } : {}),
          },
        },
      ];
    }),
  );
  return { areaOrder: order, areas, start: { area: order[0] ?? "", entry: START_ENTRY } };
}

// The zone key's recipe assembled for a seed: its start chunk, a seeded run of its
// theme's chunks (searchRun), and its finish chunk, with the recipe's events and doors in
// seeded slots. The same seed always gives the same zone. Throws when no assembly fits.
export function assembleZone(
  library: ChunkLibrary,
  seed: number,
  key: string,
  recipe: StageRecipe,
): ZonePlan {
  if ("sections" in recipe) {
    return assembleOrdered(library, seed, key, recipe);
  }
  const run = searchRun(library, randomStream(seed, `assemble:${key}`), recipe);
  if (!run) {
    throw new Error(
      `No assembly of zone ${key} fits its recipe: its theme's chunks never join from ` +
        `${recipe.start} to ${recipe.finish} within ${recipe.length.min} to ` +
        `${recipe.length.max} columns, the difficulty band and each chunk's maxPerZone, ` +
        "with slots for its events and doors",
    );
  }
  return zonePlanOf(
    library,
    randomStream(seed, `slots:${key}`),
    fillsOf(recipe),
    recipe.theme,
    recipe.spawnCol,
    [recipe.start, ...run, recipe.finish],
  );
}
