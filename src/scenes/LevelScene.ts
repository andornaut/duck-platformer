import { frameSteps, startStepClock, type StepClock } from "@andornaut/game-kit/clock/fixedStep";
import { containsPoint } from "@andornaut/game-kit/rect";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, Input, Scene } from "phaser";

import { DUCK } from "../data/duck";
import { TEST_LEVELS } from "../data/levels";
import { OBJECT_TYPES } from "../data/objects";
import { SCREEN, TILE } from "../data/screen";
import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import type { AreaLink, Collision, LevelLayout, Rect } from "../data/types";
import {
  combineIntents,
  type HeldTouch,
  keyIntent,
  touchIntent,
  touchRoleAt,
} from "../input/intent";
import { gamePoint } from "../input/screenPoint";
import { PAUSE_BUTTON } from "../layout/pauseCard";
import { LABEL_SCALE, TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { areaOf, enterArea, type LevelState, startLevel, stepLevel } from "../rules/level";
import { nextLevelIndex, startLevelIndex } from "../rules/levelChain";
import { STEP_MS, STEP_SECONDS } from "../rules/step";
import { levelLayout } from "../rules/tiles";
import { touchControlsShown } from "../settings/touchControls";
import {
  animKey,
  ART_MANIFEST_KEY,
  artHitboxes,
  type ArtManifest,
  type AsepriteSheet,
  sheetTags,
  type TagFrame,
  tagMs,
} from "../view/aseprite";
import { duckFrameAt, type DuckPose, startPose, stepPose } from "../view/duck";
import {
  buttonHeld,
  centredAt,
  controlTag,
  labelAt,
  labelColour,
  trackPress,
} from "../view/touchControls";

// After a stall, run at most this much time at once rather than lurching ahead.
const MAX_FRAME_MS = 250;

// PLACEHOLDER: flat colours until art's tiles and sprites land: the terrain, and each object by
// its collision.
const BACKGROUND = 0x262b44;
const TERRAIN = 0x8b9bb4;
const OBJECT_COLOURS: Readonly<Record<Collision, number>> = {
  hazard: 0xe43b44,
  ledge: 0xc0cbdc,
  none: 0xf6757a,
  solid: 0xe4a672,
  use: 0x63c74d,
};
// Going through a door fades to black and back, each way this long, with play held still.
const FADE_MS = 250;

const DUCK_SPRITE = "duck";
const CONTROL_SPRITES: Readonly<Record<TouchControl, string>> = {
  jump: "ui-touch-jump",
  use: "ui-touch-use",
};
const LABEL_FONT = "font-body";
// Drawn above the area and its objects, which are added whenever an area is drawn.
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
  private areaArt!: GameObjects.Graphics;
  // The hit boxes art's sprites declare, by art key.
  private hitboxes: Readonly<Record<string, Rect>> = {};
  // The area drawn, and a rectangle for each of its objects.
  private areaShown = "";
  // Play holds still while a door fades.
  private fading = false;
  private objectArt: GameObjects.Rectangle[] = [];
  // When each held button's press began.
  private readonly presses = new Map<TouchControl, number>();
  private readonly tags = new Map<string, ReadonlyMap<string, readonly TagFrame[]>>();

  constructor() {
    super("level");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BACKGROUND);
    this.cameras.main.setRoundPixels(true);
    this.areaArt = this.add.graphics();

    for (const key of [DUCK_SPRITE, ...Object.values(CONTROL_SPRITES)]) {
      this.tags.set(key, sheetTags(this.cache.json.get(key) as AsepriteSheet));
    }
    this.landMs = tagMs(this.sheet(DUCK_SPRITE), "land");

    this.duck = this.add.sprite(0, 0, DUCK_SPRITE).setOrigin(0).setDepth(DUCK_DEPTH);
    this.cameras.main.startFollow(this.focus, true);
    this.hitboxes = artHitboxes(this.cache.json.get(ART_MANIFEST_KEY) as ArtManifest);
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
    // Paused under the pause card: keys and time while it was open count for nothing.
    this.events.on("resume", () => {
      this.clock = startStepClock;
      this.heldKeys.clear();
    });
  }

  // Shows or hides the touch buttons now, for the pause card to show the level behind it as the
  // setting changes. They show only on a touch screen.
  showTouchControls(shown: boolean): void {
    const visible = shown && window.matchMedia("(pointer: coarse)").matches;
    for (const [control, sprite] of this.controls) {
      sprite.setVisible(visible);
      this.labels.get(control)?.setVisible(visible);
    }
  }

  override update(time: number): void {
    const frame = frameSteps({ maxFrameMs: MAX_FRAME_MS, stepMs: STEP_MS }, time, this.clock);
    this.clock = frame.clock;
    const touches = [...this.heldTouches.values()];
    const intent = combineIntents(keyIntent(this.heldKeys), touchIntent(TOUCH, touches));
    for (let step = 0; step < frame.steps && !this.fading; step++) {
      const before = this.level.duck;
      this.level = stepLevel(
        DUCK,
        this.layout,
        STEP_SECONDS,
        { jumpHeld: intent.jump, move: intent.move, useHeld: intent.use },
        this.level,
      );
      this.duckPose = stepPose(this.landMs, STEP_MS, before, this.level.duck, this.duckPose);
      // PLACEHOLDER: what clearing a level leads to. For now the next test level starts.
      if (this.level.cleared) {
        this.loadLevel(nextLevelIndex(this.levelIndex, TEST_LEVELS.length));
      } else if (this.level.using) {
        this.goThrough(this.level.using);
      }
    }
    if (this.level.area !== this.areaShown) {
      this.drawArea();
    }
    this.drawObjects();
    this.drawDuck();
    this.drawControls(time, touches);
  }

  // Starts the test level at index from its start. Each load draws a fresh seed, so the random
  // motion differs from one play to the next; ?seed=<n> fixes it.
  private loadLevel(index: number): void {
    const plan = TEST_LEVELS[index];
    if (!plan) {
      throw new Error(`No level ${index + 1}`);
    }
    this.levelIndex = index;
    this.layout = levelLayout(TILE, OBJECT_TYPES, this.hitboxes, plan);
    const asked = Number(new URLSearchParams(window.location.search).get("seed"));
    const seed = Number.isInteger(asked) && asked > 0 ? asked : Math.floor(Math.random() * 2 ** 31);
    this.level = startLevel(DUCK, this.layout, seed);
    this.drawArea();
  }

  // Fades to black, takes her through the door to link, and fades back, play held still.
  private goThrough(link: AreaLink): void {
    this.fading = true;
    const camera = this.cameras.main;
    camera.fadeOut(FADE_MS, 0, 0, 0);
    camera.once("camerafadeoutcomplete", () => {
      this.level = enterArea(DUCK, this.layout, link, this.level);
      this.drawArea();
      this.drawObjects();
      this.drawDuck();
      camera.fadeIn(FADE_MS, 0, 0, 0);
      camera.once("camerafadeincomplete", () => {
        this.fading = false;
      });
    });
  }

  // Draws the area she is in, in flat colours, with the camera kept inside it.
  private drawArea(): void {
    const area = areaOf(this.layout, this.level.area);
    this.areaShown = this.level.area;
    this.cameras.main.setBounds(0, 0, area.width, area.height);
    const art = this.areaArt.clear().fillStyle(TERRAIN);
    for (const rect of area.solids) {
      art.fillRect(rect.x, rect.y, rect.width, rect.height);
    }
    for (const rectangle of this.objectArt) {
      rectangle.destroy();
    }
    this.objectArt = area.objects.map((object) =>
      this.add
        .rectangle(0, 0, object.width, object.height, OBJECT_COLOURS[object.collision])
        .setOrigin(0),
    );
  }

  // Each object where the rules put it, in whole pixels.
  private drawObjects(): void {
    this.level.objects.forEach((at, index) => {
      this.objectArt[index]?.setPosition(Math.round(at.x), Math.round(at.y));
    });
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
  // nearest edge), except on the nav bar or a link or button, on the pause button, or while the
  // pause card is open.
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
      if (!this.scene.isActive() || containsPoint(PAUSE_BUTTON.hit, point.x, point.y)) {
        return;
      }
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

  // The buttons show only on a touch screen, with the Touch controls setting on. A pressed
  // button plays its press tag, then holds until release, its label white until then. Nothing
  // marks where a move touch started.
  private drawControls(nowMs: number, touches: readonly HeldTouch[]): void {
    const shown = window.matchMedia("(pointer: coarse)").matches && touchControlsShown();
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
