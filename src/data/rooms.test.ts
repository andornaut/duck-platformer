import { type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { describe, expect, it } from "vitest";

import manifestJson from "../../public/art/manifest.json";
import type { ArtManifest } from "../view/aseprite";
import { CHARACTERS } from "./characters";
import { ROOMS } from "./rooms";
import { TEXT } from "./text";

const MANIFEST = manifestJson as ArtManifest;
const SHEETS = import.meta.glob<AsepriteSheet>("../../public/art/sprites/*.json", {
  eager: true,
  import: "default",
});
const tagsOf = (art: string) => {
  const sheet = SHEETS[`../../public/art/sprites/${art}.json`];
  return sheet ? [...sheetTags(sheet).keys()] : [];
};
const BACKDROPS = new Set(MANIFEST.backdrops.map(({ key }) => key));

describe.each(Object.entries(ROOMS))("room %s", (key, room) => {
  it("has a name", () => {
    expect(TEXT.rooms[key]?.name, `TEXT.rooms.${key}.name`).toBeDefined();
  });

  it("draws a backdrop art has, if any", () => {
    if (room.art !== undefined) {
      expect(BACKDROPS.has(room.art), room.art).toBe(true);
    }
  });

  it("plays only tags art has, of characters that exist", () => {
    const missing = [
      ...(room.animations ?? []).flatMap(({ art, tag }) =>
        tagsOf(art).includes(tag) ? [] : [`${art}:${tag}`],
      ),
      ...(room.cast ?? []).flatMap(({ character }) =>
        character in CHARACTERS ? [] : [`character ${character}`],
      ),
    ];
    expect(missing).toEqual([]);
  });
});

describe("the rooms' words", () => {
  it("name only rooms that exist", () => {
    expect(Object.keys(TEXT.rooms).filter((key) => !(key in ROOMS))).toEqual([]);
  });
});
