import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { ZONE_MAP } from "../data/map";
import { TEXT } from "../data/text";
import { CARD_FONTS } from "../testing/cardFonts";
import { TEXT_BUTTON } from "./buttonLabel";
import { type PressArea, pressedArea } from "./hitAreas";
import { CARD_TEXT_SCALE } from "./pauseCard";
import { stageSelectCard } from "./stageSelectCard";
const STAGE_SELECT_CARD = stageSelectCard(
  CARD_FONTS,
  TEXT.map.zones[ZONE_MAP.destinations[0]!.id]!,
  ZONE_MAP.destinations[0]!.stages.map((id) => TEXT.map.stages[id]!),
);

describe("stage picker layout", () => {
  it.each(ZONE_MAP.destinations)("fits both $id stage labels without shrinking", (destination) => {
    const labels = destination.stages.map((id) => TEXT.map.stages[id]!);
    const layout = stageSelectCard(CARD_FONTS, TEXT.map.zones[destination.id]!, labels);
    for (const [index, text] of labels.entries()) {
      expect(inkWidth(parseBitmapFont(fontBody), CARD_TEXT_SCALE, text)).toBeLessThanOrEqual(
        layout.buttons[index]!.button.width - 2 * TEXT_BUTTON.inset,
      );
    }
  });
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
