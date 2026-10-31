import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { ZONE_MAP } from "../data/map";
import { TEXT } from "../data/text";
import { TEXT_BUTTON } from "./buttonLabel";
import { type PressArea, pressedArea } from "./hitAreas";
import { CARD_TEXT_SCALE } from "./pauseCard";
import { STAGE_SELECT_CARD } from "./stageSelectCard";

describe("stage picker layout", () => {
  it.each(ZONE_MAP.destinations.flatMap(({ stages }) => stages))(
    "fits stage %s without shrinking",
    (id) => {
      const ink = inkWidth(parseBitmapFont(fontBody), CARD_TEXT_SCALE, TEXT.map.stages[id]!);
      expect(ink).toBeLessThanOrEqual(
        STAGE_SELECT_CARD.buttons[0]!.button.width - 2 * TEXT_BUTTON.inset,
      );
    },
  );
  it("keeps each row and close action independently pressable", () => {
    const areas: PressArea<string>[] = [
      ...STAGE_SELECT_CARD.buttons.map((row, index) => ({
        art: row.button,
        hit: row.hit,
        key: String(index),
      })),
      { art: STAGE_SELECT_CARD.close.art, hit: STAGE_SELECT_CARD.close.hit, key: "close" },
    ];
    for (const { art, key } of areas) {
      expect(pressedArea(areas, { x: art.x + art.width / 2, y: art.y + art.height / 2 })).toBe(key);
    }
  });
});
