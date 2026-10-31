import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import fontTitle from "../../public/art/fonts/font-title.fnt?raw";
import { ZONE_MAP } from "../data/map";
import { TEXT } from "../data/text";
import { DEATH_ACTIONS } from "../input/deathInput";
import { deathLabels, deathSummary } from "../view/death";
import { TEXT_BUTTON } from "./buttonLabel";
import { cardTitleAt } from "./cardFrame";
import { DEATH_CARD } from "./deathCard";
import { type PressArea, pressedArea } from "./hitAreas";
import { CARD_TEXT_SCALE } from "./pauseCard";

const labels = { home: TEXT.pause.home, retry: TEXT.death.retry };

describe("death card", () => {
  it.each(DEATH_ACTIONS)("fits the %s action with standard height and padding", (key) => {
    const { button } = DEATH_CARD[key];
    const ink = inkWidth(parseBitmapFont(fontBody), CARD_TEXT_SCALE, labels[key]);
    expect(button.height).toBe(TEXT_BUTTON.height);
    expect((button.width - ink) / 2).toBeGreaterThanOrEqual(TEXT_BUTTON.inset);
    expect(button.y + button.height).toBeLessThan(DEATH_CARD.card.y + DEATH_CARD.card.height);
  });
  it("centres the title relative to this top card instead of another card's fixed position", () => {
    const title = cardTitleAt(DEATH_CARD.card, 100);
    expect(title.y).toBeGreaterThan(DEATH_CARD.card.y);
    expect(title.y).toBeLessThan(DEATH_CARD.level.y);
    expect(DEATH_CARD.level.y + DEATH_CARD.level.height).toBeLessThanOrEqual(DEATH_CARD.time.y);
    expect(DEATH_CARD.time.y + DEATH_CARD.time.height).toBeLessThanOrEqual(DEATH_CARD.progress.y);
  });
  it.each(ZONE_MAP.destinations.flatMap(({ levels }) => levels))(
    "fits the zone and level labels for %s without shrinking text",
    (levelId) => {
      const words = deathSummary(TEXT.death, {
        activeSeconds: 65,
        ...deathLabels(ZONE_MAP, TEXT.map, "1", levelId),
        percent: 0.5,
      });
      expect(
        inkWidth(parseBitmapFont(fontTitle), CARD_TEXT_SCALE, words.title),
      ).toBeLessThanOrEqual(DEATH_CARD.level.width);
      for (const key of ["level", "progress", "time"] as const) {
        expect(
          inkWidth(parseBitmapFont(fontBody), CARD_TEXT_SCALE, words[key]),
        ).toBeLessThanOrEqual(DEATH_CARD[key].width);
      }
    },
  );
  it("keeps Back to title left and Retry right with distinct press centres", () => {
    expect(DEATH_CARD.home.button.x + DEATH_CARD.home.button.width + TEXT_BUTTON.gap).toBe(
      DEATH_CARD.retry.button.x,
    );
    const areas: PressArea<string>[] = DEATH_ACTIONS.map((key) => ({
      art: DEATH_CARD[key].button,
      hit: DEATH_CARD[key].hit,
      key,
    }));
    for (const { art, key } of areas) {
      expect(pressedArea(areas, { x: art.x + art.width / 2, y: art.y + art.height / 2 })).toBe(key);
    }
  });
});
