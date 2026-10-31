import { EventEmitter } from "node:events";

import { expect, it, vi } from "vitest";

import { ART_MANIFEST_KEY } from "../view/aseprite";

const art = vi.hoisted(() => ({ atlas: null as null | object }));
vi.mock("phaser", () => ({
  Scene: class {
    readonly cache = { json: { get: vi.fn() } };
    readonly load = Object.assign(new EventEmitter(), {
      image: vi.fn(),
      json: vi.fn(),
      setPath: vi.fn(),
    });
  },
}));
vi.mock("../pwa", () => ({}));
vi.mock("../save", () => ({}));
vi.mock("./atlasArt", () => ({
  get ATLAS() {
    return art.atlas;
  },
  queueAtlasFonts: vi.fn(),
  queueAtlasPages: vi.fn(),
}));

import { BootScene } from "./BootScene";

it("loads standalone manifest images in development and atlas mode", () => {
  for (const atlas of [null, {}]) {
    art.atlas = atlas;
    const scene = new BootScene();
    vi.mocked(scene.cache.json.get).mockReturnValue({
      backdrops: [],
      data: [],
      fonts: [],
      images: [{ key: "standalone-image", png: "images/standalone.png" }],
      sprites: [],
      tilesets: [],
    });
    scene.preload();
    scene.load.emit(`filecomplete-json-${ART_MANIFEST_KEY}`);
    expect(scene.load.image).toHaveBeenCalledExactlyOnceWith(
      "standalone-image",
      "images/standalone.png",
    );
  }
});
