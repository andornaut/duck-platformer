import { animationKey, type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
import { type MenuInstallBrowser, offersInstall } from "@andornaut/game-kit/pwa/installState";
import { type BitmapFont, inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { bitmapMeasure, fittingText } from "@andornaut/game-kit/text/textFit";
import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { centredLabel } from "../layout/buttonLabel";
import { type PressArea, pressedArea } from "../layout/hitAreas";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import { focusRingAround, SETTINGS_CARD, STEPS_CARD } from "../layout/settingsCard";
import { focusKeyAction, stepFocus } from "../pause/focusInput";
import { installOffer } from "../pwa/installOffer";
import { TOUCH_SETTINGS, type TouchSetting, touchSettingShown } from "../settings/touchControls";
import { addCardText, addCardTitle, addSlice, BODY_FONT, BUTTON, paletteColour } from "./cardParts";
import { catchModalTaps } from "./modalTaps";
import { fitPlayCamera, playPoint } from "./playCamera";

// The scene that opens the settings card, the pause card's or the start screen's: it saves each
// touch setting and shows it as it changes, and shows again when the card closes. It passes the
// card its keys and back while the card shows.
export interface SettingsOpener {
  setTouchSetting(setting: TouchSetting, shown: boolean): void;
  settingsClosed(): void;
}

// What the opener launches the card with: its own scene key.
export interface SettingsData {
  readonly opener: string;
}

// The settings card's controls: the close X, the Install row and each touch setting's row.
type Target = "close" | "install" | TouchSetting;

// The icon on each touch setting's row.
const SETTING_ICONS: Readonly<Record<TouchSetting, string>> = {
  actionButtons: "icon-touch-controls",
  moveControls: "icon-move-controls",
};

// A touch setting's row as drawn: its label and its switch.
interface SettingRow {
  readonly label: GameObjects.BitmapText;
  readonly toggle: GameObjects.Sprite;
}

// The glyph of the button each browser's install steps start from.
const STEPS_GLYPHS: Readonly<Record<MenuInstallBrowser, string>> = {
  firefoxAndroid: "icon-browser-menu",
  ios: "icon-ios-share",
};

// The settings card, which the pause card opens in its place over the same dim, or the start
// screen over itself: the Move controls and Action buttons rows, the Install row while the game
// can be installed,
// and the build label. A row acts when a press lands on it and lifts on it; the close X, back,
// Escape and P close the card, back to the scene that opened it. Install shows the browser's
// install prompt or, for a browser that installs only from its own menu, the install steps card
// in the settings card's place, which the same controls close. Up and Down move the keyboard's
// focus through the controls; Enter and Space press the focused one. The opener passes this
// scene its keys and back.
export class SettingsScene extends Scene {
  private card!: GameObjects.Container;
  private closeX!: GameObjects.Sprite;
  private focus: Target | undefined;
  // Art's focus ring round the focused control, while the keyboard has moved the focus.
  private focusRing: GameObjects.NineSlice | undefined;
  // The Install button's face, normal and pressed.
  private installButton: Readonly<Record<"normal" | "pressed", GameObjects.NineSlice>> | undefined;
  private installButtonLabel: GameObjects.BitmapText | undefined;
  private installLabel: GameObjects.BitmapText | undefined;
  private opener = "";
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Target | undefined;
  private settingRows = new Map<TouchSetting, SettingRow>();
  // The install steps card while it shows.
  private steps: GameObjects.Container | undefined;

  constructor() {
    super("settings");
  }

  init(data: SettingsData): void {
    this.opener = data.opener;
  }

  create(): void {
    fitPlayCamera(this);
    this.focus = undefined;
    this.pressed = undefined;
    this.steps = undefined;
    this.card = this.drawCard(offersInstall(installOffer().state()));
    this.focusRing = undefined;
    this.render();
    this.watchPresses();
    catchModalTaps(this, this.cameras.main, {
      close: () => this.back(),
      covered: () => this.covered(),
    });
    // The Install row comes and goes as the game becomes installable or installed.
    const stopWatching = installOffer().onChange(() =>
      this.scene.restart({ opener: this.opener } satisfies SettingsData),
    );
    this.events.once("shutdown", stopWatching);
  }

  // A key the opener passes on while the card shows.
  key(event: KeyboardEvent): void {
    const action = focusKeyAction(event.key, event.shiftKey, event.repeat);
    if (action === "close") {
      this.back();
    } else if (action === "press") {
      if (this.steps !== undefined) {
        this.closeSteps();
      } else if (this.focus !== undefined) {
        this.act(this.focus);
      }
    } else if (action !== undefined) {
      this.focus = stepFocus(this.targets(), this.focus, action);
      this.render();
    }
  }

  // The card on top and its controls' press areas: the install steps card and its close X, or the
  // settings card, with or without its Install row, and each control it shows.
  private covered(): Rect[] {
    if (this.steps !== undefined) {
      return [STEPS_CARD.card, STEPS_CARD.close.hit];
    }
    const card =
      this.installButton === undefined ? SETTINGS_CARD.cardWithoutInstall : SETTINGS_CARD.card;
    const hits: Record<Target, Rect> = {
      actionButtons: SETTINGS_CARD.actionButtons.hit,
      close: SETTINGS_CARD.close.hit,
      install: SETTINGS_CARD.install.hit,
      moveControls: SETTINGS_CARD.moveControls.hit,
    };
    return [card, ...this.targets().map((target) => hits[target])];
  }

  // Back, Escape, P and a tap outside it close the install steps card while it shows, and the
  // settings card otherwise.
  back(): void {
    if (this.steps !== undefined) {
      this.closeSteps();
    } else {
      this.close();
    }
  }

  private close(): void {
    this.scene.stop();
    this.openerScene().settingsClosed();
  }

  private openerScene(): SettingsOpener {
    return this.scene.get(this.opener) as Scene & SettingsOpener;
  }

  // The controls the keyboard's focus moves through: the install steps card's close X alone while
  // it shows.
  private targets(): Target[] {
    if (this.steps !== undefined) {
      return ["close"];
    }
    return this.installButton === undefined
      ? [...TOUCH_SETTINGS, "close"]
      : [...TOUCH_SETTINGS, "install", "close"];
  }

  private act(target: Target): void {
    if (target === "close") {
      this.close();
    } else if (target === "install") {
      this.install();
    } else {
      this.openerScene().setTouchSetting(target, !touchSettingShown(target));
      this.render();
    }
  }

  // The browser's install prompt, or the install steps card where the browser installs only
  // from its own menu.
  private install(): void {
    const flow = installOffer();
    void flow.install().then((outcome) => {
      if (outcome === "menuSteps" && flow.menuBrowser !== undefined && this.scene.isActive()) {
        this.openSteps(flow.menuBrowser);
      }
    });
  }

  private openSteps(browser: MenuInstallBrowser): void {
    const words = TEXT.settings.installSteps;
    const { card, close, linePitch, lines, room, steps } = STEPS_CARD;
    const ink = this.colour("ink");
    const style = { lines, scale: CARD_TEXT_SCALE };
    const measure = bitmapMeasure(this.font());
    const texts = [words[browser].first, words[browser].second];
    const stepObjects = steps.flatMap(({ glyph, text: at }, index) => [
      this.add.image(glyph.x, glyph.y, index === 0 ? STEPS_GLYPHS[browser] : "icon-install"),
      ...fittingText(style, measure, room, texts[index] ?? "").lines.map((line, row) =>
        addCardText(this, BODY_FONT, { x: at.x, y: at.y + row * linePitch }, line, ink),
      ),
    ]);
    for (const image of stepObjects) {
      image.setOrigin(0);
    }
    this.steps = this.add.container(0, 0, [
      addSlice(this, "ui-settings-card", STEPS_CARD.card),
      addCardTitle(this, card, words.title),
      this.add.sprite(close.at.x, close.at.y, "ui-close").setOrigin(0),
      ...stepObjects,
    ]);
    this.card.setVisible(false);
    // A keyboard that pressed Install keeps its focus, on the steps card's close X.
    this.focus = this.focus === undefined ? undefined : "close";
    this.render();
  }

  private closeSteps(): void {
    this.steps?.destroy();
    this.steps = undefined;
    this.card.setVisible(true);
    this.focus = this.focus === undefined ? undefined : "install";
    this.render();
  }

  private drawCard(installRow: boolean): GameObjects.Container {
    const { buildLabel, card, cardWithoutInstall, close, install } = SETTINGS_CARD;
    const words = TEXT.settings;
    const ink = this.colour("ink");
    const frame = installRow ? card : cardWithoutInstall;
    const objects: GameObjects.GameObject[] = [
      addSlice(this, "ui-settings-card", frame),
      addCardTitle(this, frame, words.title),
    ];
    this.settingRows = new Map();
    for (const setting of TOUCH_SETTINGS) {
      const { icon, label, toggle } = SETTINGS_CARD[setting];
      const drawn: SettingRow = {
        label: addCardText(this, BODY_FONT, label, words[setting], ink),
        toggle: this.add.sprite(toggle.x, toggle.y, "ui-switch"),
      };
      this.settingRows.set(setting, drawn);
      objects.push(
        this.add.image(icon.x, icon.y, SETTING_ICONS[setting]),
        drawn.label,
        drawn.toggle,
      );
    }
    this.closeX = this.add.sprite(close.at.x, close.at.y, "ui-close");
    objects.push(this.closeX);
    this.installButton = undefined;
    this.installButtonLabel = undefined;
    this.installLabel = undefined;
    if (installRow) {
      this.installLabel = addCardText(this, BODY_FONT, install.label, words.install, ink);
      const frames = sheetTags(this.cache.json.get(BUTTON.art) as AsepriteSheet);
      const face = (tag: "normal" | "pressed") =>
        addSlice(this, BUTTON.art, install.button, frames.get(tag)?.[0]?.frame);
      this.installButton = { normal: face("normal"), pressed: face("pressed") };
      this.installButtonLabel = addCardText(
        this,
        BODY_FONT,
        { x: install.button.x, y: install.buttonLabel.y },
        words.installButton,
        this.colour(BUTTON.label),
      );
      this.installButtonLabel.setX(
        centredLabel(install.button, this.inkWidth(words.installButton)).labelX,
      );
      objects.push(
        this.add.image(install.icon.x, install.icon.y, "icon-install"),
        this.installLabel,
        this.installButton.normal,
        this.installButton.pressed,
        this.installButtonLabel,
      );
    }
    const labelY = installRow ? buildLabel.y : buildLabel.yWithoutInstall;
    const label = addCardText(
      this,
      BODY_FONT,
      { x: buildLabel.centreX - Math.floor(this.inkWidth(BUILD_LABEL) / 2), y: labelY },
      BUILD_LABEL,
      this.colour("dslate"),
    );
    objects.push(label);
    for (const object of objects) {
      (object as GameObjects.Image).setOrigin(0);
    }
    return this.add.container(0, 0, objects);
  }

  // Each control as the setting, the press and the focus leave it.
  private render(): void {
    const { install } = SETTINGS_CARD;
    const pressed = this.pressed;
    // A pressed row's label turns dslate, from ink.
    const label = (target: Target) => this.colour(pressed === target ? "dslate" : "ink");
    for (const [setting, row] of this.settingRows) {
      row.toggle.play(animationKey("ui-switch", touchSettingShown(setting) ? "on" : "off"));
      row.label.setTint(label(setting));
    }
    this.installLabel?.setTint(label("install"));
    this.closeX.play(animationKey("ui-close", pressed === "close" ? "pressed" : "normal"));
    this.installButton?.normal.setVisible(pressed !== "install");
    this.installButton?.pressed.setVisible(pressed === "install");
    this.installButtonLabel?.setY(
      pressed === "install" ? install.buttonLabel.pressedY : install.buttonLabel.y,
    );
    this.drawFocus();
  }

  private drawFocus(): void {
    this.focusRing?.destroy();
    this.focusRing =
      this.focus !== undefined
        ? addSlice(this, "ui-focus", focusRingAround(this.focusedRect(this.focus)))
        : undefined;
  }

  // What the focus ring surrounds: a row, or the close X itself.
  private focusedRect(target: Target): Rect {
    if (target === "close") {
      const { x, y } = SETTINGS_CARD.close.at;
      return { height: this.closeX.height, width: this.closeX.width, x, y };
    }
    return SETTINGS_CARD[target].row;
  }

  private targetAt(pointer: Input.Pointer): Target | undefined {
    const point = playPoint(this, pointer);
    if (this.steps !== undefined) {
      const { close } = STEPS_CARD;
      return pressedArea([{ art: close.art, hit: close.hit, key: "close" as const }], point);
    }
    const { actionButtons, close, install, moveControls } = SETTINGS_CARD;
    const areas: Record<Target, PressArea<Target>> = {
      actionButtons: { art: actionButtons.row, hit: actionButtons.hit, key: "actionButtons" },
      close: { art: close.art, hit: close.hit, key: "close" },
      install: { art: install.row, hit: install.hit, key: "install" },
      moveControls: { art: moveControls.row, hit: moveControls.hit, key: "moveControls" },
    };
    return pressedArea(
      this.targets().map((target) => areas[target]),
      point,
    );
  }

  // A control acts when a press lands on it and lifts on it; on the install steps card the
  // close X closes it.
  private watchPresses(): void {
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.pressed = this.targetAt(pointer);
      this.render();
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const target = this.pressed;
      this.pressed = undefined;
      this.render();
      if (target === undefined || target !== this.targetAt(pointer)) {
        return;
      }
      if (this.steps !== undefined) {
        this.closeSteps();
      } else {
        this.act(target);
      }
    });
  }

  private font(): BitmapFont {
    return phaserBitmapFont(this.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
  }

  private inkWidth(text: string): number {
    return inkWidth(this.font(), CARD_TEXT_SCALE, text);
  }

  private colour(name: string): number {
    return paletteColour(this, name);
  }
}
