import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { browserExitPage, exitApp } from "@andornaut/game-kit/pwa/exitApp";
import { snapshotRemapped } from "@andornaut/game-kit/view/phaser/snapshotRemap";
import { type GameObjects, type Input, Scene } from "phaser";

import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { type PressArea, pressedArea } from "../layout/hitAreas";
import { playView } from "../layout/playView";
import {
  type IconButtonLayout,
  type StartScreenLayout,
  startScreenLayout,
} from "../layout/startScreen";
import { startBackAction } from "../pause/cardInput";
import { focusKeyAction, stepFocus } from "../pause/focusInput";
import { exitShown, PHONE_EVENTS } from "../pwa";
import { savedProgress } from "../save";
import { setTouchControlsShown } from "../settings/touchControls";
import { dimColour } from "../view/dim";
import {
  addButtonLabel,
  addSlice,
  type ButtonLabel,
  captureTab,
  palette,
  paletteColour,
  placeButtonLabel,
  ringFocus,
} from "./cardParts";
import { fitPlayCamera, playPoint } from "./playCamera";
import { resumeProgress } from "./resume";
import type { SettingsData, SettingsOpener, SettingsScene } from "./SettingsScene";
import type { ZoneData } from "./ZoneScene";

const LOGO = "logo";
const SETTINGS = "settings";
const ZONE = "zone";
// Zone 1's street dimmed, read back once and kept for every later visit to the start screen.
const STREET_DIM = "start-street-dim";

type Control = "exit" | "settings" | "start";

interface IconButton {
  readonly face: GameObjects.Sprite;
  readonly icon: GameObjects.Image;
  readonly layout: IconButtonLayout;
}

// The screen the game opens on without saved progress, and that Return home goes to: the Start
// button, which goes to the map (Continue, which resumes the saved progress, once there is some),
// under a nav bar with Settings and Exit at its right end. Settings opens the settings card over this screen, which
// passes it the keys and back until it closes. Exit, and back with no card open, leave the game
// (the kit's exitApp). An installed app whose window the game cannot close shows no Exit
// (exitShown), and back there is the browser's own. A control acts when a press lands on it and
// lifts on it.
export class StartScene extends Scene implements SettingsOpener {
  // The nav's icon buttons: Settings and, where the game can exit, Exit.
  private buttons = new Map<"exit" | "settings", IconButton>();
  private layout!: StartScreenLayout;
  // The control a press landed on, which acts if the press lifts on it too.
  private pressed: Control | undefined;
  // The control the keyboard's focus is on, and art's ring round it.
  private focus: Control | undefined;
  private focusRing: GameObjects.NineSlice | undefined;
  private settingsOpen = false;
  private startButton!: GameObjects.Sprite;
  private startLabel!: ButtonLabel;
  private street!: GameObjects.Image;

  constructor() {
    super("start");
  }

