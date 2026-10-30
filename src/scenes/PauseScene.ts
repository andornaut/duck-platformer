import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { snapshotRemapped } from "@andornaut/game-kit/view/phaser/snapshotRemap";
import { type Cameras, Core, type GameObjects, type Input, Scale, Scene, Scenes } from "phaser";

import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { FRAME_TURN } from "../input/frameTurn";
import { type PressArea, pressedArea } from "../layout/hitAreas";
import { PAUSE_BUTTON, PAUSE_CARD } from "../layout/pauseCard";
import { shifted, topShift } from "../layout/playView";
import { type CardAction, cardBackAction, cardKeyAction, cardTurnAction } from "../pause/cardInput";
import { focusKeyAction, stepFocus } from "../pause/focusInput";
import { coverZone, PHONE_EVENTS, startWakeLock, stopWakeLock, zoneShown } from "../pwa";
import { setTouchSettingShown, type TouchSetting, touchSettings } from "../settings/touchControls";
import { dimColour, type Palette } from "../view/dim";
import {
  addCardText,
  addCardTitle,
  addSlice,
  addTextButton,
  captureTab,
  palette,
  paletteColour,
  pressTextButton,
  PRIMARY_BUTTON,
  ringFocus,
  type TextButton,
} from "./cardParts";
import { catchModalTaps } from "./modalTaps";
import { canvasRect, fitCanvasCamera, fitPlayCamera, playPoint } from "./playCamera";
import type { SettingsData, SettingsOpener, SettingsScene } from "./SettingsScene";
import type { ZoneScene } from "./ZoneScene";

const ZONE = "zone";
const SETTINGS = "settings";
const START = "start";
// The dimmed zone with each mix of the touch settings, so the settings card's Move controls and
// Action buttons rows update the view behind the card as they change.
const DIM_MIXES: readonly Readonly<Record<TouchSetting, boolean>>[] = [false, true].flatMap(
  (moveControls) => [false, true].map((actionButtons) => ({ actionButtons, moveControls })),
);

// The texture key of the dimmed zone with settings.
function dimTexture({ actionButtons, moveControls }: Readonly<Record<TouchSetting, boolean>>) {
  return `pause-dim-move-${String(moveControls)}-action-${String(actionButtons)}`;
}

type Control = "close" | "home" | "pauseButton" | "resume" | "settings";
type CardControl = Exclude<Control, "pauseButton">;

// The card's controls, in the order the keyboard's focus moves through them.
const FOCUS_ORDER: readonly CardControl[] = ["resume", "settings", "home", "close"];
// The card's buttons, top to bottom.
type CardButton = Exclude<CardControl, "close">;
const BUTTONS: readonly CardButton[] = ["resume", "settings", "home"];

// The pause card over the dimmed zone, and the pause button that opens it, which shows on a
// touch screen while a zone plays, never on the map. It runs beside the zone from the start.
// Opening the card pauses the zone and lets the screen sleep; Resume (the primary button, at the
// top), the close X, back, Escape, P and a tap outside the card (closeOnOutsideTap) close it.
// Settings opens SettingsScene's card over the same dim in the pause card's place, and passes it
// the keys and back until it closes; Back to title ends the zone for the start screen.
export class PauseScene extends Scene implements SettingsOpener {
  private card!: GameObjects.Container;
  // The control the keyboard's focus is on, and art's ring round it.
  private focus: CardControl | undefined;
  private focusRing: GameObjects.NineSlice | undefined;
  private closeX!: GameObjects.Sprite;
  private dim!: GameObjects.Image;
  private pauseButton!: GameObjects.Sprite;
  // The control a press landed on, which acts if the press lifts on it too.
  private cardCamera!: Cameras.Scene2D.Camera;
  private pressed: Control | undefined;
  private buttons!: Readonly<Record<CardButton, TextButton>>;
  private state: "closed" | "open" | "opening" | "settings" = "closed";

  constructor() {
    super("pause");
  }

