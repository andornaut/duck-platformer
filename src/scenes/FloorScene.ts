import { frameSteps, startStepClock, type StepClock } from "@andornaut/game-kit/clock/fixedStep";
import { type GameObjects, Input, Scene } from "phaser";

import { DUCK } from "../data/duck";
import { SCREEN } from "../data/screen";
import { TEST_FLOOR } from "../data/testFloor";
import type { Rect } from "../data/types";
import {
  combineIntents,
  controlAt,
  type HeldTouch,
  keyIntent,
  knobOffset,
  touchIntent,
} from "../input/intent";
import { TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { type FloorState, startFloor, stepFloor } from "../rules/floor";

const STEP_MS = 1000 / 60;
// After a stall, run at most this much time at once rather than lurching ahead.
const MAX_FRAME_MS = 250;

// PLACEHOLDER: flat colours and rings until art's tiles, duck and touch control sprites land.
const COLOURS = {
  background: 0x262b44,
  duck: 0xfeae34,
  exit: 0x63c74d,
  hazard: 0xe43b44,
  ring: 0xffffff,
  solid: 0x8b9bb4,
};
const RING_RADIUS: Readonly<Record<TouchControl, number>> = { interact: 18, jump: 18, move: 28 };

// One floor, played with the keyboard or the touch controls.
export class FloorScene extends Scene {
  private clock: StepClock = startStepClock;
  private duck!: GameObjects.Rectangle;
  private floor!: FloorState;
  private readonly heldKeys = new Set<string>();
  private readonly heldTouches = new Map<number, HeldTouch>();
  private overlay!: GameObjects.Graphics;
  private readonly layout = TEST_FLOOR;

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

    this.floor = startFloor(DUCK, this.layout);
    this.duck = this.add.rectangle(0, 0, DUCK.width, DUCK.height, COLOURS.duck).setOrigin(0);
    this.cameras.main.startFollow(this.duck, true);

    this.overlay = this.add.graphics().setScrollFactor(0);
    this.watchKeys();
    this.watchTouches();
  }

  override update(time: number): void {
    const frame = frameSteps({ maxFrameMs: MAX_FRAME_MS, stepMs: STEP_MS }, time, this.clock);
    this.clock = frame.clock;
    const touches = [...this.heldTouches.values()];
    const intent = combineIntents(keyIntent(this.heldKeys), touchIntent(touches));
    for (let step = 0; step < frame.steps; step++) {
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
    }
    this.duck.setPosition(Math.round(this.floor.duck.x), Math.round(this.floor.duck.y));
    this.drawOverlay(touches);
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

  // The rings show only on a touch screen. A held control's ring is drawn thicker, and the move
  // ring's knob follows the touch.
  private drawOverlay(touches: readonly HeldTouch[]): void {
    this.overlay.clear();
    if (!window.matchMedia("(pointer: coarse)").matches) {
      return;
    }
    for (const control of Object.keys(TOUCH_CONTROLS) as TouchControl[]) {
      const { centre } = TOUCH_CONTROLS[control];
      const held = touches.find((touch) => touch.control === control);
      this.overlay.lineStyle(held ? 2 : 1, COLOURS.ring, 0.5);
      this.overlay.strokeCircle(centre.x, centre.y, RING_RADIUS[control]);
      if (control === "move") {
        const dx = held ? knobOffset(held.x - centre.x) : 0;
        this.overlay.fillStyle(COLOURS.ring, 0.35);
        this.overlay.fillCircle(centre.x + dx, centre.y, 10);
      }
    }
  }
}
