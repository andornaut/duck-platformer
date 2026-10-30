import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
import { containsPoint, rectsOverlap } from "@andornaut/game-kit/rect";
import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { overflowingTexts } from "@andornaut/game-kit/text/overflow";
import { bitmapMeasure, fittingText } from "@andornaut/game-kit/text/textFit";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import manifestJson from "../../public/art/manifest.json";
import buttonSheet from "../../public/art/sprites/ui-button.json";
import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Point, Rect } from "../data/types";
import type { ArtManifest } from "../view/aseprite";
import { CARD_FRAME } from "./cardFrame";
import { type PressArea, pressedArea } from "./hitAreas";
import { CARD_TEXT_SCALE, PAUSE_CARD } from "./pauseCard";
import { focusRingAround, SETTINGS_CARD, STEPS_CARD } from "./settingsCard";

const FONT = parseBitmapFont(fontBody);
// Art's 9-slice edges, by sprite key.
const MANIFEST_SLICES = Object.fromEntries(
  (manifestJson as ArtManifest).sprites.flatMap(({ key, slice }) => (slice ? [[key, slice]] : [])),
);
const SETTINGS = ["moveControls", "actionButtons"] as const;
const SCREEN_RECT: Rect = { ...SCREEN, x: 0, y: 0 };

// The touch settings' rows, as press areas named for their settings.
function settingAreas(): CardButton[] {
  return SETTINGS.map((setting) => ({
    art: SETTINGS_CARD[setting].row,
    hit: SETTINGS_CARD[setting].hit,
    key: `${setting} row`,
  }));
}

// Each card's buttons, by name: where each is drawn, on its card, and its press area. The pause
// button sits on the zone instead.
// Card buttons press in rects.
type CardButton = PressArea<string> & { readonly hit: Rect };

const CARDS: [string, Rect, CardButton[]][] = [
  [
    "pause card",
    PAUSE_CARD.card,
    [
      { art: PAUSE_CARD.close.art, hit: PAUSE_CARD.close.hit, key: "close" },
      { art: PAUSE_CARD.home.button, hit: PAUSE_CARD.home.hit, key: "back to title" },
      { art: PAUSE_CARD.resume.button, hit: PAUSE_CARD.resume.hit, key: "resume" },
      { art: PAUSE_CARD.settings.button, hit: PAUSE_CARD.settings.hit, key: "settings" },
    ],
  ],
  [
    "settings card",
    SETTINGS_CARD.card,
    [
      { art: SETTINGS_CARD.close.art, hit: SETTINGS_CARD.close.hit, key: "close" },
      { art: SETTINGS_CARD.install.row, hit: SETTINGS_CARD.install.hit, key: "install row" },
      ...settingAreas(),
    ],
  ],
  [
    "settings card without Install",
    SETTINGS_CARD.cardWithoutInstall,
    [
      { art: SETTINGS_CARD.close.art, hit: SETTINGS_CARD.close.hit, key: "close" },
      ...settingAreas(),
    ],
  ],
  [
    "install steps card",
    STEPS_CARD.card,
    [{ art: STEPS_CARD.close.art, hit: STEPS_CARD.close.hit, key: "close" }],
  ],
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

  it("draws the Install button inside its row, at least as large as its 9-slice", () => {
    const { button, row } = SETTINGS_CARD.install;
    const { h, w } = frameOf(buttonSheet);
    expect({ fits: inside(row, button), large: button.width >= w && button.height >= h }).toEqual({
      fits: true,
      large: true,
    });
  });
});

describe("pause card", () => {
  const buttons = (["resume", "settings", "home"] as const).map(
    (name) => [name, PAUSE_CARD[name], TEXT.pause[name]] as const,
  );

  // Each label fits across its button inside the button's 9-slice edges, and centres there with
  // room either side.
  it("fits each button's label in its room", () => {
    const slice = MANIFEST_SLICES["ui-button"];
    const roles = buttons.map(([name, { button }, text]) => ({
      name: `${name} button`,
      room: button.width - (slice?.left ?? 0) - (slice?.right ?? 0),
      style: { scale: CARD_TEXT_SCALE },
      texts: [text],
    }));
    expect(overflowingTexts(bitmapMeasure(FONT), roles)).toEqual([]);
  });

  it("stacks Resume, Settings and Back to title in that order, all one shape", () => {
    const rects = buttons.map(([, { button }]) => button);
    expect({
      order: rects.every((rect, i) => i === 0 || (rects[i - 1]?.y ?? 0) < rect.y),
      shapes: new Set(rects.map(({ height, width, x }) => `${x} ${width}x${height}`)).size,
    }).toEqual({ order: true, shapes: 1 });
  });
});

describe("settings words", () => {
  const words = TEXT.settings;
  const { install } = SETTINGS_CARD;

  // Each label ends before what follows it on its row.
  it.each<readonly [string, string, Rect, number]>([
    ...SETTINGS.map((setting) => {
      const { label, toggle } = SETTINGS_CARD[setting];
      return [words[setting], "its switch", textRect(label, words[setting]), toggle.x] as const;
    }),
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

  // The build label sits below the card's last row and inside the card, with Install and
  // without.
  it.each([
    ["with Install", SETTINGS_CARD.card, SETTINGS_CARD.install.row, SETTINGS_CARD.buildLabel.y],
    [
      "without Install",
      SETTINGS_CARD.cardWithoutInstall,
      SETTINGS_CARD.actionButtons.row,
      SETTINGS_CARD.buildLabel.yWithoutInstall,
    ],
  ])("places the build label under the last row %s", (_, card, lastRow, y) => {
    const height = FONT.lineHeight * CARD_TEXT_SCALE;
    expect({
      belowRow: y >= lastRow.y + lastRow.height,
      inCard: y + height <= card.y + card.height,
    }).toEqual({ belowRow: true, inCard: true });
  });

  it("has a glyph for every character of the build label, which fits across the card", () => {
    const { buildLabel, card } = SETTINGS_CARD;
    const half = inkWidth(FONT, CARD_TEXT_SCALE, BUILD_LABEL) / 2;
    const margin = CARD_FRAME.padding;
    expect({
      fits:
        buildLabel.centreX - half >= card.x + margin &&
        buildLabel.centreX + half <= card.x + card.width - margin,
      missing: [...BUILD_LABEL].filter((char) => !FONT.glyphs.has(char)),
    }).toEqual({ fits: true, missing: [] });
  });

  it.each<readonly [string, Rect]>([
    ...SETTINGS.map((setting) => [`${setting} row`, SETTINGS_CARD[setting].row] as const),
    ["install row", SETTINGS_CARD.install.row],
  ])("rings the %s inside the screen", (_, row) => {
    expect(inside(SCREEN_RECT, focusRingAround(row))).toBe(true);
  });
});
