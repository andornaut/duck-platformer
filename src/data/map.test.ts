import { describe, expect, it } from "vitest";

import { isLastZone, openMap } from "../rules/map";
import { destinationForStage, destinationSelection } from "../rules/mapDestinations";
import { ZONE_MAP } from "./map";
import { TEXT } from "./text";
import { RECIPES, ZONES } from "./zones";

const STAGE_IDS = ZONE_MAP.nodes.filter((node) => node.kind === "zone").map((node) => node.id);

describe("ZONE_MAP", () => {
  it.each(STAGE_IDS)("names stage node %s in TEXT", (id) => {
    expect(TEXT.map.stages[id]).toBeTruthy();
  });
  it.each(ZONE_MAP.destinations)("names destination $id in TEXT", (destination) => {
    expect(TEXT.map.zones[destination.id]).toBeTruthy();
  });
  it("assigns every stage to one destination and keeps unbuilt stages unavailable", () => {
    const catalogue = ZONE_MAP.destinations.flatMap(({ stages }) => stages);
    expect(new Set(catalogue).size).toBe(catalogue.length);
    expect([...catalogue].sort()).toEqual([...STAGE_IDS].sort());
    const plans = new Set([...Object.keys(ZONES), ...Object.keys(RECIPES)]);
    const open = openMap(ZONE_MAP, new Set());
    expect(open.zones).toEqual([ZONE_MAP.start]);
    expect(
      ZONE_MAP.destinations.map(
        (destination) => destinationSelection(plans, ZONE_MAP, open, destination).kind,
      ),
    ).toEqual(
      ZONE_MAP.destinations.map((destination) =>
        destination.stages.includes(ZONE_MAP.start) ? "play" : "unavailable",
      ),
    );
  });
  it.each([
    {
      completed: ["street"],
      industrial: { kind: "unavailable" },
      open: ["street", "city-boundary"],
      stage: "after the depot clear",
    },
    {
      completed: ["street", "city-boundary"],
      industrial: { kind: "play", stage: "warehouse-district" },
      open: ["street", "city-boundary", "warehouse-district"],
      stage: "after both cityscape stages clear",
    },
    {
      completed: ["street", "city-boundary", "warehouse-district"],
      industrial: {
        kind: "choose",
        latest: "freight-terminal",
        stages: ["warehouse-district", "freight-terminal"],
      },
      open: ["street", "city-boundary", "warehouse-district", "freight-terminal"],
      stage: "after the warehouse clear",
    },
    {
      completed: ["street", "city-boundary", "warehouse-district", "freight-terminal"],
      industrial: {
        kind: "choose",
        latest: "freight-terminal",
        stages: ["warehouse-district", "freight-terminal"],
      },
      open: ["street", "city-boundary", "warehouse-district", "freight-terminal"],
      stage: "after both industrial stages clear",
    },
  ])(
    "preserves replays and unlocks only built stages $stage",
    ({ completed, industrial, open: expectedOpen }) => {
      const plans = new Set([...Object.keys(ZONES), ...Object.keys(RECIPES)]);
      const open = openMap(ZONE_MAP, new Set(completed));
      expect(open.zones).toEqual(expectedOpen);
      expect(
        destinationSelection(plans, ZONE_MAP, open, destinationForStage(ZONE_MAP, "street")),
      ).toEqual({
        kind: "choose",
        latest: "city-boundary",
        stages: ["street", "city-boundary"],
      });
      for (const id of open.zones) {
        const node = ZONE_MAP.nodes.find((item) => item.id === id)!;
        expect(node.zone !== undefined && plans.has(node.zone)).toBe(true);
        expect(isLastZone(ZONE_MAP, id)).toBe(false);
      }
      expect(
        destinationSelection(
          plans,
          ZONE_MAP,
          open,
          destinationForStage(ZONE_MAP, "warehouse-district"),
        ),
      ).toEqual(industrial);
      for (const destination of ZONE_MAP.destinations.slice(2)) {
        expect(destinationSelection(plans, ZONE_MAP, open, destination)).toEqual({
          kind: "unavailable",
        });
      }
    },
  );
  it("identifies the catalogue's final apartment stage", () => {
    expect(ZONE_MAP.nodes.find(({ id }) => id === ZONE_MAP.finish)?.kind).toBe("zone");
    expect(ZONE_MAP.destinations.at(-1)?.stages.at(-1)).toBe(ZONE_MAP.finish);
  });
});
