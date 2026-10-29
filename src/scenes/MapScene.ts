import { animationKey } from "@andornaut/game-kit/art/aseprite";
import { containsPoint } from "@andornaut/game-kit/rect";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { ZONE_MAP } from "../data/map";
import { TILE } from "../data/screen";
import { TEXT } from "../data/text";
import type { MapNode, Point, Rect } from "../data/types";
import {
  forkChoiceRects,
  MAP_PATH,
  MAP_PATH_LOOKS,
  MAP_SCREEN,
  mapLabel,
  type PathLook,
} from "../layout/mapScreen";
import { type MapStand, mapStand, nodeOf, walkOn } from "../rules/map";
import { ART_MANIFEST_KEY, type ArtManifest } from "../view/aseprite";
import {
  advanceWidth,
  choosing,
  firstStep,
  forkArrow,
  markerState,
  nodeCentre,
  pathLook,
} from "../view/mapMarks";
import { bentCurve, pathRects } from "../view/mapPath";

const PALETTE = "palette";
const BODY_FONT = "font-body";
const TITLE_FONT = "font-title";
const ICON_FALLBACK = "map-icon-zone";
const CHOOSE_KEYS: Readonly<Record<string, -1 | 1>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  KeyA: -1,
  KeyD: 1,
};
const CONTINUE_KEYS = ["ArrowUp", "Enter", "KeyE", "KeyW", "Space"];
// Paths are drawn in this order, so the ones that matter more lie on top.
const LOOK_ORDER: readonly PathLook[] = ["unbuilt", "built", "travelled", "selectable", "selected"];

// A control on the map: Continue, or a fork-choice button by its route's index.
type Control = "continue" | number;

interface ChoiceButton {
  readonly arrow: GameObjects.Sprite;
  readonly art: GameObjects.Sprite;
  readonly hit: Rect;
  readonly label: GameObjects.BitmapText;
}

// The map between zones, drawn as art's paper map: its pen marks, every path and node, each
// zone's name, and the duck on the node she stands on. Before she plays the node she is at,
// Continue plays it. After, she walks on to where the routes on split and chooses among them
// with a button each (Left and Right, or a tap); with one route on, Continue takes it, to the
// start again after the finish.
export class MapScene extends Scene {
  private chosen = 0;
  private choices: ChoiceButton[] = [];
  private colours: Readonly<Record<string, string>> = {};
  private continueArt: GameObjects.Sprite | undefined;
  private continueLabel: GameObjects.BitmapText | undefined;
  private paths!: GameObjects.Graphics;
  private played = false;
  private pressed: Control | undefined;
  private route: readonly string[] = [];
  private stand!: MapStand;

  constructor() {
    super("map");
  }

  // data.route: the nodes she has walked this lap, ending at the node she is at; data.played:
  // whether she has played it.
  init(data: { played?: boolean; route?: readonly string[] }): void {
    this.played = data.played ?? false;
    this.route = data.route ?? [ZONE_MAP.start];
    this.chosen = 0;
    this.choices = [];
    this.continueArt = undefined;
    this.continueLabel = undefined;
    this.pressed = undefined;
  }

