import { describe, expect, it } from "vitest";

import { askedAssemblySeed, askedRecipe, nextZoneIndex, startZoneIndex } from "./zoneChain";

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

describe("askedRecipe", () => {
  it.each([
    ["", undefined],
    ["?zone=park", "park"],
    ["?dev=1&zone=park", "park"],
    ["?zone=alley", undefined],
    ["?zone=2", undefined],
  ])("reads %j as %s", (search, key) => {
    expect(askedRecipe(search, ["park"])).toBe(key);
  });
});

describe("askedAssemblySeed", () => {
  it.each([
    ["", undefined],
    ["?assembly=", undefined],
    ["?assembly=0", 0],
    ["?assembly=42", 42],
    ["?assembly=4294967295", 2 ** 32 - 1],
    ["?assembly=4294967296", undefined],
    ["?assembly=-1", undefined],
    ["?assembly=1.5", undefined],
    ["?assembly=one", undefined],
  ])("reads %j as %s", (search, seed) => {
    expect(askedAssemblySeed(search)).toBe(seed);
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
