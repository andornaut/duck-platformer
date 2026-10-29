import { type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { describe, expect, it } from "vitest";

import manifestJson from "../../public/art/manifest.json";
import lobbyTiles from "../../public/art/tilesets/tiles-lobby.json";
import streetTiles from "../../public/art/tilesets/tiles-street.json";
import { resolveNames } from "../rules/tiles";
import type { ArtManifest } from "../view/aseprite";
import { artKind } from "../view/objectArt";
import { lookTiles, type Tileset } from "../view/tiles";
import { ARCHETYPES, NO_INTERACTION, NO_REACTION, STATIC_MOTION } from "./archetypes";
import { CHARACTERS } from "./characters";
import { ZONE_MAP } from "./map";
import { SCREEN, TILE } from "./screen";
import { TEXT } from "./text";
import type { AreaPlan, Instance, TileRect, Tuning } from "./types";
import { ZONE_1 } from "./zone1";
import { TEST_ZONES, ZONES as ZONES_BY_KEY } from "./zones";

const MANIFEST = manifestJson as ArtManifest;
const TILESETS: Readonly<Record<string, Tileset>> = {
  "tiles-lobby": lobbyTiles,
  "tiles-street": streetTiles,
};
const SHEETS = import.meta.glob<AsepriteSheet>("../../public/art/sprites/*.json", {
  eager: true,
  import: "default",
});
const tagsOf = (art: string) => {
  const sheet = SHEETS[`../../public/art/sprites/${art}.json`];
  return sheet ? [...sheetTags(sheet).keys()] : [];
};
const ZONES = [ZONE_1, ...TEST_ZONES];
const CATALOGUE = { archetypes: ARCHETYPES, characters: CHARACTERS };

const inside = (area: AreaPlan, rect: TileRect) =>
  rect.col >= 0 &&
  rect.row >= 0 &&
  rect.col + rect.cols <= area.cols &&
  rect.row + rect.rows <= area.rows;

// The fields a tuning names that its parts do not have.
function unknownFields(tuning: Tuning | undefined): string[] {
  const known: Record<string, object> = {
    interaction: NO_INTERACTION,
    motion: STATIC_MOTION,
    reaction: NO_REACTION,
  };
  return Object.entries(tuning ?? {}).flatMap(([part, fields]) =>
    known[part]
      ? Object.keys(fields as object)
          .filter((field) => !(field in (known[part] as object)))
          .map((field) => `${part}.${field}`)
      : [part],
  );
}

const areas = ZONES.flatMap((zone, index) =>
  Object.entries(zone.areas).map(([name, area]) => [`${index + 1} ${name}`, zone, area] as const),
);
const instances = areas.flatMap(([name, , area]) =>
  area.objects.map(
    (instance, index) => [`${name} #${index} ${instance.character}`, area, instance] as const,
  ),
);

describe("the characters", () => {
  it.each(Object.entries(CHARACTERS))(
    "%s has a real archetype, tuning, tags and words",
    (name, character) => {
      expect(ARCHETYPES[character.archetype], character.archetype).toBeDefined();
      expect(unknownFields(character.tuning)).toEqual([]);
      const tags = [
        ...Object.values(character.animations ?? {}),
        ...(character.quirks ?? []).map(({ tag }) => tag),
      ];
      const known = tagsOf(character.art);
      expect(
        tags.filter((tag) => !known.includes(tag)),
        `${name}'s tags in ${character.art}`,
      ).toEqual([]);
      expect((character.lines ?? []).filter((key) => !(key in TEXT.lines))).toEqual([]);
      expect((character.quips ?? []).filter((key) => !(key in TEXT.quips))).toEqual([]);
    },
  );
});

describe("the zones", () => {
  it.each(instances)(
    "instance %s resolves, with real overrides and words",
    (_, area, instance: Instance) => {
      const { character } = resolveNames(CATALOGUE, instance);
      expect(unknownFields(instance.overrides)).toEqual([]);
      expect((instance.lines ?? []).filter((key) => !(key in TEXT.lines))).toEqual([]);
      const rect = {
        col: instance.col,
        cols: instance.cols ?? character.cols,
        row: instance.row,
        rows: instance.rows ?? character.rows,
      };
      expect(inside(area, rect), "inside its area").toBe(true);
      const tileset = area.tileset === undefined ? undefined : TILESETS[area.tileset];
      const drawable =
        character.art.startsWith("placeholder-") ||
        character.art.startsWith("test-") ||
        artKind(MANIFEST, tileset, character.art) !== "placeholder";
      expect(drawable, `${character.art} is drawable`).toBe(true);
    },
  );

  it.each(areas)("area %s is two screens tall, with its terrain inside it", (_, __, area) => {
    expect(area.rows * TILE).toBe(2 * SCREEN.height);
    expect(area.solids.every((rect) => inside(area, rect))).toBe(true);
  });

  it.each(areas)("area %s's doors lead to an entry that exists", (_, zone, area) => {
    for (const { to } of area.objects) {
      if (to) {
        expect(zone.areas[to.area]?.entries[to.entry], JSON.stringify(to)).toBeDefined();
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

  it.each(ZONES.map((zone, index) => [index + 1, zone] as const))(
    "zone %i starts at an entry that exists and has an exit",
    (_, zone) => {
      expect(zone.areas[zone.start.area]?.entries[zone.start.entry]).toBeDefined();
      const exits = Object.values(zone.areas).flatMap((area) =>
        area.objects.filter(
          (instance) =>
            !instance.to &&
            ARCHETYPES[CHARACTERS[instance.character]?.archetype ?? ""]?.collision === "use",
        ),
      );
      expect(exits.length).toBeGreaterThan(0);
    },
  );
});

describe("the map", () => {
  const ids = ZONE_MAP.nodes.map(({ id }) => id);
  const after = (id: string, builtOnly = false) =>
    ZONE_MAP.edges
      .filter((edge) => edge.from === id && (!builtOnly || edge.built))
      .map(({ to }) => to);
  const reach = (from: string, next: (id: string) => string[]) => {
    const seen = new Set([from]);
    for (const id of seen) {
      for (const to of next(id)) {
        seen.add(to);
      }
    }
    return seen;
  };

  it("names each node once, and every path's ends", () => {
    expect(new Set(ids).size).toBe(ids.length);
    const ends = ZONE_MAP.edges.flatMap(({ from, to }) => [from, to]);
    expect(ends.filter((id) => !ids.includes(id))).toEqual([]);
    expect([ZONE_MAP.start, ZONE_MAP.finish].filter((id) => !ids.includes(id))).toEqual([]);
  });

  it("names a zone for every zone node a built path reaches, and only zones that exist", () => {
    const built = reach(ZONE_MAP.start, (id) => after(id, true));
    for (const node of ZONE_MAP.nodes) {
      if (node.zone !== undefined) {
        expect(ZONES_BY_KEY[node.zone], node.zone).toBeDefined();
      }
      if (node.kind === "zone" && built.has(node.id)) {
        expect(node.zone, node.id).toBeDefined();
      }
    }
  });

  it("leads every node from the start and on to the finish, never back", () => {
    expect([...reach(ZONE_MAP.start, (id) => after(id))].sort()).toEqual([...ids].sort());
    for (const id of ids) {
      expect(reach(id, (each) => after(each)).has(ZONE_MAP.finish), id).toBe(true);
      expect(
        after(id).some((to) => reach(to, (each) => after(each)).has(id)),
        `${id} loops back`,
      ).toBe(false);
    }
  });

  it("has a built path from the start to the finish", () => {
    expect(reach(ZONE_MAP.start, (id) => after(id, true)).has(ZONE_MAP.finish)).toBe(true);
  });
});
