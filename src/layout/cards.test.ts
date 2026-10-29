import { containsPoint, rectsOverlap } from "@andornaut/game-kit/rect";
import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { bitmapMeasure, fittingText } from "@andornaut/game-kit/text/textFit";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import installSheet from "../../public/art/sprites/icon-install.json";
import settingsSheet from "../../public/art/sprites/icon-settings.json";
import touchSheet from "../../public/art/sprites/icon-touch-controls.json";
import buttonSheet from "../../public/art/sprites/ui-button.json";
import checkboxSheet from "../../public/art/sprites/ui-checkbox.json";
import pauseSheet from "../../public/art/sprites/ui-pause.json";
import quitSheet from "../../public/art/sprites/ui-quit.json";
import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Point, Rect } from "../data/types";
import { CARD_TEXT_SCALE, PAUSE_BUTTON, PAUSE_CARD } from "./pauseCard";
import { SETTINGS_CARD, STEPS_CARD } from "./settingsCard";

// A touch target is at least this many base pixels on each side (art/README.md, UI).
const MIN_TARGET = 44;
const FONT = parseBitmapFont(fontBody);
const SCREEN_RECT: Rect = { ...SCREEN, x: 0, y: 0 };

// Each card's hit areas, by name, on its card: the pause button sits on the zone instead.
const CARDS: [string, Rect, [string, Rect][]][] = [
  [
    "pause card",
    PAUSE_CARD.card,
    [
      ["close", PAUSE_CARD.close.hit],
      ["quit row", PAUSE_CARD.quit.row],
      ["resume", PAUSE_CARD.resume.hit],
      ["settings row", PAUSE_CARD.settings.row],
    ],
  ],
  [
    "settings card",
    SETTINGS_CARD.card,
    [
      ["close", SETTINGS_CARD.close.hit],
      ["install row", SETTINGS_CARD.install.row],
      ["touch controls row", SETTINGS_CARD.touchControls.row],
    ],
  ],
  [
    "settings card without Install",
    SETTINGS_CARD.cardWithoutInstall,
    [
      ["close", SETTINGS_CARD.close.hit],
      ["touch controls row", SETTINGS_CARD.touchControls.row],
    ],
  ],
  ["install steps card", STEPS_CARD.card, [["close", STEPS_CARD.close.hit]]],
];

const HIT_AREAS: [string, Rect][] = [
  ["pause button", PAUSE_BUTTON.hit],
  ...CARDS.flatMap(([card, , hits]) =>
    hits.map(([name, hit]): [string, Rect] => [`${card}'s ${name}`, hit]),
  ),
];

function inside(outer: Rect, inner: Rect): boolean {
  return (
    containsPoint(outer, inner.x, inner.y) &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

const frameOf = (sheet: { frames: Record<string, { frame: { h: number; w: number } }> }) =>
  Object.values(sheet.frames)[0]?.frame ?? { h: 0, w: 0 };

const textRect = (at: Point, text: string): Rect => ({
  height: 1,
  width: inkWidth(FONT, CARD_TEXT_SCALE, text),
  ...at,
});

describe("card layouts", () => {
  it.each(HIT_AREAS)("%s is a touch target inside the screen", (_, hit) => {
    expect({
      inside: inside(SCREEN_RECT, hit),
      large: hit.width >= MIN_TARGET && hit.height >= MIN_TARGET,
    }).toEqual({ inside: true, large: true });
  });

  it.each(CARDS)("the %s holds its hit areas, no two overlapping", (_, card, hits) => {
    const outside = hits.filter(([, hit]) => !inside(card, hit)).map(([name]) => name);
    const overlapping = hits.flatMap(([a, first], i) =>
      hits
        .slice(i + 1)
        .filter(([, second]) => rectsOverlap(first, second))
        .map(([b]) => `${a} and ${b}`),
    );
    expect({ outside, overlapping }).toEqual({ outside: [], overlapping: [] });
  });

  // Each sprite's frame, at its point, lies inside the area that presses it.
  it.each([
    ["pause button", pauseSheet, PAUSE_BUTTON.at, PAUSE_BUTTON.hit],
    ["quit icon", quitSheet, PAUSE_CARD.quit.icon, PAUSE_CARD.quit.row],
    ["settings icon", settingsSheet, PAUSE_CARD.settings.icon, PAUSE_CARD.settings.row],
    [
      "checkbox",
      checkboxSheet,
      SETTINGS_CARD.touchControls.checkbox,
      SETTINGS_CARD.touchControls.row,
    ],
    [
      "touch controls icon",
      touchSheet,
      SETTINGS_CARD.touchControls.icon,
      SETTINGS_CARD.touchControls.row,
    ],
    ["install icon", installSheet, SETTINGS_CARD.install.icon, SETTINGS_CARD.install.row],
  ] as const)("draws the %s inside its hit area", (_, sheet, at, hit) => {
    const { h: height, w: width } = frameOf(sheet);
    expect(inside(hit, { height, width, ...at })).toBe(true);
  });

  it("draws the Install button inside its row, at least as large as its 9-slice", () => {
    const { button, row } = SETTINGS_CARD.install;
    const { h, w } = frameOf(buttonSheet);
    expect({ fits: inside(row, button), large: button.width >= w && button.height >= h }).toEqual({
      fits: true,
      large: true,
    });
  });
});

describe("settings words", () => {
  const words = TEXT.settings;
  const { install, touchControls } = SETTINGS_CARD;

  const stateLeft = (state: string) =>
    touchControls.stateRight - inkWidth(FONT, CARD_TEXT_SCALE, state);

  // Each label ends before what follows it on its row.
  it.each([
    [
      "Touch controls",
      "Hidden",
      textRect(touchControls.label, words.touchControls),
      stateLeft(words.hidden),
    ],
    [
      "Touch controls",
      "Shown",
      textRect(touchControls.label, words.touchControls),
      stateLeft(words.shown),
    ],
    ["Install", "its button", textRect(install.label, words.install), install.button.x],
  ])("%s ends before %s", (_, __, label, next) => {
    expect(label.x + label.width).toBeLessThan(next);
  });

  it("fits the Install button's label in its room", () => {
    expect(inkWidth(FONT, CARD_TEXT_SCALE, words.installButton)).toBeLessThanOrEqual(
      install.buttonLabel.room,
    );
  });

  it.each(
    (["firefoxAndroid", "ios"] as const).flatMap((browser) =>
      (["first", "second"] as const).map(
        (step) => [browser, step, words.installSteps[browser][step]] as const,
      ),
    ),
  )("fits %s's %s step in its lines", (_, __, text) => {
    const style = { lines: STEPS_CARD.lines, scale: CARD_TEXT_SCALE };
    const fitted = fittingText(style, bitmapMeasure(FONT), STEPS_CARD.room, text);
    const widest = Math.max(...fitted.lines.map((line) => inkWidth(FONT, CARD_TEXT_SCALE, line)));
    expect({
      lines: fitted.lines.length <= STEPS_CARD.lines,
      wide: widest <= STEPS_CARD.room,
    }).toEqual({
      lines: true,
      wide: true,
    });
  });
});
