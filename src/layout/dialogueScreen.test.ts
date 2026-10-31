import { containsPoint } from "@andornaut/game-kit/rect";
import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { SCREEN } from "../data/screen";
import { TEXT_BUTTON } from "./buttonLabel";
import { DIALOGUE_SCREEN, dialogueNameTab, dialogueSkipButton } from "./dialogueScreen";

describe("dialogue layout", () => {
  it.each(["Dog", "Duck"])("keeps %s's name tab inside the top panel", (name) => {
    const tab = dialogueNameTab(
      inkWidth(parseBitmapFont(fontBody), DIALOGUE_SCREEN.text.scale, name),
    );
    const box = DIALOGUE_SCREEN.box;
    expect(containsPoint(box, tab.x, tab.y)).toBe(true);
    expect(containsPoint(box, tab.x + tab.width - 1, tab.y + tab.height - 1)).toBe(true);
  });

  it("keeps standard Skip clear of paragraph text and inside the view", () => {
    const { text } = DIALOGUE_SCREEN;
    const skip = dialogueSkipButton(inkWidth(parseBitmapFont(fontBody), text.scale, "Skip")).button;
    expect(skip.height).toBe(TEXT_BUTTON.height);
    expect(skip.x).toBeGreaterThan(text.x + text.width);
    expect(skip.x + skip.width).toBeLessThanOrEqual(SCREEN.width);
  });
});
