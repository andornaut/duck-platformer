import { BUILD_LABEL } from "@andornaut/game-kit/build/buildLabel";
import { rectsOverlap } from "@andornaut/game-kit/rect";
import { expect, it } from "vitest";

import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import type { Rect } from "../data/types";
import { CARD_FONTS } from "../testing/cardFonts";
import { CARD_CONTENT, cardTextSize } from "./contentCard";
import { pressedArea } from "./hitAreas";
import { pauseCard } from "./pauseCard";
import { settingsCard, stepsCard } from "./settingsCard";

const pause = pauseCard(CARD_FONTS, TEXT.pause);
const variants = [false, true].map((install) =>
  settingsCard(CARD_FONTS, TEXT.settings, BUILD_LABEL, install),
);
const installs = (["firefoxAndroid", "ios"] as const).map((browser) =>
  stepsCard(CARD_FONTS, TEXT.settings.installSteps.title, [
    TEXT.settings.installSteps[browser].first,
    TEXT.settings.installSteps[browser].second,
  ]),
);
const inside = (outer: Rect, inner: Rect) =>
  inner.x >= outer.x &&
  inner.y >= outer.y &&
  inner.x + inner.width <= outer.x + outer.width &&
  inner.y + inner.height <= outer.y + outer.height;

it.each([pause, ...variants, ...installs])(
  "keeps measured headers and close controls inside padded cards",
  ({ card, close, title }) => {
    const interior = {
      height: card.height - 2 * CARD_CONTENT.padding,
      width: card.width - 2 * CARD_CONTENT.padding,
      x: card.x + CARD_CONTENT.padding,
      y: card.y + CARD_CONTENT.padding,
    };
    expect(inside({ ...SCREEN, x: 0, y: 0 }, card)).toBe(true);
    expect(inside(interior, close.art)).toBe(true);
    expect(inside(interior, title)).toBe(true);
    expect(title.x + title.width + CARD_CONTENT.gap).toBeLessThanOrEqual(close.art.x);
  },
);

it("sizes equal pause actions to their widest label and preserves distinct hit selection", () => {
  const actions = (["resume", "settings", "home"] as const).map((key) => ({
    art: pause[key].button,
    hit: pause[key].hit,
    key,
  }));
  const widest = Math.max(
    ...[TEXT.pause.resume, TEXT.pause.settings, TEXT.pause.home].map(
      (text) => cardTextSize(CARD_FONTS.body, text).width,
    ),
  );
  for (const action of actions) {
    expect(action.art.width).toBe(widest + 32);
    expect(
      pressedArea(actions, {
        x: action.art.x + action.art.width / 2,
        y: action.art.y + action.art.height / 2,
      }),
    ).toBe(action.key);
  }
  expect(rectsOverlap(actions[0]!.art, actions[1]!.art)).toBe(false);
});

it.each([false, true])(
  "sizes settings with install=%s and keeps labels apart from controls",
  (hasInstall) => {
    const layout = settingsCard(CARD_FONTS, TEXT.settings, BUILD_LABEL, hasInstall);
    for (const key of ["moveControls", "actionButtons"] as const) {
      const row = layout[key];
      expect(row.label.x + row.label.width + CARD_CONTENT.gap).toBeLessThanOrEqual(row.toggle.x);
      expect(inside(layout.card, row.row)).toBe(true);
    }
    const last = hasInstall ? layout.install.row : layout.actionButtons.row;
    expect(layout.buildLabel.y - last.y - last.height).toBe(CARD_CONTENT.gap);
    expect(layout.buildLabel.y + layout.buildLabel.height + CARD_CONTENT.padding).toBe(
      layout.card.y + layout.card.height,
    );
  },
);

it("grows a measured card for longer labels without changing font scale or button height", () => {
  const longer = pauseCard(CARD_FONTS, { ...TEXT.pause, home: TEXT.pause.home.repeat(2) });
  expect(longer.card.width).toBeGreaterThan(pause.card.width);
  expect(longer.home.button.height).toBe(pause.home.button.height);
});
