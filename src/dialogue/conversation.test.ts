import { inkWidth, parseBitmapFont } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import fontBody from "../../public/art/fonts/font-body.fnt?raw";
import { TOUCH } from "../data/touch";
import type { DialoguePlan, DialogueSpeaker, GameText } from "../data/types";
import { DIALOGUE_SCREEN } from "../layout/dialogueScreen";
import {
  dialogueKeyAction,
  dialogueLines,
  dialogueParagraphs,
  type DialoguePress,
  dialogueTapAction,
  moveDialoguePress,
} from "./conversation";

const speakers: Readonly<Record<string, DialogueSpeaker>> = {
  dog: { colour: "amber", portrait: "portrait-dog", side: "right" },
};
const text: Pick<GameText, "dialogue" | "lines"> = {
  dialogue: { continue: "Continue", skip: "Skip", speakers: { dog: "Dog" } },
  lines: { greeting: "Stop there." },
};
const plan: DialoguePlan = { lines: [{ line: "greeting", speaker: "dog" }] };

describe("dialogueParagraphs", () => {
  it("resolves paragraphs in their written order", () => {
    expect(dialogueParagraphs(speakers, text, { lines: [...plan.lines, ...plan.lines] })).toEqual(
      Array.from({ length: plan.lines.length * 2 }, () => ({
        ...speakers.dog,
        name: text.dialogue.speakers.dog,
        text: text.lines.greeting,
      })),
    );
  });

  it.each(["empty plan", "missing speaker", "missing name", "missing paragraph"])(
    "rejects %s before showing the conversation",
    (invalid) => {
      const words = {
        ...text,
        ...(invalid === "missing paragraph" ? { lines: {} } : {}),
        dialogue: {
          ...text.dialogue,
          ...(invalid === "missing name" ? { speakers: {} } : {}),
        },
      };
      expect(() =>
        dialogueParagraphs(
          invalid === "missing speaker" ? {} : speakers,
          words,
          invalid === "empty plan" ? { lines: [] } : plan,
        ),
      ).toThrow();
    },
  );
});

describe("dialogueLines", () => {
  const font = parseBitmapFont(fontBody);
  const style = DIALOGUE_SCREEN.text;

  it.each([style.lines, style.lines + 1])("keeps the fixed font size for %i lines", (count) => {
    const paragraph = Array.from({ length: count }, () => text.lines.greeting).join("\n");
    const fit = () => dialogueLines(font, style, style.width, paragraph);
    if (count > style.lines) {
      expect(fit).toThrow("does not fit");
    } else {
      expect(fit()).toEqual(paragraph.split("\n"));
    }
  });

  it("wraps by measured ink width and rejects an unbreakable word wider than the panel", () => {
    const wide = "W".repeat(Math.ceil(style.width / inkWidth(font, style.scale, "W")) + 1);
    expect(() => dialogueLines(font, style, style.width, wide)).toThrow("does not fit");
    const paragraph = Array.from({ length: 25 }, () => text.lines.greeting).join(" ");
    const lines = dialogueLines(font, { ...style, lines: 100 }, style.width, paragraph);
    expect(lines.length).toBeGreaterThan(1);
    expect(lines.every((line) => inkWidth(font, style.scale, line) <= style.width)).toBe(true);
  });
});

describe("dialogueKeyAction", () => {
  it.each([
    { action: "advance", focused: false, key: "Enter", repeat: false },
    { action: "advance", focused: false, key: "p", repeat: false },
    { action: "advance", focused: false, key: "Escape", repeat: false },
    { action: "focusSkip", focused: false, key: "Tab", repeat: false },
    { action: "skip", focused: true, key: "Enter", repeat: false },
    { action: "skip", focused: true, key: " ", repeat: false },
    { action: undefined, focused: true, key: "Enter", repeat: true },
    { action: undefined, focused: false, key: "Shift", repeat: false },
  ])("$key with focus $focused and repeat $repeat: $action", ({ action, focused, key, repeat }) => {
    expect(dialogueKeyAction(focused, { key, repeat })).toBe(action);
  });
});

describe("dialogueTapAction", () => {
  const hit = { height: 48, width: 80, x: 100, y: 0 };
  const ordinary: DialoguePress = { at: { x: 10, y: 10 }, cancelled: false, id: 1, skip: false };
  const skip: DialoguePress = { ...ordinary, at: { x: 120, y: 10 }, skip: true };
  const pointer = { id: ordinary.id, wasCanceled: false, ...ordinary.at };

  it.each([
    { action: "advance", name: "fresh ordinary tap", press: ordinary, release: pointer },
    { action: "skip", name: "fresh Skip tap", press: skip, release: { ...pointer, ...skip.at } },
    {
      action: undefined,
      name: "held pointer from before opening",
      press: undefined,
      release: pointer,
    },
    {
      action: undefined,
      name: "another finger",
      press: ordinary,
      release: { ...pointer, id: pointer.id + 1 },
    },
    {
      action: undefined,
      name: "cancelled touch",
      press: ordinary,
      release: { ...pointer, wasCanceled: true },
    },
    { action: undefined, name: "Skip press released outside", press: skip, release: pointer },
  ])("$name", ({ action, press, release }) => {
    expect(dialogueTapAction(hit, TOUCH.tapMaxDistance, press, release)).toBe(action);
  });

  it("does not advance when a drag returns to its starting point", () => {
    const dragged = moveDialoguePress(
      TOUCH.tapMaxDistance,
      { ...ordinary.at, x: ordinary.at.x + TOUCH.tapMaxDistance + 1 },
      ordinary,
    );
    expect(dialogueTapAction(hit, TOUCH.tapMaxDistance, dragged, pointer)).toBeUndefined();
  });
});
