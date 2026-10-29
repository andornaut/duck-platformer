import { describe, expect, it } from "vitest";

import { ZONE_MAP } from "./map";
import { TEXT } from "./text";

describe("ZONE_MAP", () => {
  it.each(ZONE_MAP.nodes.filter((node) => node.kind === "zone").map((node) => node.id))(
    "names zone node %s in TEXT",
    (id) => {
      expect(TEXT.map.zones[id]).toBeTruthy();
    },
  );
});
