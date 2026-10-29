import type { TerrainRect } from "../data/types";

// An art tileset's description (public/art/tilesets/<key>.json): tiles by name, as indices into
// the sheet counted row by row, and pieces (multi-tile units) as rows of indices, top row first.
export interface Tileset {
  readonly columns: number;
  readonly pieces: Readonly<Record<string, readonly (readonly number[])[]>>;
  readonly tileSize: number;
  readonly tiles: Readonly<Record<string, number>>;
}

// The tileset key names, as lookup finds what loaded: undefined for an area without one, or one
// art does not have yet, which then draws flat. Throws for one whose tiles are not tile px.
export function loadedTileset(
  tile: number,
  lookup: (key: string) => Tileset | undefined,
  key: string | undefined,
): Tileset | undefined {
  const tileset = key === undefined ? undefined : lookup(key);
  if (tileset && tileset.tileSize !== tile) {
    throw new Error(`Tileset ${key} is not ${tile} px a tile`);
  }
  return tileset;
}

// A tile to draw at a column and row, by its index in the sheet.
export interface PlacedTile {
  readonly col: number;
  readonly index: number;
  readonly row: number;
}

// The tile names each terrain look draws with.
const TOP_AND_FACE = [
  "top",
  "top-joint",
  "top-left",
  "top-right",
  "face",
  "face-left",
  "face-right",
];
export function lookTiles(look: string): string[] {
  switch (look) {
    case "road":
      return ["road-top", "road", "kerb-left", "kerb-right"];
    case "post":
      return ["cap", "", "base"].flatMap((part) =>
        ["left", "right"].map((side) => ["post", part, side].filter(Boolean).join("-")),
      );
    default:
      return TOP_AND_FACE.map((part) => `${look}-${part}`);
  }
}

function indexOf(tileset: Tileset, name: string): number {
  const index = tileset.tiles[name];
  if (index === undefined) {
    throw new Error(`No tile ${name} in the tileset`);
  }
  return index;
}

// The tiles an area's terrain is drawn with, picked by each cell's look and its neighbours: a
// top row where nothing is above, ends where nothing is beside, kerbs where the sidewalk meets a
// road below it, and a post's cap, shaft and base by its rect.
export function terrainTiles(
  tileset: Tileset,
  cols: number,
  rows: number,
  solids: readonly TerrainRect[],
): PlacedTile[] {
  const cells: (TerrainRect | undefined)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => undefined),
  );
  for (const solid of solids) {
    for (let row = solid.row; row < Math.min(rows, solid.row + solid.rows); row++) {
      for (let col = solid.col; col < Math.min(cols, solid.col + solid.cols); col++) {
        (cells[row] as (TerrainRect | undefined)[])[col] = solid;
      }
    }
  }
  const at = (col: number, row: number) =>
    col < 0 || col >= cols || row >= rows ? "edge" : row < 0 ? undefined : cells[row]?.[col]?.look;
  const tiles: PlacedTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const solid = cells[row]?.[col];
      if (!solid?.look) {
        continue;
      }
      const name = tileName(solid, col, row, at);
      tiles.push({ col, index: indexOf(tileset, name), row });
    }
  }
  return tiles;
}

function tileName(
  solid: TerrainRect,
  col: number,
  row: number,
  at: (col: number, row: number) => string | undefined,
): string {
  const look = solid.look as string;
  if (look === "post") {
    const side = col === solid.col ? "left" : "right";
    if (row === solid.row) {
      return `post-cap-${side}`;
    }
    return row === solid.row + solid.rows - 1 ? `post-base-${side}` : `post-${side}`;
  }
  if (look === "road") {
    return at(col, row - 1) === "road" ? "road" : "road-top";
  }
  const top = at(col, row - 1) === undefined;
  const openLeft = at(col - 1, row) === undefined;
  const openRight = at(col + 1, row) === undefined;
  if (top) {
    if (openLeft && at(col - 1, row + 1) === "road") {
      return "kerb-left";
    }
    if (openRight && at(col + 1, row + 1) === "road") {
      return "kerb-right";
    }
    if (openLeft) {
      return `${look}-top-left`;
    }
    if (openRight) {
      return `${look}-top-right`;
    }
    return `${look}-top${col % 2 === 1 ? "-joint" : ""}`;
  }
  if (openLeft) {
    return `${look}-face-left`;
  }
  return openRight ? `${look}-face-right` : `${look}-face`;
}

// The tiles above a stacking tile, in art's rule for the cellar hatch: its steel leaf's top over
// the leaf, above each hatch edge.
const STACKS: Readonly<Record<string, string>> = {
  "hatch-left": "pit-leaf-left",
  "hatch-right": "pit-leaf-right",
};

// Whether an art key names a tile or piece in the tileset.
export function drawsFrom(tileset: Tileset, art: string): boolean {
  return art in tileset.pieces || art in tileset.tiles;
}

// The tiles an object of art, cols x rows tiles, is drawn with, from its top-left. A piece is
// drawn whole. A tile with -left and -right ends runs across the object's width, with a -top row
// where the tileset has one (a planter), or -bed rows under its first where it has those (a
// pond). A stacking tile sits on the bottom row with its stack above. Any other tile repeats
// across the object.
export function objectTiles(
  tileset: Tileset,
  art: string,
  cols: number,
  rows: number,
): PlacedTile[] {
  const piece = tileset.pieces[art];
  if (piece) {
    return piece.flatMap((line, row) => line.map((index, col) => ({ col, index, row })));
  }
  const has = (name: string) => name in tileset.tiles;
  const stack = STACKS[art];
  const tiles: PlacedTile[] = [];
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let name: string;
      if (stack) {
        const fromBottom = rows - 1 - row;
        if (fromBottom > 2) {
          continue;
        }
        name = [art, stack, `${stack}-top`][fromBottom] as string;
      } else {
        const base =
          row === 0 && has(`${art}-top`)
            ? `${art}-top`
            : row > 0 && has(`${art}-bed`)
              ? `${art}-bed`
              : art;
        const end = col === 0 ? "-left" : col === cols - 1 ? "-right" : "";
        name = cols > 1 && has(`${base}${end}`) ? `${base}${end}` : base;
      }
      tiles.push({ col, index: indexOf(tileset, name), row });
    }
  }
  return tiles;
}
