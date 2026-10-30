import { type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import type { GameObjects, Scene } from "phaser";

import type { Point, Rect } from "../data/types";
import { centredLabel, MARK_DROP, PLAY_MARK } from "../layout/buttonLabel";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import type { LabelledButton } from "../layout/restartCard";
import { focusRingAround } from "../layout/settingsCard";
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

// A button's label: its text, and art's play mark before it on Start, Resume and Continue.
export interface ButtonLabel {
  readonly label: GameObjects.BitmapText;
  readonly mark?: GameObjects.Image;
}

// A button's label in body text, centred across the button with the play mark before it when
// marked, its origin at labelY.
export function addButtonLabel(
  scene: Scene,
  button: Rect,
  labelY: number,
  text: string,
  options: { readonly colour: number; readonly marked: boolean },
): ButtonLabel {
  const font = phaserBitmapFont(scene.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
  const ink = inkWidth(font, CARD_TEXT_SCALE, text);
  const { labelX, markX } = centredLabel(button, ink, options.marked ? PLAY_MARK : undefined);
  const label = addCardText(scene, BODY_FONT, { x: labelX, y: labelY }, text, options.colour);
  return markX === undefined
    ? { label }
    : { label, mark: scene.add.image(markX, labelY + MARK_DROP, "ui-play-mark").setOrigin(0) };
}

// Moves a button's label, and its mark with it, to labelY: a pressed button's sink.
export function placeButtonLabel({ label, mark }: ButtonLabel, labelY: number): void {
  label.setY(labelY);
  mark?.setY(labelY + MARK_DROP);
}

// Art's keyboard focus ring round rect, in place of the last one, or none for no focus.
export function ringFocus(
  scene: Scene,
  last: GameObjects.NineSlice | undefined,
  rect: Rect | undefined,
): GameObjects.NineSlice | undefined {
  last?.destroy();
  return rect === undefined ? undefined : addSlice(scene, "ui-focus", focusRingAround(rect));
}

// Tab moves the keyboard's focus on a card or the start screen: while one shows, the game keeps
// it from moving the page's focus out of the canvas.
export function captureTab(scene: Scene, captured: boolean): void {
  if (captured) {
    scene.input.keyboard?.addCapture("TAB");
  } else {
    scene.input.keyboard?.removeCapture("TAB");
  }
}

// A labelled button on art's `ui-button` stretched over its rect: its normal and pressed faces,
// and its label in ink.
export interface TextButton {
  readonly faces: Readonly<Record<"normal" | "pressed", GameObjects.NineSlice>>;
  readonly label: ButtonLabel;
  readonly layout: LabelledButton;
}

export function addTextButton(scene: Scene, layout: LabelledButton, text: string): TextButton {
  const frames = sheetTags(scene.cache.json.get("ui-button") as AsepriteSheet);
  const face = (tag: "normal" | "pressed") =>
    addSlice(scene, "ui-button", layout.button, frames.get(tag)?.[0]?.frame);
  return {
    faces: { normal: face("normal"), pressed: face("pressed") },
    label: addButtonLabel(scene, layout.button, layout.labelY, text, {
      colour: paletteColour(scene, "ink"),
      marked: false,
    }),
    layout,
  };
}

// Shows a labelled button pressed or not: the pressed face, its label sunk.
export function pressTextButton({ faces, label, layout }: TextButton, pressed: boolean): void {
  faces.normal.setVisible(!pressed);
  faces.pressed.setVisible(pressed);
  placeButtonLabel(label, pressed ? layout.pressedLabelY : layout.labelY);
}
