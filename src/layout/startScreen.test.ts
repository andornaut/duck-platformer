import { containsPoint } from "@andornaut/game-kit/rect";
import { describe, expect, it } from "vitest";

import buttonSheet from "../../public/art/sprites/ui-icon-button.json";
import startSheet from "../../public/art/sprites/ui-start.json";
import { SCREEN } from "../data/screen";
import type { Rect } from "../data/types";
import { HIT_RULE, type PressArea, pressedArea } from "./hitAreas";
import type { LabelledButton } from "./restartCard";
import { type IconButtonLayout, startScreenLayout } from "./startScreen";

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
  ["with Exit, with no save", true, false],
  ["without Exit, with no save", false, false],
  ["with Exit and a save", true, true],
  ["without Exit, with a save", false, true],
])("the start screen %s", (_, exitShown, saved) => {
  const layout = startScreenLayout(exitShown, saved);
  const texts: [string, LabelledButton][] = [
    ["start", layout.start],
    ...(layout.restart === undefined
      ? []
      : [["restart", layout.restart] as [string, LabelledButton]]),
  ];
  const buttons: [string, IconButtonLayout][] = [
    ["settings", layout.settings],
    ...(layout.exit === undefined ? [] : [["exit", layout.exit] as [string, IconButtonLayout]]),
  ];
  const hits: [string, Rect][] = [
    ...texts.map(([name, button]): [string, Rect] => [name, button.hit]),
    ...buttons.map(([name, button]): [string, Rect] => [name, button.hit]),
  ];
  const areas: PressArea<string>[] = [
    ...texts.map(([key, { button, hit }]) => ({ art: button, hit, key })),
    ...buttons.map(([key, { art, hit }]) => ({ art, hit, key })),
  ];

  it.each(hits)(
    "makes %s a touch target, its part on the screen at least the least size",
    (__, hit) => {
      const width = Math.min(SCREEN_RECT.width, hit.x + hit.width) - Math.max(0, hit.x);
      const height = Math.min(SCREEN_RECT.height, hit.y + hit.height) - Math.max(0, hit.y);
      expect(Math.min(width, height)).toBeGreaterThanOrEqual(HIT_RULE.minTarget);
    },
  );

  // A press anywhere on a drawn button takes that button, however the press areas overlap.
  it.each(areas)("takes every press on $key's drawn button as $key", ({ art, key }) => {
    const corners = [
      { x: art.x, y: art.y },
      { x: art.x + art.width - 1, y: art.y + art.height - 1 },
    ];
    expect(corners.map((point) => pressedArea(areas, point))).toEqual([key, key]);
  });

  it("ends the nav with Exit, or with Settings in Exit's place where there is no Exit", () => {
    const last = layout.exit ?? layout.settings;
    const withExit = startScreenLayout(true, saved).exit;
    expect({
      lastIsExit: last === layout.exit,
      settingsBeforeExit:
        layout.exit === undefined || right(layout.settings.art) <= layout.exit.art.x,
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

  it.each(texts)("sizes %s to Start's art, under the nav bar, on the screen", (__, { button }) => {
    expect({
      below: button.y >= layout.nav.y + layout.nav.height,
      onScreen: inside(SCREEN_RECT, button),
      size: { height: button.height, width: button.width },
    }).toEqual({ below: true, onScreen: true, size: frameOf(startSheet) });
  });

  it("shows Restart only with a save, beside Continue in Start's row, the two centred on Start", () => {
    const alone = startScreenLayout(exitShown, false).start.button;
    const { restart, start } = layout;
    const row = restart && {
      centre: (start.button.x + right(restart.button)) / 2,
      clear: right(start.button) < restart.button.x,
      y: restart.button.y,
    };
    expect(row).toEqual(
      saved ? { centre: alone.x + alone.width / 2, clear: true, y: alone.y } : undefined,
    );
  });
});
