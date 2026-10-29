import { containsPoint } from "@andornaut/game-kit/rect";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { CARD_TEXT_SCALE, PAUSE_BUTTON, PAUSE_CARD } from "../layout/pauseCard";
import { type CardAction, cardBackAction, cardKeyAction } from "../pause/cardInput";
import { leaveGame, PHONE_EVENTS, startWakeLock, stopWakeLock } from "../pwa";
import { setTouchControlsShown, touchControlsShown } from "../settings/touchControls";
import { animKey, type ArtManifest } from "../view/aseprite";
import { dimPixels, type Palette } from "../view/dim";
import type { LevelScene } from "./LevelScene";

const LEVEL = "level";
const MANIFEST = "manifest";
const PALETTE = "palette";
const BODY_FONT = "font-body";
const TITLE_FONT = "font-title";
// The dimmed level, with the touch buttons hidden and shown, so the Touch controls row updates
// the view behind the card as it changes.
const DIM_TEXTURES = { hidden: "pause-dim-hidden", shown: "pause-dim-shown" } as const;

type Control = "close" | "pauseButton" | "quit" | "resume" | "touchControls";

// The pause card over the dimmed level, and the pause button that opens it. It runs beside the
// level from the start. Opening the card pauses the level and lets the screen sleep; Resume, the
// close X, back, Escape and P close it. The Touch controls row shows or hides the touch buttons,
// and Quit leaves the game (leaveGame).
export class PauseScene extends Scene {
  private card!: GameObjects.Container;
  private checkbox!: GameObjects.Sprite;
  private closeX!: GameObjects.Sprite;
  private colours: Readonly<Record<string, string>> = {};
  private dim!: GameObjects.Image;
  private pauseButton!: GameObjects.Graphics;
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Control | undefined;
  private resume!: GameObjects.Sprite;
  private state: "closed" | "open" | "opening" = "closed";
  private stateText!: GameObjects.BitmapText;

  constructor() {
    super("pause");
  }

  create(): void {
    this.colours = this.palette().colours;
    this.pauseButton = this.drawPauseButton();
    this.dim = this.add.image(0, 0, "__DEFAULT").setOrigin(0);
    this.card = this.drawCard();
    this.showCard(false);
    this.watchPresses();
    this.watchKeys();
    const onBack = () => this.act(cardBackAction(this.state === "open"));
    window.addEventListener(PHONE_EVENTS.backPressed, onBack);
    this.events.once("shutdown", () => {
      window.removeEventListener(PHONE_EVENTS.backPressed, onBack);
    });
    startWakeLock();
  }

  private act(action: CardAction | undefined): void {
    if (action === "open") {
      void this.open();
    } else if (action === "close") {
      this.close();
    }
  }

  // Pauses the level, reads it back twice (touch buttons hidden, then shown) to dim each, and
  // shows the card over the dim. Nothing of this scene shows while the level is read back.
  private async open(): Promise<void> {
    if (this.state !== "closed" || !this.scene.isActive(LEVEL)) {
      return;
    }
    this.state = "opening";
    this.scene.pause(LEVEL);
    stopWakeLock();
    const camera = this.cameras.main.setVisible(false);
    const level = this.scene.get(LEVEL) as LevelScene;
    level.showTouchControls(false);
    await this.dimLevel(DIM_TEXTURES.hidden);
    level.showTouchControls(true);
    await this.dimLevel(DIM_TEXTURES.shown);
    level.showTouchControls(touchControlsShown());
    this.renderTouchControls();
    this.showCard(true);
    camera.setVisible(true);
    this.state = "open";
  }

  private close(): void {
    if (this.state !== "open") {
      return;
    }
    this.state = "closed";
    this.showCard(false);
    this.scene.resume(LEVEL);
    startWakeLock();
  }

  // Closed first, so a page kept for back-forward caching comes back to the game in play.
  private quit(): void {
    this.close();
    leaveGame();
  }

  private toggleTouchControls(): void {
    const shown = !touchControlsShown();
    setTouchControlsShown(shown);
    (this.scene.get(LEVEL) as LevelScene).showTouchControls(shown);
    this.renderTouchControls();
  }

