import { animationKey, type AsepriteSheet, sheetTags } from "@andornaut/game-kit/art/aseprite";
import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
import { type MenuInstallBrowser, offersInstall } from "@andornaut/game-kit/pwa/installState";
import { containsPoint } from "@andornaut/game-kit/rect";
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
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import { focusRingAround, SETTINGS_CARD, STEPS_CARD } from "../layout/settingsCard";
import { settingsKeyAction, stepFocus } from "../pause/settingsInput";
import { installOffer } from "../pwa/installOffer";
import { touchControlsShown } from "../settings/touchControls";
import { addCardText, addSlice, BODY_FONT, paletteColour, TITLE_FONT } from "./cardParts";

// The scene that opens the settings card, the pause card's or the start screen's: it shows the
// Touch controls setting as it changes, and shows again when the card closes. It passes the card
// its keys and back while the card shows.
export interface SettingsOpener {
  setTouchControls(shown: boolean): void;
  settingsClosed(): void;
}

// What the opener launches the card with: its own scene key.
export interface SettingsData {
  readonly opener: string;
}

// The settings card's controls, in the order the keyboard's focus moves through them.
type Target = "close" | "install" | "touchControls";

// The glyph of the button each browser's install steps start from.
const STEPS_GLYPHS: Readonly<Record<MenuInstallBrowser, string>> = {
  firefoxAndroid: "icon-browser-menu",
  ios: "icon-ios-share",
};

// The settings card, which the pause card opens in its place over the same dim, or the start
// screen over itself: the Touch controls row, the Install row while the game can be installed,
// and the build label. A row acts when a press lands on it and lifts on it; the close X, back,
// Escape and P close the card, back to the scene that opened it. Install shows the browser's
// install prompt or, for a browser that installs only from its own menu, the install steps card
// in the settings card's place, which the same controls close. Up and Down move the keyboard's
// focus through the controls; Enter and Space press the focused one. The opener passes this
// scene its keys and back.
export class SettingsScene extends Scene {
  private card!: GameObjects.Container;
  private checkbox!: GameObjects.Sprite;
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
  private stateText!: GameObjects.BitmapText;
  // The install steps card while it shows.
  private steps: GameObjects.Container | undefined;
  private touchLabel!: GameObjects.BitmapText;

  constructor() {
    super("settings");
  }

  init(data: SettingsData): void {
    this.opener = data.opener;
  }

  create(): void {
    this.focus = undefined;
    this.pressed = undefined;
    this.steps = undefined;
    this.card = this.drawCard(offersInstall(installOffer().state()));
    this.focusRing = undefined;
    this.render();
    this.watchPresses();
    // The Install row comes and goes as the game becomes installable or installed.
    const stopWatching = installOffer().onChange(() =>
      this.scene.restart({ opener: this.opener } satisfies SettingsData),
    );
    this.events.once("shutdown", stopWatching);
  }

  // A key the opener passes on while the card shows.
  key(event: KeyboardEvent): void {
    const action = settingsKeyAction(event.key, event.repeat);
    if (action === "close") {
      this.back();
    } else if (action === "press") {
      if (this.steps !== undefined) {
        this.closeSteps();
      } else if (this.focus !== undefined) {
        this.act(this.focus);
      }
    } else if (action !== undefined && this.steps === undefined) {
      this.focus = stepFocus(this.targets(), this.focus, action);
      this.render();
    }
  }

  // Back, Escape and P close the install steps card while it shows, and the settings card
  // otherwise.
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

  private targets(): Target[] {
    return this.installButton === undefined
      ? ["touchControls", "close"]
      : ["touchControls", "install", "close"];
  }

