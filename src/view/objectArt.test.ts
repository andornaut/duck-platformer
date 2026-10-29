import { describe, expect, it } from "vitest";

import type { ArtManifest } from "./aseprite";
import { artKind } from "./objectArt";
import type { Tileset } from "./tiles";

const MANIFEST = {
  backdrops: [
    { key: "sky", repeat: "x" },
    { key: "tower", repeat: "none" },
  ],
  sprites: [{ key: "pigeon" }],
} as unknown as ArtManifest;
const TILESET: Tileset = { columns: 1, pieces: {}, tileSize: 12, tiles: { planter: 0 } };

describe("artKind", () => {
  it.each([
    ["a tile of the area's tileset", TILESET, "planter", "tiles"],
    ["a repeated backdrop", TILESET, "sky", "repeated-backdrop"],
    ["a backdrop", TILESET, "tower", "backdrop"],
    ["a sprite", TILESET, "pigeon", "sprite"],
    ["placeholder art", TILESET, "placeholder-park-bench", "placeholder"],
    ["art the game does not have", TILESET, "park-bench", "placeholder"],
    [
      "a tile name in an area whose tileset art does not have yet",
      undefined,
      "planter",
      "placeholder",
    ],
  ])("draws %s as %s", (_, tileset, art, kind) => {
    expect(artKind(MANIFEST, tileset, art)).toBe(kind);
  });
});
