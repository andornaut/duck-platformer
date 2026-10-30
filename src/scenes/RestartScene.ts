import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import { type PressArea, pressedArea } from "../layout/hitAreas";
import { RESTART_CARD } from "../layout/restartCard";
import { focusKeyAction, stepFocus } from "../pause/focusInput";
import { clearProgress } from "../save";
import {
  addCardText,
  addSlice,
  addTextButton,
  BODY_FONT,
  paletteColour,
  pressTextButton,
  ringFocus,
  type TextButton,
  TITLE_FONT,
} from "./cardParts";
import { fitPlayCamera, playPoint } from "./playCamera";

// The scene that opens the restart card, the start screen or the celebration: it passes the card
// its keys and back while the card shows, and hears when Cancel closes it.
export interface RestartOpener {
  restartClosed(): void;
}

// What the opener launches the card with: its own scene key.
export interface RestartData {
  readonly opener: string;
}

// The card's buttons, in the order the keyboard's focus moves through them.
type Target = "cancel" | "restart";
const TARGETS: readonly Target[] = ["cancel", "restart"];

// The card that asks before Restart clears progress, over the scene that opened it: a question,
// Cancel, and Restart, which confirms. Restart clears only the progress save and opens the map
// with her on the first zone and nothing completed; Cancel, back, Escape and P close the card. A
// button acts when a press lands on it and lifts on it; Tab and the arrows move the keyboard's
// focus, and Enter and Space press the focused one. The opener passes this scene its keys and
// back.
export class RestartScene extends Scene {
  private buttons!: Readonly<Record<Target, TextButton>>;
  private focus: Target | undefined;
  private focusRing: GameObjects.NineSlice | undefined;
  private opener = "";
  // The button a press landed on, which acts if the press lifts on it too.
  private pressed: Target | undefined;

  constructor() {
    super("restart");
  }

  init(data: RestartData): void {
    this.opener = data.opener;
    this.focus = undefined;
    this.focusRing = undefined;
    this.pressed = undefined;
  }

  create(): void {
    fitPlayCamera(this);
    const { card, question, title } = RESTART_CARD;
    const words = TEXT.restart;
    const cream = paletteColour(this, "cream");
    addSlice(this, "ui-settings-card", card);
    addCardText(this, TITLE_FONT, title, words.title, cream);
    addCardText(this, BODY_FONT, question, words.question, cream);
    this.buttons = {
      cancel: addTextButton(this, RESTART_CARD.cancel, words.cancel),
      restart: addTextButton(this, RESTART_CARD.restart, words.restart),
    };
    this.render();
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.pressed = this.targetAt(pointer);
      this.render();
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const target = this.pressed;
      this.pressed = undefined;
      this.render();
      if (target !== undefined && target === this.targetAt(pointer)) {
        this.act(target);
      }
    });
  }

  // A key the opener passes on while the card shows.
  key(event: KeyboardEvent): void {
    const action = focusKeyAction(event.key, event.shiftKey, event.repeat);
    if (action === "close") {
      this.back();
    } else if (action === "press") {
      if (this.focus !== undefined) {
        this.act(this.focus);
      }
    } else if (action !== undefined) {
      this.focus = stepFocus([...TARGETS], this.focus, action);
      this.render();
    }
  }

  // Back, Escape and P cancel.
  back(): void {
    this.scene.stop();
    (this.scene.get(this.opener) as Scene & RestartOpener).restartClosed();
  }

  private act(target: Target): void {
    if (target === "cancel") {
      this.back();
    } else {
      clearProgress();
      this.scene.stop(this.opener);
      this.scene.start("map");
    }
  }

  private targetAt(pointer: Input.Pointer): Target | undefined {
    const areas: PressArea<Target>[] = TARGETS.map((key) => ({
      art: RESTART_CARD[key].button,
      hit: RESTART_CARD[key].hit,
      key,
    }));
    return pressedArea(areas, playPoint(this, pointer));
  }

  // Each button as the press leaves it, and art's focus ring round the focused one.
  private render(): void {
    for (const target of TARGETS) {
      pressTextButton(this.buttons[target], this.pressed === target);
    }
    this.focusRing = ringFocus(
      this,
      this.focusRing,
      this.focus === undefined ? undefined : RESTART_CARD[this.focus].button,
    );
  }
}
