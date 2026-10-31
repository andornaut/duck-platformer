import { describe, expect, it } from "vitest";

import { levelSelectKey } from "./levelSelectInput";

const LEVELS = ["one", "two"];
const LATEST = LEVELS[1]!;

describe("level-picker input", () => {
  it.each(["Enter", " "])("does not auto-select through the opening %s key", (key) => {
    expect(
      levelSelectKey(LATEST, LEVELS, undefined, { key, repeat: false, shiftKey: false }).level,
    ).toBeUndefined();
    expect(
      levelSelectKey(LATEST, LEVELS, LATEST, { key, repeat: true, shiftKey: false }).level,
    ).toBeUndefined();
  });
  it("focuses the latest reached level first, then permits explicit replay of an earlier level", () => {
    const tab = { key: "Tab", repeat: false, shiftKey: false };
    const first = levelSelectKey(LATEST, LEVELS, undefined, tab);
    expect(first.focus).toBe(LATEST);
    expect(first.level).toBeUndefined();
    const earlier = levelSelectKey(LATEST, LEVELS, first.focus, tab);
    expect(earlier.focus).toBe(LEVELS[0]);
    expect(levelSelectKey(LATEST, LEVELS, earlier.focus, { ...tab, key: "Enter" }).level).toBe(
      LEVELS[0],
    );
  });
  it("Escape and focused close return to the map without choosing a level", () => {
    expect(
      levelSelectKey(LATEST, LEVELS, undefined, { key: "Escape", repeat: false, shiftKey: false }),
    ).toEqual({ close: true, focus: undefined, level: undefined });
    expect(
      levelSelectKey(LATEST, LEVELS, "close", { key: "Enter", repeat: false, shiftKey: false }),
    ).toEqual({ close: true, focus: "close", level: undefined });
  });
});
