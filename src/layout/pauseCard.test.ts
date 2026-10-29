import { containsPoint, rectsOverlap } from "@andornaut/game-kit/rect";
import { describe, expect, it } from "vitest";

import checkboxSheet from "../../public/art/sprites/ui-checkbox.json";
import pauseSheet from "../../public/art/sprites/ui-pause.json";
import quitSheet from "../../public/art/sprites/ui-quit.json";
import { SCREEN } from "../data/screen";
import type { Rect } from "../data/types";
import { PAUSE_BUTTON, PAUSE_CARD } from "./pauseCard";

// A touch target is at least this many base pixels on each side (art/README.md, UI).
const MIN_TARGET = 44;

const HIT_AREAS: [string, Rect][] = [
  ["close", PAUSE_CARD.close.hit],
  ["pause button", PAUSE_BUTTON.hit],
  ["quit row", PAUSE_CARD.quit.row],
  ["resume", PAUSE_CARD.resume.hit],
  ["touch controls row", PAUSE_CARD.touchControls.row],
];

const SCREEN_RECT: Rect = { ...SCREEN, x: 0, y: 0 };

function inside(outer: Rect, inner: Rect): boolean {
  return (
    containsPoint(outer, inner.x, inner.y) &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

describe("pause card layout", () => {
  it.each(HIT_AREAS)("%s is a touch target inside the screen", (_, hit) => {
    expect({
      inside: inside(SCREEN_RECT, hit),
      large: hit.width >= MIN_TARGET && hit.height >= MIN_TARGET,
    }).toEqual({ inside: true, large: true });
  });

  it.each(HIT_AREAS.filter(([name]) => name !== "pause button"))(
    "%s lies on the card",
    (_, hit) => {
      expect(inside(PAUSE_CARD.card, hit)).toBe(true);
    },
  );

  it("has no two hit areas overlapping", () => {
    const overlapping = HIT_AREAS.flatMap(([a, first], i) =>
      HIT_AREAS.slice(i + 1)
        .filter(([, second]) => rectsOverlap(first, second))
        .map(([b]) => `${a} and ${b}`),
    );
    expect(overlapping).toEqual([]);
  });

  // Each sprite's frame, at its point, lies inside the area that presses it.
  it.each([
    ["checkbox", checkboxSheet, PAUSE_CARD.touchControls.checkbox, PAUSE_CARD.touchControls.row],
    ["pause button", pauseSheet, PAUSE_BUTTON.at, PAUSE_BUTTON.hit],
    ["quit icon", quitSheet, PAUSE_CARD.quit.icon, PAUSE_CARD.quit.row],
  ] as const)("draws the %s inside its hit area", (_, sheet, at, hit) => {
    const { h: height, w: width } = Object.values(sheet.frames)[0]?.frame ?? { h: 0, w: 0 };
    expect(inside(hit, { height, width, ...at })).toBe(true);
  });
});
