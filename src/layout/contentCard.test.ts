import { laidGlyphs, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import fontTitle from "../../public/art/fonts/font-title.fnt?raw";
import { SCREEN } from "../data/screen";
import { TEXT } from "../data/text";
import { CARD_TEXT_SCALE } from "./cardFrame";
import {
  CARD_CONTENT,
  cardActions,
  cardActionsSize,
  cardTextOrigin,
  cardTextRowsSize,
  contentCardLayout,
} from "./contentCard";

const BODY = parseBitmapFont(fontBody);
const TITLE = parseBitmapFont(fontTitle);
const VIEW = { ...SCREEN, x: 0, y: 0 };

describe("measured content cards", () => {
  it("measures equal action faces from the widest actual label and includes only present gaps", () => {
    const labels = [TEXT.pause.home, TEXT.death.retry];
    const actions = cardActionsSize(BODY, "row", labels);
    const rows = cardTextRowsSize(BODY, ["City", "Stage 1", "Progress: 25%", "Time: 1:05"]);
    const result = contentCardLayout(
      VIEW,
      [
        { key: "rows", ...rows },
        { height: 0, key: "absent", width: 0 },
        { key: "actions", ...actions },
      ],
      undefined,
      { x: 226, y: 16 },
    );
    expect(result.card).toEqual({ height: 164, width: 268, x: 226, y: 16 });
    const rect = result.groups.actions;
    if (!rect) {
      throw new Error("Missing measured actions");
    }
    const faces = cardActions(BODY, "row", rect, labels).map(({ button }) => button);
    expect(faces).toEqual([
      { height: 48, width: 114, x: 242, y: 116 },
      { height: 48, width: 114, x: 364, y: 116 },
    ]);
  });

  it.each([false, true])(
    "includes the optional close control without shrinking the title (close=%s)",
    (close) => {
      const titleWidth = 180;
      const result = contentCardLayout(VIEW, [], { close, titleWidth });
      expect(result.card.width).toBe(
        titleWidth +
          2 * CARD_CONTENT.padding +
          (close ? CARD_CONTENT.closeSize + CARD_CONTENT.gap : 0),
      );
      expect(result.title?.width).toBeGreaterThanOrEqual(titleWidth);
      expect(result.close === undefined).toBe(!close);
    },
  );

  it("expands for long content instead of forcing a standard width", () => {
    const narrow = contentCardLayout(VIEW, [{ height: 16, key: "label", width: 80 }]);
    const wide = contentCardLayout(VIEW, [{ height: 16, key: "label", width: 400 }]);
    expect(wide.card.width - narrow.card.width).toBe(320);
    expect(wide.card.width).toBe(400 + 2 * CARD_CONTENT.padding);
  });

  it.each([BODY, TITLE])("centres actual ink rather than the first glyph bearing", (font) => {
    const text = "Hint";
    const rect = { height: 16, width: 180, x: 20, y: 30 };
    const at = cardTextOrigin(font, rect, text);
    const spans = laidGlyphs(font, CARD_TEXT_SCALE, text).flatMap(({ ink }) => ink ?? []);
    const left = Math.min(...spans.map((span) => span.left)) + at.x;
    const right = Math.max(...spans.map((span) => span.right)) + at.x;
    expect(Math.abs((left + right) / 2 - (rect.x + rect.width / 2))).toBeLessThanOrEqual(0.5);
  });
});
