import { containsPoint } from "@andornaut/game-kit/rect";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { Core, type GameObjects, type Input, Scene } from "phaser";

import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { CARD_TEXT_SCALE, PAUSE_BUTTON, PAUSE_CARD } from "../layout/pauseCard";
import { type CardAction, cardBackAction, cardKeyAction } from "../pause/cardInput";
import { coverZone, leaveGame, PHONE_EVENTS, startWakeLock, stopWakeLock, zoneShown } from "../pwa";
import { setTouchControlsShown, touchControlsShown } from "../settings/touchControls";
import { animKey, type ArtManifest } from "../view/aseprite";
import { dimPixels, type Palette } from "../view/dim";
import type { ZoneScene } from "./ZoneScene";

const ZONE = "zone";
const MANIFEST = "manifest";
const PALETTE = "palette";
const BODY_FONT = "font-body";
const TITLE_FONT = "font-title";
// The dimmed zone, with the touch buttons hidden and shown, so the Touch controls row updates
// the view behind the card as it changes.
const DIM_TEXTURES = { hidden: "pause-dim-hidden", shown: "pause-dim-shown" } as const;

type Control = "close" | "pauseButton" | "quit" | "resume" | "touchControls";

// The pause card over the dimmed zone, and the pause button that opens it, which shows on a
// touch screen while a zone plays, never on the map. It runs beside the zone from the start.
// Opening the card pauses the zone and lets the screen sleep; Resume, the close X, back, Escape
// and P close it. The Touch controls row shows or hides the touch buttons, and Quit leaves the
// game (leaveGame).
export class PauseScene extends Scene {
  private card!: GameObjects.Container;
  private checkbox!: GameObjects.Sprite;
  private closeX!: GameObjects.Sprite;
  private colours: Readonly<Record<string, string>> = {};
  private dim!: GameObjects.Image;
  private pauseButton!: GameObjects.Sprite;
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Control | undefined;
  private quitIcon!: GameObjects.Sprite;
  private quitLabel!: GameObjects.BitmapText;
  private resume!: GameObjects.Sprite;
  private resumeLabel!: GameObjects.BitmapText;
  private state: "closed" | "open" | "opening" = "closed";
  private stateText!: GameObjects.BitmapText;

  constructor() {
    super("pause");
  }

  create(): void {
    this.colours = this.palette().colours;
    this.pauseButton = this.add
      .sprite(PAUSE_BUTTON.at.x, PAUSE_BUTTON.at.y, "ui-pause")
      .setOrigin(0);
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
    // The zone's first frame: the game page is now the home screen.
    this.game.events.once(Core.Events.POST_RENDER, () => zoneShown());
  }

  private act(action: CardAction | undefined): void {
    if (action === "open") {
      void this.open();
    } else if (action === "close") {
      this.close();
    }
  }

  // Pauses the zone, reads it back twice (touch buttons hidden, then shown) to dim each, and
  // shows the card over the dim. Nothing of this scene shows while the zone is read back.
  private async open(): Promise<void> {
    if (this.state !== "closed" || !this.scene.isActive(ZONE)) {
      return;
    }
    this.state = "opening";
    this.scene.pause(ZONE);
    stopWakeLock();
    coverZone("pauseCard", true);
    const camera = this.cameras.main.setVisible(false);
    const zone = this.scene.get(ZONE) as ZoneScene;
    zone.showTouchControls(false);
    await this.dimZone(DIM_TEXTURES.hidden);
    zone.showTouchControls(true);
    await this.dimZone(DIM_TEXTURES.shown);
    zone.showTouchControls(touchControlsShown());
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
    this.scene.resume(ZONE);
    startWakeLock();
    coverZone("pauseCard", false);
  }

  // Closed first, so a page kept for back-forward caching comes back to the game in play.
  private quit(): void {
    this.close();
    leaveGame();
  }

  private toggleTouchControls(): void {
    const shown = !touchControlsShown();
    setTouchControlsShown(shown);
    (this.scene.get(ZONE) as ZoneScene).showTouchControls(shown);
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
    this.showPauseButton();
  }

  // The pause button shows on a touch screen while a zone plays and the card is closed. The map
  // between zones has nothing to pause, so it shows none.
  private showPauseButton(): void {
    this.pauseButton.setVisible(
      this.state === "closed" &&
        this.scene.isActive(ZONE) &&
        window.matchMedia("(pointer: coarse)").matches,
    );
  }

  override update(): void {
    this.showPauseButton();
  }

  // The canvas as rendered at the end of the next frame, redrawn two steps down each colour's
  // ramp into the texture key. Where the renderer gives no image, the card shows undimmed.
  private dimZone(key: string): Promise<void> {
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
    ];
    this.quitIcon = this.add.sprite(quit.icon.x, quit.icon.y, "ui-quit").setOrigin(0);
    this.quitLabel = this.text(BODY_FONT, quit.label.x, quit.label.y, words.quit, cream);
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
    this.resumeLabel = this.text(
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
      this.quitIcon,
      this.quitLabel,
      this.stateText,
      this.resume,
      this.resumeLabel,
    ]);
  }

  // A pressed control shows its pressed look until the press lifts: the pause button plays its
  // press tag, then holds, as the touch buttons do; Quit's label turns white and Resume's sinks.
  private setPressed(control: Control | undefined): void {
    this.pressed = control;
    const { label, pressedLabel } = PAUSE_CARD.resume;
    this.closeX.play(animKey("ui-close", control === "close" ? "pressed" : "normal"));
    this.quitIcon.play(animKey("ui-quit", control === "quit" ? "pressed" : "normal"));
    this.quitLabel.setTint(this.colour(control === "quit" ? "white" : "cream"));
    this.resume.play(animKey("ui-resume", control === "resume" ? "pressed" : "normal"));
    this.resumeLabel.setY(control === "resume" ? pressedLabel.y : label.y);
    this.pauseButton.chain();
    if (control === "pauseButton") {
      this.pauseButton.play(animKey("ui-pause", "press")).chain(animKey("ui-pause", "held"));
    } else {
      this.pauseButton.play(animKey("ui-pause", "rest"));
    }
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
        : this.pauseButton.visible
          ? [["pauseButton", PAUSE_BUTTON.hit]]
          : [];
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
