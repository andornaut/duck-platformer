import { frameSteps, startStepClock, type StepClock } from "@andornaut/game-kit/clock/fixedStep";
import { type GameObjects, Input, Scene } from "phaser";

import { DUCK } from "../data/duck";
import { SCREEN } from "../data/screen";
import { TEST_FLOOR } from "../data/testFloor";
import type { Rect } from "../data/types";
import { combineIntents, controlAt, type HeldTouch, keyIntent, touchIntent } from "../input/intent";
import { TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { type FloorState, startFloor, stepFloor } from "../rules/floor";
import { animKey, type AsepriteSheet, sheetTags, type TagFrame, tagMs } from "../view/aseprite";
import { duckFrameAt, type DuckPose, startPose, stepPose } from "../view/duck";
import {
  centredAt,
  controlTag,
  knobAt,
  knobTag,
  type Press,
  pressSuffix,
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
  solid: 0x8b9bb4,
};

const DUCK_SPRITE = "duck";
const CONTROL_SPRITES: Readonly<Record<TouchControl, string>> = {
  interact: "ui-touch-interact",
  jump: "ui-touch-jump",
  move: "ui-touch-move",
};
const KNOB_SPRITE = "ui-touch-knob";

// Starts a sprite's tag, unless it already shows it, playing or finished on its last frame.
function show(sprite: GameObjects.Sprite, tag: string): void {
  const key = animKey(sprite.texture.key, tag);
  if (sprite.anims.currentAnim?.key !== key) {
    sprite.play(key);
  }
}

// One floor, played with the keyboard or the touch controls.
export class FloorScene extends Scene {
  private clock: StepClock = startStepClock;
  private readonly controls = new Map<TouchControl, GameObjects.Sprite>();
  private duck!: GameObjects.Sprite;
  private duckPose: DuckPose = startPose;
  private floor!: FloorState;
  // The camera follows her collision box's centre.
  private readonly focus = { x: 0, y: 0 };
  private readonly heldKeys = new Set<string>();
  private readonly heldTouches = new Map<number, HeldTouch>();
  private knob!: GameObjects.Sprite;
  private landMs = 0;
  private readonly layout = TEST_FLOOR;
  private readonly presses = new Map<TouchControl, Press>();
  private readonly tags = new Map<string, ReadonlyMap<string, readonly TagFrame[]>>();

  constructor() {
    super("floor");
  }

  create(): void {
    this.cameras.main.setBackgroundColor(COLOURS.background);
    this.cameras.main.setBounds(0, 0, this.layout.width, SCREEN.height);
    this.cameras.main.setRoundPixels(true);
    const level = this.add.graphics();
    const fill = (rects: readonly Rect[], colour: number) => {
      level.fillStyle(colour);
      for (const rect of rects) {
        level.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    };
    fill(this.layout.solids, COLOURS.solid);
    fill(this.layout.hazards, COLOURS.hazard);
    fill([this.layout.exit], COLOURS.exit);

    for (const key of [DUCK_SPRITE, KNOB_SPRITE, ...Object.values(CONTROL_SPRITES)]) {
      this.tags.set(key, sheetTags(this.cache.json.get(key) as AsepriteSheet));
    }
    this.landMs = tagMs(this.sheet(DUCK_SPRITE), "land");

    this.floor = startFloor(DUCK, this.layout);
    this.duck = this.add.sprite(0, 0, DUCK_SPRITE).setOrigin(0);
    this.cameras.main.startFollow(this.focus, true);

    for (const control of Object.keys(CONTROL_SPRITES) as TouchControl[]) {
      const sprite = this.add
        .sprite(0, 0, CONTROL_SPRITES[control])
        .setOrigin(0)
        .setScrollFactor(0);
      const at = centredAt(TOUCH_CONTROLS[control].centre, sprite.frame);
      this.controls.set(control, sprite.setPosition(at.x, at.y));
    }
    this.knob = this.add.sprite(0, 0, KNOB_SPRITE).setOrigin(0).setScrollFactor(0);
    this.watchKeys();
    this.watchTouches();
  }

  override update(time: number): void {
    const frame = frameSteps({ maxFrameMs: MAX_FRAME_MS, stepMs: STEP_MS }, time, this.clock);
    this.clock = frame.clock;
    const touches = [...this.heldTouches.values()];
    const intent = combineIntents(keyIntent(this.heldKeys), touchIntent(touches));
    for (let step = 0; step < frame.steps; step++) {
      const before = this.floor.duck;
      this.floor = stepFloor(
        DUCK,
        this.layout,
        STEP_MS / 1000,
        { jumpHeld: intent.jump, move: intent.move },
        this.floor,
      );
      // PLACEHOLDER: what clearing a floor leads to. For now the test floor starts over.
      if (this.floor.cleared) {
        this.floor = startFloor(DUCK, this.layout);
      }
      this.duckPose = stepPose(this.landMs, STEP_MS, before, this.floor.duck, this.duckPose);
    }
    this.drawDuck();
    this.drawControls(time, touches);
  }

  private sheet(key: string): ReadonlyMap<string, readonly TagFrame[]> {
    const tags = this.tags.get(key);
    if (!tags) {
      throw new Error(`No sprite ${key}`);
    }
    return tags;
  }

  private drawDuck(): void {
    const { duck } = this.floor;
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

  // A touch takes the control it starts on and keeps it, wherever it moves, until it lifts.
  private watchTouches(): void {
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      const control = pointer.wasTouch ? controlAt({ x: pointer.x, y: pointer.y }) : undefined;
      if (control) {
        this.heldTouches.set(pointer.id, { control, x: pointer.x });
      }
    });
    this.input.on("pointermove", (pointer: Input.Pointer) => {
      const touch = this.heldTouches.get(pointer.id);
      if (touch) {
        this.heldTouches.set(pointer.id, { ...touch, x: pointer.x });
      }
    });
    const release = (pointer: Input.Pointer) => this.heldTouches.delete(pointer.id);
    this.input.on("pointerup", release);
    this.input.on("pointerupoutside", release);
  }

  // The controls show only on a touch screen. A pressed control plays its press tag, then holds
  // until release; the knob follows the move touch.
  private drawControls(nowMs: number, touches: readonly HeldTouch[]): void {
    const shown = window.matchMedia("(pointer: coarse)").matches;
    for (const [control, sprite] of this.controls) {
      sprite.setVisible(shown);
      const press = trackPress(nowMs, pressSuffix(control, touches), this.presses.get(control));
      if (press) {
        this.presses.set(control, press);
      } else {
        this.presses.delete(control);
      }
      show(sprite, controlTag(this.sheet(sprite.texture.key), nowMs, press));
    }
    this.knob.setVisible(shown);
    show(this.knob, knobTag(touches));
    const at = knobAt(this.knob.frame, touches);
    this.knob.setPosition(at.x, at.y);
  }
}
