import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { containsPoint } from "@andornaut/game-kit/rect";
import { snapshotRemapped } from "@andornaut/game-kit/view/phaser/snapshotRemap";
import { Core, type GameObjects, type Input, Scene } from "phaser";

import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { PAUSE_BUTTON, PAUSE_CARD } from "../layout/pauseCard";
import { type CardAction, cardBackAction, cardKeyAction } from "../pause/cardInput";
import { coverZone, PHONE_EVENTS, startWakeLock, stopWakeLock, zoneShown } from "../pwa";
import { setTouchControlsShown, touchControlsShown } from "../settings/touchControls";
import { dimColour, type Palette } from "../view/dim";
import { addCardText, addSlice, BODY_FONT, palette, paletteColour, TITLE_FONT } from "./cardParts";
import type { SettingsData, SettingsOpener, SettingsScene } from "./SettingsScene";
import type { ZoneScene } from "./ZoneScene";

const ZONE = "zone";
const SETTINGS = "settings";
const START = "start";
// The dimmed zone, with the touch buttons hidden and shown, so the settings card's Touch
// controls row updates the view behind the card as it changes.
const DIM_TEXTURES = { hidden: "pause-dim-hidden", shown: "pause-dim-shown" } as const;

type Control = "close" | "home" | "pauseButton" | "resume" | "settings";

// The pause card over the dimmed zone, and the pause button that opens it, which shows on a
// touch screen while a zone plays, never on the map. It runs beside the zone from the start.
// Opening the card pauses the zone and lets the screen sleep; Resume, the close X, back, Escape
// and P close it. The Settings row opens SettingsScene's card over the same dim in the pause
// card's place, and passes it the keys and back until it closes; Return home ends the zone for
// the start screen.
export class PauseScene extends Scene implements SettingsOpener {
  private card!: GameObjects.Container;
  private closeX!: GameObjects.Sprite;
  private dim!: GameObjects.Image;
  private pauseButton!: GameObjects.Sprite;
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Control | undefined;
  private homeIcon!: GameObjects.Sprite;
  private homeLabel!: GameObjects.BitmapText;
  private resume!: GameObjects.Sprite;
  private resumeLabel!: GameObjects.BitmapText;
  private settingsLabel!: GameObjects.BitmapText;
  private state: "closed" | "open" | "opening" | "settings" = "closed";

  constructor() {
    super("pause");
  }

