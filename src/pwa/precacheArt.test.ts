import { describe, expect, it } from "vitest";

import { ART_PATH, type ArtManifest } from "../view/aseprite";
import { ART_MANIFEST_URL, artUrls } from "./precacheArt";

const EMPTY: ArtManifest = { data: [], fonts: [], sprites: [] };

describe("artUrls", () => {
  it.each([
    ["nothing", EMPTY, []],
    [
      "a sprite",
      { ...EMPTY, sprites: [{ json: "s/a.json", key: "a", once: [], png: "s/a.png" }] },
      ["s/a.png", "s/a.json"],
    ],
    [
      "a font",
      { ...EMPTY, fonts: [{ fnt: "f/b.fnt", key: "b", png: "f/b.png" }] },
      ["f/b.png", "f/b.fnt"],
    ],
    ["a data file", { ...EMPTY, data: [{ json: "c.json", key: "c" }] }, ["c.json"]],
  ])("lists the manifest and %s", (_, manifest, files) => {
    expect(artUrls(manifest)).toEqual([ART_MANIFEST_URL, ...files.map((file) => ART_PATH + file)]);
  });
});
