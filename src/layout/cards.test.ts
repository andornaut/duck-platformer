import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
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
import { HIT_RULE, type PressArea, pressedArea } from "./hitAreas";
import { CARD_TEXT_SCALE, PAUSE_BUTTON, PAUSE_CARD } from "./pauseCard";
import { focusRingAround, SETTINGS_CARD, STEPS_CARD } from "./settingsCard";

const FONT = parseBitmapFont(fontBody);
const SCREEN_RECT: Rect = { ...SCREEN, x: 0, y: 0 };

// Each card's buttons, by name: where each is drawn, on its card, and its press area. The pause
// button sits on the zone instead.
const CARDS: [string, Rect, PressArea<string>[]][] = [
  [
    "pause card",
    PAUSE_CARD.card,
    [
      { art: PAUSE_CARD.close.art, hit: PAUSE_CARD.close.hit, key: "close" },
      { art: PAUSE_CARD.home.row, hit: PAUSE_CARD.home.hit, key: "return home row" },
      { art: PAUSE_CARD.resume.art, hit: PAUSE_CARD.resume.hit, key: "resume" },
      { art: PAUSE_CARD.settings.row, hit: PAUSE_CARD.settings.hit, key: "settings row" },
    ],
  ],
  [
    "settings card",
    SETTINGS_CARD.card,
    [
      { art: SETTINGS_CARD.close.art, hit: SETTINGS_CARD.close.hit, key: "close" },
      { art: SETTINGS_CARD.install.row, hit: SETTINGS_CARD.install.hit, key: "install row" },
      {
        art: SETTINGS_CARD.touchControls.row,
        hit: SETTINGS_CARD.touchControls.hit,
        key: "touch controls row",
      },
    ],
  ],
  [
    "settings card without Install",
    SETTINGS_CARD.cardWithoutInstall,
    [
      { art: SETTINGS_CARD.close.art, hit: SETTINGS_CARD.close.hit, key: "close" },
      {
        art: SETTINGS_CARD.touchControls.row,
        hit: SETTINGS_CARD.touchControls.hit,
        key: "touch controls row",
      },
    ],
  ],
  [
    "install steps card",
    STEPS_CARD.card,
    [{ art: STEPS_CARD.close.art, hit: STEPS_CARD.close.hit, key: "close" }],
  ],
];

const HIT_AREAS: [string, Rect][] = [
  ["pause button", PAUSE_BUTTON.hit],
  ...CARDS.flatMap(([card, , areas]) =>
    areas.map(({ hit, key }): [string, Rect] => [`${card}'s ${key}`, hit]),
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
  it.each(HIT_AREAS)(
    "%s is a touch target, its part on the screen at least the least size",
    (_, hit) => {
      const width = Math.min(SCREEN_RECT.width, hit.x + hit.width) - Math.max(0, hit.x);
      const height = Math.min(SCREEN_RECT.height, hit.y + hit.height) - Math.max(0, hit.y);
      expect(Math.min(width, height)).toBeGreaterThanOrEqual(HIT_RULE.minTarget);
    },
  );

  it.each(CARDS)("the %s holds its buttons, no two drawn overlapping", (_, card, areas) => {
    const outside = areas.filter(({ art }) => !inside(card, art)).map(({ key }) => key);
    const overlapping = areas.flatMap((first, i) =>
      areas
        .slice(i + 1)
        .filter((second) => rectsOverlap(first.art, second.art))
        .map((second) => `${first.key} and ${second.key}`),
    );
    expect({ outside, overlapping }).toEqual({ outside: [], overlapping: [] });
  });

  // A press anywhere on a drawn button takes that button, however the press areas overlap.
  it.each(CARDS.flatMap(([card, , areas]) => areas.map((area) => [card, area, areas] as const)))(
    "on the %s, takes every press on its drawn %s as it",
    (_, { art, key }, areas) => {
      const corners = [
        { x: art.x, y: art.y },
        { x: art.x + art.width - 1, y: art.y + art.height - 1 },
      ];
      expect(corners.map((point) => pressedArea(areas, point))).toEqual([key, key]);
    },
  );

  // Each sprite's frame, at its point, lies inside the area that presses it.
  it.each([
    ["pause button", pauseSheet, PAUSE_BUTTON.at, PAUSE_BUTTON.hit],
    ["return home icon", quitSheet, PAUSE_CARD.home.icon, PAUSE_CARD.home.row],
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

  it("has a glyph for every character of the build label, which fits across the card", () => {
    const { buildLabel, card, title } = SETTINGS_CARD;
    const half = inkWidth(FONT, CARD_TEXT_SCALE, BUILD_LABEL) / 2;
    const margin = title.x - card.x;
    expect({
      fits:
        buildLabel.centreX - half >= card.x + margin &&
        buildLabel.centreX + half <= card.x + card.width - margin,
      missing: [...BUILD_LABEL].filter((char) => !FONT.glyphs.has(char)),
    }).toEqual({ fits: true, missing: [] });
  });

  it.each([
    ["touch controls row", SETTINGS_CARD.touchControls.row],
    ["install row", SETTINGS_CARD.install.row],
  ])("rings the %s inside the screen", (_, row) => {
    expect(inside(SCREEN_RECT, focusRingAround(row))).toBe(true);
  });
});