  create(): void {
    this.pauseButton = this.add
      .sprite(PAUSE_BUTTON.at.x, PAUSE_BUTTON.at.y, "ui-pause")
      .setOrigin(0);
    this.dim = this.add.image(0, 0, "__DEFAULT").setOrigin(0);
    this.card = this.drawCard();
    this.showCard(false);
    this.watchPresses();
    this.watchKeys();
    const onBack = () => {
      if (this.state === "settings") {
        this.settings().back();
      } else {
        this.act(cardBackAction(this.state === "open"));
      }
    };
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
    this.renderDim();
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

  // Ends the zone and shows the start screen, this scene staying beside it for the next zone.
  private returnHome(): void {
    this.state = "closed";
    this.showCard(false);
    this.scene.stop(ZONE);
    this.scene.launch(START);
    startWakeLock();
    coverZone("pauseCard", false);
  }

  // Saves the Touch controls setting and shows it in the zone and the dim behind the cards.
  setTouchControls(shown: boolean): void {
    setTouchControlsShown(shown);
    (this.scene.get(ZONE) as ZoneScene).showTouchControls(shown);
    this.renderDim();
  }

  // Hides the pause card under the settings card, which SettingsScene draws over the dim.
  private openSettings(): void {
    this.state = "settings";
    this.card.setVisible(false);
    this.scene.launch(SETTINGS, { opener: this.scene.key } satisfies SettingsData);
  }

  // The settings card has closed: the pause card shows again.
  settingsClosed(): void {
    if (this.state === "settings") {
      this.state = "open";
      this.card.setVisible(true);
    }
  }

  private settings(): SettingsScene {
    return this.scene.get(SETTINGS) as SettingsScene;
  }

  // The dim behind the cards, with the touch buttons as the setting shows them.
  private renderDim(): void {
    const key = touchControlsShown() ? DIM_TEXTURES.shown : DIM_TEXTURES.hidden;
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
  private async dimZone(key: string): Promise<void> {
    await snapshotRemapped(dimColour(this.palette()), this, { ...SCREEN, x: 0, y: 0 }, key);
  }

  private drawCard(): GameObjects.Container {
    const { card, close, home, resume, settings, title } = PAUSE_CARD;
    const words = TEXT.pause;
    const cream = this.colour("cream");
    const objects: GameObjects.GameObject[] = [
      this.slice("ui-settings-card", card),
      this.text(TITLE_FONT, title.x, title.y, words.title, cream),
      this.slice("ui-settings-row", settings.row),
      this.add.image(settings.icon.x, settings.icon.y, "icon-settings").setOrigin(0),
      this.slice("ui-settings-row", home.row),
    ];
    this.settingsLabel = this.text(
      BODY_FONT,
      settings.label.x,
      settings.label.y,
      words.settings,
      cream,
    );
    // PLACEHOLDER: ui-quit stands in for art's home icon.
    this.homeIcon = this.add.sprite(home.icon.x, home.icon.y, "ui-quit").setOrigin(0);
    this.homeLabel = this.text(BODY_FONT, home.label.x, home.label.y, words.home, cream);
    this.closeX = this.add.sprite(close.at.x, close.at.y, "ui-close").setOrigin(0);
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
      this.settingsLabel,
      this.homeIcon,
      this.homeLabel,
      this.resume,
      this.resumeLabel,
    ]);
  }

  // A pressed control shows its pressed look until the press lifts: the pause button plays its
  // press tag, then holds, as the touch buttons do; the Settings and Return home labels turn white and
  // Resume's sinks.
  private setPressed(control: Control | undefined): void {
    this.pressed = control;
    const { label, pressedLabel } = PAUSE_CARD.resume;
    this.closeX.play(animationKey("ui-close", control === "close" ? "pressed" : "normal"));
    this.homeIcon.play(animationKey("ui-quit", control === "home" ? "pressed" : "normal"));
    this.homeLabel.setTint(this.colour(control === "home" ? "white" : "cream"));
    this.settingsLabel.setTint(this.colour(control === "settings" ? "white" : "cream"));
    this.resume.play(animationKey("ui-resume", control === "resume" ? "pressed" : "normal"));
    this.resumeLabel.setY(control === "resume" ? pressedLabel.y : label.y);
    this.pauseButton.chain();
    if (control === "pauseButton") {
      this.pauseButton
        .play(animationKey("ui-pause", "press"))
        .chain(animationKey("ui-pause", "held"));
    } else {
      this.pauseButton.play(animationKey("ui-pause", "rest"));
    }
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    const hits: [Control, Rect][] =
      this.state === "open"
        ? [
            ["close", PAUSE_CARD.close.hit],
            ["settings", PAUSE_CARD.settings.row],
            ["home", PAUSE_CARD.home.row],
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
        home: () => this.returnHome(),
        pauseButton: () => void this.open(),
        resume: () => this.close(),
        settings: () => this.openSettings(),
      };
      actions[control]();
    });
  }

  private watchKeys(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      if (this.state === "opening") {
        return;
      }
      if (this.state === "settings") {
        this.settings().key(event);
        return;
      }
      this.act(cardKeyAction(this.state === "open", event.key, event.repeat));
    });
  }

  private slice(key: string, rect: Rect): GameObjects.NineSlice {
    return addSlice(this, key, rect);
  }

  private text(
    font: string,
    x: number,
    y: number,
    text: string,
    colour: number,
  ): GameObjects.BitmapText {
    return addCardText(this, font, { x, y }, text, colour);
  }

  private palette(): Palette {
    return palette(this);
  }

  private colour(name: string): number {
    return paletteColour(this, name);
  }
}
