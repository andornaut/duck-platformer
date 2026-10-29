import { Scene } from "phaser";

import { TILE } from "../data/screen";
import { launchReady } from "../pwa";
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
import { addAtlasArt, ATLAS, queueAtlasFonts, queueAtlasPages } from "./atlasArt";

// First scene to run. Loads everything art's manifest lists, makes an animation of every sprite
// tag, looping unless the manifest lists it as played once, then, once launchReady resolves,
// starts the test level and the pause scene beside it.
export class BootScene extends Scene {
  constructor() {
    super("boot");
  }

  // A build loads its atlas pages, in parallel with the manifest, and each font's .fnt: every
  // PNG art's manifest lists is on the pages. The dev server has no atlas, so each art file loads
  // on its own there and every edit shows on reload.
  preload(): void {
    if (ATLAS !== null) {
      queueAtlasPages(this, ATLAS);
    }
    this.load.setPath(ART_PATH);
    this.load.json(ART_MANIFEST_KEY, ART_MANIFEST_FILE);
    this.load.once(`filecomplete-json-${ART_MANIFEST_KEY}`, () => {
      const manifest = this.manifest();
      for (const { json, key } of manifest.data) {
        this.load.json(key, json);
      }
      for (const { json, key } of manifest.tilesets) {
        this.load.json(key, json);
      }
      if (ATLAS !== null) {
        queueAtlasFonts(this, manifest);
        return;
      }
      for (const { json, key, png } of manifest.sprites) {
        this.load.aseprite(key, png, json);
      }
      for (const { fnt, key, png } of manifest.fonts) {
        this.load.bitmapFont(key, png, fnt);
      }
      for (const { key, png } of manifest.tilesets) {
        this.load.spritesheet(key, png, { frameHeight: TILE, frameWidth: TILE });
      }
      for (const { key, png } of manifest.backdrops) {
        this.load.image(key, png);
      }
    });
  }

  create(): void {
    if (ATLAS !== null) {
      addAtlasArt(this, ATLAS, this.manifest());
    }
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
    // The level shows once a version about to be replaced by a newer one has had its chance to
    // reload first, so it never draws the old level.
    void launchReady().then(() => {
      this.scene.launch("pause");
      this.scene.start("level");
    });
  }

  private manifest(): ArtManifest {
    return this.cache.json.get(ART_MANIFEST_KEY) as ArtManifest;
  }
}
