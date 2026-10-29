import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { TEXT } from "../data/text";
import { centredLabel, PLAY_MARK } from "./buttonLabel";
import { CARD_TEXT_SCALE } from "./pauseCard";
import { startScreenLayout } from "./startScreen";

const button = { height: 28, width: 72, x: 452, y: 198 };

describe("centredLabel", () => {
  it.each([
    { expected: { labelX: 468 }, ink: 40, mark: undefined, name: "an even label" },
    {
      expected: { labelX: 469 },
      ink: 39,
      mark: undefined,
      name: "an odd label, its spare pixel before it",
    },
    { expected: { labelX: 452 }, ink: 72, mark: undefined, name: "a label as wide as the button" },
    {
      expected: { labelX: 474, markX: 463 },
      ink: 40,
      mark: { gap: 6, width: 5 },
      name: "a label with a mark before it",
    },
  ])("places $name", ({ expected, ink, mark }) => {
    expect(centredLabel(button, ink, mark)).toEqual(expected);
  });

  it.each([
    { ink: 40, mark: undefined },
    { ink: 41, mark: undefined },
    { ink: 40, mark: { gap: 6, width: 5 } },
  ])(
    "leaves at most a pixel more room before the group than after it ($ink px)",
    ({ ink, mark }) => {
      const { labelX, markX } = centredLabel(button, ink, mark);
      const before = (markX ?? labelX) - button.x;
      const after = button.x + button.width - (labelX + ink);
      expect(before - after).toBeGreaterThanOrEqual(0);
      expect(before - after).toBeLessThanOrEqual(1);
    },
  );

  it.each([
    ["Start", TEXT.start.start],
    ["Continue", TEXT.start.continue],
  ])("fits the start screen's %s label, led by the play mark, on its button", (_, text) => {
    const { button: start } = startScreenLayout(true).start;
    const ink = inkWidth(parseBitmapFont(fontBody), CARD_TEXT_SCALE, text);
    const { labelX, markX } = centredLabel(start, ink, PLAY_MARK);
    const margins = [(markX ?? labelX) - start.x, start.x + start.width - (labelX + ink)];
    expect(Math.min(...margins)).toBeGreaterThan(0);
  });

  it("puts Start's play mark and label where art's worked example does", () => {
    const ink = inkWidth(parseBitmapFont(fontBody), CARD_TEXT_SCALE, TEXT.start.start);
    expect(centredLabel(startScreenLayout(true).start.button, ink, PLAY_MARK)).toEqual({
      labelX: 349,
      markX: 338,
    });
  });
});
