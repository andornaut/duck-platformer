import { describe, expect, it } from "vitest";

import manifestJson from "../../public/art/manifest.json";
import lobbyTiles from "../../public/art/tilesets/tiles-lobby.json";
import streetTiles from "../../public/art/tilesets/tiles-street.json";
import type { ArtManifest } from "../view/aseprite";
import { artKind } from "../view/objectArt";
import { lookTiles, type Tileset } from "../view/tiles";
import { LEVEL_1 } from "./level1";
import { TEST_LEVELS } from "./levels";
import { OBJECT_TYPES } from "./objects";
import { SCREEN, TILE } from "./screen";
import type { AreaPlan, TileRect } from "./types";

const MANIFEST = manifestJson as ArtManifest;
const TILESETS: Readonly<Record<string, Tileset>> = {
  "tiles-lobby": lobbyTiles,
  "tiles-street": streetTiles,
};
const LEVELS = [LEVEL_1, ...TEST_LEVELS];

const inside = (area: AreaPlan, rect: TileRect) =>
  rect.col >= 0 &&
  rect.row >= 0 &&
  rect.col + rect.cols <= area.cols &&
  rect.row + rect.rows <= area.rows;

const areas = LEVELS.flatMap((level, index) =>
  Object.entries(level.areas).map(([name, area]) => [`${index + 1} ${name}`, level, area] as const),
);

describe("the levels", () => {
  it.each(areas)(
    "area %s is two screens tall, its terrain and objects inside it",
    (_, __, area) => {
      expect(area.rows * TILE).toBe(2 * SCREEN.height);
      expect(area.solids.every((rect) => inside(area, rect))).toBe(true);
      for (const placed of area.objects) {
        const type = OBJECT_TYPES[placed.type];
        expect(type, placed.type).toBeDefined();
        const rect = {
          col: placed.col,
          cols: placed.cols ?? type?.cols ?? 0,
          row: placed.row,
          rows: placed.rows ?? type?.rows ?? 0,
        };
        expect(inside(area, rect), JSON.stringify(placed)).toBe(true);
      }
    },
  );

  it.each(areas)("area %s's doors lead to an entry that exists", (_, level, area) => {
    for (const { to } of area.objects) {
      if (to) {
        expect(level.areas[to.area]?.entries[to.entry], JSON.stringify(to)).toBeDefined();
      }
    }
  });

  it.each(areas)(
    "area %s draws from a tileset art has, with a look for each terrain run",
    (_, __, area) => {
      const tileset = area.tileset === undefined ? undefined : TILESETS[area.tileset];
      if (area.tileset !== undefined) {
        expect(tileset, area.tileset).toBeDefined();
      }
      for (const solid of area.solids) {
        if (!tileset) {
          expect(solid.look, JSON.stringify(solid)).toBeUndefined();
          continue;
        }
        expect(solid.look, JSON.stringify(solid)).toBeDefined();
        const missing = lookTiles(solid.look ?? "").filter((name) => !(name in tileset.tiles));
        expect(missing, `${solid.look} in ${area.tileset}`).toEqual([]);
      }
    },
  );

  it.each(areas)("area %s's objects name art the game can draw", (_, __, area) => {
    const tileset = area.tileset === undefined ? undefined : TILESETS[area.tileset];
    for (const placed of area.objects) {
      const art = OBJECT_TYPES[placed.type]?.art ?? "";
      const known =
        art.startsWith("placeholder-") || artKind(MANIFEST, tileset, art) !== "placeholder";
      expect(known || art.startsWith("test-"), `${placed.type}: ${art}`).toBe(true);
    }
  });

  it.each(LEVELS.map((level, index) => [index + 1, level] as const))(
    "level %i starts at an entry that exists and has an exit",
    (_, level) => {
      expect(level.areas[level.start.area]?.entries[level.start.entry]).toBeDefined();
      const exits = Object.values(level.areas).flatMap((area) =>
        area.objects.filter(
          (placed) => OBJECT_TYPES[placed.type]?.collision === "use" && !placed.to,
        ),
      );
      expect(exits.length).toBeGreaterThan(0);
    },
  );
});
