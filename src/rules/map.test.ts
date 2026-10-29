import { describe, expect, it } from "vitest";

import type { ZoneMap } from "../data/types";
import { nextChoices, nextZoneNode, pathsFrom } from "./map";

// a, then a fork f with built paths to b and c and an unbuilt one to d, all three joining at the
// finish z, a fork.
const MAP: ZoneMap = {
  edges: [
    { built: true, from: "a", to: "f" },
    { built: true, from: "f", to: "b" },
    { built: true, from: "f", to: "c" },
    { built: false, from: "f", to: "d" },
    { built: true, from: "b", to: "z" },
    { built: true, from: "c", to: "z" },
    { built: false, from: "d", to: "z" },
  ],
  finish: "z",
  nodes: [
    ...["a", "b", "c", "d"].map((id) => ({
      at: { col: 0, row: 0 },
      id,
      kind: "zone" as const,
      zone: id,
    })),
    ...["f", "z"].map((id) => ({ at: { col: 0, row: 0 }, id, kind: "fork" as const })),
  ],
  start: "a",
};

describe("pathsFrom", () => {
  it.each([
    ["a", ["f"]],
    ["f", ["b", "c", "d"]],
    ["z", []],
  ])("leads on from %s to %j, built or not", (at, to) => {
    expect(pathsFrom(MAP, at).map(({ node }) => node.id)).toEqual(to);
  });
});

describe("nextChoices", () => {
  it.each([
    ["a, through the fork, its built zones", "a", ["b", "c"]],
    ["the fork, its built zones", "f", ["b", "c"]],
    ["b, past the finish, the start", "b", ["a"]],
    ["d, no built path on", "d", []],
  ])("offers from %s", (_, at, choices) => {
    expect(nextChoices(MAP, at).map(({ id }) => id)).toEqual(choices);
  });
});

describe("nextZoneNode", () => {
  it.each([
    ["from a, the first choice", "a", undefined, "b"],
    ["from a, the other choice when chosen", "a", "c", "c"],
    ["from the fork, an unbuilt zone chosen, the first built one", "f", "d", "b"],
    ["from b, past the finish to the start", "b", undefined, "a"],
    ["from d, with no built path on", "d", undefined, undefined],
  ])("goes %s", (_, at, chosen, next) => {
    expect(nextZoneNode(MAP, at, chosen)?.id).toBe(next);
  });
});
