import { describe, expect, it } from "vitest";

import { cardBackAction, cardKeyAction, startBackAction } from "./cardInput";

describe("cardKeyAction", () => {
  it.each([
    { action: "open", key: "Escape", open: false, repeat: false },
    { action: "close", key: "Escape", open: true, repeat: false },
    { action: "open", key: "p", open: false, repeat: false },
    { action: "open", key: "P", open: false, repeat: false },
    { action: "close", key: "p", open: true, repeat: false },
    { action: undefined, key: "p", open: false, repeat: true },
    { action: undefined, key: "Escape", open: true, repeat: true },
    { action: undefined, key: "ArrowLeft", open: false, repeat: false },
    { action: undefined, key: " ", open: true, repeat: false },
  ])("$key with the card open $open, repeat $repeat: $action", ({ action, key, open, repeat }) => {
    expect(cardKeyAction(open, key, repeat)).toBe(action);
  });
});

describe("cardBackAction", () => {
  it.each([
    { action: "open", open: false },
    { action: "close", open: true },
  ])("with the card open $open: $action", ({ action, open }) => {
    expect(cardBackAction(open)).toBe(action);
  });
});

describe("startBackAction", () => {
  it.each([
    { action: "closeSettings", canExit: true, settingsOpen: true },
    { action: "closeSettings", canExit: false, settingsOpen: true },
    { action: "exit", canExit: true, settingsOpen: false },
    { action: undefined, canExit: false, settingsOpen: false },
  ])(
    "with the settings card open $settingsOpen, Exit shown $canExit: $action",
    ({ action, canExit, settingsOpen }) => {
      expect(startBackAction(settingsOpen, canExit)).toBe(action);
    },
  );
});
