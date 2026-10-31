import { describe, expect, it } from "vitest";

import themeData from "../../public/art/zone-themes.json";
import { ZONE_MAP } from "../data/map";
import { zoneTheme, type ZoneThemes } from "./zoneTheme";

const THEMES = themeData as ZoneThemes;

describe("zone progress themes", () => {
  it.each(ZONE_MAP.destinations)("shares $id's primary between both stages", (destination) => {
    const actual = destination.stages.map((stage) => zoneTheme(ZONE_MAP, THEMES, stage));
    expect(actual).toEqual([THEMES[destination.id], THEMES[destination.id]]);
    expect(actual[0]?.primary).toBeTruthy();
  });
  it("uses the starting destination for non-catalogued debug stages", () => {
    expect(zoneTheme(ZONE_MAP, THEMES, "test:3")).toEqual(
      zoneTheme(ZONE_MAP, THEMES, ZONE_MAP.start),
    );
  });
  it("rejects absent art theme data instead of substituting a second colour table", () => {
    expect(() => zoneTheme(ZONE_MAP, {}, ZONE_MAP.start)).toThrow("Missing primary theme");
  });
});
