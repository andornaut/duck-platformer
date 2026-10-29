import { describe, expect, it } from "vitest";

import { animKey, type AsepriteSheet, sheetTags, tagMs, tagRepeat } from "./aseprite";

const tag = (name: string, from: number, to: number, direction = "forward") => ({
  direction,
  from,
  name,
  to,
});

const SHEET: AsepriteSheet = {
  frames: {
    "s 0.aseprite": { duration: 400 },
    "s 1.aseprite": { duration: 130 },
    "s 2.aseprite": { duration: 80 },
  },
  meta: { frameTags: [tag("rest", 0, 0), tag("press", 1, 2)] },
};

describe("sheetTags", () => {
  it.each([
    ["rest", [{ frame: "s 0.aseprite", ms: 400 }]],
    [
      "press",
      [
        { frame: "s 1.aseprite", ms: 130 },
        { frame: "s 2.aseprite", ms: 80 },
      ],
    ],
  ])("gives %s its frames in order", (name, frames) => {
    expect(sheetTags(SHEET).get(name)).toEqual(frames);
  });

  it.each(["reverse", "pingpong"])("refuses a %s tag", (direction) => {
    const sheet = { ...SHEET, meta: { frameTags: [tag("rest", 0, 1, direction)] } };
    expect(() => sheetTags(sheet)).toThrow(direction);
  });
});

describe("tagMs", () => {
  it.each([
    ["rest", 400],
    ["press", 210],
  ])("plays %s for %i ms", (name, ms) => {
    expect(tagMs(sheetTags(SHEET), name)).toBe(ms);
  });

  it("refuses a missing tag", () => {
    expect(() => tagMs(sheetTags(SHEET), "held")).toThrow("held");
  });
});

describe("tagRepeat", () => {
  it.each([
    [["jump", "land"], "jump", 0],
    [["jump", "land"], "land", 0],
    [["jump", "land"], "walk", -1],
    [[], "rest", -1],
  ])("with %j played once, repeats %s %i times", (once, tag, repeat) => {
    expect(tagRepeat(once, tag)).toBe(repeat);
  });
});

describe("animKey", () => {
  it("keeps one sprite's tag apart from another's", () => {
    expect(animKey("ui-touch-jump", "rest")).not.toBe(animKey("ui-touch-move", "rest"));
  });
});
