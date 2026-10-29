import { Scene } from "phaser";

import { TILE } from "../data/screen";
import {
  animKey,
  ART_MANIFEST_FILE,
  ART_MANIFEST_KEY,
  ART_PATH,
  type ArtManifest,
  type AsepriteSheet,
  sheetTags,
  tagRepeat,
} from "../view/aseprite";

// First scene to run. Loads everything art's manifest lists, makes an animation of every sprite
// tag, looping unless the manifest lists it as played once, then starts the test level and the
// pause scene beside it.
export class BootScene extends Scene {
  constructor() {
    super("boot");
  }

  preload(): void {
    this.load.setPath(ART_PATH);
    this.load.json(ART_MANIFEST_KEY, ART_MANIFEST_FILE);
    this.load.once(`filecomplete-json-${ART_MANIFEST_KEY}`, () => {
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
      for (const { json, key, png } of manifest.tilesets) {
        this.load.json(key, json);
        this.load.spritesheet(key, png, { frameHeight: TILE, frameWidth: TILE });
      }
      for (const { key, png } of manifest.backdrops) {
        this.load.image(key, png);
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
    this.scene.launch("pause");
    this.scene.start("level");
  }

  private manifest(): ArtManifest {
    return this.cache.json.get(ART_MANIFEST_KEY) as ArtManifest;
  }
}
