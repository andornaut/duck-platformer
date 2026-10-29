import { frameSteps, startStepClock, type StepClock } from "@andornaut/game-kit/clock/fixedStep";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, Input, Scene } from "phaser";

import { DUCK } from "../data/duck";
import { TEST_LEVELS } from "../data/levels";
import { SCREEN, TILE } from "../data/screen";
import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import type { LevelLayout, MoverLayout, Rect } from "../data/types";
import {
  combineIntents,
  type HeldTouch,
  keyIntent,
  touchIntent,
  touchRoleAt,
} from "../input/intent";
import { gamePoint } from "../input/screenPoint";
import { LABEL_SCALE, TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { type LevelState, startLevel, stepLevel } from "../rules/level";
import { nextLevelIndex, startLevelIndex } from "../rules/levelChain";
import { moverAt } from "../rules/movers";
import { levelLayout } from "../rules/tiles";
import { animKey, type AsepriteSheet, sheetTags, type TagFrame, tagMs } from "../view/aseprite";
import { duckFrameAt, type DuckPose, startPose, stepPose } from "../view/duck";
import {
  buttonHeld,
  centredAt,
  controlTag,
  labelAt,
  labelColour,
  trackPress,
} from "../view/touchControls";

const STEP_MS = 1000 / 60;
// After a stall, run at most this much time at once rather than lurching ahead.
const MAX_FRAME_MS = 250;

// PLACEHOLDER: flat colours until art's tiles land.
const COLOURS = {
  background: 0x262b44,
  exit: 0x63c74d,
  hazard: 0xe43b44,
  ledge: 0xc0cbdc,
  mover: 0xe4a672,
  solid: 0x8b9bb4,
};

const DUCK_SPRITE = "duck";
const CONTROL_SPRITES: Readonly<Record<TouchControl, string>> = {
  jump: "ui-touch-jump",
  use: "ui-touch-use",
};
const LABEL_FONT = "font-body";
// Drawn above the level and its moving platforms, which the level adds whenever it loads.
const DUCK_DEPTH = 1;
const OVERLAY_DEPTH = 2;
const PALETTE = "palette";

// Starts a sprite's tag, unless it already shows it, playing or finished on its last frame.
function show(sprite: GameObjects.Sprite, tag: string): void {
  const key = animKey(sprite.texture.key, tag);
  if (sprite.anims.currentAnim?.key !== key) {
    sprite.play(key);
  }
}

// One level, played with the keyboard or the touch controls.
export class LevelScene extends Scene {
  private clock: StepClock = startStepClock;
  private readonly controls = new Map<TouchControl, GameObjects.Sprite>();
  private readonly labels = new Map<TouchControl, GameObjects.BitmapText>();
  private colours: Readonly<Record<string, string>> = {};
  private duck!: GameObjects.Sprite;
  private duckPose: DuckPose = startPose;
  private level!: LevelState;
  // The camera follows her collision box's centre.
  private readonly focus = { x: 0, y: 0 };
  private readonly heldKeys = new Set<string>();
  private readonly heldTouches = new Map<number, HeldTouch>();
  private landMs = 0;
  private layout!: LevelLayout;
  private levelIndex = startLevelIndex(window.location.search, TEST_LEVELS.length);
  private levelArt!: GameObjects.Graphics;
  private moverArt: { mover: MoverLayout; rectangle: GameObjects.Rectangle }[] = [];
  // When each held button's press began.
  private readonly presses = new Map<TouchControl, number>();
  private readonly tags = new Map<string, ReadonlyMap<string, readonly TagFrame[]>>();

  constructor() {
    super("level");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLOURS.background);
    this.cameras.main.setRoundPixels(true);
    this.levelArt = this.add.graphics();

    for (const key of [DUCK_SPRITE, ...Object.values(CONTROL_SPRITES)]) {
      this.tags.set(key, sheetTags(this.cache.json.get(key) as AsepriteSheet));
    }
    this.landMs = tagMs(this.sheet(DUCK_SPRITE), "land");

    this.duck = this.add.sprite(0, 0, DUCK_SPRITE).setOrigin(0).setDepth(DUCK_DEPTH);
    this.cameras.main.startFollow(this.focus, true);
    this.loadLevel(this.levelIndex);

    const font = phaserBitmapFont(this.cache.bitmapFont.get(LABEL_FONT).data as PhaserFontData);
    this.colours = (this.cache.json.get(PALETTE) as { colours: Record<string, string> }).colours;
    for (const control of Object.keys(CONTROL_SPRITES) as TouchControl[]) {
      const sprite = this.add
        .sprite(0, 0, CONTROL_SPRITES[control])
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(OVERLAY_DEPTH);
      const { centre } = TOUCH_CONTROLS[control];
      const at = centredAt(centre, sprite.frame);
      this.controls.set(control, sprite.setPosition(at.x, at.y));
      const text = TEXT.buttons[control];
      const origin = labelAt(font, centre, text);
      const label = this.add
        .bitmapText(origin.x, origin.y, LABEL_FONT, text)
        .setScale(LABEL_SCALE)
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(OVERLAY_DEPTH);
      this.labels.set(control, label);
    }
    this.watchKeys();
    this.watchTouches();
  }

  override update(time: number): void {
    const frame = frameSteps({ maxFrameMs: MAX_FRAME_MS, stepMs: STEP_MS }, time, this.clock);
    this.clock = frame.clock;
    const touches = [...this.heldTouches.values()];
    const intent = combineIntents(keyIntent(this.heldKeys), touchIntent(TOUCH, touches));
    for (let step = 0; step < frame.steps; step++) {
      const before = this.level.duck;
      this.level = stepLevel(
        DUCK,
        this.layout,
        STEP_MS / 1000,
        { jumpHeld: intent.jump, move: intent.move },
        this.level,
      );
      // PLACEHOLDER: what clearing a level leads to. For now the next test level starts.
      if (this.level.cleared) {
        this.loadLevel(nextLevelIndex(this.levelIndex, TEST_LEVELS.length));
      }
      this.duckPose = stepPose(this.landMs, STEP_MS, before, this.level.duck, this.duckPose);
    }
    this.drawMovers();
    this.drawDuck();
    this.drawControls(time, touches);
  }

  // Starts the test level at index from its start, drawn in flat colours, with the camera kept
  // inside it.
  private loadLevel(index: number): void {
    const plan = TEST_LEVELS[index];
    if (!plan) {
      throw new Error(`No level ${index + 1}`);
    }
    this.levelIndex = index;
    this.layout = levelLayout(TILE, plan);
    this.level = startLevel(DUCK, this.layout);
    this.cameras.main.setBounds(0, 0, this.layout.width, this.layout.height);
    const art = this.levelArt.clear();
    const fill = (rects: readonly Rect[], colour: number) => {
      art.fillStyle(colour);
      for (const rect of rects) {
        art.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    };
    fill(this.layout.solids, COLOURS.solid);
    fill(this.layout.ledges, COLOURS.ledge);
    fill(this.layout.hazards, COLOURS.hazard);
    fill([this.layout.exit], COLOURS.exit);
    for (const { rectangle } of this.moverArt) {
      rectangle.destroy();
    }
    this.moverArt = [
      ...this.layout.movers.map((mover) => [mover, COLOURS.mover] as const),
      ...this.layout.movingHazards.map((hazard) => [hazard, COLOURS.hazard] as const),
    ].map(([mover, colour]) => ({
      mover,
      rectangle: this.add.rectangle(0, 0, mover.width, mover.height, colour).setOrigin(0),
    }));
  }

  // Each moving platform and hazard where the rules put it, in whole pixels.
  private drawMovers(): void {
    for (const { mover, rectangle } of this.moverArt) {
      const at = moverAt(mover, this.level.seconds);
      rectangle.setPosition(Math.round(at.x), Math.round(at.y));
    }
  }

  private sheet(key: string): ReadonlyMap<string, readonly TagFrame[]> {
    const tags = this.tags.get(key);
    if (!tags) {
      throw new Error(`No sprite ${key}`);
    }
    return tags;
  }

  private drawDuck(): void {
    const { duck } = this.level;
    const { tag } = this.duckPose;
    show(this.duck, tag);
    const at = duckFrameAt(DUCK, this.duck.frame, duck);
    this.duck.setPosition(at.x, at.y).setFlipX(duck.facing < 0);
    this.focus.x = Math.round(duck.x + DUCK.width / 2);
    this.focus.y = Math.round(duck.y + DUCK.height / 2);
  }

  private watchKeys(): void {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      return;
    }
    // Arrow keys and Space would otherwise scroll the page.
    keyboard.addCapture([
      Input.Keyboard.KeyCodes.LEFT,
      Input.Keyboard.KeyCodes.RIGHT,
      Input.Keyboard.KeyCodes.UP,
      Input.Keyboard.KeyCodes.SPACE,
    ]);
    keyboard.on("keydown", (event: KeyboardEvent) => this.heldKeys.add(event.code));
    keyboard.on("keyup", (event: KeyboardEvent) => this.heldKeys.delete(event.code));
    // A key released while the page is hidden never sends keyup.
    this.game.events.on("blur", () => this.heldKeys.clear());
  }

  // A touch takes the role it starts with and keeps it, wherever it moves, until it lifts. A new
  // touch goes last in heldTouches, so the latest move touch is the last. Touches anywhere on the
  // page count, the letterbox bars beside the canvas included (gamePoint puts them on the game's
  // nearest edge), except on the nav bar or a link or button.
  private watchTouches(): void {
    const toGame = (event: PointerEvent) => {
      const canvas = this.game.canvas.getBoundingClientRect();
      return gamePoint(canvas, SCREEN, { x: event.clientX, y: event.clientY });
    };
    const down = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.pointerType !== "touch" || target?.closest("a, button, nav") != null) {
        return;
      }
      const point = toGame(event);
      this.heldTouches.set(event.pointerId, {
        role: touchRoleAt(point),
        startX: point.x,
        x: point.x,
      });
    };
    const move = (event: PointerEvent) => {
      const touch = this.heldTouches.get(event.pointerId);
      if (touch) {
        this.heldTouches.set(event.pointerId, { ...touch, x: toGame(event).x });
      }
    };
    const release = (event: PointerEvent) => this.heldTouches.delete(event.pointerId);
    const listeners = [
      ["pointerdown", down],
      ["pointermove", move],
      ["pointerup", release],
      ["pointercancel", release],
    ] as const;
    for (const [type, listener] of listeners) {
      window.addEventListener(type, listener);
    }
    this.events.once("shutdown", () => {
      for (const [type, listener] of listeners) {
        window.removeEventListener(type, listener);
      }
    });
  }

  // The buttons show only on a touch screen. A pressed button plays its press tag, then holds
  // until release, its label white until then. Nothing marks where a move touch started.
  private drawControls(nowMs: number, touches: readonly HeldTouch[]): void {
    const shown = window.matchMedia("(pointer: coarse)").matches;
    for (const [control, sprite] of this.controls) {
      sprite.setVisible(shown);
      const since = trackPress(nowMs, buttonHeld(control, touches), this.presses.get(control));
      if (since === undefined) {
        this.presses.delete(control);
      } else {
        this.presses.set(control, since);
      }
      const tag = controlTag(this.sheet(sprite.texture.key), nowMs, since);
      show(sprite, tag);
      this.labels.get(control)?.setVisible(shown).setTint(labelColour(this.colours, tag));
    }
  }
}
