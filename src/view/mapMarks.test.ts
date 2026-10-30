import type { BitmapFont, BitmapGlyph } from "@andornaut/game-kit/text/bitmapFont";
import { describe, expect, it } from "vitest";

import type { MapEdge, ZoneMap } from "../data/types";
import { MAP_SCREEN } from "../layout/mapScreen";
import { mapStand, nodeOf } from "../rules/map";
import { advanceWidth, forkArrow, markerState, nodeCentre, pathLook, routeAtTap } from "./mapMarks";

// a, then a fork f a row down with built paths to b, up a row, and c, level, and an unbuilt one to
// d, all three joining at the finish z, a fork.
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
    { at: { col: 0, row: 4 }, id: "a", kind: "zone", zone: "a" },
    { at: { col: 2, row: 5 }, id: "f", kind: "fork" },
    { at: { col: 4, row: 4 }, id: "b", kind: "zone", zone: "b" },
    { at: { col: 4, row: 5 }, id: "c", kind: "zone", zone: "c" },
    { at: { col: 4, row: 6 }, id: "d", kind: "zone" },
    { at: { col: 6, row: 5 }, id: "z", kind: "fork" },
  ],
  start: "a",
};
// She has played a and stands on the fork, choosing.
const AT_FORK = mapStand(MAP, true, ["a"]);
// She has not played a yet.
const AT_START = mapStand(MAP, false, ["a"]);

const edge = (from: string, to: string): MapEdge => {
  const found = MAP.edges.find((each) => each.from === from && each.to === to);
  if (!found) {
    throw new Error(`No edge ${from} ${to}`);
  }
  return found;
};

describe("nodeCentre", () => {
  it.each([
    [12, "a", { x: 6, y: 54 }],
    [10, "f", { x: 25, y: 55 }],
  ])("centres a node in its %i px tile: %s at %j", (tile, id, centre) => {
    expect(nodeCentre(tile, nodeOf(MAP, id))).toEqual(centre);
  });
});

describe("markerState", () => {
  it.each([
    ["a", "visited"],
    ["f", "current"],
    ["b", "normal"],
    ["d", "unbuilt"],
    ["z", "normal"],
  ])("marks %s at the fork as %s", (id, state) => {
    expect(markerState(MAP, AT_FORK, nodeOf(MAP, id))).toBe(state);
  });

  it("marks the start as current before she plays it", () => {
    expect(markerState(MAP, AT_START, nodeOf(MAP, "a"))).toBe("current");
  });
});

describe("pathLook", () => {
  it.each([
    ["a", "f", 0, "travelled"],
    ["f", "b", 0, "selected"],
    ["f", "c", 0, "selectable"],
    ["f", "b", 1, "selectable"],
    ["f", "c", 1, "selected"],
    ["f", "d", 0, "unbuilt"],
    ["b", "z", 0, "built"],
  ])("draws %s to %s, route %i chosen, as %s", (from, to, chosen, look) => {
    expect(pathLook(AT_FORK, chosen, edge(from, to))).toBe(look);
  });

  it.each([
    ["a", "f", "built"],
    ["f", "b", "built"],
  ])("draws %s to %s before she plays the start as %s", (from, to, look) => {
    expect(pathLook(AT_START, 0, edge(from, to))).toBe(look);
  });
});

describe("routeAtTap", () => {
  // Tiles wide enough that no two nodes' hit areas meet.
  const WIDE = 100;
  const { nodeHit } = MAP_SCREEN;
  const at = (id: string, dx = 0, dy = 0) => {
    const centre = nodeCentre(WIDE, nodeOf(MAP, id));
    return { x: centre.x + dx, y: centre.y + dy };
  };
  const edgeX = nodeHit.width / 2;
  const edgeY = nodeHit.height / 2;

  it.each([
    ["b's centre, its route", AT_FORK, at("b"), 0],
    ["c's centre, its route", AT_FORK, at("c"), 1],
    ["the corner of b's hit area", AT_FORK, at("b", edgeX, edgeY), 0],
    ["just past c's hit area", AT_FORK, at("c", edgeX + 1), undefined],
    ["the unbuilt d", AT_FORK, at("d"), undefined],
    ["the fork she stands on", AT_FORK, at("f"), undefined],
    ["a, behind her", AT_FORK, at("a"), undefined],
    ["b, before she plays a", AT_START, at("b"), undefined],
  ])("picks, for a tap on %s, route %s", (_name, stand, point, route) => {
    expect(routeAtTap(WIDE, nodeHit, stand, point)).toBe(route);
  });

  // Nodes a row apart on 30 px tiles: their hit areas overlap between them.
  it.each([
    ["nearer b", -1, 0],
    ["nearer c", 1, 1],
  ])("picks the nearer node where hit areas overlap: %s", (_name, offset, route) => {
    const between = { x: nodeCentre(30, nodeOf(MAP, "b")).x, y: 15 + 30 * 4.5 + offset };
    expect(routeAtTap(30, nodeHit, AT_FORK, between)).toBe(route);
  });
});

describe("forkArrow", () => {
  it.each([
    ["b", "up"],
    ["c", "level"],
    ["d", "down"],
  ])("points the fork's path to %s %s", (to, arrow) => {
    expect(forkArrow(nodeOf(MAP, "f"), nodeOf(MAP, to))).toBe(arrow);
  });
});

describe("advanceWidth", () => {
  const glyph = (advance: number): BitmapGlyph => ({
    advance,
    height: 8,
    width: advance - 1,
    xOffset: 0,
    yOffset: 0,
  });
  const FONT: BitmapFont = {
    glyphs: new Map([
      ["A", glyph(5)],
      ["V", glyph(6)],
    ]),
    kernings: new Map([["AV", -1]]),
    lineHeight: 10,
  };

  it.each([
    ["", 2, 0],
    ["A", 2, 10],
    ["AV", 1, 10],
    ["AV", 2, 20],
    ["VA", 2, 22],
    ["A?", 2, 10],
  ])("moves the pen for %j at %ix by %i", (line, scale, width) => {
    expect(advanceWidth(FONT, scale, line)).toBe(width);
  });
});
