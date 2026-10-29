import { describe, expect, it } from "vitest";

import { nextZoneIndex, startZoneIndex } from "./zoneChain";

describe("startZoneIndex", () => {
  it.each([
    ["", 0],
    ["?zone=1", 0],
    ["?zone=2", 1],
    ["?zone=3", 2],
    ["?zone=4", 0],
    ["?zone=0", 0],
    ["?zone=1.5", 0],
    ["?zone=two", 0],
    ["?dev=1&zone=2", 1],
  ])("starts %j of 3 zones at index %i", (search, index) => {
    expect(startZoneIndex(search, 3)).toBe(index);
  });
});

describe("nextZoneIndex", () => {
  it.each([
    [0, 1],
    [1, 2],
    [2, 0],
  ])("follows index %i of 3 with %i", (index, next) => {
    expect(nextZoneIndex(index, 3)).toBe(next);
  });
});