  create(): void {
    fitPlayCamera(this);
    this.pressed = undefined;
    this.settingsOpen = false;
    this.focus = undefined;
    this.focusRing = undefined;
    this.layout = startScreenLayout(exitShown());
    this.draw();
    void this.showStreet();
    this.showPressed(undefined);
    this.watchPresses();
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.key(event));
    const onBack = () => {
      const action = startBackAction(this.settingsOpen, this.layout.exit !== undefined);
      if (action === "closeSettings") {
        this.settings().back();
      } else if (action === "exit") {
        this.act("exit");
      }
    };
    window.addEventListener(PHONE_EVENTS.backPressed, onBack);
    captureTab(this, true);
    this.events.once("shutdown", () => {
      window.removeEventListener(PHONE_EVENTS.backPressed, onBack);
      captureTab(this, false);
    });
  }

  // The start screen has no zone to show the setting in: saving it is enough.
  setTouchControls(shown: boolean): void {
    setTouchControlsShown(shown);
  }

  settingsClosed(): void {
    this.settingsOpen = false;
    this.drawFocus();
  }

  // Zone 1's street dimmed behind everything, over plain ink until it is read back.
  private draw(): void {
    const { exit, logo, nav, settings, start } = this.layout;
    this.cameras.main.setBackgroundColor(this.colour("ink"));
    this.street = this.add.image(0, 0, "__DEFAULT").setOrigin(0).setVisible(false);
    addSlice(this, "ui-nav-bar", nav);
    this.add.image(logo.x, logo.y, LOGO).setOrigin(0);
    this.buttons = new Map([
      ["settings", this.iconButton(settings, "icon-settings-nav")],
      ...(exit === undefined ? [] : [["exit", this.iconButton(exit, "ui-quit")] as const]),
    ]);
    this.startButton = this.add.sprite(start.button.x, start.button.y, "ui-start").setOrigin(0);
    this.startLabel = addButtonLabel(
      this,
      start.button,
      start.labelY,
      savedProgress().at === "beginning" ? TEXT.start.start : TEXT.start.continue,
      {
        colour: this.colour("ink"),
        marked: true,
      },
    );
  }

  // Shows the dimmed street, reading it back first if no visit has yet. Nothing of this scene is
  // drawn while the street is read back, and the canvas is hidden over the page's ink meanwhile,
  // so the undimmed street never shows. Where the renderer gives no image, the ink stays.
  private async showStreet(): Promise<void> {
    if (!this.textures.exists(STREET_DIM)) {
      const camera = this.cameras.main.setVisible(false);
      const canvas = this.game.canvas.style;
      canvas.visibility = "hidden";
      await this.dimStreet();
      canvas.visibility = "";
      if (!this.sys.isActive()) {
        return;
      }
      camera.setVisible(true);
    }
    if (this.textures.exists(STREET_DIM)) {
      this.street.setTexture(STREET_DIM).setVisible(true);
    }
  }

  // Draws zone 1's street as ZoneScene's still backdrop, reads the frame it first renders in back
  // two steps down each colour's ramp, as the pause card dims the zone, and stops the zone.
  private dimStreet(): Promise<boolean> {
    return new Promise((resolve) => {
      this.scene.get(ZONE).events.once("create", () => {
        void snapshotRemapped(
          dimColour(palette(this)),
          this,
          playView(this.scale.gameSize),
          STREET_DIM,
        ).then((dimmed) => {
          this.scene.stop(ZONE);
          resolve(dimmed);
        });
      });
      this.scene.launch(ZONE, { backdrop: true } satisfies ZoneData);
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
    const areas: PressArea<Control>[] = [
      ...(exit === undefined ? [] : [{ art: exit.art, hit: exit.hit, key: "exit" as const }]),
      { art: settings.art, hit: settings.hit, key: "settings" },
      { art: start.button, hit: start.hit, key: "start" },
    ];
    return pressedArea(areas, playPoint(this, pointer));
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

  // Tab and the arrows move the keyboard's focus through Start and the nav's buttons; Enter and
  // Space press the focused one, or Start with nothing focused.
  private key(event: KeyboardEvent): void {
    if (this.settingsOpen) {
      this.settings().key(event);
      return;
    }
    const action = focusKeyAction(event.key, event.shiftKey, event.repeat);
    if (action === "next" || action === "previous") {
      this.focus = stepFocus(this.targets(), this.focus, action);
      this.drawFocus();
    } else if (action === "press") {
      this.act(this.focus ?? "start");
    }
  }

  // The controls the keyboard's focus moves through, in order.
  private targets(): Control[] {
    return ["start", "settings", ...(this.layout.exit === undefined ? [] : ["exit" as const])];
  }

  // Art's focus ring round Start's face or a nav button's face.
  private drawFocus(): void {
    const faceOf = (control: Control): Rect | undefined => {
      if (control === "start") {
        return this.layout.start.button;
      }
      const button = this.buttons.get(control);
      return (
        button && { height: button.face.height, width: button.face.width, ...button.layout.at }
      );
    };
    const rect = this.focus === undefined || this.settingsOpen ? undefined : faceOf(this.focus);
    this.focusRing = ringFocus(this, this.focusRing, rect);
  }

  private act(control: Control): void {
    if (control === "start") {
      // Start plays from the beginning; Continue resumes the saved progress.
      resumeProgress(this, false, savedProgress());
    } else if (control === "settings") {
      this.settingsOpen = true;
      this.drawFocus();
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
