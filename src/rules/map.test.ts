import { describe, expect, it } from "vitest";

import type { ZoneMap } from "../data/types";
import { type MapRoute, mapStand, pathsFrom, routesOn, walkOn } from "./map";

// a, then a fork f with built paths to b and c and an unbuilt one to d, all three joining at the
// finish z, a fork.
const MAP: ZoneMap = {
  decorations: [],
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

// A route as the forks it passes and the zone it reaches, by id.
const ids = (routes: readonly MapRoute[]) => routes.map(({ via, zone }) => [via, zone.id]);

describe("routesOn", () => {
  it.each([
    [
      "a, through the fork, to its built zones",
      "a",
      [
        [["f"], "b"],
        [["f"], "c"],
      ],
    ],
    [
      "the fork, to its built zones",
      "f",
      [
        [[], "b"],
        [[], "c"],
      ],
    ],
    ["b, past the finish, to the start", "b", [[["z"], "a"]]],
    ["d, with no built path on, nowhere", "d", []],
  ])("leads from %s", (_, at, routes) => {
    expect(ids(routesOn(MAP, at))).toEqual(routes);
  });
});

describe("mapStand", () => {
  it.each([
    ["on a before she plays it", false, ["a"], "a", ["a"], []],
    ["at the start before she walks", false, [], "a", ["a"], []],
    [
      "on the fork its routes share, after a",
      true,
      ["a"],
      "f",
      ["a", "f"],
      [
        [[], "b"],
        [[], "c"],
      ],
    ],
    ["on b, with one route on", true, ["a", "f", "b"], "b", ["a", "f", "b"], [[["z"], "a"]]],
    ["on d, with none", true, ["d"], "d", ["d"], []],
  ])("stands %s", (_, played, route, at, walked, routes) => {
    const stand = mapStand(MAP, played, route);
    expect([stand.at, stand.walked, ids(stand.routes)]).toEqual([at, walked, routes]);
  });
});

describe("walkOn", () => {
  it.each([
    ["from the fork after a, to c", ["a"], "c", ["a", "f", "c"]],
    ["from b, past the finish, to a new lap", ["a", "f", "b"], "a", ["a"]],
  ])("walks %s", (_, route, zone, walked) => {
    const stand = mapStand(MAP, true, route);
    const taken = stand.routes.find((each) => each.zone.id === zone);
    expect(taken && walkOn(MAP, stand, taken)).toEqual(walked);
  });
});
