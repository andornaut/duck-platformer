import { catchOutsideTaps } from "@andornaut/game-kit/input/phaser/catchOutsideTaps";
import type { Scene } from "phaser";

import { TOUCH } from "../data/touch";
import type { Point, Rect } from "../data/types";

// A modal card, for catchModalTaps: covered gives the card's rect and each of its controls'
// press areas, in its camera's view, while it shows, or undefined while it shows none; close
// closes it, or is left out for a card with no close, a required choice.
export interface Modal {
  readonly close?: () => void;
  readonly covered: () => readonly Rect[] | undefined;
}

// While a modal card shows, only it responds: a tap anywhere else, the bars beside the game's
// view included, closes a card that can close, as its close X or back would, and does nothing at
// all on a card with no close (the kit's catchOutsideTaps, as dog-walker's panels close). A press
// that lands outside is kept from the scenes under the card's, which stay inert: a modal scene
// sits above every scene it covers (main.ts's scene order). camera is where the card's view sits
// in the canvas. Every modal card takes its taps this way.
export function catchModalTaps(
  scene: Pick<Scene, "input" | "scale">,
  camera: Point,
  modal: Modal,
): void {
  catchOutsideTaps(
    TOUCH.tapMaxDistance,
    scene,
    () => {
      const card = modal.covered();
      if (card === undefined) {
        return undefined;
      }
      const { height, width } = scene.scale.gameSize;
      return {
        bounds: { height, width, x: 0, y: 0 },
        covered: card.map((rect) => ({ ...rect, x: rect.x + camera.x, y: rect.y + camera.y })),
      };
    },
    () => modal.close?.(),
  );
}
