import { describe, expect, it } from "vitest";

import { isLastZone, openMap } from "../rules/map";
import { destinationSelection } from "../rules/mapDestinations";
import { ZONE_MAP } from "./map";
import { TEXT } from "./text";
import { RECIPES, ZONES } from "./zones";

const LEVEL_IDS = ZONE_MAP.nodes.filter((node) => node.kind === "zone").map((node) => node.id);

describe("ZONE_MAP", () => {
  it.each(LEVEL_IDS)("names level node %s in TEXT", (id) => {
    expect(TEXT.map.levels[id]).toBeTruthy();
  });
  it.each(ZONE_MAP.destinations)(
    "names destination $id and assigns each level once",
    (destination) => {
      expect(TEXT.map.zones[destination.id]).toBeTruthy();
      expect(destination.levels.every((id) => LEVEL_IDS.includes(id))).toBe(true);
    },
  );
  it("assigns every level to one destination and keeps unbuilt levels unavailable", () => {
    const catalogue = ZONE_MAP.destinations.flatMap(({ levels }) => levels);
    expect(new Set(catalogue).size).toBe(catalogue.length);
    expect([...catalogue].sort()).toEqual([...LEVEL_IDS].sort());
    const plans = new Set([...Object.keys(ZONES), ...Object.keys(RECIPES)]);
    const open = openMap(ZONE_MAP, new Set());
    expect(open.zones).toEqual([ZONE_MAP.start]);
    expect(
      ZONE_MAP.destinations.map(
        (destination) => destinationSelection(plans, ZONE_MAP, open, destination).kind,
      ),
    ).toEqual(
      ZONE_MAP.destinations.map((destination) =>
        destination.levels.includes(ZONE_MAP.start) ? "play" : "unavailable",
      ),
    );
  });
  it("does not celebrate when the depot is cleared while the final apartment level is unbuilt", () => {
    expect(isLastZone(ZONE_MAP, ZONE_MAP.start)).toBe(false);
    expect(ZONE_MAP.nodes.find(({ id }) => id === ZONE_MAP.finish)?.kind).toBe("zone");
    expect(ZONE_MAP.destinations.at(-1)?.levels.at(-1)).toBe(ZONE_MAP.finish);
  });
});
