import { Scene } from "phaser";

import {
  animKey,
  type ArtManifest,
  type AsepriteSheet,
  sheetTags,
  tagRepeat,
} from "../view/aseprite";

const MANIFEST = "manifest";

// First scene to run. Loads everything art's manifest lists, makes an animation of every sprite
// tag, looping unless the manifest lists it as played once, then starts the test floor.
export class BootScene extends Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.setPath("art/");
    this.load.json(MANIFEST, "manifest.json");
    this.load.once(`filecomplete-json-${MANIFEST}`, () => {
      const manifest = this.manifest();
      for (const { json, key, png } of manifest.sprites) {
        this.load.aseprite(key, png, json);
      }
      for (const { fnt, key, png } of manifest.fonts) {
        this.load.bitmapFont(key, png, fnt);
      }
      for (const { json, key } of manifest.data) {
        this.load.json(key, json);
      }
    });
  }

  create(): void {
    for (const { key, once } of this.manifest().sprites) {
      const sheet = this.cache.json.get(key) as AsepriteSheet;
      for (const [tag, frames] of sheetTags(sheet)) {
        this.anims.create({
          frames: frames.map(({ frame, ms }) => ({ duration: ms, frame, key })),
          key: animKey(key, tag),
          repeat: tagRepeat(once, tag),
        });
      }
    }
    this.scene.start("floor");
  }

  private manifest(): ArtManifest {
    return this.cache.json.get(MANIFEST) as ArtManifest;
  }
}
