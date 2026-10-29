import { describe, expect, it } from "vitest";

import { settingsKeyAction, stepFocus } from "./settingsInput";

describe("settingsKeyAction", () => {
  it.each([
    { action: "next", key: "ArrowDown", repeat: false },
    { action: "next", key: "ArrowDown", repeat: true },
    { action: "previous", key: "ArrowUp", repeat: true },
    { action: "press", key: "Enter", repeat: false },
    { action: "press", key: " ", repeat: false },
    { action: undefined, key: "Enter", repeat: true },
    { action: "close", key: "Escape", repeat: false },
    { action: "close", key: "p", repeat: false },
    { action: "close", key: "P", repeat: false },
    { action: undefined, key: "Escape", repeat: true },
    { action: undefined, key: "ArrowLeft", repeat: false },
  ])("$key, repeat $repeat: $action", ({ action, key, repeat }) => {
    expect(settingsKeyAction(key, repeat)).toBe(action);
  });
});

describe("stepFocus", () => {
  const targets = ["a", "b", "c"];
  it.each([
    { focus: undefined, step: "next", to: "a" },
    { focus: undefined, step: "previous", to: "c" },
    { focus: "a", step: "next", to: "b" },
    { focus: "c", step: "next", to: "a" },
    { focus: "a", step: "previous", to: "c" },
    { focus: "gone", step: "next", to: "a" },
  ] as const)("from $focus, $step: $to", ({ focus, step, to }) => {
    expect(stepFocus<string>(targets, focus, step)).toBe(to);
  });
});
