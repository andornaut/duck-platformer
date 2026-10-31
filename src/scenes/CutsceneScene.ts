import { containsPoint } from "@andornaut/game-kit/rect";
import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import type { Point } from "../data/types";
import { CUTSCENE_CONTINUE } from "../layout/cutscene";
import { focusKeyAction } from "../pause/focusInput";
import {
  addTextButton,
  captureTab,
  pressTextButton,
  PRIMARY_BUTTON,
  ringFocus,
  type TextButton,
} from "./cardParts";
import { fitPlayCamera, playPoint } from "./playCamera";

export interface CutsceneData {
  readonly stage: string;
}

// A required inter-stage screen. Only a fresh Continue activation starts the next stage.
export class CutsceneScene extends Scene {
  private stage!: string;
  private button!: TextButton;
  private focused = false;
  private finished = false;
  private ring: GameObjects.NineSlice | undefined;
  private press: { readonly id: number; readonly at: Point; cancelled: boolean } | undefined;

  constructor() {
    super("cutscene");
  }
  init({ stage }: CutsceneData): void {
    this.stage = stage;
    this.focused = false;
    this.finished = false;
    this.ring = undefined;
    this.press = undefined;
  }
  create(): void {
    fitPlayCamera(this);
    this.add.image(0, 0, "stage-cutscene-placeholder").setOrigin(0);
    this.button = addTextButton(this, CUTSCENE_CONTINUE, TEXT.map.continue, {
      style: PRIMARY_BUTTON,
    });
    captureTab(this, true);
    this.events.once("shutdown", () => captureTab(this, false));
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      event.stopPropagation();
      const action = focusKeyAction(event.key, event.shiftKey, event.repeat);
      if (action === "next" || action === "previous") {
        this.focused = true;
        this.render();
      } else if (action === "press") {
        this.continue();
      }
    });
    this.input.keyboard?.on("keyup", (event: KeyboardEvent) => event.stopPropagation());
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      if (this.press || this.finished) {
        return;
      }
      const at = playPoint(this, pointer);
      if (containsPoint(CUTSCENE_CONTINUE.hit, at.x, at.y)) {
        this.press = { at, cancelled: false, id: pointer.id };
        this.render();
      }
    });
    this.input.on("pointermove", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      if (this.press?.id === pointer.id) {
        const at = playPoint(this, pointer);
        this.press.cancelled ||=
          Math.hypot(at.x - this.press.at.x, at.y - this.press.at.y) > TOUCH.tapMaxDistance;
        this.render();
      }
    });
    const up = (pointer: Input.Pointer, outside: boolean) => {
      this.input.stopPropagation();
      if (this.press?.id !== pointer.id) {
        return;
      }
      const press = this.press;
      this.press = undefined;
      this.render();
      const at = playPoint(this, pointer);
      if (
        !outside &&
        !pointer.wasCanceled &&
        !press.cancelled &&
        containsPoint(CUTSCENE_CONTINUE.hit, at.x, at.y) &&
        Math.hypot(at.x - press.at.x, at.y - press.at.y) <= TOUCH.tapMaxDistance
      ) {
        this.continue();
      }
    };
    this.input.on("pointerup", (pointer: Input.Pointer) => up(pointer, false));
    this.input.on("pointerupoutside", (pointer: Input.Pointer) => up(pointer, true));
  }
  private render(): void {
    pressTextButton(this.button, this.press !== undefined && !this.press.cancelled);
    this.ring = ringFocus(this, this.ring, this.focused ? CUTSCENE_CONTINUE.button : undefined);
  }
  private continue(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.press = undefined;
    this.scene.start("zone", { node: this.stage });
  }
}
