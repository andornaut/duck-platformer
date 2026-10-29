import { encodeSave, loadSave } from "@andornaut/game-kit/save/versionedSave";
import { describe, expect, it } from "vitest";

import { ZONE_MAP } from "../data/map";
import type { MapNode, ZoneMap } from "../data/types";
import { ZONES } from "../data/zones";
import { BEGINNING, type Progress, PROGRESS_VERSION, progressFormat } from "./progress";

const node = (id: string, kind: MapNode["kind"], zone?: string): MapNode => ({
  at: { col: 0, row: 0 },
  id,
  kind,
  ...(zone === undefined ? {} : { zone }),
});

// A start zone, a fork to a built zone and an unbuilt one, a built path to a zone node whose zone
// is gone, and the finish.
const MAP: ZoneMap = {
  decorations: [],
  edges: [
    { built: true, from: "start", to: "fork" },
    { built: true, from: "fork", to: "built" },
    { built: false, from: "fork", to: "unbuilt" },
    { built: true, from: "start", to: "gone" },
    { built: true, from: "built", to: "finish" },
  ],
  finish: "finish",
  nodes: [
    node("start", "zone", "start"),
    node("fork", "fork"),
    node("built", "zone", "built"),
    node("unbuilt", "zone", "unbuilt"),
    node("gone", "zone", "removed"),
    node("finish", "fork"),
  ],
  start: "start",
};
const ZONE_KEYS = { built: {}, start: {}, unbuilt: {} };
// A version 1 save's new lap seed.
const DRAWN = 42;
const FORMAT = progressFormat(MAP, ZONE_KEYS, () => DRAWN);

const stored = (fields: object, version = PROGRESS_VERSION) =>
  JSON.stringify({ seed: 7, ...fields, version });

describe("progressFormat", () => {
  it.each<[string, Progress]>([
    ["the beginning", BEGINNING],
    ["the start zone's start", { at: "zone", route: ["start"], seed: 0 }],
    ["a zone past a fork", { at: "zone", route: ["start", "fork", "built"], seed: 2 ** 32 - 1 }],
    ["the map after clearing a zone", { at: "map", route: ["start", "fork", "built"], seed: 7 }],
  ])("round-trips %s", (_, progress) => {
    const encoded = encodeSave(FORMAT, progress);
    expect(encoded.ok && loadSave(FORMAT, encoded.value)).toEqual({
      save: progress,
      status: "loaded",
    });
  });

  it.each([
    ["not JSON", "{not json"],
    ["no version", JSON.stringify({ at: "zone", route: ["start"] })],
    ["a version older than 1", stored({ at: "zone", route: ["start"] }, 0)],
    ["no lap seed", JSON.stringify({ at: "zone", route: ["start"], version: PROGRESS_VERSION })],
    ["a lap seed that is not whole", stored({ at: "zone", route: ["start"], seed: 1.5 })],
    ["a negative lap seed", stored({ at: "zone", route: ["start"], seed: -1 })],
    ["a lap seed past 32 bits", stored({ at: "zone", route: ["start"], seed: 2 ** 32 })],
    ["a lap seed that is not a number", stored({ at: "zone", route: ["start"], seed: "7" })],
    ["an unknown place to resume", stored({ at: "shop", route: ["start"] })],
    ["a route that is not a list", stored({ at: "zone", route: "start" })],
    ["a route with a non-name", stored({ at: "zone", route: ["start", 3] })],
    ["a route not from the start", stored({ at: "zone", route: ["built"] })],
    ["a node that no longer exists", stored({ at: "zone", route: ["start", "moved"] })],
    ["a path not built", stored({ at: "zone", route: ["start", "fork", "unbuilt"] })],
    ["a route ending at a fork", stored({ at: "map", route: ["start", "fork"] })],
    ["a zone that no longer exists", stored({ at: "zone", route: ["start", "gone"] })],
  ])("starts from the beginning on a save with %s", (_, raw) => {
    expect(loadSave(FORMAT, raw)).toMatchObject({ save: BEGINNING, status: "corrupt" });
  });

  it("leaves a later version's save alone and starts from the beginning", () => {
    const raw = stored({ at: "zone", route: ["start"] }, PROGRESS_VERSION + 1);
    expect(loadSave(FORMAT, raw)).toMatchObject({ save: BEGINNING, status: "newer" });
  });

  it.each<[string, object, Progress]>([
    ["the beginning", { at: "beginning" }, BEGINNING],
    [
      "a zone's start, with a new lap seed",
      { at: "zone", route: ["start"] },
      { at: "zone", route: ["start"], seed: DRAWN },
    ],
    [
      "the map, with a new lap seed",
      { at: "map", route: ["start"] },
      { at: "map", route: ["start"], seed: DRAWN },
    ],
  ])("migrates a version 1 save at %s", (_, fields, progress) => {
    const raw = JSON.stringify({ ...fields, version: 1 });
    expect(loadSave(FORMAT, raw)).toEqual({ save: progress, status: "loaded" });
  });

  it("refuses to store a route that does not fit the map", () => {
    expect(
      encodeSave(FORMAT, { at: "zone", route: ["start", "fork", "unbuilt"], seed: 1 }).ok,
    ).toBe(false);
  });

  it("takes the game's map start as a zone start", () => {
    const encoded = encodeSave(
      progressFormat(ZONE_MAP, ZONES, () => DRAWN),
      {
        at: "zone",
        route: [ZONE_MAP.start],
        seed: 1,
      },
    );
    expect(encoded.ok).toBe(true);
  });
});
