import {
  type AnimationFrame,
  animationKey,
  type AsepriteSheet,
  sheetTags,
  tagMs,
} from "@andornaut/game-kit/art/aseprite";
import { frameSteps, startStepClock, type StepClock } from "@andornaut/game-kit/clock/fixedStep";
import {
  clientPoint,
  listenPagePresses,
  onPageControl,
  type PagePointerEvent,
  type PagePress,
} from "@andornaut/game-kit/input/pagePresses";
import { type Random, randomStream } from "@andornaut/game-kit/random";
import { clampInto, containsPoint } from "@andornaut/game-kit/rect";
import { pageToGame } from "@andornaut/game-kit/view/pagePoint";
import { type GameObjects, Input, Scale, Scene, Scenes, type Tilemaps } from "phaser";

import { ARCHETYPES } from "../data/archetypes";
import { CAMERA } from "../data/camera";
import { CHARACTERS } from "../data/characters";
import { DEATH } from "../data/death";
import { DUCK } from "../data/duck";
import { ZONE_MAP } from "../data/map";
import { HAZARD_OUTLINE, SCREEN, TILE } from "../data/screen";
import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import type {
  AreaLayout,
  ArtHitbox,
  CharacterState,
  Collision,
  ObjectLayout,
  Point,
  ZoneLayout,
  ZonePlan,
} from "../data/types";
import { ZONE_1 } from "../data/zone1";
import { RECIPES, TEST_ZONES } from "../data/zones";
import { FRAME_TURN } from "../input/frameTurn";
import {
  combineIntents,
  type HeldTouch,
  keyIntent,
  touchIntent,
  touchRoleAt,
} from "../input/intent";
import { DEATH_PROGRESS_HEIGHT } from "../layout/deathCard";
import { PAUSE_BUTTON } from "../layout/pauseCard";
import { bottomShift, shifted, topShift } from "../layout/playView";
import { MOVE_HINT, TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { coverZone, startWakeLock, stopWakeLock } from "../pwa";
import { contactBox } from "../rules/behaviour";
import { attemptProgress, deathSupport } from "../rules/death";
import { isLastZone, nodeOf } from "../rules/map";
import { STEP_MS, STEP_SECONDS } from "../rules/step";
import { zoneLayout } from "../rules/tiles";
import {
  activateBehaviour,
  areaOf,
  leaveRoom,
  retryZone,
  roomOf,
  startZone,
  stepZone,
  type ZoneState,
} from "../rules/zone";
import {
  askedAssemblySeed,
  askedRecipe,
  newAssemblySeed,
  nextZoneIndex,
  startZoneIndex,
} from "../rules/zoneChain";
import { zonePlanFor } from "../rules/zonePlans";
import { activeLevelTime, flushStats, recordActiveLevelStep, saveCompleted } from "../save";
import { type TouchSetting, touchSettings, touchSettingShown } from "../settings/touchControls";
import { ART_MANIFEST_KEY, artHitboxes, type ArtManifest } from "../view/aseprite";
import { behaviourPose } from "../view/behaviour";
import { cameraScroll } from "../view/camera";
import { characterState, nextQuirkAt } from "../view/character";
import {
  deathFrameIndex,
  deathLabels,
  type DeathPresentation,
  type DeathView,
  startDeathPresentation,
  stepDeathPresentation,
} from "../view/death";
import { doorPhase } from "../view/doorOpen";
import { DUCK_FRAME, duckFrameAt, type DuckPose, startPose, stepPose } from "../view/duck";
import { hazardOutline } from "../view/hazardOutline";
import { moveHintView } from "../view/moveHint";
import { type ArtKind, artKind, artOffset, artScrollFactor } from "../view/objectArt";
import { type PlayHold, stepAction } from "../view/playHold";
import { loadedTileset, objectTiles, terrainTiles, type Tileset } from "../view/tiles";
import { buttonHeld, centredAt, controlTag, trackPress } from "../view/touchControls";
import { proximityDialogue } from "../view/zoneDialogue";
import { ZONE_THEMES_KEY, zoneTheme, type ZoneThemes } from "../view/zoneTheme";
import { paletteColour } from "./cardParts";
import type { DeathData, DeathOpener } from "./DeathScene";
import type { DialogueData, DialogueOpener } from "./DialogueScene";
import { canvasRect, fitCanvasCamera, fitPlayCamera } from "./playCamera";
import type { RoomData } from "./RoomScene";

// The zone a map node plays, assembled for seed where it is a recipe.
function zoneAt(seed: number, node: string): ZonePlan {
  const key = nodeOf(ZONE_MAP, node).zone;
  if (key === undefined) {
    throw new Error(`Map node ${node} has no zone to play`);
  }
  return zonePlanFor(seed, key);
}

// What every zone's instances are resolved against.
const CATALOGUE = { archetypes: ARCHETYPES, characters: CHARACTERS };

// The zones in play order, looping: zone 1, then the test zones.
const CHAIN = [ZONE_1, ...TEST_ZONES];

// After a stall, run at most this much time at once rather than lurching ahead.
const MAX_FRAME_MS = 250;

// PLACEHOLDER: flat colours where an area or object has no art: the ground, the terrain, and
// each object by its collision. An area drawn from a tileset shows ink below its terrain.
const BACKGROUND = 0x262b44;
const INK = 0x181425;
const TERRAIN = 0x8b9bb4;
const OBJECT_COLOURS: Readonly<Record<Collision, number>> = {
  hazard: 0xe43b44,
  ledge: 0xc0cbdc,
  none: 0xf6757a,
  solid: 0xe4a672,
  use: 0x63c74d,
};
// Leaving an ended zone fades to black, and where the next zone plays in this scene, back, each
// way this long, with play held still.
const FADE_MS = 250;

const DUCK_SPRITE = "duck";
const MOVE_HINT_SPRITE = "ui-move-hint";
const MOVE_KNOB_SPRITE = "ui-move-knob";
const CONTROL_SPRITES: Readonly<Record<TouchControl, string>> = {
  jump: "ui-touch-jump",
  use: "ui-touch-use",
};
// Back to front: repeated backdrops, placed backdrops, the terrain, objects, her, and the touch
// controls. An area's art is added whenever it is drawn.
const DEPTHS: Readonly<Record<ArtKind | "terrain", number>> = {
  backdrop: -3,
  placeholder: 0,
  "repeated-backdrop": -4,
  sprite: 0,
  terrain: -2,
  tiles: -1,
};
const DUCK_DEPTH = 1;
const OVERLAY_DEPTH = 2;

// Everything drawn for one object, placed at its top-left corner plus offset. A sprite faces the
// way it last moved.
interface ObjectArt {
  readonly item: GameObjects.Components.Transform & GameObjects.GameObject;
  readonly offset: Point;
  // When its next quirk plays, and the draws that time it.
  readonly quirk?: { at: number; readonly random: Random };
  readonly sprite: GameObjects.Sprite | undefined;
}

// Starts a sprite's tag, unless it already shows it, playing or finished on its last frame.
function show(sprite: GameObjects.Sprite, tag: string): void {
  const key = animationKey(sprite.texture.key, tag);
  if (sprite.anims.currentAnim?.key !== key) {
    sprite.play(key);
  }
}

// What a zone starts with: see ZoneScene.init.
export interface ZoneData {
  readonly backdrop?: boolean;
  readonly node?: string;
}

// One zone, played with the keyboard or the touch controls.
export class ZoneScene extends Scene implements DeathOpener, DialogueOpener {
  private clock: StepClock = startStepClock;
  private readonly controls = new Map<TouchControl, GameObjects.Sprite>();
  // The move hint's ring and knob.
  private moveHint!: { readonly knob: GameObjects.Sprite; readonly ring: GameObjects.Sprite };
  private duck!: GameObjects.Sprite;
  private duckPose: DuckPose = startPose;
  private dying: DeathPresentation | undefined;
  private deathView: DeathView | undefined;
  private deathModal = false;
  private progress!: GameObjects.Graphics;
  private zone!: ZoneState;
  private readonly heldKeys = new Set<string>();
  private readonly heldTouches = new Map<number, HeldTouch>();
  private landMs = 0;
  private layout!: ZoneLayout;
  private zoneIndex = startZoneIndex(window.location.search, CHAIN.length);
  // The map node she plays, or undefined when ?zone=<n> chains the zones without the map.
  private mapNode: string | undefined;
  // The recipe ?zone=<key> plays on its own, assembled afresh each time she clears it unless
  // ?assembly=<n> fixes the seed.
  private trial: string | undefined;
  private areaArt!: GameObjects.Graphics;
  private hazardArt!: GameObjects.Graphics;
  // Drawn as the start screen's backdrop rather than played.
  private backdrop = false;
  // The hit boxes art's sprites declare, by art key.
  private hitboxes: Readonly<Record<string, ArtHitbox>> = {};
  private manifest!: ArtManifest;
  // The area drawn, and a rectangle for each of its objects.
  private areaShown = "";
  private attemptShown = 0;
  // Why play holds still, if it does.
  private hold: PlayHold;
  // The door she used, by its index among the area's objects, while it opens: when Use went down,
  // in ms, and how long its open tag runs (undefined without one). drawObjects leaves its tag
  // alone meanwhile.
  private opening:
    { readonly at: number; readonly index: number; readonly ms?: number } | undefined;
  // Whether a room shows over the paused zone.
  private inRoom = false;
  private dialogueObject: number | undefined;
  private dialogueAttempt = -1;
  private dialogueArea = "";
  private readonly heardDialogues = new Set<number>();
  private objectArt: ObjectArt[] = [];
  private terrainMap: Tilemaps.Tilemap | undefined;
  // When each held button's press began.
  private readonly presses = new Map<TouchControl, number>();
  private readonly tags = new Map<string, ReadonlyMap<string, readonly AnimationFrame[]>>();

  constructor() {
    super("zone");
  }

  // data.node: the map node to play; without one, the recipe ?zone=<key> names, or the chain from
  // ?zone=<n>. data.backdrop: the start screen's backdrop instead (holdStill).
  init(data: ZoneData): void {
    const { search } = window.location;
    this.backdrop = data.backdrop === true;
    this.mapNode = data.node;
    this.trial = askedRecipe(search, Object.keys(RECIPES));
    // Everything one run of the zone changes starts afresh: the scene object is reused.
    this.objectArt = [];
    this.heldKeys.clear();
    this.heldTouches.clear();
    this.presses.clear();
    this.hold = undefined;
    this.opening = undefined;
    this.inRoom = false;
    this.dialogueObject = undefined;
    this.dialogueAttempt = -1;
    this.dialogueArea = "";
    this.heardDialogues.clear();
    this.clock = startStepClock;
    this.duckPose = startPose;
    this.dying = undefined;
    this.deathView = undefined;
    this.deathModal = false;
  }

  create(): void {
    // The main camera shows the zone in the game's view; the controls camera covers the whole
    // canvas for the touch buttons, anchored to its bottom-right corner, and shows nothing else.
    fitPlayCamera(this);
    const controlsCamera = this.cameras.add();
    fitCanvasCamera(this, controlsCamera);
    const offControls = (object: GameObjects.GameObject) => controlsCamera.ignore(object);
    this.events.on(Scenes.Events.ADDED_TO_SCENE, offControls);
    this.events.once("shutdown", () => this.events.off(Scenes.Events.ADDED_TO_SCENE, offControls));
    this.cameras.main.setBackgroundColor(BACKGROUND);
    this.cameras.main.setRoundPixels(true);
    this.areaArt = this.add.graphics();
    this.hazardArt = this.add.graphics().setDepth(DUCK_DEPTH);
    this.progress = this.add.graphics().setDepth(OVERLAY_DEPTH);
    this.cameras.main.ignore(this.progress);
    this.progress.cameraFilter &= ~controlsCamera.id;
    this.events.once("shutdown", () => {
      if (this.dialogueOpen()) {
        this.scene.stop("dialogueChoice");
        this.scene.stop("dialogue");
      }
      this.dialogueObject = undefined;
      coverZone("dialogue", false);
      this.scene.stop("death");
      coverZone("death", false);
      if (!this.backdrop) {
        void flushStats();
      }
    });

    this.landMs = tagMs(this.sheet(DUCK_SPRITE), "land");

    this.duck = this.add.sprite(0, 0, DUCK_SPRITE).setOrigin(0).setDepth(DUCK_DEPTH);
    this.manifest = this.cache.json.get(ART_MANIFEST_KEY) as ArtManifest;
    this.hitboxes = artHitboxes((key) => this.textures.getFrame(key), this.manifest);
    const node = this.mapNode;
    if (this.backdrop) {
      this.loadPlan(ZONE_1);
      this.holdStill();
      return;
    }
    // An assembled zone is assembled afresh each time she enters it, unless ?assembly=<n> fixes
    // the seed.
    const seed = askedAssemblySeed(window.location.search) ?? newAssemblySeed();
    if (node !== undefined) {
      this.loadPlan(zoneAt(seed, node));
    } else if (this.trial !== undefined) {
      this.loadPlan(zonePlanFor(seed, this.trial));
    } else {
      this.loadZone(this.zoneIndex);
    }

    for (const control of Object.keys(CONTROL_SPRITES) as TouchControl[]) {
      const sprite = this.add
        .sprite(0, 0, CONTROL_SPRITES[control])
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(OVERLAY_DEPTH);
      const at = centredAt(TOUCH_CONTROLS[control].centre, sprite.frame);
      this.controls.set(control, sprite.setPosition(at.x, at.y));
      this.cameras.main.ignore(sprite);
      sprite.cameraFilter &= ~controlsCamera.id;
    }
    this.moveHint = {
      knob: this.add.sprite(0, 0, MOVE_KNOB_SPRITE).setOrigin(0),
      ring: this.add.sprite(0, 0, MOVE_HINT_SPRITE).setOrigin(0),
    };
    for (const part of [this.moveHint.ring, this.moveHint.knob]) {
      part.setScrollFactor(0).setDepth(OVERLAY_DEPTH);
      this.cameras.main.ignore(part);
      part.cameraFilter &= ~controlsCamera.id;
    }
    this.drawMoveHint([]);
    this.placeControls();
    this.scale.on(Scale.Events.RESIZE, this.placeControls, this);
    this.events.once("shutdown", () =>
      this.scale.off(Scale.Events.RESIZE, this.placeControls, this),
    );
    this.watchKeys();
    this.watchTouches();
    this.events.on("pause", () => void flushStats());
    // Paused under the pause card or a room: keys and time while it was open count for nothing.
    // Back from a room, she stands at its door with nothing held, and the door shows closed.
    this.events.on("resume", () => {
      this.clock = startStepClock;
      this.heldKeys.clear();
      if (this.inRoom) {
        this.inRoom = false;
        this.hold = undefined;
        this.closeDoor(this.zone.door);
        this.zone = leaveRoom(this.zone);
        this.heldTouches.clear();
      }
    });
  }

  // The start screen's backdrop: zone 1's street as she starts it, without her or the touch
  // buttons, drawn once and paused as soon as it is created, so it never steps, animates or takes
  // input, and isActive("zone") stays false for the pause scene and the frame rate cap.
  private holdStill(): void {
    this.duck.setVisible(false);
    this.drawObjects();
    this.drawDuck();
    this.events.once("create", () => this.sys.pause());
  }

  // Puts the touch buttons at their places shifted across with the view and down to the canvas's
  // bottom, into the bar below where the canvas is taller than the game's view.
  private placeControls(): void {
    const shift = bottomShift(this.scale.gameSize);
    for (const [control, sprite] of this.controls) {
      const { centre } = TOUCH_CONTROLS[control];
      const at = shifted(shift, centredAt(centre, sprite.frame));
      sprite.setPosition(at.x, at.y);
    }
    this.drawProgress();
  }

  // Shows or hides the touch controls now as settings has them, for the pause card to show the
  // zone behind it as the settings change. They show only on a touch screen.
  showTouchControls(settings: Readonly<Record<TouchSetting, boolean>>): void {
    const touch = !this.playCovered() && window.matchMedia("(pointer: coarse)").matches;
    const buttons = settings.actionButtons && touch;
    for (const sprite of this.controls.values()) {
      sprite.setVisible(buttons);
    }
    this.moveHint.ring.setVisible(settings.moveControls && touch);
    this.moveHint.knob.setVisible(settings.moveControls && touch);
  }

  // The move hint shows only on a touch screen, with the Move controls setting on: at rest at its
  // place anchored to the canvas's bottom-left corner, or following the drag that moves her
  // (moveHintView).
  private drawMoveHint(touches: readonly HeldTouch[]): void {
    const { knob, ring } = this.moveHint;
    const shown =
      !this.playCovered() &&
      window.matchMedia("(pointer: coarse)").matches &&
      touchSettingShown("moveControls");
    const rest = shifted(bottomShift(this.scale.gameSize), MOVE_HINT.centre);
    const view = moveHintView(TOUCH, MOVE_HINT.knobReach, rest, touches);
    show(ring, view.ringTag);
    show(knob, view.knobTag);
    const ringAt = centredAt(view.centre, ring.frame);
    const knobAt = centredAt(view.knob, knob.frame);
    ring.setPosition(ringAt.x, ringAt.y).setVisible(shown);
    knob.setPosition(knobAt.x, knobAt.y).setVisible(shown);
  }

  override update(time: number): void {
    if (this.dying !== undefined) {
      this.updateDeath(time);
      return;
    }
    const frame = frameSteps({ maxFrameMs: MAX_FRAME_MS, stepMs: STEP_MS }, time, this.clock);
    this.clock = frame.clock;
    const touches = [...this.heldTouches.values()];
    const intent = combineIntents(keyIntent(this.heldKeys), touchIntent(TOUCH, touches));
    if (this.opening && doorPhase(this.opening.ms, time - this.opening.at) === "room") {
      this.openRoom();
    }
    for (let step = 0; step < frame.steps; step++) {
      const action = stepAction(this.hold, this.zone.cleared || this.zone.turnedBack);
      if (action === "hold") {
        break;
      }
      if (action === "leave") {
        this.fadeOut();
        break;
      }
      if (this.openProximityDialogue()) {
        break;
      }
      const beforeZone = this.zone;
      const before = this.zone.duck;
      this.zone = stepZone(
        DUCK,
        this.layout,
        STEP_SECONDS,
        { jumpHeld: intent.jump, move: intent.move, useHeld: intent.use },
        this.zone,
      );
      recordActiveLevelStep(this.levelKey(), STEP_SECONDS, beforeZone, this.zone);
      if (this.zone.death !== undefined) {
        this.beginDeath();
        break;
      }
      this.duckPose = stepPose(this.landMs, STEP_MS, before, this.zone.duck, this.duckPose);
      if (this.zone.door !== undefined) {
        this.openDoor(time, this.zone.door);
        break;
      }
    }
    if (this.dying !== undefined) {
      this.drawDeath();
      return;
    }
    if (this.zone.area !== this.areaShown || this.zone.attempt !== this.attemptShown) {
      this.drawArea();
    }
    this.drawObjects();
    this.drawDuck();
    this.drawControls(time, touches);
    this.drawMoveHint(touches);
    this.drawProgress();
  }

  // Pause and page controls stay inert throughout dialogue, death presentation and its card.
  playCovered(): boolean {
    return this.dialogueOpen() || this.zone?.death !== undefined;
  }

  private levelKey(): string {
    if (this.mapNode !== undefined) {
      return this.mapNode;
    }
    return this.trial === undefined
      ? this.zoneIndex === 0
        ? ZONE_MAP.start
        : ""
      : (ZONE_MAP.nodes.find(({ zone }) => zone === this.trial)?.id ?? "");
  }

  private progressFraction(): number {
    const area = areaOf(this.layout, this.zone.area);
    const startArea = areaOf(this.layout, this.layout.start.area);
    const entry = startArea.entries[this.layout.start.entry];
    if (entry === undefined) {
      throw new Error("Missing level checkpoint");
    }
    return this.zone.cleared
      ? 1
      : attemptProgress(entry.x, area.exitX, this.zone.duck.x + DUCK.width / 2);
  }

  private drawProgress(): void {
    const theme = zoneTheme(
      ZONE_MAP,
      this.cache.json.get(ZONE_THEMES_KEY) as ZoneThemes,
      this.levelKey(),
    );
    const at = topShift(this.scale.gameSize);
    this.progress
      .clear()
      .fillStyle(paletteColour(this, "dslate"))
      .fillRect(at.x, at.y, SCREEN.width, DEATH_PROGRESS_HEIGHT)
      .fillStyle(paletteColour(this, theme.primary))
      .fillRect(at.x, at.y, SCREEN.width * this.progressFraction(), DEATH_PROGRESS_HEIGHT);
  }

  private beginDeath(): void {
    const death = this.zone.death;
    if (death === undefined || this.dying !== undefined) {
      return;
    }
    const camera = this.cameras.main;
    this.deathView = {
      body: DUCK,
      bounds: { height: SCREEN.height, width: SCREEN.width, x: camera.scrollX, y: camera.scrollY },
      frame: DUCK_FRAME,
    };
    this.dying = startDeathPresentation(DEATH, this.deathView, this.zone.duck.facing, death);
    this.deathModal = false;
    this.clearControls();
    this.input.enabled = false;
    this.drawObjects();
    for (const art of this.objectArt) {
      art.sprite?.anims.pause();
    }
    this.duck.anims.stop();
    this.showTouchControls(touchSettings());
    coverZone("death", true);
    this.drawProgress();
    void flushStats();
  }

  private updateDeath(time: number): void {
    const view = this.deathView;
    if (view === undefined || this.dying === undefined) {
      return;
    }
    const frame = frameSteps({ maxFrameMs: MAX_FRAME_MS, stepMs: STEP_MS }, time, this.clock);
    this.clock = frame.clock;
    for (let step = 0; step < frame.steps; step++) {
      this.dying = stepDeathPresentation(
        DEATH,
        view,
        (position) => deathSupport(DUCK, this.layout, this.zone, position),
        STEP_SECONDS,
        this.dying,
      );
    }
    this.drawDeath();
    if (this.dying.phase === "seated" && !this.deathModal) {
      this.deathModal = true;
      const level = this.levelKey();
      this.scene.launch("death", {
        activeSeconds: activeLevelTime(level),
        ...deathLabels(ZONE_MAP, TEXT.map, String(this.zoneIndex + 1), level),
        percent: this.progressFraction(),
      } satisfies DeathData);
      stopWakeLock();
      this.scene.pause();
    }
  }

  private drawDeath(): void {
    const pose = this.dying;
    if (pose === undefined) {
      return;
    }
    const frame = this.sheet(DUCK_SPRITE).get("death")?.[deathFrameIndex(pose.phase)]?.frame;
    if (frame === undefined) {
      throw new Error(`Missing duck death frame ${pose.phase}`);
    }
    this.duck.setFrame(frame);
    const at = duckFrameAt(DUCK, this.duck.frame, { ...this.zone.duck, ...pose.position });
    this.duck.setPosition(at.x, at.y).setFlipX(pose.facing < 0);
  }

  // The modal stops before returning here. Reuse the layout and cumulative clock, reset inputs
  // and conversations, and let the core create the next explicit attempt.
  retryDeath(): void {
    if (this.zone.death === undefined) {
      return;
    }
    this.zone = retryZone(DUCK, this.layout, this.zone);
    this.dying = undefined;
    this.deathView = undefined;
    this.deathModal = false;
    this.heardDialogues.clear();
    this.dialogueAttempt = -1;
    this.dialogueArea = "";
    this.duckPose = startPose;
    this.clearControls();
    this.input.enabled = true;
    coverZone("death", false);
    this.drawArea();
    this.drawObjects();
    this.duck.play(animationKey(DUCK_SPRITE, startPose.tag));
    this.drawDuck();
    this.drawProgress();
    this.showTouchControls(touchSettings());
    startWakeLock();
    this.scene.resume();
  }

  leaveDeath(): void {
    if (this.zone.death === undefined) {
      return;
    }
    void flushStats();
    coverZone("death", false);
    startWakeLock();
    this.scene.start("start");
  }

  // The pause scene and page input stay inert during the conversation, including its launch.
  dialogueOpen(): boolean {
    return this.dialogueObject !== undefined;
  }

  private clearControls(): void {
    this.heldKeys.clear();
    this.heldTouches.clear();
    this.presses.clear();
    this.clock = startStepClock;
  }

  private openProximityDialogue(): boolean {
    if (this.dialogueOpen()) {
      return true;
    }
    if (this.zone.attempt !== this.dialogueAttempt || this.zone.area !== this.dialogueArea) {
      this.heardDialogues.clear();
      this.dialogueAttempt = this.zone.attempt;
      this.dialogueArea = this.zone.area;
    }
    const area = areaOf(this.layout, this.zone.area);
    const index = proximityDialogue(area.objects, this.zone.objects, this.heardDialogues, {
      height: DUCK.height,
      width: DUCK.width,
      x: this.zone.duck.x,
      y: this.zone.duck.y,
    });
    const scene = index === undefined ? undefined : area.objects[index]?.scene;
    if (index === undefined || scene === undefined) {
      return false;
    }
    this.dialogueObject = index;
    this.clearControls();
    this.input.enabled = false;
    this.showTouchControls(touchSettings());
    coverZone("dialogue", true);
    this.scene.launch("dialogue", { scene } satisfies DialogueData);
    this.scene.pause();
    return true;
  }

  // DialogueScene stops itself before returning control; the dog starts only after that.
  dialogueClosed(): void {
    const index = this.dialogueObject;
    if (index === undefined) {
      return;
    }
    this.heardDialogues.add(index);
    this.zone = activateBehaviour(index, this.zone);
    this.dialogueObject = undefined;
    this.clearControls();
    this.input.enabled = true;
    this.showTouchControls(touchSettings());
    coverZone("dialogue", false);
    this.scene.resume();
  }

  // Fades out of the ended zone, play held still, then leaves it.
  private fadeOut(): void {
    this.hold = "fade";
    const camera = this.cameras.main;
    camera.fadeOut(FADE_MS, 0, 0, 0);
    camera.once("camerafadeoutcomplete", () => this.leave());
  }

  // Plays the open tag of the door she used, where its art has one, play held still; the room
  // shows once it has run (update), or at once without one.
  private openDoor(nowMs: number, index: number): void {
    this.hold = "door";
    const sprite = this.objectArt[index]?.sprite;
    const tag = areaOf(this.layout, this.zone.area).objects[index]?.animations.open;
    const sheet = sprite && this.sheet(sprite.texture.key);
    const ms = tag !== undefined && sheet?.has(tag) ? tagMs(sheet, tag) : undefined;
    this.opening = { at: nowMs, index, ...(ms !== undefined && { ms }) };
    if (sprite && tag !== undefined && ms !== undefined) {
      sprite.play(animationKey(sprite.texture.key, tag));
    }
    if (doorPhase(ms, 0) === "room") {
      this.openRoom();
    }
  }

  // Shows a door's closed look again, its idle tag or its sheet's first, after its open tag.
  private closeDoor(index: number | undefined): void {
    const sprite = index === undefined ? undefined : this.objectArt[index]?.sprite;
    const object =
      index === undefined ? undefined : areaOf(this.layout, this.zone.area).objects[index];
    if (!sprite || !object) {
      return;
    }
    const tag = object.animations.idle ?? [...this.sheet(object.art).keys()][0];
    if (tag !== undefined) {
      show(sprite, tag);
    }
  }

  // Shows the room behind the door she used, the zone paused under it until she leaves.
  private openRoom(): void {
    const room = roomOf(this.layout, this.zone);
    this.opening = undefined;
    if (room === undefined) {
      this.hold = undefined;
      return;
    }
    this.inRoom = true;
    this.scene.launch("room", { room } satisfies RoomData);
    this.scene.pause();
  }

  // Leaves the ended zone, play held until the next screen takes over, with her standing on it on
  // the map. Cleared, it is completed, and after a last zone (isLastZone) the celebration shows
  // first; turned back, it is left as it was and the save is unchanged. Without a map node, plays
  // the recipe ?zone=<key> names assembled again, or the next zone in the chain (the same one,
  // turned back), fading back in.
  private leave(): void {
    const { turnedBack } = this.zone;
    if (this.mapNode !== undefined) {
      if (turnedBack) {
        this.scene.start("map");
        return;
      }
      saveCompleted(this.mapNode);
      this.scene.start(isLastZone(ZONE_MAP, this.mapNode) ? "celebration" : "map");
      return;
    }
    if (this.trial !== undefined) {
      const seed = askedAssemblySeed(window.location.search) ?? newAssemblySeed();
      this.loadPlan(zonePlanFor(seed, this.trial));
    } else {
      this.loadZone(turnedBack ? this.zoneIndex : nextZoneIndex(this.zoneIndex, CHAIN.length));
    }
    this.drawObjects();
    this.drawDuck();
    const camera = this.cameras.main;
    camera.fadeIn(FADE_MS, 0, 0, 0);
    camera.once("camerafadeincomplete", () => {
      this.hold = undefined;
    });
  }

  // Starts the zone at index from its start. Each load draws a fresh seed, so the random
  // motion differs from one play to the next; ?seed=<n> fixes it.
  private loadZone(index: number): void {
    const plan = CHAIN[index];
    if (!plan) {
      throw new Error(`No zone ${index + 1}`);
    }
    this.zoneIndex = index;
    this.loadPlan(plan);
  }

  private loadPlan(plan: ZonePlan): void {
    this.heardDialogues.clear();
    this.dialogueAttempt = -1;
    this.dialogueArea = "";
    // PLACEHOLDER: carried choices set no flags yet.
    const tilesets = Object.fromEntries(
      this.manifest.tilesets.map(({ key }) => [key, this.cache.json.get(key) as Tileset]),
    );
    this.layout = zoneLayout(TILE, DUCK_FRAME, CATALOGUE, this.hitboxes, tilesets, new Set(), plan);
    const asked = Number(new URLSearchParams(window.location.search).get("seed"));
    const seed = Number.isInteger(asked) && asked > 0 ? asked : Math.floor(Math.random() * 2 ** 31);
    this.zone = startZone(DUCK, this.layout, seed);
    this.drawArea();
  }

  // Draws the area she is in, with the camera kept inside it: its terrain from its tileset, or
  // flat where it has none, and each object's art.
  private drawArea(): void {
    const area = areaOf(this.layout, this.zone.area);
    this.areaShown = this.zone.area;
    this.attemptShown = this.zone.attempt;
    this.cameras.main.setBounds(0, 0, area.width, area.height);
    // A tileset art does not have yet draws flat, like an area without one.
    const tileset = loadedTileset(
      TILE,
      (key) => this.cache.json.get(key) as Tileset | undefined,
      area.tileset,
    );
    this.cameras.main.setBackgroundColor(tileset ? INK : BACKGROUND);
    const flat = this.areaArt.clear().setDepth(DEPTHS.terrain);
    this.terrainMap?.destroy();
    this.terrainMap = undefined;
    if (area.tileset && tileset) {
      this.terrainMap = this.drawTerrain(area.tileset, tileset, area);
    } else {
      flat.fillStyle(TERRAIN);
      for (const rect of area.solids) {
        flat.fillRect(rect.x, rect.y, rect.width, rect.height);
      }
    }
    for (const { item } of this.objectArt) {
      item.destroy();
    }
    this.objectArt = area.objects.map((object, index) => {
      const key = object.tileset ?? area.tileset;
      const source = loadedTileset(
        TILE,
        (name) => this.cache.json.get(name) as Tileset | undefined,
        key,
      );
      return this.drawObject(key, source, object, index);
    });
  }

  private drawTerrain(key: string, tileset: Tileset, area: AreaLayout): Tilemaps.Tilemap {
    const map = this.make.tilemap({
      height: area.height / TILE,
      tileHeight: TILE,
      tileWidth: TILE,
      width: area.width / TILE,
    });
    const sheet = map.addTilesetImage(key, key, TILE, TILE, 0, 0);
    const layer = sheet && map.createBlankLayer("terrain", sheet, 0, 0);
    if (!layer) {
      throw new Error(`No tilemap layer for ${key}`);
    }
    layer.setDepth(DEPTHS.terrain);
    for (const { col, index, row } of terrainTiles(tileset, map.width, map.height, area.terrain)) {
      layer.putTileAt(index, col, row);
    }
    return map;
  }

  private drawObject(
    key: string | undefined,
    tileset: Tileset | undefined,
    object: ObjectLayout,
    index: number,
  ): ObjectArt {
    const kind = artKind(this.manifest, tileset, object.art);
    const parallax = artScrollFactor(kind, object.parallax);
    const rect = { height: object.height, width: object.width };
    switch (kind) {
      case "tiles": {
        const images = objectTiles(
          tileset as Tileset,
          object.art,
          rect.width / TILE,
          rect.height / TILE,
        ).map(({ col, index, row }) =>
          this.add.image(col * TILE, row * TILE, key as string, index).setOrigin(0),
        );
        const item = this.add.container(0, 0, images).setDepth(DEPTHS.tiles);
        return { item, offset: { x: 0, y: 0 }, sprite: undefined };
      }
      case "backdrop": {
        const item = this.add
          .image(0, 0, object.art)
          .setOrigin(0)
          .setScrollFactor(parallax.x, parallax.y)
          .setDepth(DEPTHS.backdrop);
        return { item, offset: artOffset(kind, rect, item), sprite: undefined };
      }
      case "repeated-backdrop": {
        const height = this.textures.getFrame(object.art).height;
        const item = this.add
          .tileSprite(0, 0, rect.width, height, object.art)
          .setOrigin(0)
          .setScrollFactor(parallax.x, parallax.y)
          .setDepth(DEPTHS["repeated-backdrop"]);
        return {
          item,
          offset: artOffset(kind, rect, { height, width: rect.width }),
          sprite: undefined,
        };
      }
      case "sprite": {
        const sprite = this.add.sprite(0, 0, object.art).setOrigin(0).setDepth(DEPTHS.sprite);
        const tag = object.animations.idle ?? [...this.sheet(object.art).keys()][0];
        if (tag !== undefined) {
          show(sprite, tag);
        }
        const [quirk] = object.quirks;
        const random = randomStream(
          this.zone.seed + this.zone.attempt,
          `${this.zone.area}:${index}:quirk`,
        );
        return {
          item: sprite,
          offset: artOffset(kind, rect, sprite.frame),
          ...(quirk && { quirk: { at: nextQuirkAt(random, quirk, 0), random } }),
          sprite,
        };
      }
      default: {
        const item = this.add
          .rectangle(0, 0, rect.width, rect.height, OBJECT_COLOURS[object.collision])
          .setOrigin(0)
          .setDepth(DEPTHS.placeholder);
        return { item, offset: { x: 0, y: 0 }, sprite: undefined };
      }
    }
  }

  // Each object where the rules put it, in whole pixels. A character's sprite faces the way it
  // moved and plays the tag for its state, and an idle one now and then plays a quirk.
  private drawObjects(): void {
    const area = areaOf(this.layout, this.zone.area);
    const { duck } = this.zone;
    const hers = { x: duck.x + DUCK.width / 2, y: duck.y + DUCK.height / 2 };
    this.hazardArt.clear();
    this.zone.objects.forEach((at, index) => {
      const art = this.objectArt[index];
      const object = area.objects[index];
      if (!art || !object) {
        return;
      }
      const x = Math.round(at.x + art.offset.x);
      const y = Math.round(at.y + art.offset.y);
      const moved = x !== art.item.x || y !== art.item.y;
      const behaviour = this.zone.behaviours[index];
      if (behaviour) {
        if (art.sprite) {
          const pose = behaviourPose(object, behaviour);
          art.sprite.setFlipX(pose.flipX);
          if (pose.animation !== undefined) {
            show(art.sprite, pose.animation);
          }
        }
        if (object.collision === "hazard") {
          for (const { band, rect } of hazardOutline(
            HAZARD_OUTLINE,
            contactBox(object, at, behaviour.facing),
          )) {
            this.hazardArt.fillStyle(paletteColour(this, HAZARD_OUTLINE[band]));
            this.hazardArt.fillRect(rect.x, rect.y, rect.width, rect.height);
          }
        }
      } else if (art.sprite && index !== this.opening?.index) {
        if (x !== art.item.x) {
          art.sprite.setFlipX(x < art.item.x);
        }
        const mine = { x: at.x + object.width / 2, y: at.y + object.height / 2 };
        this.animate(art, object, characterState(object, moved, mine, hers));
      }
      art.item.setPosition(x, y);
    });
  }

  // Plays the tag for a character's state, or while it idles, its quirks when they come due, each
  // timed by the attempt's random draws so a restart rolls them afresh.
  private animate(art: ObjectArt, object: ObjectLayout, state: CharacterState): void {
    const sprite = art.sprite as GameObjects.Sprite;
    const quirk = object.quirks[0];
    const playingQuirk =
      quirk !== undefined &&
      sprite.anims.isPlaying &&
      sprite.anims.currentAnim?.key === animationKey(object.art, quirk.tag);
    if (state === "idle" && quirk && art.quirk) {
      if (this.zone.seconds >= art.quirk.at) {
        sprite.play(animationKey(object.art, quirk.tag));
        art.quirk.at = nextQuirkAt(art.quirk.random, quirk, this.zone.seconds);
        return;
      }
      if (playingQuirk) {
        return;
      }
    }
    const tag = object.animations[state];
    if (tag !== undefined) {
      show(sprite, tag);
    }
  }

  private sheet(key: string): ReadonlyMap<string, readonly AnimationFrame[]> {
    let tags = this.tags.get(key);
    if (!tags) {
      tags = sheetTags(this.cache.json.get(key) as AsepriteSheet);
      this.tags.set(key, tags);
    }
    return tags;
  }

  private drawDuck(): void {
    const { duck } = this.zone;
    const { tag } = this.duckPose;
    show(this.duck, tag);
    const at = duckFrameAt(DUCK, this.duck.frame, duck);
    this.duck.setPosition(at.x, at.y).setFlipX(duck.facing < 0);
    const feet = { x: duck.x + DUCK.width / 2, y: duck.y + DUCK.height };
    const scroll = cameraScroll(CAMERA, SCREEN, areaOf(this.layout, this.zone.area), feet);
    this.cameras.main.setScroll(scroll.x, scroll.y);
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
    // A key held from before the zone resumed, under the pause card or a room, counts only once
    // pressed again: its repeats never press it.
    keyboard.on("keydown", (event: KeyboardEvent) => {
      if (!event.repeat && !this.playCovered() && this.scene.isActive()) {
        this.heldKeys.add(event.code);
      }
    });
    keyboard.on("keyup", (event: KeyboardEvent) => this.heldKeys.delete(event.code));
    // A key released while the page is hidden never sends keyup.
    this.game.events.on("blur", () => this.heldKeys.clear());
  }

  // A touch takes the role it starts with and keeps it, wherever it moves, until it lifts. A new
  // touch goes last in heldTouches, so the latest move touch is the last. Touches anywhere on the
  // page count, the letterbox bars and safe-area margins beside the canvas included, except on
  // the nav bar or a link or button, on the pause button, or while the pause card is open. A
  // touch's role is read where it starts on the game's nearest edge pixel (clampInto), and a move
  // touch's travel unclamped (pageToGame), so a drag within the bars still moves her. Both
  // read through the page frame's turn (FRAME_TURN). Only a touch on the canvas can be on the
  // pause button: one in the bar beside it lands on the game's edge, inside the button's hit
  // area, and moves her.
  private watchTouches(): void {
    const unclamped = (event: PagePointerEvent) =>
      pageToGame(
        FRAME_TURN.turn(),
        this.game.canvas.getBoundingClientRect(),
        this.scale.gameSize,
        clientPoint(event),
      );
    const onGame = (event: PagePointerEvent) => clampInto(canvasRect(this), unclamped(event));
    // The touch buttons sit shifted with the view and to the canvas's bottom (placeControls), and
    // the pause button with the view.
    const roleAt = (point: Point) =>
      touchRoleAt(shifted(bottomShift(this.scale.gameSize), point, -1));
    const accepts = (event: PagePointerEvent) => {
      if (
        event.pointerType !== "touch" ||
        onPageControl(event.target) ||
        !this.scene.isActive() ||
        this.playCovered()
      ) {
        return false;
      }
      const point = shifted(topShift(this.scale.gameSize), onGame(event), -1);
      return !(
        event.target === this.game.canvas && containsPoint(PAUSE_BUTTON.hit, point.x, point.y)
      );
    };
    const release = ({ pointerId }: PagePress) => this.heldTouches.delete(pointerId);
    const stopListening = listenPagePresses(
      accepts,
      {
        cancel: release,
        down: ({ pointerId }, event) => {
          const { x, y } = unclamped(event);
          const role = roleAt(onGame(event));
          this.heldTouches.set(pointerId, { role, startX: x, startY: y, x });
        },
        move: ({ pointerId }, event) => {
          const touch = this.heldTouches.get(pointerId);
          if (touch) {
            this.heldTouches.set(pointerId, { ...touch, x: unclamped(event).x });
          }
        },
        up: release,
      },
      window,
    );
    this.events.once("shutdown", stopListening);
  }

  // The buttons show only on a touch screen, with the Action buttons setting on. A pressed
  // button plays its press tag, then holds until release, its label white until then. Nothing
  // marks where a move touch started.
  private drawControls(nowMs: number, touches: readonly HeldTouch[]): void {
    const shown =
      !this.playCovered() &&
      window.matchMedia("(pointer: coarse)").matches &&
      touchSettingShown("actionButtons");
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
    }
  }
}
