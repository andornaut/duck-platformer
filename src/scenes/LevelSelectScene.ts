import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { ZONE_MAP } from "../data/map";
import { TEXT } from "../data/text";
import { RECIPES, ZONES } from "../data/zones";
import { levelSelectKey } from "../input/levelSelectInput";
import { TEXT_BUTTON } from "../layout/buttonLabel";
import { type PressArea, pressedArea } from "../layout/hitAreas";
import { LEVEL_SELECT_CARD } from "../layout/levelSelectCard";
import { CARD_TEXT_SCALE } from "../layout/pauseCard";
import { openMap } from "../rules/map";
import { destinationOf, destinationSelection } from "../rules/mapDestinations";
import { savedMap } from "../save";
import {
  addCardTitle,
  addSlice,
  addTextButton,
  BODY_FONT,
  captureTab,
  pressTextButton,
  PRIMARY_BUTTON,
  ringFocus,
  type TextButton,
} from "./cardParts";
import { catchModalTaps } from "./modalTaps";
import { fitPlayCamera, playPoint } from "./playCamera";

export interface LevelSelectData {
  readonly destination: string;
}
export interface LevelSelectOpener {
  levelSelected(level: string): void;
  levelSelectionClosed(): void;
}

type Target = { readonly kind: "level"; readonly id: string } | { readonly kind: "close" };
const PLANS = new Set([...Object.keys(ZONES), ...Object.keys(RECIPES)]);

// Only reached levels appear here. The latest reached level is primary; selecting or cancelling
// never changes completed levels. Outside taps, back and Escape return to the map.
export class LevelSelectScene extends Scene {
  private levels: readonly string[] = [];
  private latest = "";
  private destination = "";
  private focus: string | undefined;
  private ring: GameObjects.NineSlice | undefined;
  private pressed: Target | undefined;
  private closeX!: GameObjects.Sprite;
  private buttons = new Map<string, TextButton>();
  private finished = false;
  constructor() {
    super("levelSelect");
  }
  init({ destination }: LevelSelectData): void {
    const progress = savedMap();
    const selection = destinationSelection(
      PLANS,
      ZONE_MAP,
      openMap(ZONE_MAP, new Set(progress.completed)),
      destinationOf(ZONE_MAP, destination),
    );
    if (selection.kind !== "choose") {
      throw new Error(`Level picker requires multiple unlocked levels: ${destination}`);
    }
    this.levels = selection.levels;
    this.latest = selection.latest;
    this.destination = destination;
    this.focus = undefined;
    this.ring = undefined;
    this.pressed = undefined;
    this.buttons = new Map();
    this.finished = false;
  }
  create(): void {
    fitPlayCamera(this);
    addSlice(this, "ui-settings-card", LEVEL_SELECT_CARD.card);
    const title = TEXT.map.zones[this.destination];
    if (title === undefined) {
      throw new Error(`No destination label ${this.destination}`);
    }
    addCardTitle(this, LEVEL_SELECT_CARD.card, title);
    const font = phaserBitmapFont(this.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
    this.levels.forEach((id, index) => {
      const layout = LEVEL_SELECT_CARD.buttons[index];
      const label = TEXT.map.levels[id];
      if (
        !layout ||
        label === undefined ||
        inkWidth(font, CARD_TEXT_SCALE, label) > layout.button.width - 2 * TEXT_BUTTON.inset
      ) {
        throw new Error(`Level label does not fit: ${id}`);
      }
      this.buttons.set(
        id,
        addTextButton(this, layout, label, id === this.latest ? { style: PRIMARY_BUTTON } : {}),
      );
    });
    this.closeX = this.add
      .sprite(LEVEL_SELECT_CARD.close.at.x, LEVEL_SELECT_CARD.close.at.y, "ui-close")
      .setOrigin(0);
    this.render();
    catchModalTaps(this, this.cameras.main, {
      close: () => this.back(),
      covered: () => [
        LEVEL_SELECT_CARD.card,
        LEVEL_SELECT_CARD.close.hit,
        ...this.levels.map((_, index) => LEVEL_SELECT_CARD.buttons[index]!.hit),
      ],
    });
    this.watchInput();
    captureTab(this, true);
    this.events.once("shutdown", () => captureTab(this, false));
  }
  back(): void {
    if (this.finished) {
      return;
    }
    this.finished = true;
    this.scene.stop();
    (this.scene.get("map") as unknown as LevelSelectOpener).levelSelectionClosed();
  }
  private render(): void {
    for (const [id, button] of this.buttons) {
      pressTextButton(button, this.pressed?.kind === "level" && this.pressed.id === id);
    }
    this.closeX.play(
      animationKey("ui-close", this.pressed?.kind === "close" ? "pressed" : "normal"),
    );
    const at =
      this.focus === "close"
        ? LEVEL_SELECT_CARD.close.art
        : this.focus === undefined
          ? undefined
          : this.buttons.get(this.focus)?.layout.button;
    this.ring = ringFocus(this, this.ring, at);
  }
  private targetAt(pointer: Input.Pointer): Target | undefined {
    const areas: PressArea<string>[] = [
      ...this.levels.map((key, index) => ({
        art: LEVEL_SELECT_CARD.buttons[index]!.button,
        hit: LEVEL_SELECT_CARD.buttons[index]!.hit,
        key,
      })),
      { art: LEVEL_SELECT_CARD.close.art, hit: LEVEL_SELECT_CARD.close.hit, key: "close" },
    ];
    const key = pressedArea(areas, playPoint(this, pointer));
    return key === undefined
      ? undefined
      : key === "close"
        ? { kind: "close" }
        : { id: key, kind: "level" };
  }
  private activate(target: Target): void {
    if (target.kind === "close") {
      this.back();
      return;
    }
    if (this.finished || !this.levels.includes(target.id)) {
      return;
    }
    this.finished = true;
    this.scene.stop();
    (this.scene.get("map") as unknown as LevelSelectOpener).levelSelected(target.id);
  }
  private watchInput(): void {
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => {
      event.stopPropagation();
      const next = levelSelectKey(this.latest, this.levels, this.focus, event);
      this.focus = next.focus;
      this.render();
      if (next.close) {
        this.back();
      } else if (next.level !== undefined) {
        this.activate({ id: next.level, kind: "level" });
      }
    });
    this.input.keyboard?.on("keyup", (event: KeyboardEvent) => event.stopPropagation());
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      this.pressed = this.targetAt(pointer);
      this.render();
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      this.input.stopPropagation();
      const down = this.pressed;
      this.pressed = undefined;
      this.render();
      const up = this.targetAt(pointer);
      if (
        !pointer.wasCanceled &&
        down &&
        up &&
        down.kind === up.kind &&
        (down.kind === "close" || (up.kind === "level" && down.id === up.id))
      ) {
        this.activate(down);
      }
    });
  }
}
