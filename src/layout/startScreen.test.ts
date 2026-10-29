import { containsPoint, rectsOverlap } from "@andornaut/game-kit/rect";
import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontTitle from "../../public/art/fonts/font-title.fnt?raw";
import settingsSheet from "../../public/art/sprites/icon-settings.json";
import quitSheet from "../../public/art/sprites/ui-quit.json";
import resumeSheet from "../../public/art/sprites/ui-resume.json";
import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { CARD_TEXT_SCALE } from "./pauseCard";
import { startScreenLayout } from "./startScreen";

// A touch target is at least this many base pixels on each side (art/README.md, UI).
const MIN_TARGET = 44;
const SCREEN_RECT: Rect = { ...SCREEN, x: 0, y: 0 };
const TITLE = parseBitmapFont(fontTitle);

function inside(outer: Rect, inner: Rect): boolean {
  return (
    containsPoint(outer, inner.x, inner.y) &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

const frameOf = (sheet: { frames: Record<string, { frame: { h: number; w: number } }> }) => {
  const { h: height, w: width } = Object.values(sheet.frames)[0]?.frame ?? { h: 0, w: 0 };
  return { height, width };
};

const right = (rect: Rect) => rect.x + rect.width;

describe.each([
  ["with Exit", true],
  ["without Exit", false],
])("the start screen %s", (_, exitShown) => {
  const layout = startScreenLayout(exitShown);
  const hits: [string, Rect][] = [
    ["settings", layout.settings.hit],
    ["start", layout.start.hit],
    ...(layout.exit === undefined ? [] : [["exit", layout.exit.hit] as [string, Rect]]),
  ];

  it.each(hits)("makes %s a touch target inside the screen", (__, hit) => {
    expect({
      inside: inside(SCREEN_RECT, hit),
      large: hit.width >= MIN_TARGET && hit.height >= MIN_TARGET,
    }).toEqual({ inside: true, large: true });
  });

  it("has no two hit areas overlapping", () => {
    const overlapping = hits.flatMap(([a, first], i) =>
      hits
        .slice(i + 1)
        .filter(([, second]) => rectsOverlap(first, second))
        .map(([b]) => `${a} and ${b}`),
    );
    expect(overlapping).toEqual([]);
  });

  it("ends the nav with Exit, or with Settings where there is no Exit", () => {
    const last = layout.exit?.hit ?? layout.settings.hit;
    expect({
      last: right(last),
      settings: layout.exit === undefined ? right(layout.settings.hit) : layout.exit.hit.x,
    }).toEqual({ last: right(layout.nav), settings: right(layout.settings.hit) });
  });

  it.each([
    ["settings icon", settingsSheet, layout.settings.icon, layout.settings.hit],
    ...(layout.exit === undefined
      ? []
      : [["exit icon", quitSheet, layout.exit.icon, layout.exit.hit] as const]),
    ["start button", resumeSheet, layout.start.hit, layout.start.hit],
  ] as const)("draws the %s inside its hit area", (__, sheet, at, hit) => {
    expect(inside(hit, { ...frameOf(sheet), ...at })).toBe(true);
  });

  it.each(hits.filter(([name]) => name !== "start"))("puts %s on the nav bar", (__, hit) => {
    expect(inside(layout.nav, hit)).toBe(true);
  });

  it("fits Start's label across its button", () => {
    expect(inkWidth(TITLE, CARD_TEXT_SCALE, TEXT.start.start)).toBeLessThan(layout.start.hit.width);
  });
});