  private act(target: Target): void {
    if (target === "close") {
      this.close();
    } else if (target === "touchControls") {
      this.openerScene().setTouchControls(!touchControlsShown());
      this.render();
    } else {
      this.install();
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
    const { close, linePitch, lines, room, steps, title } = STEPS_CARD;
    const cream = this.colour("cream");
    const style = { lines, scale: CARD_TEXT_SCALE };
    const measure = bitmapMeasure(this.font());
    const texts = [words[browser].first, words[browser].second];
    const stepObjects = steps.flatMap(({ glyph, text: at }, index) => [
      this.add.image(glyph.x, glyph.y, index === 0 ? STEPS_GLYPHS[browser] : "icon-install"),
      ...fittingText(style, measure, room, texts[index] ?? "").lines.map((line, row) =>
        addCardText(this, BODY_FONT, { x: at.x, y: at.y + row * linePitch }, line, cream),
      ),
    ]);
    for (const image of stepObjects) {
      image.setOrigin(0);
    }
    this.steps = this.add.container(0, 0, [
      addSlice(this, "ui-settings-card", STEPS_CARD.card),
      addCardText(this, TITLE_FONT, title, words.title, cream),
      this.add.sprite(close.at.x, close.at.y, "ui-close").setOrigin(0),
      ...stepObjects,
    ]);
    this.card.setVisible(false);
    this.render();
  }

  private closeSteps(): void {
    this.steps?.destroy();
    this.steps = undefined;
    this.card.setVisible(true);
    this.render();
  }

  private drawCard(installRow: boolean): GameObjects.Container {
    const { buildLabel, card, cardWithoutInstall, close, install, title, touchControls } =
      SETTINGS_CARD;
    const words = TEXT.settings;
    const cream = this.colour("cream");
    const objects: GameObjects.GameObject[] = [
      addSlice(this, "ui-settings-card", installRow ? card : cardWithoutInstall),
      addCardText(this, TITLE_FONT, title, words.title, cream),
      addSlice(this, "ui-settings-row", touchControls.row),
      this.add.image(touchControls.icon.x, touchControls.icon.y, "icon-touch-controls"),
    ];
    this.touchLabel = addCardText(this, BODY_FONT, touchControls.label, words.touchControls, cream);
    this.stateText = addCardText(this, BODY_FONT, touchControls.label, "", cream);
    this.checkbox = this.add.sprite(
      touchControls.checkbox.x,
      touchControls.checkbox.y,
      "ui-checkbox",
    );
    this.closeX = this.add.sprite(close.at.x, close.at.y, "ui-close");
    objects.push(this.touchLabel, this.stateText, this.checkbox, this.closeX);
    this.installButton = undefined;
    this.installButtonLabel = undefined;
    this.installLabel = undefined;
    if (installRow) {
      this.installLabel = addCardText(this, BODY_FONT, install.label, words.install, cream);
      const frames = sheetTags(this.cache.json.get("ui-button") as AsepriteSheet);
      const face = (tag: "normal" | "pressed") =>
        addSlice(this, "ui-button", install.button, frames.get(tag)?.[0]?.frame);
      this.installButton = { normal: face("normal"), pressed: face("pressed") };
      this.installButtonLabel = addCardText(
        this,
        BODY_FONT,
        { x: install.button.x, y: install.buttonLabel.y },
        words.installButton,
        this.colour("ink"),
      );
      this.installButtonLabel.setX(
        centredLabel(install.button, this.inkWidth(words.installButton)).labelX,
      );
      objects.push(
        addSlice(this, "ui-settings-row", install.row),
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
      this.colour("tan"),
    );
    objects.push(label);
    for (const object of objects) {
      (object as GameObjects.Image).setOrigin(0);
    }
    return this.add.container(0, 0, objects);
  }

  // Each control as the setting, the press and the focus leave it.
  private render(): void {
    const shown = touchControlsShown();
    const words = TEXT.settings;
    const { install, touchControls } = SETTINGS_CARD;
    const pressed = this.pressed;
    this.checkbox.play(animationKey("ui-checkbox", shown ? "on" : "off"));
    const state = shown ? words.shown : words.hidden;
    this.stateText.setText(state).setX(touchControls.stateRight - this.inkWidth(state));
    const label = (target: Target) => this.colour(pressed === target ? "white" : "cream");
    this.touchLabel.setTint(label("touchControls"));
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
      this.steps === undefined && this.focus !== undefined
        ? addSlice(this, "ui-focus", focusRingAround(this.focusedRect(this.focus)))
        : undefined;
  }

  // What the focus ring surrounds: a row, or the close X itself.
  private focusedRect(target: Target): Rect {
    if (target === "close") {
      const { x, y } = SETTINGS_CARD.close.at;
      return { height: this.closeX.height, width: this.closeX.width, x, y };
    }
    return this.hitOf(target);
  }

  private hitOf(target: Target): Rect {
    const { close, install, touchControls } = SETTINGS_CARD;
    return { close: close.hit, install: install.row, touchControls: touchControls.row }[target];
  }

  private targetAt(pointer: Input.Pointer): Target | undefined {
    if (this.steps !== undefined) {
      return containsPoint(STEPS_CARD.close.hit, pointer.x, pointer.y) ? "close" : undefined;
    }
    return this.targets().find((target) => containsPoint(this.hitOf(target), pointer.x, pointer.y));
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
