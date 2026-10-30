import { animationKey } from "@andornaut/game-kit/art/aseprite";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { ZONE_MAP } from "../data/map";
import { TILE } from "../data/screen";
import { TEXT } from "../data/text";
import type { MapNode, Point, Rect } from "../data/types";
import { pressedArea } from "../layout/hitAreas";
import { MAP_PATH, MAP_PATH_LOOKS, MAP_SCREEN, mapLabel, type PathLook } from "../layout/mapScreen";
import { nodeOf, type OpenMap, openMap } from "../rules/map";
import { savedMap, saveStand } from "../save";
import { ART_MANIFEST_KEY, type ArtManifest } from "../view/aseprite";
import {
  advanceWidth,
  markerState,
  nodeCentre,
  pathLook,
  steppedZone,
  zoneAtTap,
} from "../view/mapMarks";
import { bentCurve, pathRects } from "../view/mapPath";
import { addButtonLabel, type ButtonLabel, placeButtonLabel } from "./cardParts";
import { fitPlayCamera, playPoint } from "./playCamera";
import type { ZoneData } from "./ZoneScene";

const PALETTE = "palette";
const TITLE_FONT = "font-title";
const ICON_FALLBACK = "map-icon-zone";
const STEP_KEYS: Readonly<Record<string, -1 | 1>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  KeyA: -1,
  KeyD: 1,
};
const CONTINUE_KEYS = ["ArrowUp", "Enter", "KeyE", "KeyW", "Space"];
// Paths are drawn in this order, so the open ones lie on top.
const LOOK_ORDER: readonly PathLook[] = ["unbuilt", "built", "open"];

// A control on the map: Continue, or an open zone node by its id.
type Control = { readonly kind: "continue" } | { readonly kind: "node"; readonly id: string };

// The map between zones, drawn as art's paper map: its pen marks, every path and node, each
// zone's name, and the duck on the zone node she stands on. The zones she has completed open the
// paths past them (openMap): she may stand on any open zone node, back or on, and play it. A tap
// on an open zone node, or Left and Right through them in the map's order, walks her there;
// Continue plays the zone she stands on. Where she stands is saved as it changes.
export class MapScene extends Scene {
  private colours: Readonly<Record<string, string>> = {};
  private completed: ReadonlySet<string> = new Set();
  private continueArt!: GameObjects.Sprite;
  private continueLabel!: ButtonLabel;
  private open!: OpenMap;
  private pressed: Control | undefined;
  private stand = ZONE_MAP.start;

  constructor() {
    super("map");
  }

  // Where she is comes from the saved progress: the map's start with nothing completed from the
  // beginning.
  init(): void {
    const { completed, stand } = savedMap();
    this.completed = new Set(completed);
    this.open = openMap(ZONE_MAP, this.completed);
    this.stand = this.open.zones.includes(stand) ? stand : ZONE_MAP.start;
    this.pressed = undefined;
  }