  create(): void {
    this.colours = (this.cache.json.get(PALETTE) as { colours: Record<string, string> }).colours;
    this.stand = mapStand(ZONE_MAP, this.played, this.route);
    this.slice("map-paper", MAP_SCREEN.paper);
    for (const { art, at } of ZONE_MAP.decorations) {
      this.add.sprite(at.x, at.y, art).setOrigin(0).play(animationKey(art, "rest"));
    }
    this.paths = this.add.graphics();
    this.drawPaths();
    this.drawNodes();
    const { textScale, title } = MAP_SCREEN;
    this.add
      .bitmapText(title.x, title.y, TITLE_FONT, TEXT.map.title)
      .setScale(textScale)
      .setTint(this.colour("plum"));
    if (choosing(this.stand)) {
      this.addChoices();
    } else {
      this.addContinue();
    }
    this.showPressed(undefined);
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.key(event.code));
    this.input.on("pointerdown", (pointer: Input.Pointer) => {
      this.showPressed(this.controlAt(pointer));
    });
    this.input.on("pointerup", (pointer: Input.Pointer) => {
      const control = this.pressed;
      this.showPressed(undefined);
      if (control !== undefined && control === this.controlAt(pointer)) {
        this.goOn(control === "continue" ? this.chosen : control);
      }
    });
  }

  private centre(node: MapNode): Point {
    return nodeCentre(TILE, node);
  }

  private drawPaths(): void {
    const paths = this.paths.clear();
    const edges = ZONE_MAP.edges.map((edge, index) => ({
      edge,
      index,
      look: pathLook(this.stand, this.chosen, edge),
    }));
    for (const look of LOOK_ORDER) {
      const { colour, stroke, ...rest } = MAP_PATH_LOOKS[look];
      const arrow = "arrow" in rest ? rest.arrow : undefined;
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
        for (const rect of pathRects(MAP_PATH.step, stroke, arrow, ends, curve)) {
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
      const state = markerState(ZONE_MAP, this.stand, node);
      const key = `map-${node.kind}`;
      this.add
        .sprite(centre.x + marker[node.kind].x, centre.y + marker[node.kind].y, key)
        .setOrigin(0)
        .play(animationKey(key, state));
      if (node.kind === "zone" && state !== "unbuilt") {
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
    const at = nodeOf(ZONE_MAP, this.stand.at);
    const centre = this.centre(at);
    this.add
      .sprite(centre.x + duck[at.kind].x, centre.y + duck[at.kind].y, "map-duck")
      .setOrigin(0)
      .play(animationKey("map-duck", "idle"));
  }

  private addContinue(): void {
    const { hit, label } = MAP_SCREEN.continue;
    this.continueArt = this.add.sprite(hit.x, hit.y, "ui-resume").setOrigin(0);
    this.continueLabel = this.add
      .bitmapText(label.x, label.y, TITLE_FONT, TEXT.map.continue)
      .setScale(MAP_SCREEN.textScale)
      .setTint(this.colour("ink"));
  }

  private addChoices(): void {
    const { arrow, label } = MAP_SCREEN.forkChoice;
    const from = nodeOf(ZONE_MAP, this.stand.at);
    const rects = forkChoiceRects(this.stand.routes.length);
    this.choices = this.stand.routes.flatMap((route, i) => {
      const rect = rects[i];
      if (!rect) {
        return [];
      }
      const { art, hit } = rect;
      const direction = forkArrow(from, nodeOf(ZONE_MAP, firstStep(route)));
      const button = this.add.sprite(art.x, art.y, "ui-fork-choice").setOrigin(0);
      const name = TEXT.map.zones[route.zone.id] ?? "";
      return [
        {
          arrow: this.add
            .sprite(art.x + arrow.x, art.y + arrow.y, "ui-fork-arrow")
            .setOrigin(0)
            .play(animationKey("ui-fork-arrow", direction)),
          art: button,
          hit,
          label: this.add
            .bitmapText(art.x + label.x, art.y + label.y, BODY_FONT, name)
            .setScale(MAP_SCREEN.textScale),
        },
      ];
    });
  }

  // A pressed control shows its pressed look until the press lifts: Continue's label sinks, and
  // a fork-choice button turns tan; otherwise the chosen one shows selected.
  private showPressed(control: Control | undefined): void {
    this.pressed = control;
    const { label, pressedLabel } = MAP_SCREEN.continue;
    const pressed = control === "continue";
    this.continueArt?.play(animationKey("ui-resume", pressed ? "pressed" : "normal"));
    this.continueLabel?.setY(pressed ? pressedLabel.y : label.y);
    this.choices.forEach((choice, i) => {
      const tag = control === i ? "pressed" : i === this.chosen ? "selected" : "normal";
      choice.art.play(animationKey("ui-fork-choice", tag));
      choice.label.setTint(this.colour(tag === "normal" ? "cream" : "ink"));
    });
  }

  private controlAt(pointer: Input.Pointer): Control | undefined {
    if (this.continueArt && containsPoint(MAP_SCREEN.continue.hit, pointer.x, pointer.y)) {
      return "continue";
    }
    const index = this.choices.findIndex(({ hit }) => containsPoint(hit, pointer.x, pointer.y));
    return index >= 0 ? index : undefined;
  }

  private key(code: string): void {
    const step = CHOOSE_KEYS[code];
    const count = this.stand.routes.length;
    if (step !== undefined && choosing(this.stand)) {
      this.chosen = (this.chosen + step + count) % count;
      this.drawPaths();
      this.showPressed(this.pressed);
    } else if (CONTINUE_KEYS.includes(code)) {
      this.goOn(this.chosen);
    }
  }

  // Plays the node she is at, or after it, the zone at the end of route choice, or with no route
  // on, the start again.
  private goOn(choice: number): void {
    const route = this.stand.routes[choice];
    const walked = !this.played
      ? this.stand.walked
      : route
        ? walkOn(ZONE_MAP, this.stand, route)
        : [ZONE_MAP.start];
    this.scene.start("zone", { route: walked });
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
