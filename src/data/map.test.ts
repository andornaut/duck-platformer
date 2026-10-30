import { describe, expect, it } from "vitest";

import { ZONE_MAP } from "./map";
import { TEXT } from "./text";

const ZONE_IDS = ZONE_MAP.nodes.filter((node) => node.kind === "zone").map((node) => node.id);

describe("ZONE_MAP", () => {
  it.each(ZONE_IDS)("names zone node %s in TEXT", (id) => {
    expect(TEXT.map.zones[id]).toBeTruthy();
  });
});
