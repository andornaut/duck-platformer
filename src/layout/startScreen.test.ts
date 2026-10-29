import { containsPoint, rectsOverlap } from "@andornaut/game-kit/rect";
import { describe, expect, it } from "vitest";

import buttonSheet from "../../public/art/sprites/ui-icon-button.json";
import startSheet from "../../public/art/sprites/ui-start.json";
import { SCREEN } from "../data/screen";
import type { Rect } from "../data/types";
import { type IconButtonLayout, startScreenLayout } from "./startScreen";

// A touch target is at least this many base pixels on each side (art/README.md, UI).
const MIN_TARGET = 44;
// A nav icon's size (art/README.md, Start screen).
const NAV_ICON = 20;
const SCREEN_RECT: Rect = { ...SCREEN, x: 0, y: 0 };

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
const face = ({ at }: IconButtonLayout): Rect => ({ ...frameOf(buttonSheet), ...at });

describe.each([
  ["with Exit", true],
  ["without Exit", false],
])("the start screen %s", (_, exitShown) => {
  const layout = startScreenLayout(exitShown);
  const buttons: [string, IconButtonLayout][] = [
    ["settings", layout.settings],
    ...(layout.exit === undefined ? [] : [["exit", layout.exit] as [string, IconButtonLayout]]),
  ];
  const hits: [string, Rect][] = [
    ["start", layout.start.button],
    ...buttons.map(([name, button]): [string, Rect] => [name, button.hit]),
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

  it("ends the nav with Exit, or with Settings in Exit's place where there is no Exit", () => {
    const last = layout.exit ?? layout.settings;
    const withExit = startScreenLayout(true).exit;
    expect({
      lastIsExit: last === layout.exit,
      settingsBeforeExit:
        layout.exit === undefined || right(layout.settings.hit) <= layout.exit.hit.x,
      x: last.at.x,
    }).toEqual({ lastIsExit: exitShown, settingsBeforeExit: true, x: withExit?.at.x });
  });

  it.each(buttons)("draws %s's face and icon on the nav, inside its hit area", (__, button) => {
    const icon = { height: NAV_ICON, width: NAV_ICON, ...button.icon };
    const pressedIcon = { height: NAV_ICON, width: NAV_ICON, ...button.pressedIcon };
    expect({
      face: inside(button.hit, face(button)) && inside(layout.nav, face(button)),
      icon: inside(face(button), icon) && inside(face(button), pressedIcon),
    }).toEqual({ face: true, icon: true });
  });

  it("sizes Start to its art, under the nav bar", () => {
    const { button } = layout.start;
    expect({
      below: button.y >= layout.nav.y + layout.nav.height,
      size: { height: button.height, width: button.width },
    }).toEqual({ below: true, size: frameOf(startSheet) });
  });
});
