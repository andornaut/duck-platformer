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
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { pageToGame } from "@andornaut/game-kit/view/pagePoint";
import { type GameObjects, Input, Scene, type Tilemaps } from "phaser";

import { ARCHETYPES } from "../data/archetypes";
import { CHARACTERS } from "../data/characters";
import { DUCK } from "../data/duck";
import { ZONE_MAP } from "../data/map";
import { SCREEN, TILE } from "../data/screen";
import { TEXT } from "../data/text";
import { TOUCH } from "../data/touch";
import type {
  AreaLayout,
  AreaLink,
  ArtHitbox,
  CharacterState,
  Collision,
  ObjectLayout,
  Point,
  ZoneLayout,
  ZonePlan,
} from "../data/types";
import { ZONE_1 } from "../data/zone1";
import { TEST_ZONES, ZONES } from "../data/zones";
import { pageFrameTurn } from "../input/frameTurn";
import {
  combineIntents,
  type HeldTouch,
  keyIntent,
  touchIntent,
  touchRoleAt,
} from "../input/intent";
import { PAUSE_BUTTON } from "../layout/pauseCard";
import { LABEL_SCALE, TOUCH_CONTROLS, type TouchControl } from "../layout/touchControls";
import { nodeOf } from "../rules/map";
import { STEP_MS, STEP_SECONDS } from "../rules/step";
import { zoneLayout } from "../rules/tiles";
import { areaOf, enterArea, startZone, stepZone, type ZoneState } from "../rules/zone";
import { nextZoneIndex, startZoneIndex } from "../rules/zoneChain";
import { touchControlsShown } from "../settings/touchControls";
import { ART_MANIFEST_KEY, artHitboxes, type ArtManifest } from "../view/aseprite";
import { cameraScroll } from "../view/camera";
import { characterState, nextQuirkAt } from "../view/character";
import { duckFrameAt, type DuckPose, startPose, stepPose } from "../view/duck";
import { type ArtKind, artKind, artOffset } from "../view/objectArt";
import { objectTiles, terrainTiles, type Tileset } from "../view/tiles";
import {
  buttonHeld,
  centredAt,
  controlTag,
  labelAt,
  labelColour,
  trackPress,
} from "../view/touchControls";

// The zone a map node plays.
function zoneAt(node: string): ZonePlan {
  const key = nodeOf(ZONE_MAP, node).zone;
  const plan = key === undefined ? undefined : ZONES[key];
  if (!plan) {
    throw new Error(`Map node ${node} has no zone to play`);
  }
  return plan;
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
// Going through a door fades to black and back, each way this long, with play held still.
const FADE_MS = 250;

const DUCK_SPRITE = "duck";
const CONTROL_SPRITES: Readonly<Record<TouchControl, string>> = {
  jump: "ui-touch-jump",
  use: "ui-touch-use",
};
const LABEL_FONT = "font-body";
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
const PALETTE = "palette";

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
  readonly route?: readonly string[];
}

// One zone, played with the keyboard or the touch controls.
export class ZoneScene extends Scene {
  private clock: StepClock = startStepClock;
  private readonly controls = new Map<TouchControl, GameObjects.Sprite>();
  private readonly labels = new Map<TouchControl, GameObjects.BitmapText>();
  private colours: Readonly<Record<string, string>> = {};
  private duck!: GameObjects.Sprite;
  private duckPose: DuckPose = startPose;
  private zone!: ZoneState;
  private readonly heldKeys = new Set<string>();
  private readonly heldTouches = new Map<number, HeldTouch>();
  private landMs = 0;
  private layout!: ZoneLayout;
  private zoneIndex = startZoneIndex(window.location.search, CHAIN.length);
  // The nodes she has walked this lap on the map, ending at the node she plays, or undefined
  // when ?zone=<n> chains the zones without the map.
  private mapRoute: readonly string[] | undefined;
  private areaArt!: GameObjects.Graphics;
  // Drawn as the start screen's backdrop rather than played.
  private backdrop = false;
  // The hit boxes art's sprites declare, by art key.
  private hitboxes: Readonly<Record<string, ArtHitbox>> = {};
  private manifest!: ArtManifest;
  // The area drawn, and a rectangle for each of its objects.
  private areaShown = "";
  private attemptShown = 0;
  // Play holds still while a door fades.
  private fading = false;
  private objectArt: ObjectArt[] = [];
  private terrainMap: Tilemaps.Tilemap | undefined;
  // When each held button's press began.
  private readonly presses = new Map<TouchControl, number>();
  private readonly tags = new Map<string, ReadonlyMap<string, readonly AnimationFrame[]>>();

