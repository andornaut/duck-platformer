import { describe, expect, it } from "vitest";

import { nextLevelIndex, startLevelIndex } from "./levelChain";

describe("startLevelIndex", () => {
  it.each([
    ["", 0],
    ["?level=1", 0],
    ["?level=2", 1],
    ["?level=3", 2],
    ["?level=4", 0],
    ["?level=0", 0],
    ["?level=1.5", 0],
    ["?level=two", 0],
    ["?dev=1&level=2", 1],
  ])("starts %j of 3 levels at index %i", (search, index) => {
    expect(startLevelIndex(search, 3)).toBe(index);
  });
});

describe("nextLevelIndex", () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 0],
  ])("follows index %i of 3 with %i", (index, next) => {
    expect(nextLevelIndex(index, 3)).toBe(next);
  });
});
