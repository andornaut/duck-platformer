import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import { DEATH_ACTIONS, type DeathAction, deathKeyAction } from "../input/deathInput";
import { DEATH_CARD } from "../layout/deathCard";
import { type PressArea, pressedArea } from "../layout/hitAreas";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import { type DeathSummary, deathSummary } from "../view/death";
import {
  addCardText,
  addCardTitle,
  addSlice,
  addTextButton,
  BODY_FONT,
  captureTab,
  paletteColour,
  pressTextButton,
  PRIMARY_BUTTON,
  ringFocus,
  type TextButton,
  TITLE_FONT,
} from "./cardParts";
import { catchModalTaps } from "./modalTaps";
import { fitPlayCamera, playPoint } from "./playCamera";

export type DeathData = DeathSummary;
export interface DeathOpener {
  leaveDeath(): void;
  retryDeath(): void;
}

// Death's required card holds indefinitely. Only an explicit title/retry action can close it.
export class DeathScene extends Scene {
  private summary!: DeathSummary;
  private buttons!: Readonly<Record<DeathAction, TextButton>>;
  private focus: DeathAction | undefined;
  private ring: GameObjects.NineSlice | undefined;
  private press:
    | {
        readonly at: { readonly x: number; readonly y: number };
        readonly id: number;
        readonly target: DeathAction | undefined;
        cancelled: boolean;
      }
    | undefined;
  private finished = false;

  constructor() {
    super("death");
  }
  init(data: DeathData): void {
    this.summary = data;
    this.focus = undefined;
    this.ring = undefined;
    this.press = undefined;
    this.finished = false;
  }
  create(): void {
    fitPlayCamera(this);
    addSlice(this, "ui-settings-card", DEATH_CARD.card);
    const words = deathSummary(TEXT.death, this.summary);
    const titleFont = phaserBitmapFont(
      this.cache.bitmapFont.get(TITLE_FONT).data as PhaserFontData,
    );
    if (inkWidth(titleFont, CARD_TEXT_SCALE, words.title) > DEATH_CARD.stage.width) {
      throw new Error("Death title does not fit its card");
    }
    addCardTitle(this, DEATH_CARD.card, words.title);
    const font = phaserBitmapFont(this.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
    for (const name of ["stage", "progress", "time"] as const) {
      const rect = DEATH_CARD[name];
      const width = inkWidth(font, CARD_TEXT_SCALE, words[name]);
      if (width > rect.width) {
        throw new Error(`Death ${name} does not fit its card`);
      }
      addCardText(
        this,
        BODY_FONT,
        { x: rect.x + (rect.width - width) / 2, y: rect.y },
        words[name],
        paletteColour(this, "ink"),
      );
    }
    this.buttons = {
      home: addTextButton(this, DEATH_CARD.home, TEXT.pause.home),
      retry: addTextButton(this, DEATH_CARD.retry, TEXT.death.retry, { style: PRIMARY_BUTTON }),
    };
    this.render();
    catchModalTaps(this, this.cameras.main, {
      covered: () => [DEATH_CARD.card, ...DEATH_ACTIONS.map((name) => DEATH_CARD[name].hit)],
    });
    this.watchInput();
    captureTab(this, true);
    this.events.once("shutdown", () => captureTab(this, false));
  }
  private render(): void {
    for (const name of DEATH_ACTIONS) {
      pressTextButton(this.buttons[name], this.press?.target === name && !this.press.cancelled);
    }
    this.ring = ringFocus(
      this,
      this.ring,
      this.focus === undefined ? undefined : DEATH_CARD[this.focus].button,
    );
  }
  private areas(): readonly PressArea<DeathAction>[] {
    return DEATH_ACTIONS.map((key) => ({
      art: DEATH_CARD[key].button,
      hit: DEATH_CARD[key].hit,
      key,
    }));
  }
  private act(action: DeathAction): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.scene.stop();
    const opener = this.scene.get("zone") as unknown as DeathOpener;
    if (action === "retry") {
      opener.retryDeath();
    } else {
      opener.leaveDeath();
    }
  }
  private watchInput(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      event.stopPropagation();
      const next = deathKeyAction(this.focus, event);
      this.focus = next.focus;
      this.render();
      if (next.action !== undefined) {
        this.act(next.action);
      }
    });
    this.input.keyboard?.on("keyup", (event: KeyboardEvent) => event.stopPropagation());
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      if (this.press || this.finished) {
        return;
      }
      const at = playPoint(this, pointer);
      this.press = { at, cancelled: false, id: pointer.id, target: pressedArea(this.areas(), at) };
      this.render();
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
        press.target !== undefined &&
        Math.hypot(at.x - press.at.x, at.y - press.at.y) <= TOUCH.tapMaxDistance &&
        pressedArea(this.areas(), at) === press.target
      ) {
        this.act(press.target);
      }
    };
    this.input.on("pointerup", (pointer: Input.Pointer) => up(pointer, false));
    this.input.on("pointerupoutside", (pointer: Input.Pointer) => up(pointer, true));
  }
}