  // The checkbox, its state text and the dim behind the card, by the setting.
  private renderTouchControls(): void {
    const shown = touchControlsShown();
    const words = TEXT.pause;
    this.checkbox.play(animKey(this.checkbox.texture.key, shown ? "on" : "off"));
    const text = shown ? words.shown : words.hidden;
    const font = phaserBitmapFont(this.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
    this.stateText
      .setText(text)
      .setX(PAUSE_CARD.touchControls.stateRight - inkWidth(font, CARD_TEXT_SCALE, text));
    const key = shown ? DIM_TEXTURES.shown : DIM_TEXTURES.hidden;
    this.dim.setTexture(this.textures.exists(key) ? key : "__DEFAULT");
  }

  private showCard(open: boolean): void {
    this.card.setVisible(open);
    this.dim.setVisible(open);
    this.pauseButton.setVisible(!open);
  }

  // The canvas as rendered at the end of the next frame, redrawn two steps down each colour's
  // ramp into the texture key. Where the renderer gives no image, the card shows undimmed.
  private dimLevel(key: string): Promise<void> {
    return new Promise((resolve) => {
      this.game.renderer.snapshotArea(0, 0, SCREEN.width, SCREEN.height, (snapshot) => {
        if (snapshot instanceof HTMLImageElement) {
          if (this.textures.exists(key)) {
            this.textures.remove(key);
          }
          const texture = this.textures.createCanvas(key, SCREEN.width, SCREEN.height);
          const context = texture?.getContext();
          if (texture && context) {
            context.drawImage(snapshot, 0, 0);
            const pixels = context.getImageData(0, 0, SCREEN.width, SCREEN.height);
            dimPixels(this.palette(), pixels.data);
            context.putImageData(pixels, 0, 0);
            texture.refresh();
          }
        }
        resolve();
      });
    });
  }

  // PLACEHOLDER: art has no pause button yet. A navy face in a cream ring with an ink edge, as
  // the touch buttons are, holding two cream bars.
  private drawPauseButton(): GameObjects.Graphics {
    const { face } = PAUSE_BUTTON;
    const graphics = this.add.graphics();
    const fill = (colour: string, rect: Rect) => {
      graphics.fillStyle(this.colour(colour)).fillRect(rect.x, rect.y, rect.width, rect.height);
    };
    const inset = (amount: number): Rect => ({
      height: face.height - 2 * amount,
      width: face.width - 2 * amount,
      x: face.x + amount,
      y: face.y + amount,
    });
    fill("ink", face);
    fill("cream", inset(1));
    fill("navy", inset(3));
    const bar = { height: 12, width: 4 };
    const top = face.y + (face.height - bar.height) / 2;
    fill("cream", { ...bar, x: face.x + 9, y: top });
    fill("cream", { ...bar, x: face.x + face.width - 9 - bar.width, y: top });
    return graphics;
  }

  private drawCard(): GameObjects.Container {
    const { card, close, quit, resume, title, touchControls } = PAUSE_CARD;
    const words = TEXT.pause;
    const cream = this.colour("cream");
    const objects: GameObjects.GameObject[] = [
      this.slice("ui-settings-card", card),
      this.text(TITLE_FONT, title.x, title.y, words.title, cream),
      this.slice("ui-settings-row", touchControls.row),
      this.text(
        BODY_FONT,
        touchControls.label.x,
        touchControls.label.y,
        words.touchControls,
        cream,
      ),
      this.slice("ui-settings-row", quit.row),
      this.text(BODY_FONT, quit.label.x, quit.label.y, words.quit, cream),
    ];
    this.closeX = this.add.sprite(close.at.x, close.at.y, "ui-close").setOrigin(0);
    this.checkbox = this.add
      .sprite(touchControls.checkbox.x, touchControls.checkbox.y, "ui-checkbox")
      .setOrigin(0);
    this.stateText = this.text(
      BODY_FONT,
      touchControls.stateRight,
      touchControls.label.y,
      "",
      this.colour("lgrey"),
    );
    this.resume = this.add.sprite(resume.hit.x, resume.hit.y, "ui-resume").setOrigin(0);
    const resumeLabel = this.text(
      TITLE_FONT,
      resume.label.x,
      resume.label.y,
      words.resume,
      this.colour("ink"),
    );
    this.setPressed(undefined);
    return this.add.container(0, 0, [
      ...objects,
      this.closeX,
      this.checkbox,
      this.stateText,
      this.resume,
      resumeLabel,
    ]);
  }

  // A pressed button shows its pressed tag until the press lifts.
  private setPressed(control: Control | undefined): void {
    this.pressed = control;
    this.closeX.play(animKey("ui-close", control === "close" ? "pressed" : "normal"));
    this.resume.play(animKey("ui-resume", control === "resume" ? "pressed" : "normal"));
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    const hits: [Control, Rect][] =
      this.state === "open"
        ? [
            ["close", PAUSE_CARD.close.hit],
            ["touchControls", PAUSE_CARD.touchControls.row],
            ["quit", PAUSE_CARD.quit.row],
            ["resume", PAUSE_CARD.resume.hit],
          ]
        : [["pauseButton", PAUSE_BUTTON.hit]];
    return hits.find(([, hit]) => containsPoint(hit, pointer.x, pointer.y))?.[0];
  }

  // A control acts when a press lands on it and lifts on it.
  private watchPresses(): void {
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.setPressed(this.controlAt(pointer));
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const control = this.pressed;
      this.setPressed(undefined);
      if (control === undefined || control !== this.controlAt(pointer)) {
        return;
      }
      const actions: Record<Control, () => void> = {
        close: () => this.close(),
        pauseButton: () => void this.open(),
        quit: () => this.quit(),
        resume: () => this.close(),
        touchControls: () => this.toggleTouchControls(),
      };
      actions[control]();
    });
  }

  private watchKeys(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.state === "opening") {
        return;
      }
      this.act(cardKeyAction(this.state === "open", event.key, event.repeat));
    });
  }

  private slice(key: string, rect: Rect): GameObjects.NineSlice {
    const entry = (this.cache.json.get(MANIFEST) as ArtManifest).sprites.find(
      (sprite) => sprite.key === key,
    );
    const slice = entry?.slice;
    if (!slice) {
      throw new Error(`No 9-slice edges for ${key}`);
    }
    const { bottom, left, right, top } = slice;
    return this.add
      .nineslice(rect.x, rect.y, key, undefined, rect.width, rect.height, left, right, top, bottom)
      .setOrigin(0);
  }

  private text(
    font: string,
    x: number,
    y: number,
    text: string,
    colour: number,
  ): GameObjects.BitmapText {
    return this.add
      .bitmapText(x, y, font, text)
      .setScale(CARD_TEXT_SCALE)
      .setOrigin(0)
      .setTint(colour);
  }

  private palette(): Palette {
    return this.cache.json.get(PALETTE) as Palette;
  }

  private colour(name: string): number {
    const hex = this.colours[name];
    if (hex === undefined) {
      throw new Error(`The palette has no ${name}`);
    }
    return Number.parseInt(hex.slice(1), 16);
  }
}
