import { describe, expect, it } from "vitest";

import { CARD_FRAME, cardRect, cardTitleAt } from "./cardFrame";

describe("cardTitleAt", () => {
  // Art's rule on its 368-wide card at x 176: origin x = 358 - floor((A - 4) / 2), y 96.
  it.each([38, 39])("centres a title %i px in advance as art does", (advance) => {
    expect(cardTitleAt(cardRect(100), advance)).toEqual({
      x: 358 - Math.floor((advance - 4) / 2),
      y: 96,
    });
  });
});

describe("every card", () => {
  it("puts the close X inside the card's top-left corner, and the first row below the title", () => {
    const card = cardRect(100);
    const { art } = CARD_FRAME.close;
    expect({
      inCorner: art.x < card.x + card.width / 2 && art.x >= card.x && art.y >= card.y,
      rowBelowTitle: CARD_FRAME.firstRowY > CARD_FRAME.titleY,
    }).toEqual({ inCorner: true, rowBelowTitle: true });
  });
});
