import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { isFirefoxAndroidApp } from "@andornaut/game-kit/pwa/backNavigation";
import { browserExitPage, exitApp } from "@andornaut/game-kit/pwa/exitApp";
import { containsPoint } from "@andornaut/game-kit/rect";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import { type StartScreenLayout, startScreenLayout } from "../layout/startScreen";
import { PHONE_EVENTS } from "../pwa";
import { setTouchControlsShown } from "../settings/touchControls";
import { addCardText, paletteColour, TITLE_FONT } from "./cardParts";
import type { SettingsData, SettingsOpener, SettingsScene } from "./SettingsScene";

const MAP = "map";
const SETTINGS = "settings";

type Control = "exit" | "settings" | "start";

// The keys that press Start while the settings card is closed.
const START_KEYS = new Set(["Enter", " "]);

// The screen the game opens on: the Start button, which goes to the map, under a nav bar with
// Settings and Exit at its right end. Settings opens the settings card over this screen, which
// passes it the keys and back until it closes. Exit leaves the game (the kit's exitApp); Firefox
// for Android's installed app ignores window.close(), so it shows no Exit there. A control acts
// when a press lands on it and lifts on it.
export class StartScene extends Scene implements SettingsOpener {
  private exitIcon: GameObjects.Sprite | undefined;
  private layout!: StartScreenLayout;
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Control | undefined;
  private settingsOpen = false;
  private startButton!: GameObjects.Sprite;
  private startLabel!: GameObjects.BitmapText;

  constructor() {
    super("start");
  }

  create(): void {
    this.pressed = undefined;
    this.settingsOpen = false;
    // WORKAROUND: https://bugzilla.mozilla.org/show_bug.cgi?id=2079243 (see isFirefoxAndroidApp).
    const canExit = !isFirefoxAndroidApp(
      navigator.userAgent,
      (query) => window.matchMedia(query).matches,
    );
    this.layout = startScreenLayout(canExit);
    this.draw();
    this.showPressed(undefined);
    this.watchPresses();
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.key(event));
    const onBack = () => {
      if (this.settingsOpen) {
        this.settings().back();
      }
    };
    window.addEventListener(PHONE_EVENTS.backPressed, onBack);
    this.events.once("shutdown", () => {
      window.removeEventListener(PHONE_EVENTS.backPressed, onBack);
    });
  }

  // The start screen has no zone to show the setting in: saving it is enough.
  setTouchControls(shown: boolean): void {
    setTouchControlsShown(shown);
  }

  settingsClosed(): void {
    this.settingsOpen = false;
  }

  // PLACEHOLDER: flat shapes and the pause card's art until art draws the start screen.
  private draw(): void {
    const { exit, nav, settings, start } = this.layout;
    this.cameras.main.setBackgroundColor(this.colour("ink"));
    this.add.rectangle(nav.x, nav.y, nav.width, nav.height, this.colour("navy")).setOrigin(0);
    this.add.image(settings.icon.x, settings.icon.y, "icon-settings").setOrigin(0);
    this.exitIcon =
      exit === undefined
        ? undefined
        : this.add.sprite(exit.icon.x, exit.icon.y, "ui-quit").setOrigin(0);
    this.startButton = this.add.sprite(start.hit.x, start.hit.y, "ui-resume").setOrigin(0);
    const label = TEXT.start.start;
    const font = phaserBitmapFont(this.cache.bitmapFont.get(TITLE_FONT).data as PhaserFontData);
    const width = inkWidth(font, CARD_TEXT_SCALE, label);
    this.startLabel = addCardText(
      this,
      TITLE_FONT,
      { x: start.hit.x + Math.floor((start.hit.width - width) / 2), y: start.labelY },
      label,
      this.colour("ink"),
    );
  }

  // A pressed control shows its pressed look until the press lifts: Start's face and label sink,
  // and Exit's arrow steps out.
  private showPressed(control: Control | undefined): void {
    this.pressed = control;
    const { start } = this.layout;
    this.startButton.play(animationKey("ui-resume", control === "start" ? "pressed" : "normal"));
    this.startLabel.setY(control === "start" ? start.pressedLabelY : start.labelY);
    this.exitIcon?.play(animationKey("ui-quit", control === "exit" ? "pressed" : "normal"));
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    const { exit, settings, start } = this.layout;
    const hits: [Control, Rect | undefined][] = [
      ["exit", exit?.hit],
      ["settings", settings.hit],
      ["start", start.hit],
    ];
    return hits.find(
      ([, hit]) => hit !== undefined && containsPoint(hit, pointer.x, pointer.y),
    )?.[0];
  }

  private watchPresses(): void {
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.showPressed(this.settingsOpen ? undefined : this.controlAt(pointer));
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const control = this.pressed;
      this.showPressed(undefined);
      if (control !== undefined && control === this.controlAt(pointer)) {
        this.act(control);
      }
    });
  }

  private key(event: KeyboardEvent): void {
    if (this.settingsOpen) {
      this.settings().key(event);
    } else if (START_KEYS.has(event.key) && !event.repeat) {
      this.act("start");
    }
  }

  private act(control: Control): void {
    if (control === "start") {
      this.scene.start(MAP);
    } else if (control === "settings") {
      this.settingsOpen = true;
      this.scene.launch(SETTINGS, { opener: this.scene.key } satisfies SettingsData);
    } else {
      exitApp(browserExitPage());
    }
  }

  private settings(): SettingsScene {
    return this.scene.get(SETTINGS) as SettingsScene;
  }

  private colour(name: string): number {
    return paletteColour(this, name);
  }
}