  create(): void {
    // The main camera covers the whole canvas, for the pause button at the view's top-left corner
    // and the dim over all of it; the card camera shows the cards in the game's view. Everything
    // added after the pause button and the dim belongs to the cards.
    const canvasCamera = this.cameras.main;
    fitCanvasCamera(this, canvasCamera);
    this.cardCamera = this.cameras.add();
    fitPlayCamera(this, this.cardCamera);
    this.pauseButton = this.add
      .sprite(PAUSE_BUTTON.at.x, PAUSE_BUTTON.at.y, "ui-pause")
      .setOrigin(0);
    this.placePauseButton();
    this.scale.on(Scale.Events.RESIZE, this.placePauseButton, this);
    this.events.once("shutdown", () =>
      this.scale.off(Scale.Events.RESIZE, this.placePauseButton, this),
    );
    this.dim = this.add.image(0, 0, "__DEFAULT").setOrigin(0);
    this.cardCamera.ignore([this.pauseButton, this.dim]);
    const toCards = (object: GameObjects.GameObject) => canvasCamera.ignore(object);
    this.events.on(Scenes.Events.ADDED_TO_SCENE, toCards);
    this.events.once("shutdown", () => this.events.off(Scenes.Events.ADDED_TO_SCENE, toCards));
    this.card = this.drawCard();
    this.showCard(false);
    this.watchPresses();
    catchModalTaps(this, this.cardCamera, {
      close: () => this.close(),
      covered: () =>
        this.state === "open"
          ? [PAUSE_CARD.card, PAUSE_CARD.close.hit, ...BUTTONS.map((name) => PAUSE_CARD[name].hit)]
          : undefined,
    });
    this.watchKeys();
    const onBack = () => {
      if (this.state === "settings") {
        this.settings().back();
      } else {
        this.act(cardBackAction(this.state === "open"));
      }
    };
    window.addEventListener(PHONE_EVENTS.backPressed, onBack);
    // The page frame turning mid-play pauses it, as P does; open only while the zone plays.
    const stopTurns = FRAME_TURN.onChange(() => this.act(cardTurnAction(this.state !== "closed")));
    this.events.once("shutdown", () => {
      window.removeEventListener(PHONE_EVENTS.backPressed, onBack);
      stopTurns();
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

  // Pauses the zone, reads it back once for each mix of the touch settings (DIM_MIXES) to dim
  // each, and
  // shows the card over the dim. Nothing of this scene shows while the zone is read back.
  private async open(): Promise<void> {
    if (this.state !== "closed" || !this.scene.isActive(ZONE)) {
      return;
    }
    this.state = "opening";
    this.scene.pause(ZONE);
    stopWakeLock();
    coverZone("pauseCard", true);
    const cameras = this.cameras.cameras.filter((camera) => camera.visible);
    cameras.forEach((camera) => camera.setVisible(false));
    const zone = this.scene.get(ZONE) as ZoneScene;
    for (const mix of DIM_MIXES) {
      zone.showTouchControls(mix);
      // eslint-disable-next-line no-await-in-loop -- each mix needs its own rendered frame.
      await this.dimZone(dimTexture(mix));
    }
    zone.showTouchControls(touchSettings());
    this.renderDim();
    this.showCard(true);
    captureTab(this, true);
    cameras.forEach((camera) => camera.setVisible(true));
    this.state = "open";
  }

  private close(): void {
    if (this.state !== "open") {
      return;
    }
    this.state = "closed";
    this.showCard(false);
    captureTab(this, false);
    this.scene.resume(ZONE);
    startWakeLock();
    coverZone("pauseCard", false);
  }

  // Ends the zone and shows the start screen, this scene staying beside it for the next zone.
  private returnHome(): void {
    this.state = "closed";
    this.showCard(false);
    captureTab(this, false);
    this.scene.stop(ZONE);
    this.scene.launch(START);
    startWakeLock();
    coverZone("pauseCard", false);
  }

  // Saves a touch setting and shows it in the zone and the dim behind the cards.
  setTouchSetting(setting: TouchSetting, shown: boolean): void {
    setTouchSettingShown(setting, shown);
    (this.scene.get(ZONE) as ZoneScene).showTouchControls(touchSettings());
    this.renderDim();
  }

  // Hides the pause card under the settings card, which SettingsScene draws over the dim.
  private openSettings(): void {
    this.state = "settings";
    this.card.setVisible(false);
    this.focusRing = ringFocus(this, this.focusRing, undefined);
    this.scene.launch(SETTINGS, { opener: this.scene.key } satisfies SettingsData);
  }

  // The settings card has closed: the pause card shows again.
  settingsClosed(): void {
    if (this.state === "settings") {
      this.state = "open";
      this.card.setVisible(true);
      this.drawFocus();
    }
  }

  private settings(): SettingsScene {
    return this.scene.get(SETTINGS) as SettingsScene;
  }

  // The dim behind the cards, with the touch buttons as the setting shows them.
  private renderDim(): void {
    const key = dimTexture(touchSettings());
    this.dim.setTexture(this.textures.exists(key) ? key : "__DEFAULT");
  }

  private showCard(open: boolean): void {
    this.card.setVisible(open);
    this.dim.setVisible(open);
    this.focus = undefined;
    this.drawFocus();
    this.showPauseButton();
  }

  private drawFocus(): void {
    const rect = this.focus === undefined ? undefined : this.focusedRect(this.focus);
    this.focusRing = ringFocus(this, this.focusRing, rect);
  }

  // What the focus ring surrounds: a button, or the close X itself.
  private focusedRect(control: CardControl): Rect {
    if (control === "close") {
      const { at } = PAUSE_CARD.close;
      return { height: this.closeX.height, width: this.closeX.width, ...at };
    }
    return PAUSE_CARD[control].button;
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
    await snapshotRemapped(dimColour(this.palette()), this, canvasRect(this), key);
  }

  private drawCard(): GameObjects.Container {
    const { card, close } = PAUSE_CARD;
    const words = TEXT.pause;
    const objects: GameObjects.GameObject[] = [
      this.slice("ui-settings-card", card),
      addCardTitle(this, card, words.title),
    ];
    this.closeX = this.add.sprite(close.at.x, close.at.y, "ui-close").setOrigin(0);
    this.buttons = {
      home: addTextButton(this, PAUSE_CARD.home, words.home),
      resume: addTextButton(this, PAUSE_CARD.resume, words.resume, {
        art: PRIMARY_BUTTON,
        marked: true,
      }),
      settings: addTextButton(this, PAUSE_CARD.settings, words.settings),
    };
    this.setPressed(undefined);
    return this.add.container(0, 0, [
      ...objects,
      this.closeX,
      ...BUTTONS.flatMap((name) => {
        const { faces, label } = this.buttons[name];
        return [faces.normal, faces.pressed, label.label, ...(label.mark ? [label.mark] : [])];
      }),
    ]);
  }

  // A pressed control shows its pressed look until the press lifts: the pause button plays its
  // press tag, then holds, as the touch buttons do; a card button's face and label sink.
  private setPressed(control: Control | undefined): void {
    this.pressed = control;
    this.closeX.play(animationKey("ui-close", control === "close" ? "pressed" : "normal"));
    for (const name of BUTTONS) {
      pressTextButton(this.buttons[name], control === name);
    }
    this.pauseButton.chain();
    if (control === "pauseButton") {
      this.pauseButton
        .play(animationKey("ui-pause", "press"))
        .chain(animationKey("ui-pause", "held"));
    } else {
      this.pauseButton.play(animationKey("ui-pause", "rest"));
    }
  }

  // Puts the pause button at its place shifted across with the view, so it stays inside it.
  private placePauseButton(): void {
    const at = shifted(topShift(this.scale.gameSize), PAUSE_BUTTON.at);
    this.pauseButton.setPosition(at.x, at.y);
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    const { close } = PAUSE_CARD;
    const areas: PressArea<Control>[] =
      this.state === "open"
        ? [
            { art: close.art, hit: close.hit, key: "close" },
            ...BUTTONS.map((key) => ({
              art: PAUSE_CARD[key].button,
              hit: PAUSE_CARD[key].hit,
              key,
            })),
          ]
        : this.pauseButton.visible
          ? [{ art: PAUSE_BUTTON.art, hit: PAUSE_BUTTON.hit, key: "pauseButton" }]
          : [];
    const point =
      this.state === "open"
        ? playPoint(this, pointer, this.cardCamera)
        : shifted(topShift(this.scale.gameSize), { x: pointer.x, y: pointer.y }, -1);
    return pressedArea(areas, point);
  }

  // A control acts when a press lands on it and lifts on it.
  private watchPresses(): void {
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.setPressed(this.controlAt(pointer));
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const control = this.pressed;
      this.setPressed(undefined);
      if (control !== undefined && control === this.controlAt(pointer)) {
        this.press(control);
      }
    });
  }

  private press(control: Control): void {
    const actions: Record<Control, () => void> = {
      close: () => this.close(),
      home: () => this.returnHome(),
      pauseButton: () => void this.open(),
      resume: () => this.close(),
      settings: () => this.openSettings(),
    };
    actions[control]();
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
      const action =
        this.state === "open" ? focusKeyAction(event.key, event.shiftKey, event.repeat) : undefined;
      if (action === "next" || action === "previous") {
        this.focus = stepFocus(FOCUS_ORDER, this.focus, action);
        this.drawFocus();
      } else if (action === "press") {
        if (this.focus !== undefined) {
          this.press(this.focus);
        }
      } else {
        this.act(cardKeyAction(this.state === "open", event.key, event.repeat));
      }
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
