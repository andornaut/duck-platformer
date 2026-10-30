import { type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { catchOutsideTaps } from "@andornaut/game-kit/input/phaser/catchOutsideTaps";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import type { GameObjects, Scene } from "phaser";

import { TOUCH } from "../data/touch";
import type { Point, Rect } from "../data/types";
import { centredLabel, MARK_DROP, PLAY_MARK } from "../layout/buttonLabel";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import type { LabelledButton } from "../layout/restartCard";
import { focusRingAround } from "../layout/settingsCard";
import { ART_MANIFEST_KEY, type ArtManifest } from "../view/aseprite";
import type { Palette } from "../view/dim";
import { canvasRect } from "./playCamera";

// What the pause, settings, install steps and restart cards draw with: art's 9-slices, card text,
// buttons and the palette's colours, and how each modal card closes on a press outside it.

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

// Art's buttons: the normal one, and the green primary, which a card leads with.
export const BUTTON = "ui-button";
export const PRIMARY_BUTTON = "ui-button-primary";

// A labelled button on one of art's buttons (BUTTON by default) stretched over its rect: its
// normal and pressed faces, and its label in ink, led by the play mark when marked.
export interface TextButton {
  readonly faces: Readonly<Record<"normal" | "pressed", GameObjects.NineSlice>>;
  readonly label: ButtonLabel;
  readonly layout: LabelledButton;
}

export function addTextButton(
  scene: Scene,
  layout: LabelledButton,
  text: string,
  { art = BUTTON, marked = false }: { readonly art?: string; readonly marked?: boolean } = {},
): TextButton {
  const frames = sheetTags(scene.cache.json.get(art) as AsepriteSheet);
  const face = (tag: "normal" | "pressed") =>
    addSlice(scene, art, layout.button, frames.get(tag)?.[0]?.frame);
  return {
    faces: { normal: face("normal"), pressed: face("pressed") },
    label: addButtonLabel(scene, layout.button, layout.labelY, text, {
      colour: paletteColour(scene, "ink"),
      marked,
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

// Closes a modal card, as its close X or back would, on a tap outside it (the kit's
// catchOutsideTaps, as dog-walker's panels close): a press that lands on the canvas off the card
// and off every control it lists, the bars beside the game's view included, travels no further
// than the tap distance, and lifts outside them too. covered gives the card's rect and each
// control's press area in camera's view while it shows, or undefined while it shows none. The
// press is kept from the scenes under this one, so a modal scene sits above the scenes it covers
// (main.ts's scene order), and the zone, paused under the pause card, never hears it. Every modal
// card closes this way.
export function closeOnOutsideTap(
  scene: Scene,
  covered: () => readonly Rect[] | undefined,
  close: () => void,
  camera = scene.cameras.main,
): void {
  catchOutsideTaps(
    TOUCH.tapMaxDistance,
    scene,
    () => {
      const rects = covered();
      return rects === undefined
        ? undefined
        : {
            bounds: canvasRect(scene),
            covered: rects.map((rect) => ({ ...rect, x: rect.x + camera.x, y: rect.y + camera.y })),
          };
    },
    close,
  );
}