  constructor() {
    super("zone");
  }

  // data.route: the nodes she has walked this lap on the map, ending at the node to play; without
  // one, the chain from ?zone=<n>. data.backdrop: the start screen's backdrop instead (holdStill).
  init(data: ZoneData): void {
    this.backdrop = data.backdrop === true;
    this.mapRoute = data.route;
    this.objectArt = [];
    this.heldKeys.clear();
    this.heldTouches.clear();
  }

  create(): void {
    this.cameras.main.setBackgroundColor(BACKGROUND);
    this.cameras.main.setRoundPixels(true);
    this.areaArt = this.add.graphics();

    this.landMs = tagMs(this.sheet(DUCK_SPRITE), "land");

    this.duck = this.add.sprite(0, 0, DUCK_SPRITE).setOrigin(0).setDepth(DUCK_DEPTH);
    this.manifest = this.cache.json.get(ART_MANIFEST_KEY) as ArtManifest;
    this.hitboxes = artHitboxes((key) => this.textures.getFrame(key), this.manifest);
    const node = this.mapRoute?.at(-1);
    if (this.backdrop) {
      this.loadPlan(ZONE_1);
      this.holdStill();
      return;
    }
    if (node === undefined) {
      this.loadZone(this.zoneIndex);
    } else {
      this.loadPlan(zoneAt(node));
    }

    const font = phaserBitmapFont(this.cache.bitmapFont.get(LABEL_FONT).data as PhaserFontData);
    this.colours = (this.cache.json.get(PALETTE) as { colours: Record<string, string> }).colours;
    for (const control of Object.keys(CONTROL_SPRITES) as TouchControl[]) {
      const sprite = this.add
        .sprite(0, 0, CONTROL_SPRITES[control])
        .setOrigin(0)
        .setScrollFactor(0)
        .setDepth(OVERLAY_DEPTH);
      const { centre, labelRaise } = TOUCH_CONTROLS[control];
      const at = centredAt(centre, sprite.frame);
      this.controls.set(control, sprite.setPosition(at.x, at.y));
      const text = TEXT.buttons[control];
      const origin = labelAt(font, centre, labelRaise, text);
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

  // The start screen's backdrop: zone 1's street as she starts it, without her or the touch
  // buttons, drawn once and paused as soon as it is created, so it never steps, animates or takes
  // input, and isActive("zone") stays false for the pause scene and the frame rate cap.
  private holdStill(): void {
    this.duck.setVisible(false);
    this.drawObjects();
    this.drawDuck();
    this.events.once("create", () => this.sys.pause());
  }

  // Shows or hides the touch buttons now, for the pause card to show the zone behind it as the
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
      const before = this.zone.duck;
      this.zone = stepZone(
        DUCK,
        this.layout,
        STEP_SECONDS,
        { jumpHeld: intent.jump, move: intent.move, useHeld: intent.use },
        this.zone,
      );
      this.duckPose = stepPose(this.landMs, STEP_MS, before, this.zone.duck, this.duckPose);
      // Clearing a zone goes to the map, or without one, the next zone in the chain.
      if (this.zone.cleared && this.mapRoute !== undefined) {
        this.scene.start("map", { played: true, route: this.mapRoute });
        return;
      }
      if (this.zone.cleared) {
        this.loadZone(nextZoneIndex(this.zoneIndex, CHAIN.length));
      } else if (this.zone.using) {
        this.goThrough(this.zone.using);
      }
    }
    if (this.zone.area !== this.areaShown || this.zone.attempt !== this.attemptShown) {
      this.drawArea();
    }
    this.drawObjects();
    this.drawDuck();
    this.drawControls(time, touches);
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
    // PLACEHOLDER: carried choices set no flags yet.
    this.layout = zoneLayout(TILE, CATALOGUE, this.hitboxes, new Set(), plan);
    const asked = Number(new URLSearchParams(window.location.search).get("seed"));
    const seed = Number.isInteger(asked) && asked > 0 ? asked : Math.floor(Math.random() * 2 ** 31);
    this.zone = startZone(DUCK, this.layout, seed);
    this.drawArea();
  }

