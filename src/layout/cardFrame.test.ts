import { describe, expect, it } from "vitest";

import { CARD_FRAME, cardRect, cardTitleAt } from "./cardFrame";
import { PAUSE_CARD } from "./pauseCard";
import { CELEBRATION, RESTART_CARD } from "./restartCard";
import { SETTINGS_CARD, STEPS_CARD } from "./settingsCard";

describe("cardTitleAt", () => {
  // Art's rule on its 368-wide card at x 176: origin x = 358 - floor((A - 4) / 2), y 96.
  it.each([38, 39, 64, 91])("centres a title %i px in advance as art does", (advance) => {
    expect(cardTitleAt(cardRect(100), advance)).toEqual({
      x: 358 - Math.floor((advance - 4) / 2),
      y: 96,
    });
  });
});

describe("every card", () => {
  it.each([
    ["pause", PAUSE_CARD.card],
    ["settings", SETTINGS_CARD.card],
    ["settings without Install", SETTINGS_CARD.cardWithoutInstall],
    ["install steps", STEPS_CARD.card],
    ["restart", RESTART_CARD.card],
    ["celebration", CELEBRATION.card],
  ])("shares the frame: the %s card", (_, card) => {
    expect({ ...card, height: 0 }).toEqual(cardRect(0));
  });

  it("puts the close X inside the card's top-right corner, and the first row below the title", () => {
    const card = cardRect(100);
    const { art } = CARD_FRAME.close;
    expect({
      inCorner: art.x + art.width <= card.x + card.width && art.y >= card.y,
      rowBelowTitle: CARD_FRAME.firstRowY > CARD_FRAME.titleY,
    }).toEqual({ inCorner: true, rowBelowTitle: true });
  });
});
