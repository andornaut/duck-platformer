import { containsPoint } from "@andornaut/game-kit/rect";
import { inkWidth } from "@andornaut/game-kit/text/bitmapFont";
import {
  phaserBitmapFont,
  type PhaserFontData,
} from "@andornaut/game-kit/text/phaser/phaserBitmapFont";
import { type GameObjects, type Input, Scene } from "phaser";

import { ZONE_MAP } from "../data/map";
import { TILE } from "../data/screen";
import { TEXT } from "../data/text";
import type { MapNode, Point } from "../data/types";
import { MAP_SCREEN } from "../layout/mapScreen";
import { nextChoices, nextZoneNode, nodeOf } from "../rules/map";

const PALETTE = "palette";
const BODY_FONT = "font-body";
const TITLE_FONT = "font-title";
const CHOOSE_KEYS: Readonly<Record<string, -1 | 1>> = {
  ArrowLeft: -1,
  ArrowRight: 1,
  KeyA: -1,
  KeyD: 1,
};
const CONTINUE_KEYS = ["ArrowUp", "Enter", "KeyE", "KeyW", "Space"];

const centreOf = (node: MapNode): Point => ({
  x: node.at.col * TILE + TILE / 2,
  y: node.at.row * TILE + TILE / 2,
});

// The map between zones, drawn flat until art draws it: every node and path, built ones bright
// and the rest greyed out, the node she is at ringed, and the choice she would take ringed too.
// Before she plays the node she is at, Continue plays it; after, Continue takes the chosen built
// path on (Left and Right, or a tap on a node, choose), to the start again after the finish.
export class MapScene extends Scene {
  private at = ZONE_MAP.start;
  private choice = 0;
  private choices: MapNode[] = [];
  private colours: Readonly<Record<string, string>> = {};
  private marks!: GameObjects.Graphics;
  private played = false;

  constructor() {
    super("map");
  }

  init(data: { at?: string; played?: boolean }): void {
    this.at = data.at ?? ZONE_MAP.start;
    this.played = data.played ?? false;
    this.choice = 0;
    this.choices = this.played ? nextChoices(ZONE_MAP, this.at) : [];
  }

  create(): void {
    this.colours = (this.cache.json.get(PALETTE) as { colours: Record<string, string> }).colours;
    this.cameras.main.setBackgroundColor(this.colour("ink"));
    const { button, textScale, title } = MAP_SCREEN;
    this.add.bitmapText(title.x, title.y, TITLE_FONT, TEXT.map.title).setScale(textScale);
    this.marks = this.add.graphics();
    this.add
      .rectangle(button.x, button.y, button.width, button.height, this.colour("amber"))
      .setOrigin(0);
    const font = phaserBitmapFont(this.cache.bitmapFont.get(BODY_FONT).data as PhaserFontData);
    const label = TEXT.map.continue;
    this.add
      .bitmapText(
        button.x + Math.floor((button.width - inkWidth(font, textScale, label)) / 2),
        button.y + Math.floor(button.height / 2) - textScale * 4,
        BODY_FONT,
        label,
      )
      .setScale(textScale)
      .setTint(this.colour("ink"));
    this.draw();
    this.input.keyboard?.on("keydown", (event: KeyboardEvent) => this.key(event.code));
    this.input.on("pointerdown", (pointer: Input.Pointer) =>
      this.tap({ x: pointer.x, y: pointer.y }),
    );
  }

  private colour(name: string): number {
    return Number.parseInt((this.colours[name] ?? "#ffffff").slice(1), 16);
  }

  private draw(): void {
    const marks = this.marks.clear();
    for (const edge of ZONE_MAP.edges) {
      const from = centreOf(nodeOf(ZONE_MAP, edge.from));
      const to = centreOf(nodeOf(ZONE_MAP, edge.to));
      marks.lineStyle(edge.built ? 2 : 1, this.colour(edge.built ? "cream" : "slate"));
      marks.lineBetween(from.x, from.y, to.x, to.y);
    }
    const reachable = new Set(
      ZONE_MAP.edges.filter((edge) => edge.built).flatMap((edge) => [edge.from, edge.to]),
    );
    const { nodeRadius } = MAP_SCREEN;
    for (const node of ZONE_MAP.nodes) {
      const { x, y } = centreOf(node);
      marks.fillStyle(this.colour(reachable.has(node.id) ? "cream" : "slate"));
      if (node.kind === "zone") {
        marks.fillCircle(x, y, nodeRadius);
      } else {
        marks.fillRect(x - nodeRadius / 2, y - nodeRadius / 2, nodeRadius, nodeRadius);
      }
    }
    const ring = (node: MapNode, colour: string) => {
      const { x, y } = centreOf(node);
      marks.lineStyle(2, this.colour(colour)).strokeCircle(x, y, nodeRadius + 4);
    };
    ring(nodeOf(ZONE_MAP, this.at), "amber");
    const chosen = this.choices[this.choice];
    if (chosen && this.choices.length > 1) {
      ring(chosen, "yellow");
    }
  }

  private key(code: string): void {
    const step = CHOOSE_KEYS[code];
    if (step !== undefined && this.choices.length > 1) {
      this.choice = (this.choice + step + this.choices.length) % this.choices.length;
      this.draw();
    } else if (CONTINUE_KEYS.includes(code)) {
      this.goOn();
    }
  }

  private tap(point: Point): void {
    if (containsPoint(MAP_SCREEN.button, point.x, point.y)) {
      this.goOn();
      return;
    }
    const index = this.choices.findIndex((node) => {
      const centre = centreOf(node);
      return Math.hypot(point.x - centre.x, point.y - centre.y) <= MAP_SCREEN.nodeRadius * 2;
    });
    if (index >= 0) {
      this.choice = index;
      this.draw();
    }
  }

  // Plays the node she is at, or after it, the next zone along the chosen built path.
  private goOn(): void {
    if (!this.played) {
      this.scene.start("zone", { node: this.at });
      return;
    }
    const next = nextZoneNode(ZONE_MAP, this.at, this.choices[this.choice]?.id);
    this.scene.start("zone", { node: (next ?? nodeOf(ZONE_MAP, ZONE_MAP.start)).id });
  }
}