  create(): void {
    fitPlayCamera(this);
    saveStand(this.stand);
    this.colours = (this.cache.json.get(PALETTE) as { colours: Record<string, string> }).colours;
    this.slice("map-paper", MAP_SCREEN.paper);
    for (const { art, at } of ZONE_MAP.decorations) {
      this.add.sprite(at.x, at.y, art).setOrigin(0).play(animationKey(art, "rest"));
    }
    this.drawPaths();
    this.drawNodes();
    const { textScale, title } = MAP_SCREEN;
    this.add
      .bitmapText(title.x, title.y, TITLE_FONT, TEXT.map.title)
      .setScale(textScale)
      .setTint(this.colour("plum"));
    this.addContinue();
    this.showPressed(undefined);
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.key(event.code));
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.showPressed(this.controlAt(pointer));
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const control = this.pressed;
      this.showPressed(undefined);
      const lifted = this.controlAt(pointer);
      if (control === undefined || lifted === undefined || !sameControl(control, lifted)) {
        return;
      }
      if (control.kind === "continue") {
        this.play();
      } else {
        this.walkTo(control.id);
      }
    });
  }

  private centre(node: MapNode): Point {
    return nodeCentre(TILE, node);
  }

  private drawPaths(): void {
    const paths = this.add.graphics();
    const edges = ZONE_MAP.edges.map((edge, index) => ({
      edge,
      index,
      look: pathLook(this.open, edge),
    }));
    for (const look of LOOK_ORDER) {
      const { colour, stroke } = MAP_PATH_LOOKS[look];
      paths.fillStyle(this.colour(colour));
      for (const { edge, index } of edges.filter((each) => each.look === look)) {
        const from = nodeOf(ZONE_MAP, edge.from);
        const to = nodeOf(ZONE_MAP, edge.to);
        const ends = {
          from: this.centre(from),
          fromTrim: MAP_PATH.trim[from.kind],
          to: this.centre(to),
          toTrim: MAP_PATH.trim[to.kind],
        };
        const curve = bentCurve(MAP_PATH.bend, ends.from, ends.to, index);
        for (const rect of pathRects(MAP_PATH.step, stroke, ends, curve)) {
          paths.fillRect(rect.x, rect.y, rect.width, rect.height);
        }
      }
    }
  }

  // Each zone's name over a cream knock-out that hides the paths behind it, then each marker
  // with its zone's icon, each name, and the duck on the node she stands on.
  private drawNodes(): void {
    const { duck, icon, marker, textScale } = MAP_SCREEN;
    const font = phaserBitmapFont(this.cache.bitmapFont.get(TITLE_FONT).data as PhaserFontData);
    const knockouts = this.add.graphics().fillStyle(this.colour("cream"));
    const labels: { at: Point; name: string }[] = [];
    for (const node of ZONE_MAP.nodes) {
      const name = TEXT.map.zones[node.id];
      if (node.kind === "zone" && name !== undefined) {
        const { knockout, origin } = mapLabel(
          advanceWidth(font, textScale, name),
          this.centre(node),
        );
        knockouts.fillRect(knockout.x, knockout.y, knockout.width, knockout.height);
        labels.push({ at: origin, name });
      }
    }
    for (const node of ZONE_MAP.nodes) {
      const centre = this.centre(node);
      const state = markerState(ZONE_MAP, this.open, this.completed, this.stand, node);
      const key = `map-${node.kind}`;
      this.add
        .sprite(centre.x + marker[node.kind].x, centre.y + marker[node.kind].y, key)
        .setOrigin(0)
        .play(animationKey(key, state));
      // A locked zone shows art's padlock in place of its icon.
      if (node.kind === "zone" && state !== "unbuilt" && state !== "locked") {
        const own = `map-icon-${node.zone ?? ""}`;
        const art = this.textures.exists(own) ? own : ICON_FALLBACK;
        this.add
          .sprite(centre.x + icon.x, centre.y + icon.y, art)
          .setOrigin(0)
          .play(animationKey(art, state === "visited" ? "visited" : "normal"));
      }
    }
    for (const { at, name } of labels) {
      this.add
        .bitmapText(at.x, at.y, TITLE_FONT, name)
        .setScale(textScale)
        .setTint(this.colour("plum"));
    }
    const at = nodeOf(ZONE_MAP, this.stand);
    const centre = this.centre(at);
    this.add
      .sprite(centre.x + duck[at.kind].x, centre.y + duck[at.kind].y, "map-duck")
      .setOrigin(0)
      .play(animationKey("map-duck", "idle"));
  }

  private addContinue(): void {
    const { art, labelY } = MAP_SCREEN.continue;
    this.continueArt = this.add.sprite(art.x, art.y, "ui-resume").setOrigin(0);
    this.continueLabel = addButtonLabel(this, art, labelY, TEXT.map.continue, {
      colour: this.colour("ink"),
      marked: true,
    });
  }

  // A pressed Continue shows its pressed look until the press lifts: its face and label sink.
  private showPressed(control: Control | undefined): void {
    this.pressed = control;
    const { labelY, pressedLabelY } = MAP_SCREEN.continue;
    const pressed = control?.kind === "continue";
    this.continueArt.play(animationKey("ui-resume", pressed ? "pressed" : "normal"));
    placeButtonLabel(this.continueLabel, pressed ? pressedLabelY : labelY);
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    const point = playPoint(this, pointer);
    const { continue: go } = MAP_SCREEN;
    if (pressedArea([{ art: go.art, hit: go.hit, key: "continue" }], point) !== undefined) {
      return { kind: "continue" };
    }
    const id = zoneAtTap(TILE, MAP_SCREEN.nodeHit, ZONE_MAP, this.open, point);
    return id === undefined ? undefined : { id, kind: "node" };
  }

  private key(code: string): void {
    const step = STEP_KEYS[code];
    if (step !== undefined) {
      this.walkTo(steppedZone(this.open, this.stand, step));
    } else if (CONTINUE_KEYS.includes(code)) {
      this.play();
    }
  }

  // She walks to an open zone node: the map shows her there, and saves it.
  private walkTo(id: string): void {
    if (id !== this.stand) {
      saveStand(id);
      this.scene.restart();
    }
  }

  // Plays the zone she stands on.
  private play(): void {
    this.scene.start("zone", { node: this.stand } satisfies ZoneData);
  }

  private slice(key: string, rect: Rect): GameObjects.NineSlice {
    const entry = (this.cache.json.get(ART_MANIFEST_KEY) as ArtManifest).sprites.find(
      (sprite) => sprite.key === key,
    );
    const slice = entry?.slice;
    if (!slice) {
      throw new Error(`No 9-slice edges for ${key}`);
    }
    const { bottom, left, right, top } = slice;
    return this.add
      .nineslice(rect.x, rect.y, key, undefined, rect.width, rect.height, left, right, top, bottom)
      .setOrigin(0);
  }

  private colour(name: string): number {
    const hex = this.colours[name];
    if (hex === undefined) {
      throw new Error(`The palette has no ${name}`);
    }
    return Number.parseInt(hex.slice(1), 16);
  }
}

function sameControl(a: Control, b: Control): boolean {
  return a.kind === b.kind && (a.kind === "continue" || a.id === (b as { id: string }).id);
}
