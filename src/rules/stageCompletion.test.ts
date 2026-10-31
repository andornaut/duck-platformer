import { describe, expect, it } from "vitest";

import { DESTINATION_FIXTURE as MAP } from "../testing/mapDestinations";
import { stageCompletion } from "./stageCompletion";

describe("stage completion routing", () => {
  it.each([
    { before: [], expected: { kind: "next-stage", stage: "two" }, stage: "one" },
    {
      before: ["one", "two", "three"],
      expected: { kind: "next-stage", stage: "two" },
      stage: "one",
    },
    { before: ["one"], expected: { kind: "map", travelTo: "three" }, stage: "two" },
    { before: ["one", "two", "three"], expected: { kind: "map", travelTo: "three" }, stage: "two" },
    { before: ["one", "two", "three"], expected: { kind: "celebration" }, stage: "four" },
    { before: ["one", "two", "three", "four"], expected: { kind: "celebration" }, stage: "four" },
  ])("$stage with completed $before", ({ before, expected, stage }) => {
    expect(stageCompletion(MAP, new Set(before), stage)).toEqual(expected);
  });
  it("never chooses an unbuilt successor or an arbitrary fork", () => {
    const unbuilt = {
      ...MAP,
      nodes: MAP.nodes.map((node) =>
        node.id === "three" ? { at: node.at, id: node.id, kind: "zone" as const } : node,
      ),
    };
    expect(stageCompletion(unbuilt, new Set(["one"]), "two")).toEqual({ kind: "map" });
    const branching = {
      ...MAP,
      edges: [...MAP.edges, { built: true, from: "two", to: "choice" }],
      nodes: [...MAP.nodes, { at: { col: 0, row: 0 }, id: "choice", kind: "fork" as const }],
    };
    expect(stageCompletion(branching, new Set(["one"]), "two")).toEqual({ kind: "map" });
  });
});
