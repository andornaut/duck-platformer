import type { GameObjects, Scene } from "phaser";

import type { Point, Rect } from "../data/types";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import { ART_MANIFEST_KEY, type ArtManifest } from "../view/aseprite";
import type { Palette } from "../view/dim";

// What the pause, settings and install steps cards draw with: art's 9-slices, card text and the
// palette's colours.

const PALETTE = "palette";
export const BODY_FONT = "font-body";
export const TITLE_FONT = "font-title";

export function palette(scene: Scene): Palette {
  return scene.cache.json.get(PALETTE) as Palette;
}

// A palette colour by name, as a number for a tint.
export function paletteColour(scene: Scene, name: string): number {
  const hex = palette(scene).colours[name];
  if (hex === undefined) {
    throw new Error(`The palette has no ${name}`);
  }
  return Number.parseInt(hex.slice(1), 16);
}

// A 9-slice sprite stretched over rect, by the edges art's manifest gives it: its frame, or its
// first.
export function addSlice(
  scene: Scene,
  key: string,
  rect: Rect,
  frame?: string,
): GameObjects.NineSlice {
  const entry = (scene.cache.json.get(ART_MANIFEST_KEY) as ArtManifest).sprites.find(
    (sprite) => sprite.key === key,
  );
  const slice = entry?.slice;
  if (!slice) {
    throw new Error(`No 9-slice edges for ${key}`);
  }
  const { bottom, left, right, top } = slice;
  return scene.add
    .nineslice(rect.x, rect.y, key, frame, rect.width, rect.height, left, right, top, bottom)
    .setOrigin(0);
}

// Text on a card at CARD_TEXT_SCALE, its top-left at at.
export function addCardText(
  scene: Scene,
  font: string,
  at: Point,
  text: string,
  colour: number,
): GameObjects.BitmapText {
  return scene.add
    .bitmapText(at.x, at.y, font, text)
    .setScale(CARD_TEXT_SCALE)
    .setOrigin(0)
    .setTint(colour);
}
