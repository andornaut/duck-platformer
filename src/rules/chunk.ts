import type { ChunkPlan, ChunkSeam, Instance, TileRect, ZoneRecipe } from "../data/types";
import { type ChunkLibrary, themesOf } from "./assemble";
import { type Catalogue, objectLayout } from "./tiles";

// A rectangle in tiles, as columns [left, right) and rows [top, bottom).
interface Span {
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

const spanOf = (rect: TileRect): Span => ({
  bottom: rect.row + rect.rows,
  left: rect.col,
  right: rect.col + rect.cols,
  top: rect.row,
});

const meets = (a: Span, b: Span) =>
  a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

const inside = (rows: number, cols: number, rect: TileRect) =>
  rect.col >= 0 && rect.row >= 0 && rect.col + rect.cols <= cols && rect.row + rect.rows <= rows;

// A placed thing in tiles: its collision, whether it moves, and the span it can be in over its
// track (its rectangle swept along its motion's axis, its reaction's range and its hops).
function thingOf(catalogue: Catalogue, instance: Instance) {
  const object = objectLayout(1, catalogue, {}, instance);
  const { direction, distance, hopHeight } = object.motion;
  const moves = object.motion.algorithm !== "static" || object.reaction.kind !== "none";
  const reach = distance + (object.reaction.kind === "none" ? 0 : object.reaction.range);
  const left = object.origin.x - (direction === "left" ? reach : 0);
  const right = object.origin.x + object.width + (direction === "right" ? reach : 0);
  const top =
    object.origin.y -
    (direction === "up" ? reach : 0) -
    (object.motion.algorithm === "hop" ? hopHeight : 0);
  const bottom = object.origin.y + object.height + (direction === "down" ? reach : 0);
  return { collision: object.collision, moves, span: { bottom, left, right, top } };
}

// Why a chunk's seam at the edge `side` breaks the seam rule, if it does: the terrain's top at
// its row must run the footing in from the edge without a gap, no hazard or moving thing she
// touches may come within the footing, at or above the seam, and no terrain, still solid or
// ledge, or hazard may come within the headroom above it.
function seamProblems(
  library: ChunkLibrary,
  catalogue: Catalogue,
  chunk: ChunkPlan,
  side: "entry" | "exit",
  seam: ChunkSeam,
): string[] {
  const { footing, headroom } = library.rules;
  const left = side === "entry" ? 0 : chunk.cols - footing;
  const right = left + footing;
  const { row } = seam;
  const problems: string[] = [];
  const covered = new Set(
    chunk.solids
      .filter((solid) => solid.row === row)
      .flatMap((solid) => Array.from({ length: solid.cols }, (_, i) => solid.col + i)),
  );
  const gaps = Array.from({ length: footing }, (_, i) => left + i).filter((c) => !covered.has(c));
  if (gaps.length > 0) {
    problems.push(`${side}: no terrain top at row ${row} in cols ${gaps.join(", ")}`);
  }
  const above: Span = { bottom: row, left, right, top: row - headroom };
  const near: Span = { ...above, bottom: row + 1 };
  if (chunk.solids.some((solid) => meets(spanOf(solid), above))) {
    problems.push(`${side}: terrain within ${headroom} rows above the seam`);
  }
  for (const instance of chunk.objects) {
    const { collision, moves, span } = thingOf(catalogue, instance);
    const name = `${instance.character} at col ${instance.col} row ${instance.row}`;
    if (collision === "hazard" && meets(span, near)) {
      problems.push(`${side}: hazard ${name} at the seam`);
    } else if (moves && collision !== "none" && collision !== "use" && meets(span, near)) {
      problems.push(`${side}: ${name} moves through the seam`);
    } else if (!moves && (collision === "solid" || collision === "ledge") && meets(span, above)) {
      problems.push(`${side}: ${name} within ${headroom} rows above the seam`);
    }
  }
  return problems;
}

// Why a chunk breaks the chunk rules, if it does: its width, its seams' rows and the seam rule
// at each, its themes and its terrain's looks in each, every placed thing a real character
// inside it, its slots inside it with unique ids, and a positive weight and maxPerZone.
export function chunkProblems(
  library: ChunkLibrary,
  catalogue: Catalogue,
  chunk: ChunkPlan,
): string[] {
  const { cols } = library.rules;
  const { rows } = library;
  const problems: string[] = [];
  if (!Number.isInteger(chunk.cols) || chunk.cols < cols.min || chunk.cols > cols.max) {
    problems.push(`${chunk.cols} cols, outside ${cols.min} to ${cols.max}`);
  }
  for (const [side, seam] of [
    ["entry", chunk.entry],
    ["exit", chunk.exit],
  ] as const) {
    if (!library.seams.includes(seam.row)) {
      problems.push(`${side} row ${seam.row} is not a seam row`);
    }
  }
  const themes = themesOf(chunk);
  if (themes.length === 0) {
    problems.push("no theme");
  }
  for (const key of themes) {
    const theme = library.themes[key];
    if (!theme) {
      problems.push(`no theme ${key}`);
      continue;
    }
    for (const solid of chunk.solids) {
      if (solid.look === undefined || !(solid.look in theme.looks)) {
        problems.push(
          `terrain at col ${solid.col} row ${solid.row}: no look ${solid.look} in ${key}`,
        );
      }
    }
  }
  for (const solid of chunk.solids) {
    if (!inside(rows, chunk.cols, solid)) {
      problems.push(`terrain at col ${solid.col} row ${solid.row} is outside the chunk`);
    }
  }
  let resolved = true;
  for (const instance of [...(chunk.backdrops ?? []), ...chunk.objects]) {
    const character = catalogue.characters[instance.character];
    if (!character || !catalogue.archetypes[character.archetype]) {
      problems.push(`no character ${instance.character}`);
      resolved = false;
      continue;
    }
    const rect = {
      col: instance.col,
      cols: instance.cols ?? character.cols,
      row: instance.row,
      rows: instance.rows ?? character.rows,
    };
    if (!inside(rows, chunk.cols, rect)) {
      problems.push(`${instance.character} at col ${instance.col} row ${instance.row} is outside`);
    }
  }
  const slots = chunk.slots ?? [];
  for (const slot of slots) {
    if (!inside(rows, chunk.cols, slot.area)) {
      problems.push(`slot ${slot.id} is outside the chunk`);
    }
  }
  if (new Set(slots.map(({ id }) => id)).size !== slots.length) {
    problems.push("two slots share an id");
  }
  if (chunk.weight !== undefined && !(chunk.weight > 0)) {
    problems.push(`weight ${chunk.weight} is not positive`);
  }
  if (
    chunk.maxPerZone !== undefined &&
    (!Number.isInteger(chunk.maxPerZone) || chunk.maxPerZone < 1)
  ) {
    problems.push(`maxPerZone ${chunk.maxPerZone} is not a positive whole number`);
  }
  // The seam rule reads each placed thing's character.
  if (resolved) {
    problems.push(
      ...seamProblems(library, catalogue, chunk, "entry", chunk.entry),
      ...seamProblems(library, catalogue, chunk, "exit", chunk.exit),
    );
  }
  return problems;
}

// Why a recipe cannot be assembled as written, if it can't: its theme, start and finish chunks
// exist, both chunks are drawn in its theme, its length range holds them, and its counts are
// whole numbers. Whether any assembly fits is assembleZone's to find.
export function recipeProblems(library: ChunkLibrary, recipe: ZoneRecipe): string[] {
  const problems: string[] = [];
  if (!library.themes[recipe.theme]) {
    problems.push(`no theme ${recipe.theme}`);
  }
  for (const id of [recipe.start, recipe.finish]) {
    const chunk = library.chunks[id];
    if (!chunk) {
      problems.push(`no chunk ${id}`);
    } else if (!themesOf(chunk).includes(recipe.theme)) {
      problems.push(`chunk ${id} is not drawn in ${recipe.theme}`);
    }
  }
  const { max, min } = recipe.length;
  const ends =
    (library.chunks[recipe.start]?.cols ?? 0) + (library.chunks[recipe.finish]?.cols ?? 0);
  if (!(min <= max) || max < ends) {
    problems.push(`length ${min} to ${max} cannot hold its start and finish (${ends} cols)`);
  }
  for (const { count } of [...recipe.events, ...recipe.doors]) {
    if (!Number.isInteger(count) || count < 0) {
      problems.push(`count ${count} is not a whole number`);
    }
  }
  return problems;
}
