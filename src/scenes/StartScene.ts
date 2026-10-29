import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { isFirefoxAndroidApp } from "@andornaut/game-kit/pwa/backNavigation";
import { browserExitPage, exitApp } from "@andornaut/game-kit/pwa/exitApp";
import { containsPoint } from "@andornaut/game-kit/rect";
import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import {
  type IconButtonLayout,
  type StartScreenLayout,
  startScreenLayout,
} from "../layout/startScreen";
import { PHONE_EVENTS } from "../pwa";
import { setTouchControlsShown } from "../settings/touchControls";
import {
  addButtonLabel,
  addSlice,
  type ButtonLabel,
  paletteColour,
  placeButtonLabel,
} from "./cardParts";
import type { SettingsData, SettingsOpener, SettingsScene } from "./SettingsScene";

const LOGO = "logo";
const MAP = "map";
const SETTINGS = "settings";

type Control = "exit" | "settings" | "start";

interface IconButton {
  readonly face: GameObjects.Sprite;
  readonly icon: GameObjects.Image;
  readonly layout: IconButtonLayout;
}

// The keys that press Start while the settings card is closed.
const START_KEYS = new Set(["Enter", " "]);

// The screen the game opens on: the Start button, which goes to the map, under a nav bar with
// Settings and Exit at its right end. Settings opens the settings card over this screen, which
// passes it the keys and back until it closes. Exit leaves the game (the kit's exitApp); Firefox
// for Android's installed app ignores window.close(), so it shows no Exit there. A control acts
// when a press lands on it and lifts on it.
export class StartScene extends Scene implements SettingsOpener {
  // The nav's icon buttons: Settings and, where the game can exit, Exit.
  private buttons = new Map<"exit" | "settings", IconButton>();
  private layout!: StartScreenLayout;
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Control | undefined;
  private settingsOpen = false;
  private startButton!: GameObjects.Sprite;
  private startLabel!: ButtonLabel;

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

  // PLACEHOLDER: a plain ink background until art's background for the start screen is
  // decided.
  private draw(): void {
    const { exit, logo, nav, settings, start } = this.layout;
    this.cameras.main.setBackgroundColor(this.colour("ink"));
    addSlice(this, "ui-nav-bar", nav);
    this.add.image(logo.x, logo.y, LOGO).setOrigin(0);
    this.buttons = new Map([
      ["settings", this.iconButton(settings, "icon-settings-nav")],
      ...(exit === undefined ? [] : [["exit", this.iconButton(exit, "ui-quit")] as const]),
    ]);
    this.startButton = this.add.sprite(start.button.x, start.button.y, "ui-start").setOrigin(0);
    this.startLabel = addButtonLabel(this, start.button, start.labelY, TEXT.start.start, {
      colour: this.colour("ink"),
      marked: true,
    });
  }

  // A nav icon button: its face, and its icon (the icon's first frame) over it.
  private iconButton(layout: IconButtonLayout, icon: string): IconButton {
    return {
      face: this.add.sprite(layout.at.x, layout.at.y, "ui-icon-button").setOrigin(0),
      icon: this.add.image(layout.icon.x, layout.icon.y, icon).setOrigin(0),
      layout,
    };
  }

  // A pressed control shows its pressed look until the press lifts: Start's face and label sink,
  // and a nav button's face sinks with its icon.
  private showPressed(control: Control | undefined): void {
    this.pressed = control;
    const { start } = this.layout;
    this.startButton.play(animationKey("ui-start", control === "start" ? "pressed" : "normal"));
    placeButtonLabel(this.startLabel, control === "start" ? start.pressedLabelY : start.labelY);
    for (const [name, { face, icon, layout }] of this.buttons) {
      const pressed = control === name;
      face.play(animationKey("ui-icon-button", pressed ? "pressed" : "normal"));
      icon.setY(pressed ? layout.pressedIcon.y : layout.icon.y);
    }
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    const { exit, settings, start } = this.layout;
    const hits: [Control, Rect | undefined][] = [
      ["exit", exit?.hit],
      ["settings", settings.hit],
      ["start", start.button],
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