  // Fades to black, takes her through the door to link, and fades back, play held still.
  private goThrough(link: AreaLink): void {
    this.fading = true;
    const camera = this.cameras.main;
    camera.fadeOut(FADE_MS, 0, 0, 0);
    camera.once("camerafadeoutcomplete", () => {
      this.zone = enterArea(DUCK, this.layout, link, this.zone);
      this.drawArea();
      this.drawObjects();
      this.drawDuck();
      camera.fadeIn(FADE_MS, 0, 0, 0);
      camera.once("camerafadeincomplete", () => {
        this.fading = false;
      });
    });
  }

  // Draws the area she is in, with the camera kept inside it: its terrain from its tileset, or
  // flat where it has none, and each object's art.
  private drawArea(): void {
    const area = areaOf(this.layout, this.zone.area);
    this.areaShown = this.zone.area;
    this.attemptShown = this.zone.attempt;
    this.cameras.main.setBounds(0, 0, area.width, area.height);
    this.cameras.main.setBackgroundColor(area.tileset ? INK : BACKGROUND);
    const tileset = area.tileset ? this.tileset(area.tileset) : undefined;
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
    this.objectArt = area.objects.map((object, index) =>
      this.drawObject(area.tileset, tileset, object, index),
    );
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
        const item = this.add.image(0, 0, object.art).setOrigin(0).setDepth(DEPTHS.backdrop);
        return { item, offset: artOffset(kind, rect, item), sprite: undefined };
      }
      case "repeated-backdrop": {
        const height = this.textures.getFrame(object.art).height;
        const item = this.add
          .tileSprite(0, 0, rect.width, height, object.art)
          .setOrigin(0)
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
    this.zone.objects.forEach((at, index) => {
      const art = this.objectArt[index];
      const object = area.objects[index];
      if (!art || !object) {
        return;
      }
      const x = Math.round(at.x + art.offset.x);
      const y = Math.round(at.y + art.offset.y);
      const moved = x !== art.item.x || y !== art.item.y;
      if (art.sprite) {
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

  private tileset(key: string): Tileset {
    const tileset = this.cache.json.get(key) as Tileset | undefined;
    if (!tileset || tileset.tileSize !== TILE) {
      throw new Error(`Tileset ${key} is missing or not ${TILE} px a tile`);
    }
    return tileset;
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
    const scroll = cameraScroll(SCREEN, areaOf(this.layout, this.zone.area), feet);
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
    keyboard.on("keydown", (event: KeyboardEvent) => this.heldKeys.add(event.code));
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
  // read through the page frame's turn (pageFrameTurn). Only a touch on the canvas can be on the
  // pause button: one in the bar beside it lands on the game's edge, inside the button's hit
  // area, and moves her.
  private watchTouches(): void {
    const unclamped = (event: PagePointerEvent) =>
      pageToGame(
        pageFrameTurn(),
        this.game.canvas.getBoundingClientRect(),
        SCREEN,
        clientPoint(event),
      );
    const onGame = (event: PagePointerEvent) =>
      clampInto({ ...SCREEN, x: 0, y: 0 }, unclamped(event));
    const accepts = (event: PagePointerEvent) => {
      if (event.pointerType !== "touch" || onPageControl(event.target) || !this.scene.isActive()) {
        return false;
      }
      const point = onGame(event);
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
          const { x } = unclamped(event);
          this.heldTouches.set(pointerId, { role: touchRoleAt(onGame(event)), startX: x, x });
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
