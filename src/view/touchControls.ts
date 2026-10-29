import { type BitmapFont, inkWidth } from "@andornaut/game-kit/text/bitmapFont";

import type { Point, Size } from "../data/types";
import type { HeldTouch } from "../input/intent";
import { LABEL_SCALE, type TouchControl } from "../layout/touchControls";
import { type TagFrame, tagMs } from "./aseprite";

// Whether a touch holds the button.
export function buttonHeld(control: TouchControl, touches: readonly HeldTouch[]): boolean {
  return touches.some((touch) => touch.role === control);
}

// When a button's press began: kept while it is held, nowMs on the frame it is first held, and
// undefined once released.
export function trackPress(
  nowMs: number,
  held: boolean,
  sinceMs: number | undefined,
): number | undefined {
  if (!held) {
    return undefined;
  }
  return sinceMs ?? nowMs;
}

// The tag a button shows: rest, its press tag for as long as that plays, then held until
// release.
export function controlTag(
  tags: ReadonlyMap<string, readonly TagFrame[]>,
  nowMs: number,
  sinceMs: number | undefined,
): string {
  if (sinceMs === undefined) {
    return "rest";
  }
  return nowMs - sinceMs < tagMs(tags, "press") ? "press" : "held";
}

// The top-left of an odd-sized frame whose centre pixel sits on centre.
export function centredAt(centre: Point, frame: Size): Point {
  return { x: centre.x - (frame.width - 1) / 2, y: centre.y - (frame.height - 1) / 2 };
}

// The origin of a label in font at LABEL_SCALE, its ink centred on centre, rounded left, and
// raise above it.
export function labelAt(font: BitmapFont, centre: Point, raise: number, label: string): Point {
  return {
    x: centre.x - Math.floor(inkWidth(font, LABEL_SCALE, label) / 2),
    y: centre.y - raise,
  };
}

// A label's colour by its button's tag: cream at rest, white while pressed or held, from art's
// palette (public/art/palette.json).
export function labelColour(colours: Readonly<Record<string, string>>, tag: string): number {
  const hex = colours[tag === "rest" ? "cream" : "white"];
  if (hex === undefined) {
    throw new Error("The palette has no cream or white");
  }
  return Number.parseInt(hex.slice(1), 16);
}
